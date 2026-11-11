begin;

-- The app role reaches these records only through the functions below.
create table if not exists anai_private.return_requests (
  id uuid primary key default gen_random_uuid(),
  original_order_id uuid not null references public.orders(id),
  replacement_order_id uuid unique references public.orders(id),
  customer_key uuid not null,
  kind text not null check (kind in ('refund', 'exchange')),
  reason_code text not null check (reason_code in ('preference', 'wrong', 'damaged', 'not_as_described')),
  reason text not null check (length(reason) between 1 and 1200),
  decision text not null default 'requested' check (decision in ('requested', 'approved', 'declined', 'cancelled')),
  decision_note text,
  proposal_pending boolean not null default false,
  delivered_at timestamptz,
  return_instructions text,
  received_at timestamptz,
  credit_kes integer not null check (credit_kes >= 0),
  delivery_credit_kes integer not null default 0 check (delivery_credit_kes >= 0),
  replacement_total_kes integer not null default 0 check (replacement_total_kes >= 0),
  topup_state text not null default 'not_due' check (topup_state in ('not_due', 'due', 'processing', 'settled', 'reconciliation')),
  refund_state text not null default 'not_due' check (refund_state in ('not_due', 'due', 'processing', 'confirmed', 'unknown')),
  fulfilled_at timestamptz,
  created_at timestamptz not null default now(),
  version integer not null default 1,
  unique (original_order_id, customer_key)
);
create index if not exists return_requests_order_idx on anai_private.return_requests(original_order_id, created_at);

create table if not exists anai_private.return_lines (
  request_id uuid not null references anai_private.return_requests(id),
  order_item_id uuid not null references public.order_items(id),
  replacement_variant_id uuid references public.product_variants(id),
  quantity integer not null check (quantity > 0),
  credit_kes integer not null check (credit_kes >= 0),
  resellable integer,
  damaged integer,
  primary key (request_id, order_item_id),
  check ((resellable is null and damaged is null) or
    (resellable is not null and damaged is not null and resellable >= 0 and damaged >= 0 and resellable + damaged = quantity))
);
create index if not exists return_lines_order_item_idx on anai_private.return_lines(order_item_id);

create table if not exists anai_private.return_photos (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references anai_private.return_requests(id),
  mime text not null check (mime in ('image/jpeg','image/png','image/webp')),
  bytes bytea not null check (octet_length(bytes) between 1 and 1048576)
);

create table if not exists anai_private.return_actions (
  token_hash text primary key,
  request_id uuid not null references anai_private.return_requests(id),
  owner_email text not null,
  action text not null,
  request_version integer not null,
  expires_at timestamptz not null,
  used_at timestamptz
);

create table if not exists anai_private.return_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references anai_private.return_requests(id),
  order_id uuid not null references public.orders(id),
  event text not null,
  actor text not null,
  detail jsonb not null default '{}',
  notify_owner boolean not null,
  notify_buyer boolean not null,
  created_at timestamptz not null default now()
);

create table if not exists anai_private.return_mail (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references anai_private.return_events(id),
  audience text not null check (audience in ('owner','buyer')),
  claimed_at timestamptz,
  claim_id uuid,
  attempts integer not null default 0,
  sent_at timestamptz,
  unique (event_id, audience)
);

create table if not exists anai_private.return_link_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null,
  email text not null,
  owner boolean not null default false,
  created_at timestamptz not null default now()
);

-- Each physical return creates a single movement per original line.
create table if not exists anai_private.return_stock_movements (
  request_id uuid not null,
  order_item_id uuid not null,
  variant_id uuid not null references public.product_variants(id),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  primary key (request_id, order_item_id),
  foreign key (request_id, order_item_id) references anai_private.return_lines(request_id, order_item_id)
);

create table if not exists anai_private.return_refunds (
  request_id uuid primary key references anai_private.return_requests(id),
  original_payment_id uuid not null references public.payments(id),
  amount_kes integer not null check (amount_kes > 0),
  reference text not null unique,
  paid_at timestamptz not null,
  recorded_by text not null,
  recorded_at timestamptz not null default now()
);

create or replace function anai_private.add_return_event(
  p_order uuid, p_request uuid, p_event text, p_actor text, p_detail jsonb, p_owner boolean, p_buyer boolean
) returns void language plpgsql set search_path = '' as $$
declare v_event uuid;
begin
  insert into anai_private.return_events(order_id, request_id, event, actor, detail, notify_owner, notify_buyer)
  values (p_order, p_request, p_event, p_actor, p_detail, p_owner, p_buyer) returning id into v_event;
  if p_owner then insert into anai_private.return_mail(event_id, audience) values(v_event, 'owner'); end if;
  if p_buyer then insert into anai_private.return_mail(event_id, audience) values(v_event, 'buyer'); end if;
end $$;

-- Serialize reference claims across normal M-Pesa receipts, top-ups and manual refunds.
create or replace function anai_private.claim_return_receipt() returns trigger language plpgsql
security definer set search_path = '' as $$
declare v_reference text;
begin
  if tg_table_name = 'payments' then
    v_reference := upper(btrim(new.mpesa_receipt_number));
    if v_reference is null or v_reference = '' then return new; end if;
    perform pg_advisory_xact_lock(hashtextextended(v_reference, 14));
    if exists (select 1 from anai_private.return_refunds where reference = v_reference)
      or exists (select 1 from public.payments where upper(btrim(mpesa_receipt_number)) = v_reference and id <> new.id) then
      raise exception using message = 'RETURN_DUPLICATE_RECEIPT';
    end if;
  else
    v_reference := upper(btrim(new.reference));
    perform pg_advisory_xact_lock(hashtextextended(v_reference, 14));
    if exists (select 1 from public.payments where upper(btrim(mpesa_receipt_number)) = v_reference) then
      raise exception using message = 'RETURN_DUPLICATE_RECEIPT';
    end if;
    new.reference := v_reference;
  end if;
  return new;
end $$;
create index if not exists payments_normalized_receipt_idx on public.payments (upper(btrim(mpesa_receipt_number))) where mpesa_receipt_number is not null;
drop trigger if exists check_return_payment_receipt on public.payments;
create trigger check_return_payment_receipt before insert or update of mpesa_receipt_number on public.payments
for each row execute function anai_private.claim_return_receipt();
drop trigger if exists check_return_refund_receipt on anai_private.return_refunds;
create trigger check_return_refund_receipt before insert on anai_private.return_refunds
for each row execute function anai_private.claim_return_receipt();

create or replace function public.submit_return_request(
  p_order uuid, p_key uuid, p_kind text, p_code text, p_reason text, p_lines jsonb, p_photos jsonb
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders%rowtype;
  v_item public.order_items%rowtype;
  v_line jsonb; v_photo jsonb; v_request uuid; v_quantity integer; v_used integer; v_used_credit integer; v_credit integer;
  v_total integer := 0; v_variant uuid; v_price integer; v_estimate integer := 0;
begin
  select * into v_order from public.orders where id = p_order for update;
  if not found or v_order.payment_status <> 'paid' or v_order.order_number like 'ANAI-X-%' or not exists (
    select 1 from public.payments where order_id = p_order and status = 'paid'
  ) then raise exception using message = 'RETURN_ORDER_INELIGIBLE'; end if;
  select id into v_request from anai_private.return_requests where original_order_id = p_order and customer_key = p_key;
  if found then return v_request; end if;
  if p_kind not in ('refund','exchange') or p_code not in ('preference','wrong','damaged','not_as_described')
    or p_kind = 'exchange' and p_code = 'preference'
    or length(btrim(p_reason)) not between 1 and 1200
    or jsonb_array_length(p_lines) not between 1 and 30 or jsonb_array_length(p_photos) > 3
    or p_code in ('damaged','wrong') and jsonb_array_length(p_photos) = 0 then
    raise exception using message = 'RETURN_INVALID_REQUEST';
  end if;
  insert into anai_private.return_requests(original_order_id, customer_key, kind, reason_code, reason, credit_kes)
  values (p_order, p_key, p_kind, p_code, btrim(p_reason), 0) returning id into v_request;
  for v_line in select value from jsonb_array_elements(p_lines) loop
    select * into v_item from public.order_items where id = (v_line->>'itemId')::uuid and order_id = p_order;
    if not found then raise exception using message = 'RETURN_INVALID_LINE'; end if;
    v_quantity := (v_line->>'quantity')::integer;
    select coalesce(sum(l.quantity),0)::integer, coalesce(sum(l.credit_kes),0)::integer
    into v_used,v_used_credit from anai_private.return_lines l
    join anai_private.return_requests r on r.id = l.request_id
    where l.order_item_id = v_item.id and (r.decision in ('requested','approved') or r.received_at is not null);
    if v_quantity is null or v_quantity < 1 or v_used + v_quantity > v_item.quantity then
      raise exception using message = 'RETURN_INVALID_QUANTITY';
    end if;
    -- Allocate only the remaining historical credit. The last units receive any rounding remainder.
    v_credit := ((v_item.line_total_kes-v_used_credit)::bigint*v_quantity/(v_item.quantity-v_used))::integer;
    v_variant := null;
    if p_kind = 'exchange' then
      select v.id, v.price_kes into v_variant, v_price from public.product_variants v
      join public.products p on p.id = v.product_id
      where v.id = (v_line->>'replacementId')::uuid and v.is_active and p.is_active and v.stock_quantity >= v_quantity;
      if not found then raise exception using message = 'RETURN_STOCK_UNAVAILABLE'; end if;
      v_estimate := v_estimate + v_price * v_quantity;
    end if;
    insert into anai_private.return_lines values(v_request, v_item.id, v_variant, v_quantity, v_credit, null, null);
    v_total := v_total + v_credit;
  end loop;
  update anai_private.return_requests set credit_kes = v_total, replacement_total_kes = v_estimate where id = v_request;
  for v_photo in select value from jsonb_array_elements(p_photos) loop
    insert into anai_private.return_photos(request_id,mime,bytes)
    values(v_request,v_photo->>'mime',decode(v_photo->>'data','base64'));
  end loop;
  perform anai_private.add_return_event(p_order,v_request,'requested','buyer','{}',true,true);
  return v_request;
end $$;

create or replace function anai_private.return_details(p_request uuid, p_owner boolean)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', r.id, 'reference', o.order_number, 'kind', r.kind, 'decision', r.decision,
    'reasonCode', r.reason_code, 'reason', r.reason, 'note', r.decision_note, 'instructions', r.return_instructions,
    'receivedAt',r.received_at,'createdAt',r.created_at,'fulfilledAt',r.fulfilled_at,
    'creditKes',r.credit_kes + r.delivery_credit_kes, 'replacementTotalKes',r.replacement_total_kes,
    'refundKes',greatest(0,r.credit_kes + r.delivery_credit_kes-r.replacement_total_kes),
    'topupKes',greatest(0,r.replacement_total_kes-r.credit_kes-r.delivery_credit_kes),
    'refundState',r.refund_state,'topupState',r.topup_state,
    'replacementReference', x.order_number, 'reservationEnds',x.checkout_expires_at,
    'proposalPending',r.proposal_pending,
    'stockHeld',x.inventory_reserved_at is not null and x.inventory_released_at is null
      and (x.checkout_expires_at is null or x.checkout_expires_at > now()),
    'version',r.version,
    'lines', (select jsonb_agg(jsonb_build_object('itemId',i.id,'name',i.product_name,'sku',i.sku,'size',i.size,'colour',i.color,
      'quantity',l.quantity,'creditKes',l.credit_kes,'resellable',l.resellable,'damaged',l.damaged,
      'replacementId',v.id,
      'replacement',case when v.id is not null then concat_ws(' / ',p.name,v.color,v.size) end,
      'replacementPriceKes',v.price_kes) order by i.id)
      from anai_private.return_lines l join public.order_items i on i.id=l.order_item_id
      left join public.product_variants v on v.id=l.replacement_variant_id left join public.products p on p.id=v.product_id
      where l.request_id=r.id)
  ) || case when p_owner then jsonb_build_object(
    'deliveredAt',r.delivered_at,'orderedAt',o.created_at,'deliveryFeeKes',o.delivery_fee_kes,
    'payerLastFour',(select right(mpesa_phone_number,4) from public.payments
      where order_id=o.id and status='paid' and lower(provider)='mpesa' order by paid_at limit 1),
    'photos',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'mime',mime)),'[]') from anai_private.return_photos where request_id=r.id)
  ) else '{}'::jsonb end
  from anai_private.return_requests r join public.orders o on o.id=r.original_order_id
  left join public.orders x on x.id=r.replacement_order_id where r.id=p_request
$$;

create or replace function public.get_return_order(p_order uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('reference',o.order_number,'totalKes',o.total_kes,
    'items',(select coalesce(jsonb_agg(jsonb_build_object('id',i.id,'name',i.product_name,'colour',i.color,'size',i.size,
      'quantity',i.quantity,'totalKes',i.line_total_kes,'available',i.quantity-coalesce((
        select sum(l.quantity) from anai_private.return_lines l join anai_private.return_requests r on r.id=l.request_id
        where l.order_item_id=i.id and (r.decision in ('requested','approved') or r.received_at is not null)
      ),0)) order by i.created_at,i.id),'[]') from public.order_items i where i.order_id=o.id),
    'requests',(select coalesce(jsonb_agg(anai_private.return_details(r.id,false) order by r.created_at desc),'[]')
      from anai_private.return_requests r where r.original_order_id=o.id))
  from public.orders o where o.id=p_order and o.payment_status in ('paid','refunded') and o.order_number not like 'ANAI-X-%'
$$;

create or replace function public.request_return_link(p_reference text,p_email text,p_owner boolean) returns void
language sql security definer set search_path = '' as $$
  insert into anai_private.return_link_requests(reference,email,owner) values(p_reference,p_email,p_owner)
$$;

create or replace function public.accept_return_alternative(p_order uuid,p_request uuid,p_version integer) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update anai_private.return_requests set proposal_pending=false,version=version+1
  where id=p_request and original_order_id=p_order and decision='requested' and proposal_pending and version=p_version;
  if not found then raise exception using message='RETURN_STATE_CHANGED'; end if;
  perform anai_private.add_return_event(p_order,p_request,'alternative_accepted','buyer','{}',true,true);
end $$;

create or replace function public.get_return_action(p_hash text,p_owner text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select anai_private.return_details(r.id,true) || jsonb_build_object('action',a.action)
  from anai_private.return_actions a join anai_private.return_requests r on r.id=a.request_id
  where a.token_hash=p_hash and a.owner_email=p_owner and a.expires_at>now()
    and a.used_at is null and a.request_version=r.version
$$;

create or replace function public.get_return_photo(p_hash text,p_owner text,p_photo uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('mime',p.mime,'data',encode(p.bytes,'base64'))
  from anai_private.return_photos p join anai_private.return_actions a on a.request_id=p.request_id
  join anai_private.return_requests r on r.id=a.request_id
  where p.id=p_photo and a.token_hash=p_hash and a.owner_email=p_owner and a.expires_at>now()
    and a.used_at is null and a.request_version=r.version
$$;

-- The normal checkout stock field is sellable stock. Deduct the reservation once and
-- keep that deduction when settled; on expiry the existing checkout release restores it.
create or replace function anai_private.reserve_exchange_stock(p_order uuid) returns boolean
language plpgsql set search_path = '' as $$
begin
  perform v.id from public.product_variants v where v.id in (
    select i.variant_id from public.order_items i where i.order_id=p_order
  ) order by v.id for update;
  if exists (
    select 1 from (select variant_id,sum(quantity) n from public.order_items where order_id=p_order group by variant_id) i
    left join public.product_variants v on v.id=i.variant_id left join public.products p on p.id=v.product_id
    where v.id is null or not v.is_active or not p.is_active or v.stock_quantity<i.n
  ) then return false; end if;
  update public.product_variants v set stock_quantity=v.stock_quantity-i.n::integer
  from (select variant_id,sum(quantity) n from public.order_items where order_id=p_order group by variant_id) i
  where v.id=i.variant_id;
  update public.orders set inventory_reserved_at=now(), inventory_released_at=null where id=p_order;
  return true;
end $$;

create or replace function anai_private.settle_exchange_order(p_order uuid) returns boolean
language plpgsql set search_path = '' as $$
declare v_order public.orders%rowtype; v_stock boolean := true;
begin
  select * into strict v_order from public.orders where id=p_order for update;
  if v_order.inventory_released_at is not null then v_stock := anai_private.reserve_exchange_stock(p_order); end if;
  update public.orders set status=case when v_stock then 'confirmed' else 'processing' end,
    payment_status='paid', checkout_expires_at=null where id=p_order;
  return v_stock;
end $$;

create or replace function public.confirm_return_action(p_hash text,p_owner text,p_data jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  a anai_private.return_actions%rowtype; r anai_private.return_requests%rowtype;
  o public.orders%rowtype; x public.orders%rowtype; l record; v_line jsonb;
  v_delivery timestamptz; v_note text; v_amount integer; v_reference text; v_date timestamptz;
  v_fee integer := 0; v_total integer := 0; v_delivery_credit integer := 0; v_credit integer; v_payment uuid;
  v_original_paid integer;
  v_replacement uuid; v_sellable integer; v_damaged integer; v_action text; v_state text;
  v_notify_buyer boolean := true;
begin
  select * into a from anai_private.return_actions where token_hash=p_hash for update;
  if not found or a.owner_email<>p_owner or a.used_at is not null or a.expires_at<=now() then
    raise exception using message='RETURN_LINK_INVALID'; end if;
  select * into strict r from anai_private.return_requests where id=a.request_id for update;
  if r.version<>a.request_version then raise exception using message='RETURN_LINK_INVALID'; end if;
  select * into strict o from public.orders where id=r.original_order_id for update;
  if r.replacement_order_id is not null then
    select * into strict x from public.orders where id=r.replacement_order_id for update;
  end if;
  v_note := nullif(btrim(left(p_data->>'note',1200)),'');
  v_action := a.action;
  v_amount := (p_data->>'amount')::integer;
  v_reference := upper(btrim(p_data->>'reference'));
  v_date := (p_data->>'paidAt')::timestamptz;

  if v_action='decline' and r.decision='requested' then
    if v_note is null then raise exception using message='RETURN_NOTE_REQUIRED'; end if;
    update anai_private.return_requests set decision='declined', decision_note=v_note where id=r.id;
  elsif v_action='offer' and r.decision='requested' and r.kind='exchange' then
    for l in select * from anai_private.return_lines where request_id=r.id order by order_item_id loop
      select v.id,v.price_kes into v_replacement,v_amount from public.product_variants v
        join public.products p on p.id=v.product_id
        where v.id=(p_data->'replacements'->>l.order_item_id::text)::uuid and v.is_active and p.is_active
          and v.stock_quantity>=l.quantity;
      if not found then raise exception using message='RETURN_STOCK_UNAVAILABLE'; end if;
      update anai_private.return_lines set replacement_variant_id=v_replacement
        where request_id=r.id and order_item_id=l.order_item_id;
      v_total := v_total+v_amount*l.quantity;
    end loop;
    if exists (select 1 from anai_private.return_lines l2 join public.product_variants v on v.id=l2.replacement_variant_id
      where l2.request_id=r.id group by v.id,v.stock_quantity having sum(l2.quantity)>v.stock_quantity)
    then raise exception using message='RETURN_STOCK_UNAVAILABLE'; end if;
    update anai_private.return_requests set proposal_pending=true,replacement_total_kes=v_total where id=r.id;
  elsif v_action='approve' and r.decision='requested' and not r.proposal_pending then
    v_delivery := (p_data->>'deliveredAt')::timestamptz;
    if v_delivery is null or v_delivery<o.created_at or v_delivery>r.created_at or
      r.created_at > v_delivery + (case when r.reason_code='preference' then interval '7 days' else interval '48 hours' end)
    then raise exception using message='RETURN_OUTSIDE_POLICY'; end if;
    if not coalesce((p_data->>'policyVerified')::boolean,false) or v_note is null then
      raise exception using message='RETURN_INSPECTION_REQUIRED'; end if;
    if coalesce((p_data->>'refundDelivery')::boolean,false) then
      if r.reason_code='preference' or exists (
        select 1 from anai_private.return_requests where original_order_id=o.id and delivery_credit_kes>0
          and (decision='approved' or received_at is not null)
      ) then raise exception using message='RETURN_INVALID_AMOUNT'; end if;
      v_delivery_credit := o.delivery_fee_kes;
    end if;
    v_credit := r.credit_kes+v_delivery_credit;
    if (select coalesce(sum(credit_kes+delivery_credit_kes),0) from anai_private.return_requests
        where original_order_id=o.id and (decision='approved' or received_at is not null)) + v_credit >
      least(o.total_kes,(select coalesce(sum(amount_kes),0) from public.payments where order_id=o.id and status='paid')) then
      raise exception using message='RETURN_INVALID_AMOUNT'; end if;
    if r.kind='exchange' then
      if p_data->>'deliveryMethod' not in ('town-pickup','nairobi-delivery') or p_data->>'deliveryMethod' is null
        or p_data->>'deliveryMethod'='nairobi-delivery' and nullif(o.delivery_address,'') is null then
        raise exception using message='RETURN_INVALID_DELIVERY'; end if;
      v_fee := case when p_data->>'deliveryMethod'='nairobi-delivery' then 300 else 0 end;
      perform v.id from public.product_variants v join anai_private.return_lines rl on rl.replacement_variant_id=v.id
        where rl.request_id=r.id order by v.id for update of v;
      select coalesce(sum(v.price_kes*rl.quantity),0)::integer into v_total from anai_private.return_lines rl
        join public.product_variants v on v.id=rl.replacement_variant_id where rl.request_id=r.id;
      if v_amount is distinct from v_total+v_fee then raise exception using message='RETURN_PRICE_CHANGED'; end if;
      insert into public.orders(order_number,customer_id,status,payment_status,subtotal_kes,delivery_fee_kes,total_kes,
        customer_email,customer_phone,delivery_county,delivery_town,delivery_address,checkout_expires_at)
      values('ANAI-X-'||replace(r.id::text,'-',''),o.customer_id,'pending','pending',v_total,v_fee,v_total+v_fee,
        o.customer_email,o.customer_phone,case when v_fee>0 then 'Nairobi' end,
        case when v_fee=0 then 'Town pickup' end,case when v_fee>0 then o.delivery_address end,now()+interval '48 hours')
      returning id into v_replacement;
      insert into public.order_items(order_id,variant_id,product_name,sku,color,size,unit_price_kes,quantity,line_total_kes)
      select v_replacement,v.id,p.name,v.sku,v.color,v.size,v.price_kes,rl.quantity,v.price_kes*rl.quantity
      from anai_private.return_lines rl join public.product_variants v on v.id=rl.replacement_variant_id
      join public.products p on p.id=v.product_id where rl.request_id=r.id;
      if not anai_private.reserve_exchange_stock(v_replacement) then raise exception using message='RETURN_STOCK_UNAVAILABLE'; end if;
    elsif v_amount is distinct from v_credit then raise exception using message='RETURN_PRICE_CHANGED';
    end if;
    update anai_private.return_requests set decision='approved',delivered_at=v_delivery,
      return_instructions=v_note,delivery_credit_kes=v_delivery_credit,replacement_order_id=v_replacement,
      replacement_total_kes=v_total+v_fee,
      topup_state=case when v_total+v_fee>v_credit then 'due' else 'not_due' end,
      refund_state=case when v_total+v_fee<v_credit then 'due' else 'not_due' end where id=r.id;
  elsif v_action='receive' and r.decision='approved' and r.received_at is null then
    perform v.id from public.product_variants v where v.id in (
      select i.variant_id from public.order_items i join anai_private.return_lines rl on rl.order_item_id=i.id where rl.request_id=r.id
    ) order by v.id for update;
    for l in select rl.*, i.variant_id from anai_private.return_lines rl join public.order_items i on i.id=rl.order_item_id
        where rl.request_id=r.id order by rl.order_item_id loop
      v_line := p_data->'inspection'->l.order_item_id::text;
      v_sellable := (v_line->>'resellable')::integer;
      v_damaged := (v_line->>'damaged')::integer;
      if v_sellable is null or v_damaged is null or v_sellable<0 or v_damaged<0 or v_sellable+v_damaged<>l.quantity then
        raise exception using message='RETURN_INVALID_INSPECTION'; end if;
      if v_sellable>0 then
        if l.variant_id is null then raise exception using message='RETURN_STOCK_UNAVAILABLE'; end if;
        insert into anai_private.return_stock_movements(request_id,order_item_id,variant_id,quantity)
          values(r.id,l.order_item_id,l.variant_id,v_sellable);
        update public.product_variants set stock_quantity=stock_quantity+v_sellable where id=l.variant_id;
      end if;
      update anai_private.return_lines set resellable=v_sellable,damaged=v_damaged where request_id=r.id and order_item_id=l.order_item_id;
    end loop;
    update anai_private.return_requests set received_at=now() where id=r.id;
    if x.id is not null and r.topup_state='not_due' and x.checkout_expires_at>now() and x.inventory_released_at is null then
      perform anai_private.settle_exchange_order(x.id);
    end if;
  elsif v_action='cancel' and r.decision='approved' and (r.received_at is null or r.kind='exchange') and r.fulfilled_at is null
    and r.topup_state in ('due','not_due') and r.refund_state in ('due','not_due') then
    if v_note is null then raise exception using message='RETURN_NOTE_REQUIRED'; end if;
    if x.id is not null then
      if exists (select 1 from public.payments where order_id=x.id and status in ('pending','paid')) then
        raise exception using message='RETURN_PAYMENT_RECONCILIATION'; end if;
      update public.orders set payment_status='pending' where id=x.id and payment_status='paid';
      perform public.release_checkout_inventory(x.id);
      update public.orders set status='cancelled',payment_status='unpaid',checkout_expires_at=null where id=x.id;
    end if;
    update anai_private.return_requests set decision='cancelled',decision_note=v_note,topup_state='not_due',
      replacement_total_kes=case when r.received_at is not null then 0 else replacement_total_kes end,
      refund_state=case when r.received_at is not null and r.credit_kes+r.delivery_credit_kes>0 then 'due' else 'not_due' end
      where id=r.id;
  elsif v_action='begin_refund' and r.decision in ('approved','cancelled') and r.received_at is not null and r.refund_state='due' then
    if v_amount is distinct from r.credit_kes+r.delivery_credit_kes-r.replacement_total_kes then
      raise exception using message='RETURN_INVALID_AMOUNT'; end if;
    select id,amount_kes into v_payment,v_original_paid from public.payments where order_id=o.id and status='paid'
      and lower(provider)='mpesa' and nullif(mpesa_receipt_number,'') is not null and nullif(mpesa_phone_number,'') is not null
      order by paid_at limit 1;
    if not found then raise exception using message='RETURN_ORIGINAL_PAYMENT_UNVERIFIED'; end if;
    if v_amount+(select coalesce(sum(f.amount_kes),0) from anai_private.return_refunds f where f.original_payment_id=v_payment)
      >v_original_paid then raise exception using message='RETURN_INVALID_AMOUNT'; end if;
    update anai_private.return_requests set refund_state='processing' where id=r.id;
  elsif v_action='refund_unknown' and r.refund_state='processing' then
    update anai_private.return_requests set refund_state='unknown' where id=r.id;
  elsif v_action='refund_failed' and r.refund_state in ('processing','unknown') then
    if v_note is null or not coalesce((p_data->>'policyVerified')::boolean,false) then
      raise exception using message='RETURN_NOTE_REQUIRED'; end if;
    update anai_private.return_requests set refund_state='due' where id=r.id;
  elsif v_action='record_refund' and r.refund_state in ('processing','unknown') then
    if v_amount is distinct from r.credit_kes+r.delivery_credit_kes-r.replacement_total_kes or
      not coalesce(v_reference~'^[A-Z0-9-]{5,60}$',false) or v_date is null or v_date>now() or v_date<o.created_at then
      raise exception using message='RETURN_INVALID_PAYMENT'; end if;
    select id,amount_kes into v_payment,v_original_paid from public.payments where order_id=o.id and status='paid'
      and lower(provider)='mpesa' and nullif(mpesa_receipt_number,'') is not null and nullif(mpesa_phone_number,'') is not null
      order by paid_at limit 1;
    if not found then raise exception using message='RETURN_ORIGINAL_PAYMENT_UNVERIFIED'; end if;
    if v_amount+(select coalesce(sum(f.amount_kes),0) from anai_private.return_refunds f where f.original_payment_id=v_payment)
      >v_original_paid then raise exception using message='RETURN_INVALID_AMOUNT'; end if;
    insert into anai_private.return_refunds(request_id,original_payment_id,amount_kes,reference,paid_at,recorded_by)
      values(r.id,v_payment,v_amount,v_reference,v_date,p_owner);
    update anai_private.return_requests set refund_state='confirmed' where id=r.id;
    if (select coalesce(sum(f.amount_kes),0) from anai_private.return_refunds f
      join anai_private.return_requests req on req.id=f.request_id where req.original_order_id=o.id)=o.total_kes then
      update public.orders set payment_status='refunded' where id=o.id;
    end if;
  elsif v_action='record_payment' and r.decision='approved' and r.received_at is not null and r.topup_state='due' and x.id is not null then
    if v_amount is null or v_amount<=0 or
      not coalesce(v_reference~'^[A-Z0-9-]{5,60}$',false) or v_date is null or v_date>now() or v_date<o.created_at then
      raise exception using message='RETURN_INVALID_PAYMENT'; end if;
    perform public.expire_checkout_reservations(x.id);
    insert into public.payments(order_id,provider,provider_reference,mpesa_receipt_number,amount_kes,status,paid_at)
      values(x.id,'mpesa-offsite',v_reference,v_reference,v_amount,'paid',v_date);
    v_state := 'reconciliation';
    if v_amount=r.replacement_total_kes-r.credit_kes-r.delivery_credit_kes and anai_private.settle_exchange_order(x.id) then
      v_state := 'settled';
    end if;
    update anai_private.return_requests set topup_state=v_state where id=r.id;
    v_action := case when v_state='settled' then 'payment_settled' else 'payment_reconciliation' end;
  elsif v_action='renew_stock' and r.decision='approved' and x.id is not null and x.inventory_released_at is not null
    and r.topup_state in ('due','not_due','settled','reconciliation') then
    if r.topup_state='reconciliation' and (
      (select coalesce(sum(amount_kes),0) from public.payments where order_id=x.id and status='paid')
        <>r.replacement_total_kes-r.credit_kes-r.delivery_credit_kes
      or exists (select 1 from public.payments where order_id=x.id and status='pending')
    ) then raise exception using message='RETURN_PAYMENT_RECONCILIATION'; end if;
    if not anai_private.reserve_exchange_stock(x.id) then raise exception using message='RETURN_STOCK_UNAVAILABLE'; end if;
    if r.topup_state in ('settled','reconciliation') or r.topup_state='not_due' and r.received_at is not null then
      perform anai_private.settle_exchange_order(x.id);
      if r.topup_state='reconciliation' then update anai_private.return_requests set topup_state='settled' where id=r.id; end if;
    else
      update public.orders set checkout_expires_at=now()+interval '48 hours' where id=x.id;
    end if;
  elsif v_action='fulfil' and r.decision='approved' and r.received_at is not null and r.fulfilled_at is null
    and x.id is not null and x.payment_status='paid' and x.inventory_released_at is null
    and r.topup_state in ('not_due','settled') then
    if v_note is null then raise exception using message='RETURN_NOTE_REQUIRED'; end if;
    update public.orders set status='fulfilled' where id=x.id;
    update anai_private.return_requests set fulfilled_at=now(),decision_note=v_note where id=r.id;
  else raise exception using message='RETURN_STATE_CHANGED';
  end if;

  update anai_private.return_actions set used_at=now() where token_hash=p_hash;
  update anai_private.return_requests set version=version+1 where id=r.id;
  perform anai_private.add_return_event(o.id,r.id,v_action,p_owner,
    jsonb_strip_nulls(jsonb_build_object('note',v_note,'amount',v_amount,'reference',v_reference)),true,v_notify_buyer);
  return r.id;
end $$;

create or replace function public.start_exchange_topup(p_order uuid,p_request uuid,p_phone text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r anai_private.return_requests%rowtype; x public.orders%rowtype; v_amount integer;
begin
  select * into r from anai_private.return_requests where id=p_request and original_order_id=p_order for update;
  if not found or r.decision<>'approved' or r.topup_state<>'due' or r.received_at is null then
    raise exception using message='RETURN_STATE_CHANGED'; end if;
  select * into strict x from public.orders where id=r.replacement_order_id for update;
  if x.inventory_released_at is not null or x.checkout_expires_at is null or x.checkout_expires_at<=now() then
    raise exception using message='RETURN_RESERVATION_EXPIRED'; end if;
  v_amount := r.replacement_total_kes-r.credit_kes-r.delivery_credit_kes;
  if v_amount<=0 then raise exception using message='RETURN_INVALID_AMOUNT'; end if;
  insert into public.payments(order_id,provider,amount_kes,status,mpesa_phone_number)
    values(x.id,'mpesa',v_amount,'pending',p_phone);
  update anai_private.return_requests set topup_state='processing',version=version+1 where id=r.id;
  perform anai_private.add_return_event(p_order,r.id,'payment_processing','buyer','{}',true,true);
  return jsonb_build_object('orderId',x.id,'reference',x.order_number,'amountKes',v_amount);
end $$;

create or replace function public.reject_exchange_topup(p_order uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare r anai_private.return_requests%rowtype;
begin
  select * into r from anai_private.return_requests where replacement_order_id=p_order for update;
  if not found or r.topup_state<>'processing' then return; end if;
  update public.payments set status='failed' where order_id=p_order and provider='mpesa' and status='pending'
    and mpesa_checkout_request_id is null;
  if not found then return; end if;
  update anai_private.return_requests set topup_state='due',version=version+1 where id=r.id;
  perform anai_private.add_return_event(r.original_order_id,r.id,'payment_failed','mpesa','{}',true,true);
end $$;

create or replace function public.finalize_exchange_topup(
  p_checkout text,p_code integer,p_amount numeric,p_receipt text,p_phone text,p_date text,p_raw jsonb
) returns table(recorded boolean,paid boolean,failed boolean)
language plpgsql security definer set search_path = '' as $$
declare r anai_private.return_requests%rowtype; p public.payments%rowtype; v_state text; v_event text; v_paid boolean := false;
begin
  select req.* into r from anai_private.return_requests req join public.payments pay on pay.order_id=req.replacement_order_id
    where pay.mpesa_checkout_request_id=p_checkout and pay.provider='mpesa' for update of req;
  if not found then return; end if;
  perform id from public.orders where id=r.replacement_order_id for update;
  select * into strict p from public.payments where mpesa_checkout_request_id=p_checkout and provider='mpesa' for update;
  if p.status='paid' or p_code<>0 and (p.raw_payload ? 'exchange_callback' or p.status='failed') then
    return query select true,p.status='paid',p.status='failed'; return;
  end if;
  if p_code=0 and p_amount between 1 and 2147483647 and p_amount=trunc(p_amount) and coalesce(p_receipt,'')<>'' then
    update public.payments set status='paid',paid_at=now(),mpesa_receipt_number=p_receipt,amount_kes=p_amount::integer,
      mpesa_phone_number=coalesce(nullif(p_phone,''),mpesa_phone_number),mpesa_transaction_date=nullif(p_date,''),
      mpesa_result_code=p_code,raw_payload=coalesce(raw_payload,'{}')||jsonb_build_object('exchange_callback',p_raw) where id=p.id;
    v_paid := true;
    if p_amount=p.amount_kes and r.topup_state in ('processing','due')
      and not exists (select 1 from public.payments where order_id=p.order_id and id<>p.id and status in ('pending','paid')) then
      perform public.expire_checkout_reservations(p.order_id);
      v_state := case when anai_private.settle_exchange_order(p.order_id) then 'settled' else 'reconciliation' end;
    else
      v_state := 'reconciliation';
    end if;
    v_event := case when v_state='settled' then 'payment_settled' else 'payment_reconciliation' end;
  elsif p_code<=0 then
    -- Keep the verified callback even when its amount or receipt needs reconciliation.
    update public.payments set mpesa_result_code=p_code,
      raw_payload=coalesce(raw_payload,'{}')||jsonb_build_object('exchange_callback',p_raw) where id=p.id;
    v_state := 'reconciliation'; v_event := 'payment_reconciliation';
  else
    update public.payments set status='failed',mpesa_result_code=p_code,
      raw_payload=coalesce(raw_payload,'{}')||jsonb_build_object('exchange_callback',p_raw) where id=p.id;
    v_state := case when r.topup_state='processing' then 'due' else r.topup_state end;
    v_event := 'payment_failed';
  end if;
  update anai_private.return_requests set topup_state=v_state,version=version+1 where id=r.id;
  perform anai_private.add_return_event(r.original_order_id,r.id,v_event,'mpesa','{}',true,true);
  return query select true,v_paid,v_event='payment_failed';
end $$;


create or replace function public.process_return_link_requests() returns void
language plpgsql security definer set search_path = '' as $$
declare l record; r record; o uuid;
begin
  for l in select * from anai_private.return_link_requests order by created_at limit 15 for update skip locked loop
    if l.owner then
      select id, original_order_id into r from anai_private.return_requests where id::text=l.reference;
      if found and not exists (
        select 1 from anai_private.return_events where request_id=r.id and event='owner_links' and created_at>now()-interval '5 minutes'
      ) then
        perform anai_private.add_return_event(r.original_order_id,r.id,'owner_links','system','{}',true,false);
      end if;
    else
      select id into o from public.orders where order_number=l.reference and lower(customer_email)=l.email
        and payment_status in ('paid','refunded') and order_number not like 'ANAI-X-%';
      if found and not exists (
        select 1 from anai_private.return_events where order_id=o and event='order_link' and created_at>now()-interval '5 minutes'
      ) then
        perform anai_private.add_return_event(o,null,'order_link','system','{}',false,true);
      end if;
    end if;
    delete from anai_private.return_link_requests where id=l.id;
  end loop;
end $$;

create or replace function public.claim_return_mail(p_event uuid default null)
returns table(mail_id uuid, claim uuid, audience text, event_name text, order_id uuid, buyer_email text, details jsonb)
language sql security definer set search_path = '' as $$
  with candidates as (
    select m.id from anai_private.return_mail m join anai_private.return_events e on e.id=m.event_id
    where m.sent_at is null and m.attempts<10 and (m.claimed_at is null or m.claimed_at<now()-interval '5 minutes')
      and (p_event is null or e.request_id=p_event)
    order by m.claimed_at nulls first,e.created_at limit 5 for update of m skip locked
  ), claimed as (
    update anai_private.return_mail m set claim_id=gen_random_uuid(), claimed_at=now(), attempts=m.attempts+1
    from candidates c where m.id=c.id returning m.*
  )
  select c.id,c.claim_id,c.audience,e.event,o.id,o.customer_email,
    anai_private.return_details(e.request_id,c.audience='owner')
  from claimed c join anai_private.return_events e on e.id=c.event_id join public.orders o on o.id=e.order_id
$$;

create or replace function public.finish_return_mail(p_id uuid,p_claim uuid,p_sent boolean) returns void
language sql security definer set search_path = '' as $$
  update anai_private.return_mail set sent_at=case when p_sent then now() else null end,claim_id=null
  where id=p_id and claim_id=p_claim
$$;

create or replace function public.issue_return_actions(p_request uuid,p_version integer,p_owner text,p_actions jsonb)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_version integer;
begin
  select version into v_version from anai_private.return_requests where id=p_request for share;
  if not found or v_version<>p_version then return false; end if;
  insert into anai_private.return_actions(token_hash,request_id,owner_email,action,request_version,expires_at)
    select value,p_request,p_owner,key,p_version,now()+interval '48 hours' from jsonb_each_text(p_actions)
    on conflict (token_hash) do nothing;
  return true;
end $$;

create or replace function public.note_return_expiries() returns void
language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  for r in select req.id,req.original_order_id,o.inventory_released_at from anai_private.return_requests req
    join public.orders o on o.id=req.replacement_order_id
    where req.decision='approved' and req.fulfilled_at is null and o.inventory_released_at is not null
      and (req.topup_state<>'reconciliation' or o.payment_status='paid')
      and not exists (select 1 from anai_private.return_events e where e.request_id=req.id
        and e.event='reservation_expired' and e.detail->>'releasedAt'=o.inventory_released_at::text)
    order by o.inventory_released_at limit 20 for update of req skip locked
  loop
    update anai_private.return_requests set version=version+1 where id=r.id;
    perform anai_private.add_return_event(r.original_order_id,r.id,'reservation_expired','system',
      jsonb_build_object('releasedAt',r.inventory_released_at::text),true,true);
  end loop;
end $$;

revoke all on schema anai_private from public;
revoke all on function
  public.submit_return_request(uuid,uuid,text,text,text,jsonb,jsonb), public.get_return_order(uuid),
  public.request_return_link(text,text,boolean), public.accept_return_alternative(uuid,uuid,integer),
  public.get_return_action(text,text), public.get_return_photo(text,text,uuid),
  public.confirm_return_action(text,text,jsonb), public.start_exchange_topup(uuid,uuid,text), public.reject_exchange_topup(uuid),
  public.finalize_exchange_topup(text,integer,numeric,text,text,text,jsonb), public.process_return_link_requests(),
  public.claim_return_mail(uuid), public.finish_return_mail(uuid,uuid,boolean), public.issue_return_actions(uuid,integer,text,jsonb),
  public.note_return_expiries() from public;
grant execute on function
  public.submit_return_request(uuid,uuid,text,text,text,jsonb,jsonb), public.get_return_order(uuid),
  public.request_return_link(text,text,boolean), public.accept_return_alternative(uuid,uuid,integer),
  public.get_return_action(text,text), public.get_return_photo(text,text,uuid),
  public.confirm_return_action(text,text,jsonb), public.start_exchange_topup(uuid,uuid,text), public.reject_exchange_topup(uuid),
  public.finalize_exchange_topup(text,integer,numeric,text,text,text,jsonb), public.process_return_link_requests(),
  public.claim_return_mail(uuid), public.finish_return_mail(uuid,uuid,boolean), public.issue_return_actions(uuid,integer,text,jsonb),
  public.note_return_expiries() to anai_app;

commit;
