begin;
select plan(9);

insert into public.categories(id, name, slug)
values ('11111111-1111-4111-8111-111111111111', 'Callback tests', 'callback-tests');

insert into public.products(id, name, slug, category_id)
values
  (
    '22222222-2222-4222-8222-222222222221',
    'Late payment with stock',
    'late-payment-with-stock',
    '11111111-1111-4111-8111-111111111111'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'Late payment without stock',
    'late-payment-without-stock',
    '11111111-1111-4111-8111-111111111111'
  );

insert into public.product_variants(id, product_id, sku, color, size, price_kes, stock_quantity)
values
  (
    '33333333-3333-4333-8333-333333333331',
    '22222222-2222-4222-8222-222222222221',
    'TEST-LATE-STOCK', 'Black', 'M/10', 1000, 2
  ),
  (
    '33333333-3333-4333-8333-333333333332',
    '22222222-2222-4222-8222-222222222222',
    'TEST-LATE-NO-STOCK', 'Black', 'M/10', 1000, 0
  );

insert into public.customers(id, full_name, email, phone)
values (
  '44444444-4444-4444-8444-444444444444',
  'Callback Test Customer',
  'callback-test@example.com',
  '254700000000'
);

insert into public.orders(
  id, order_number, customer_id, status, payment_status, subtotal_kes,
  delivery_fee_kes, total_kes, inventory_reserved_at,
  inventory_released_at, checkout_expires_at
)
values
  (
    '55555555-5555-4555-8555-555555555551',
    'TEST-LATE-STOCK',
    '44444444-4444-4444-8444-444444444444',
    'cancelled', 'failed', 1000, 0, 1000,
    now() - interval '20 minutes', now() - interval '5 minutes', now() - interval '5 minutes'
  ),
  (
    '55555555-5555-4555-8555-555555555552',
    'TEST-LATE-NO-STOCK',
    '44444444-4444-4444-8444-444444444444',
    'cancelled', 'failed', 1000, 0, 1000,
    now() - interval '20 minutes', now() - interval '5 minutes', now() - interval '5 minutes'
  );

insert into public.order_items(
  order_id, variant_id, product_name, sku, color, size,
  unit_price_kes, quantity, line_total_kes
)
values
  (
    '55555555-5555-4555-8555-555555555551',
    '33333333-3333-4333-8333-333333333331',
    'Late payment with stock', 'TEST-LATE-STOCK', 'Black', 'M/10', 1000, 1, 1000
  ),
  (
    '55555555-5555-4555-8555-555555555552',
    '33333333-3333-4333-8333-333333333332',
    'Late payment without stock', 'TEST-LATE-NO-STOCK', 'Black', 'M/10', 1000, 1, 1000
  );

insert into public.payments(
  id, order_id, provider, provider_reference, amount_kes, status,
  mpesa_checkout_request_id
)
values
  (
    '66666666-6666-4666-8666-666666666661',
    '55555555-5555-4555-8555-555555555551',
    'mpesa', 'ws_TEST_LATE_STOCK', 1000, 'failed', 'ws_TEST_LATE_STOCK'
  ),
  (
    '66666666-6666-4666-8666-666666666662',
    '55555555-5555-4555-8555-555555555552',
    'mpesa', 'ws_TEST_LATE_NO_STOCK', 1000, 'failed', 'ws_TEST_LATE_NO_STOCK'
  );

select results_eq(
  $$
    select recorded, paid, failed
    from public.finalize_mpesa_payment(
      'ws_TEST_LATE_STOCK', 0, 'Success', 1000, 'TESTRECEIPT1',
      'merchant-1', '254700000000', '20260716120000', '{}'::jsonb
    )
  $$,
  $$ values (true, true, false) $$,
  'a late successful callback is recorded as paid'
);

select is(
  (select status from public.payments where id = '66666666-6666-4666-8666-666666666661'),
  'paid'::text,
  'the payment audit trail records the successful result'
);

select is(
  (select stock_quantity from public.product_variants where id = '33333333-3333-4333-8333-333333333331'),
  1,
  'available inventory is re-reserved for the paid order'
);

select is(
  (select status from public.orders where id = '55555555-5555-4555-8555-555555555551'),
  'confirmed'::text,
  'the order is confirmed when inventory can be re-reserved'
);

select ok(
  (select inventory_released_at is null from public.orders where id = '55555555-5555-4555-8555-555555555551'),
  'the successful re-reservation clears the release marker'
);

select results_eq(
  $$
    select recorded, paid, failed
    from public.finalize_mpesa_payment(
      'ws_TEST_LATE_NO_STOCK', 0, 'Success', 1000, 'TESTRECEIPT2',
      'merchant-2', '254700000000', '20260716120001', '{}'::jsonb
    )
  $$,
  $$ values (true, true, false) $$,
  'a real payment remains paid when stock is no longer available'
);

select is(
  (select status from public.payments where id = '66666666-6666-4666-8666-666666666662'),
  'paid'::text,
  'an inventory shortfall never hides a received payment'
);

select is(
  (select stock_quantity from public.product_variants where id = '33333333-3333-4333-8333-333333333332'),
  0,
  'an inventory shortfall does not create negative stock'
);

select ok(
  (
    select status = 'processing'
      and payment_status = 'paid'
      and inventory_released_at is not null
    from public.orders
    where id = '55555555-5555-4555-8555-555555555552'
  ),
  'a paid order with a stock shortfall is flagged for operational attention'
);

select * from finish();
rollback;
