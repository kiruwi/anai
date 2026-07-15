-- The former Paystack test payments are no longer needed. Keep the generic
-- payments table because it is the application's payment audit trail.
delete from public.payments
where lower(provider) = 'paystack';

alter table public.payments
  add column if not exists mpesa_merchant_request_id text,
  add column if not exists mpesa_checkout_request_id text,
  add column if not exists mpesa_receipt_number text,
  add column if not exists mpesa_result_code integer,
  add column if not exists mpesa_result_description text,
  add column if not exists mpesa_phone_number text,
  add column if not exists mpesa_transaction_date text;

-- Existing M-Pesa rows stored their CheckoutRequestID in the provider-neutral
-- reference column. Preserve that history in the explicit M-Pesa column.
update public.payments
set mpesa_checkout_request_id = provider_reference
where lower(provider) = 'mpesa'
  and mpesa_checkout_request_id is null
  and provider_reference is not null;

create unique index if not exists payments_mpesa_checkout_request_id_idx
  on public.payments(mpesa_checkout_request_id)
  where lower(provider) = 'mpesa'
    and mpesa_checkout_request_id is not null;

create unique index if not exists payments_mpesa_receipt_number_idx
  on public.payments(mpesa_receipt_number)
  where lower(provider) = 'mpesa'
    and mpesa_receipt_number is not null;
