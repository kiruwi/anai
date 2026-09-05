begin;

create schema if not exists anai_private;
revoke all on schema anai_private from public;
create table if not exists anai_private.request_limits (
  key text primary key,
  count integer not null,
  reset_at timestamptz not null
);
create index if not exists request_limits_reset_idx on anai_private.request_limits(reset_at);
create table if not exists anai_private.recovery_lease (
  id boolean primary key default true check (id),
  token uuid not null,
  expires_at timestamptz not null
);
revoke all on all tables in schema anai_private from public;

alter table public.mpesa_callback_events add column if not exists order_id uuid references public.orders(id);
alter table public.mpesa_callback_events
  add column if not exists retry_attempts integer not null default 0,
  add column if not exists last_retry_at timestamptz;
alter table public.support_requests
  add column if not exists email_pending boolean not null default false,
  add column if not exists email_claim_token uuid,
  add column if not exists email_claimed_at timestamptz,
  add column if not exists email_attempts integer not null default 0,
  add column if not exists email_last_error text;
-- Historical requests may already have been sent. Only enqueue new requests.
alter table public.support_requests alter column email_pending set default true;
create index if not exists support_email_pending_idx on public.support_requests(email_claimed_at)
  where email_pending;
create index if not exists pending_checkout_expiry_idx on public.orders(checkout_expires_at)
  where payment_status = 'pending' and checkout_expires_at is not null;

create or replace function public.consume_request_limit(p_key text, p_max integer, p_window_ms integer)
returns table(allowed boolean, retry_after integer)
language plpgsql security definer set search_path = '' as $$
declare v_count integer; v_reset timestamptz;
begin
  if length(p_key) <> 64 or p_max < 1 or p_window_ms < 1000 or p_window_ms > 86400000 then
    raise exception 'INVALID_RATE_LIMIT';
  end if;
  insert into anai_private.request_limits as limits(key, count, reset_at)
  values (p_key, 1, clock_timestamp() + p_window_ms * interval '1 millisecond')
  on conflict (key) do update set
    count = case when limits.reset_at <= clock_timestamp() then 1 else least(limits.count + 1, p_max + 1) end,
    reset_at = case when limits.reset_at <= clock_timestamp()
      then clock_timestamp() + p_window_ms * interval '1 millisecond' else limits.reset_at end
  returning count, reset_at into v_count, v_reset;
  return query select v_count <= p_max, greatest(1, ceil(extract(epoch from v_reset - clock_timestamp()))::integer);
end;
$$;

create or replace function public.expire_checkout_reservations(p_order_id uuid default null)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_order record; v_count integer := 0;
begin
  for v_order in
    select id from public.orders
    where payment_status = 'pending' and checkout_expires_at < now()
      and (p_order_id is null or id = p_order_id)
    order by id limit 100 for update skip locked
  loop
    perform public.release_checkout_inventory(v_order.id);
    update public.orders set checkout_expires_at = null, status = 'processing'
      where id = v_order.id and payment_status = 'pending';
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

create or replace function public.set_mpesa_checkout_request(
  p_order_id uuid, p_checkout_request_id text, p_merchant_request_id text, p_initiation_payload jsonb
) returns boolean language plpgsql security definer set search_path = '' as $$
begin
  -- Same lock order as finalization and expiry. Never replace an existing request ID.
  perform id from public.orders where id = p_order_id for update;
  if exists (select 1 from public.payments where order_id = p_order_id
      and lower(provider) = 'mpesa' and mpesa_checkout_request_id = p_checkout_request_id) then
    return true;
  end if;
  update public.payments set provider_reference = p_checkout_request_id,
    mpesa_checkout_request_id = p_checkout_request_id,
    mpesa_merchant_request_id = nullif(p_merchant_request_id, ''),
    raw_payload = coalesce(raw_payload, '{}'::jsonb) || jsonb_build_object('initiation', p_initiation_payload)
  where order_id = p_order_id and lower(provider) = 'mpesa' and status = 'pending'
    and mpesa_checkout_request_id is null;
  return found;
end;
$$;

create or replace function public.claim_support_email(p_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_token uuid;
begin
  update public.support_requests
  set email_claim_token = gen_random_uuid(), email_claimed_at = now(),
      email_attempts = email_attempts + 1
  where id = p_id and email_pending and email_attempts < 10
    and (email_claimed_at is null or email_claimed_at < now() - interval '5 minutes')
  returning email_claim_token into v_token;
  return v_token;
end;
$$;

create or replace function public.finish_support_email(p_id uuid, p_token uuid, p_error text)
returns void language sql security definer set search_path = '' as $$
  update public.support_requests set email_pending = p_error is not null,
    email_last_error = left(p_error, 1000), email_claim_token = null
  where id = p_id and email_claim_token = p_token;
$$;

create or replace function public.claim_recovery_job()
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_token uuid;
begin
  insert into anai_private.recovery_lease as lease(id, token, expires_at)
  values (true, gen_random_uuid(), now() + interval '2 minutes')
  on conflict (id) do update set token = excluded.token, expires_at = excluded.expires_at
    where lease.expires_at < now()
  returning token into v_token;
  if v_token is not null then
    delete from anai_private.request_limits where reset_at < now();
  end if;
  return v_token;
end;
$$;

create or replace function public.finish_recovery_job(p_token uuid)
returns void language sql security definer set search_path = '' as $$
  delete from anai_private.recovery_lease where token = p_token;
$$;

revoke all on function public.consume_request_limit(text, integer, integer) from public;
revoke all on function public.expire_checkout_reservations(uuid) from public;
revoke all on function public.claim_support_email(uuid) from public;
revoke all on function public.finish_support_email(uuid, uuid, text) from public;
revoke all on function public.claim_recovery_job() from public;
revoke all on function public.finish_recovery_job(uuid) from public;
grant execute on function public.consume_request_limit(text, integer, integer),
  public.expire_checkout_reservations(uuid), public.claim_support_email(uuid),
  public.finish_support_email(uuid, uuid, text), public.claim_recovery_job(),
  public.finish_recovery_job(uuid) to anai_app;

-- Updated checkout function follows below; the transaction includes its replacement.
create or replace function public.create_checkout_order(
  p_order_number text,
  p_idempotency_key text,
  p_fingerprint_hash text,
  p_email text,
  p_full_name text,
  p_phone text,
  p_address text,
  p_delivery_method text,
  p_lines jsonb,
  p_checkout_payload jsonb
)
returns table (
  order_id uuid,
  order_number text,
  total_kes integer,
  checkout_request_id text,
  created boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_existing record;
  v_customer_id uuid;
  v_order_id uuid;
  v_line jsonb;
  v_variant record;
  v_quantity integer;
  v_subtotal integer := 0;
  v_delivery_fee integer;
begin
  if p_idempotency_key is null or length(p_idempotency_key) < 16 then
    raise exception using errcode = '22023', message = 'INVALID_IDEMPOTENCY_KEY';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key, 2));

  select orders.id, orders.order_number, orders.total_kes, payments.mpesa_checkout_request_id
  into v_existing
  from public.orders as orders
  left join public.payments as payments
    on payments.order_id = orders.id and lower(payments.provider) = 'mpesa'
  where orders.idempotency_key = p_idempotency_key
  limit 1;

  if found then
    return query select v_existing.id, v_existing.order_number, v_existing.total_kes,
      v_existing.mpesa_checkout_request_id, false;
    return;
  end if;

  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) < 1 or jsonb_array_length(p_lines) > 20 then
    raise exception using errcode = '22023', message = 'INVALID_CART';
  end if;

  -- Reservation expiry does not establish a failed payment.
  perform public.expire_checkout_reservations(null);

  delete from public.checkout_attempts where created_at < now() - interval '1 day';

  -- Serialize rate-limit checks for the same phone and browser fingerprint.
  perform pg_advisory_xact_lock(hashtextextended(p_phone, 0));
  perform pg_advisory_xact_lock(hashtextextended(p_fingerprint_hash, 1));

  if (
    select count(*) from public.checkout_attempts
    where phone = p_phone and created_at > now() - interval '10 minutes'
  ) >= 5 or (
    select count(*) from public.checkout_attempts
    where fingerprint_hash = p_fingerprint_hash and created_at > now() - interval '10 minutes'
  ) >= 10 then
    raise exception using errcode = 'P0001', message = 'CHECKOUT_RATE_LIMITED';
  end if;

  insert into public.checkout_attempts(fingerprint_hash, phone)
  values (p_fingerprint_hash, p_phone);

  insert into public.customers(email, full_name, phone)
  values (p_email, p_full_name, p_phone)
  on conflict (email) do update set email = excluded.email
  returning id into v_customer_id;

  for v_line in select value from jsonb_array_elements(p_lines) order by value->>'variantId'
  loop
    v_quantity := (v_line->>'quantity')::integer;
    if v_quantity < 1 or v_quantity > 99 then
      raise exception using errcode = '22023', message = 'INVALID_QUANTITY';
    end if;

    select variants.id, variants.sku, variants.color, variants.price_kes,
      products.name as product_name
    into v_variant
    from public.product_variants as variants
    join public.products as products on products.id = variants.product_id
    where variants.id = (v_line->>'variantId')::uuid
      and variants.is_active
      and products.is_active
    for update of variants;

    if not found then
      raise exception using errcode = 'P0001', message = 'ITEM_UNAVAILABLE';
    end if;

    v_subtotal := v_subtotal + (v_variant.price_kes * v_quantity);
  end loop;

  v_delivery_fee := case when p_delivery_method = 'nairobi-delivery' then 300 else 0 end;

  insert into public.orders(
    order_number, customer_id, status, payment_status, subtotal_kes, delivery_fee_kes,
    total_kes, delivery_county, delivery_town, delivery_address, customer_phone,
    customer_email, idempotency_key, inventory_reserved_at, checkout_expires_at
  ) values (
    p_order_number, v_customer_id, 'pending', 'pending', v_subtotal, v_delivery_fee,
    v_subtotal + v_delivery_fee,
    case when p_delivery_method = 'nairobi-delivery' then 'Nairobi' end,
    case when p_delivery_method = 'town-pickup' then 'Town pickup' end,
    case when p_delivery_method = 'nairobi-delivery' then p_address end,
    p_phone, p_email, p_idempotency_key, now(), now() + interval '15 minutes'
  ) returning id into v_order_id;

  for v_line in select value from jsonb_array_elements(p_lines) order by value->>'variantId'
  loop
    v_quantity := (v_line->>'quantity')::integer;

    select variants.id, variants.sku, variants.color, variants.price_kes,
      products.name as product_name
    into v_variant
    from public.product_variants as variants
    join public.products as products on products.id = variants.product_id
    where variants.id = (v_line->>'variantId')::uuid
    for update of variants;

    update public.product_variants
    set stock_quantity = stock_quantity - v_quantity
    where id = v_variant.id and stock_quantity >= v_quantity;

    if not found then
      raise exception using errcode = 'P0001', message = 'INSUFFICIENT_STOCK:' || v_variant.product_name;
    end if;

    insert into public.order_items(
      order_id, variant_id, product_name, sku, color, size, unit_price_kes, quantity, line_total_kes
    ) values (
      v_order_id, v_variant.id, v_variant.product_name, v_variant.sku,
      coalesce(nullif(v_line->>'color', ''), v_variant.color), nullif(v_line->>'size', ''),
      v_variant.price_kes, v_quantity, v_variant.price_kes * v_quantity
    );
  end loop;

  insert into public.payments(
    order_id, provider, provider_reference, amount_kes, status, mpesa_phone_number, raw_payload
  ) values (
    v_order_id, 'mpesa', p_order_number, v_subtotal + v_delivery_fee, 'pending', p_phone,
    jsonb_build_object('checkout', p_checkout_payload)
  );

  return query select v_order_id, p_order_number, v_subtotal + v_delivery_fee, null::text, true;
end;
$$;


commit;
