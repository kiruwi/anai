begin;

create table if not exists anai_private.mpesa_reversals (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references anai_private.return_requests(id),
  payment_id uuid not null unique references public.payments(id),
  original_receipt text not null,
  amount_kes integer not null check (amount_kes > 0),
  state text not null default 'sending' check (state in ('sending','accepted','unknown','confirmed','reconciled')),
  conversation_id text,
  originator_id text,
  created_at timestamptz not null default now()
);

-- Limit the first release to full refunds of a single verified payment.
create or replace function public.can_reverse_return(p_request uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from anai_private.return_requests r
    join public.orders o on o.id=r.original_order_id
    join public.payments p on p.order_id=o.id and p.status='paid'
    where r.id=p_request and r.received_at is not null and r.decision in ('approved','cancelled')
      and r.refund_state in ('due','processing') and o.payment_status='paid'
      and lower(p.provider)='mpesa' and p.mpesa_checkout_request_id is not null
      and upper(btrim(p.mpesa_receipt_number)) ~ '^[A-Z0-9]{5,30}$'
      and nullif(btrim(p.mpesa_phone_number),'') is not null
      and r.credit_kes+r.delivery_credit_kes-r.replacement_total_kes=p.amount_kes
      and p.amount_kes=o.total_kes and p.amount_kes>0
      and not exists (select 1 from public.payments other where other.order_id=o.id and other.status='paid' and other.id<>p.id)
      and not exists (select 1 from anai_private.return_refunds f where f.original_payment_id=p.id)
      and not exists (select 1 from anai_private.mpesa_reversals a where a.payment_id=p.id)
      and not exists (select 1 from anai_private.return_requests other where other.original_order_id=o.id
        and other.id<>r.id and other.refund_state in ('processing','unknown'))
  )
$$;

create or replace function public.begin_return_reversal(p_hash text,p_owner text,p_amount integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_request uuid; p public.payments%rowtype; a anai_private.mpesa_reversals%rowtype;
begin
  if not exists (select 1 from anai_private.return_actions where token_hash=p_hash and action='begin_refund') then
    raise exception using message='RETURN_LINK_INVALID'; end if;
  -- Reuse the existing action token, order locks, amount checks and audit event.
  v_request := public.confirm_return_action(p_hash,p_owner,jsonb_build_object('amount',p_amount));
  if not public.can_reverse_return(v_request) then raise exception using message='RETURN_REVERSAL_INELIGIBLE'; end if;
  select pmt.* into strict p from public.payments pmt join anai_private.return_requests r on r.original_order_id=pmt.order_id
    where r.id=v_request and pmt.status='paid';
  insert into anai_private.mpesa_reversals(request_id,payment_id,original_receipt,amount_kes)
    values(v_request,p.id,upper(btrim(p.mpesa_receipt_number)),p_amount) returning * into a;
  return jsonb_build_object('id',a.id,'requestId',a.request_id,'receipt',a.original_receipt,'amount',a.amount_kes);
end $$;

-- Enforce mutual exclusion even if someone opens a previously issued manual action link.
create or replace function anai_private.guard_reversal_refund_state() returns trigger
language plpgsql set search_path = '' as $$
declare a anai_private.mpesa_reversals%rowtype;
begin
  if new.refund_state=old.refund_state then return new; end if;
  select v.* into a from anai_private.mpesa_reversals v join anai_private.return_requests r on r.id=v.request_id
    where r.original_order_id=old.original_order_id and v.state in ('sending','accepted','unknown');
  if not found then return new; end if;
  if new.refund_state='processing' then raise exception using message='RETURN_REVERSAL_PENDING'; end if;
  if a.request_id=old.id and a.state in ('sending','accepted') then
    if new.refund_state<>'unknown' or a.created_at>now()-interval '15 minutes' then
      raise exception using message='RETURN_REVERSAL_PENDING'; end if;
    update anai_private.mpesa_reversals set state='unknown' where id=a.id;
  elsif a.request_id=old.id and a.state='unknown' and new.refund_state in ('due','confirmed') then
    update anai_private.mpesa_reversals set state='reconciled' where id=a.id;
  end if;
  return new;
end $$;

drop trigger if exists guard_reversal_refund_state on anai_private.return_requests;
create trigger guard_reversal_refund_state before update of refund_state on anai_private.return_requests
  for each row execute function anai_private.guard_reversal_refund_state();

create or replace function public.update_return_reversal(
  p_attempt uuid,p_outcome text,p_conversation text,p_originator text,p_original text,p_receipt text,p_amount integer
) returns uuid language plpgsql security definer set search_path = '' as $$
declare a anai_private.mpesa_reversals%rowtype; r anai_private.return_requests%rowtype; o public.orders%rowtype;
begin
  select req.* into r from anai_private.return_requests req
    join anai_private.mpesa_reversals attempt on attempt.request_id=req.id where attempt.id=p_attempt for update of req;
  if not found or r.refund_state not in ('processing','unknown') then return null; end if;
  select * into strict o from public.orders where id=r.original_order_id for update;
  select * into strict a from anai_private.mpesa_reversals where id=p_attempt for update;
  if a.state in ('confirmed','reconciled')
    or (p_conversation is not null and a.conversation_id is not null and a.conversation_id<>p_conversation)
    or (p_originator is not null and a.originator_id is not null and a.originator_id<>p_originator) then return null; end if;

  if p_outcome='accepted' and p_conversation is not null and p_originator is not null then
    update anai_private.mpesa_reversals set state=case when state='sending' then 'accepted' else state end,
      conversation_id=p_conversation,originator_id=p_originator where id=a.id;
    return null;
  elsif p_outcome='confirmed' and p_original=a.original_receipt and p_amount=a.amount_kes
    and p_receipt ~ '^[A-Z0-9-]{5,60}$' and p_conversation is not null and p_originator is not null then
    -- A conflicting receipt must never credit this request.
    begin
      insert into anai_private.return_refunds(request_id,original_payment_id,amount_kes,reference,paid_at,recorded_by)
        values(r.id,a.payment_id,a.amount_kes,p_receipt,now(),'mpesa-reversal');
    exception when unique_violation or raise_exception then
      p_outcome := 'unknown';
    end;
    if p_outcome='confirmed' then
      update anai_private.mpesa_reversals set state='confirmed',conversation_id=p_conversation,originator_id=p_originator where id=a.id;
      update anai_private.return_requests set refund_state='confirmed',version=version+1 where id=r.id;
      update public.orders set payment_status='refunded' where id=o.id;
      perform anai_private.add_return_event(o.id,r.id,'record_refund','mpesa-reversal',
        jsonb_build_object('amount',a.amount_kes,'reference',p_receipt),true,true);
      return r.id;
    end if;
  end if;

  update anai_private.mpesa_reversals set state='unknown' where id=a.id;
  if r.refund_state='unknown' then return null; end if;
  update anai_private.return_requests set refund_state='unknown',version=version+1 where id=r.id;
  perform anai_private.add_return_event(o.id,r.id,'refund_unknown','mpesa-reversal','{}',true,true);
  return r.id;
end $$;

create or replace function public.note_stale_return_reversals() returns void
language plpgsql security definer set search_path = '' as $$
declare v_attempt uuid;
begin
  for v_attempt in select id from anai_private.mpesa_reversals
    where state in ('sending','accepted') and created_at <= now()-interval '15 minutes'
    order by created_at,id limit 10
  loop
    perform public.update_return_reversal(v_attempt,'unknown',null,null,null,null,null);
  end loop;
end $$;

revoke all on function public.can_reverse_return(uuid),public.begin_return_reversal(text,text,integer),
  public.update_return_reversal(uuid,text,text,text,text,text,integer),public.note_stale_return_reversals() from public;
grant execute on function public.can_reverse_return(uuid),public.begin_return_reversal(text,text,integer),
  public.update_return_reversal(uuid,text,text,text,text,text,integer),public.note_stale_return_reversals() to anai_app;

commit;
