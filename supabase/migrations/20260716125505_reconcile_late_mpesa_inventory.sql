-- Reconcile a successful M-Pesa callback that arrives after an abandoned
-- checkout reservation was released. Lock orders before payments everywhere
-- in this function so expiry and callback processing cannot deadlock each
-- other by taking the same rows in opposite orders.
create or replace function public.finalize_mpesa_payment(
  p_checkout_request_id text,
  p_result_code integer,
  p_result_description text,
  p_amount numeric,
  p_receipt text,
  p_merchant_request_id text,
  p_phone_number text,
  p_transaction_date text,
  p_raw_payload jsonb
)
returns table(recorded boolean, paid boolean, failed boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order_id uuid;
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
  v_paid boolean;
  v_inventory_available boolean := true;
begin
  select payments.order_id into v_order_id
  from public.payments as payments
  where lower(payments.provider) = 'mpesa'
    and payments.mpesa_checkout_request_id = p_checkout_request_id;

  if not found then
    return query select false, false, false;
    return;
  end if;

  select * into v_order
  from public.orders
  where id = v_order_id
  for update;

  select * into v_payment
  from public.payments
  where order_id = v_order_id
    and lower(provider) = 'mpesa'
    and mpesa_checkout_request_id = p_checkout_request_id
  for update;

  if not found then
    return query select false, false, false;
    return;
  end if;

  -- Callback retries must not change the outcome or promote an order that is
  -- waiting for manual stock reconciliation from processing to confirmed.
  if v_payment.status = 'paid' then
    return query select true, true, false;
    return;
  end if;

  v_paid := p_result_code = 0
    and p_amount is not null
    and p_amount = v_payment.amount_kes
    and coalesce(p_receipt, '') <> '';

  update public.payments
  set status = case when v_paid then 'paid' else 'failed' end,
      paid_at = case when v_paid then now() else null end,
      mpesa_merchant_request_id = nullif(p_merchant_request_id, ''),
      mpesa_receipt_number = nullif(p_receipt, ''),
      mpesa_result_code = p_result_code,
      mpesa_result_description = nullif(p_result_description, ''),
      mpesa_phone_number = nullif(p_phone_number, ''),
      mpesa_transaction_date = nullif(p_transaction_date, ''),
      raw_payload = coalesce(raw_payload, '{}'::jsonb) || jsonb_build_object('callback', p_raw_payload)
  where id = v_payment.id;

  if v_paid then
    if v_order.inventory_released_at is not null then
      -- Acquire every required variant lock in a stable order before checking
      -- or changing quantities. This prevents partial re-reservations and
      -- avoids deadlocks between orders containing the same products.
      perform variants.id
      from public.product_variants as variants
      where variants.id in (
        select items.variant_id
        from public.order_items as items
        where items.order_id = v_order.id
          and items.variant_id is not null
      )
      order by variants.id
      for update;

      select not exists (
        select 1
        from (
          select items.variant_id, sum(items.quantity)::integer as quantity
          from public.order_items as items
          where items.order_id = v_order.id
            and items.variant_id is not null
          group by items.variant_id
        ) as required
        left join public.product_variants as variants on variants.id = required.variant_id
        where variants.id is null
          or variants.stock_quantity < required.quantity
      ) into v_inventory_available;

      if v_inventory_available then
        update public.product_variants as variants
        set stock_quantity = variants.stock_quantity - required.quantity
        from (
          select items.variant_id, sum(items.quantity)::integer as quantity
          from public.order_items as items
          where items.order_id = v_order.id
            and items.variant_id is not null
          group by items.variant_id
        ) as required
        where variants.id = required.variant_id;

        update public.orders
        set status = 'confirmed',
            payment_status = 'paid',
            inventory_reserved_at = now(),
            inventory_released_at = null,
            checkout_expires_at = null
        where id = v_order.id;
      else
        -- The customer has paid, so retain the payment truth. Processing plus
        -- a non-null release timestamp is the operational signal that stock
        -- could not be re-reserved and needs fulfilment or refund attention.
        update public.orders
        set status = 'processing',
            payment_status = 'paid',
            checkout_expires_at = null
        where id = v_order.id;
      end if;
    else
      update public.orders
      set status = 'confirmed',
          payment_status = 'paid',
          checkout_expires_at = null
      where id = v_order.id;
    end if;
  else
    perform public.release_checkout_inventory(v_order.id);
    update public.orders
    set status = 'cancelled', payment_status = 'failed'
    where id = v_order.id;
  end if;

  return query select true, v_paid, not v_paid;
end;
$$;

revoke all on function public.finalize_mpesa_payment(
  text, integer, text, numeric, text, text, text, text, jsonb
) from public, anon, authenticated;

grant execute on function public.finalize_mpesa_payment(
  text, integer, text, numeric, text, text, text, text, jsonb
) to service_role;
