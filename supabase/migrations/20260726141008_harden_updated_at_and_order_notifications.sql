-- The trigger only uses NEW and pg_catalog functions, so it does not need a
-- caller-controlled schema search path.
alter function public.set_updated_at() set search_path = '';

-- This ledger is internal to the paid-order notification worker. Keep it in
-- the public schema for the Data API client, but expose it only to service_role.
revoke all privileges on table public.order_email_notifications from anon, authenticated;
grant select, insert, update on table public.order_email_notifications to service_role;
