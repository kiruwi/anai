-- Run with an owner connection. This migration is idempotent and contains no credentials.
do $$
declare
  app_role record;
begin
  if not exists (select 1 from pg_roles where rolname = 'anai_app') then
    create role anai_app
      nologin nosuperuser nocreatedb nocreaterole noinherit noreplication nobypassrls;
  end if;

  select rolcanlogin, rolsuper, rolcreatedb, rolcreaterole, rolinherit,
    rolreplication, rolbypassrls
  into app_role
  from pg_roles
  where rolname = 'anai_app';

  if app_role.rolsuper or app_role.rolcreatedb
    or app_role.rolcreaterole or app_role.rolinherit
    or app_role.rolreplication or app_role.rolbypassrls then
    raise exception 'anai_app exists with unsafe role attributes';
  end if;
end
$$;

grant connect on database neondb to anai_app;
grant usage on schema public to anai_app;
grant anai_app to neondb_owner;

revoke all privileges on table
  public.categories,
  public.collections,
  public.products,
  public.product_variants,
  public.product_images,
  public.customers,
  public.orders,
  public.order_items,
  public.payments,
  public.checkout_attempts,
  public.mpesa_callback_events,
  public.newsletter_subscribers,
  public.support_requests,
  public.order_email_notifications
from anai_app;

grant select on table
  public.categories,
  public.products,
  public.product_variants,
  public.product_images,
  public.customers,
  public.orders,
  public.order_items,
  public.payments,
  public.mpesa_callback_events,
  public.newsletter_subscribers,
  public.support_requests,
  public.order_email_notifications
to anai_app;

grant insert on table
  public.mpesa_callback_events,
  public.newsletter_subscribers,
  public.support_requests,
  public.order_email_notifications
to anai_app;

grant update on table
  public.mpesa_callback_events,
  public.newsletter_subscribers,
  public.order_email_notifications
to anai_app;

revoke all privileges on sequence public.checkout_attempts_id_seq from anai_app;

revoke execute on function public.create_checkout_order(
  text, text, text, text, text, text, text, text, jsonb, jsonb
) from public;
revoke execute on function public.set_mpesa_checkout_request(uuid, text, text, jsonb) from public;
revoke execute on function public.finalize_mpesa_payment(
  text, integer, text, numeric, text, text, text, text, jsonb
) from public;
revoke execute on function public.fail_checkout_order(uuid, text) from public;
revoke execute on function public.release_checkout_inventory(uuid) from public;
revoke execute on function public.set_updated_at() from public;
revoke execute on function public.show_db_tree() from public;

grant execute on function public.create_checkout_order(
  text, text, text, text, text, text, text, text, jsonb, jsonb
) to anai_app;
grant execute on function public.set_mpesa_checkout_request(uuid, text, text, jsonb) to anai_app;
grant execute on function public.finalize_mpesa_payment(
  text, integer, text, numeric, text, text, text, text, jsonb
) to anai_app;
grant execute on function public.fail_checkout_order(uuid, text) to anai_app;
grant execute on function public.release_checkout_inventory(uuid) to anai_app;

drop policy if exists anai_app_select_categories on public.categories;
create policy anai_app_select_categories on public.categories
  for select to anai_app using (true);

drop policy if exists anai_app_select_products on public.products;
create policy anai_app_select_products on public.products
  for select to anai_app using (true);

drop policy if exists anai_app_select_product_variants on public.product_variants;
create policy anai_app_select_product_variants on public.product_variants
  for select to anai_app using (true);

drop policy if exists anai_app_select_product_images on public.product_images;
create policy anai_app_select_product_images on public.product_images
  for select to anai_app using (true);

drop policy if exists anai_app_select_customers on public.customers;
create policy anai_app_select_customers on public.customers
  for select to anai_app using (true);

drop policy if exists anai_app_select_orders on public.orders;
create policy anai_app_select_orders on public.orders
  for select to anai_app using (true);

drop policy if exists anai_app_select_order_items on public.order_items;
create policy anai_app_select_order_items on public.order_items
  for select to anai_app using (true);

drop policy if exists anai_app_select_payments on public.payments;
create policy anai_app_select_payments on public.payments
  for select to anai_app using (true);

drop policy if exists anai_app_select_mpesa_callback_events on public.mpesa_callback_events;
create policy anai_app_select_mpesa_callback_events on public.mpesa_callback_events
  for select to anai_app using (true);
drop policy if exists anai_app_insert_mpesa_callback_events on public.mpesa_callback_events;
create policy anai_app_insert_mpesa_callback_events on public.mpesa_callback_events
  for insert to anai_app with check (true);
drop policy if exists anai_app_update_mpesa_callback_events on public.mpesa_callback_events;
create policy anai_app_update_mpesa_callback_events on public.mpesa_callback_events
  for update to anai_app using (true) with check (true);

drop policy if exists anai_app_select_newsletter_subscribers on public.newsletter_subscribers;
create policy anai_app_select_newsletter_subscribers on public.newsletter_subscribers
  for select to anai_app using (true);
drop policy if exists anai_app_insert_newsletter_subscribers on public.newsletter_subscribers;
create policy anai_app_insert_newsletter_subscribers on public.newsletter_subscribers
  for insert to anai_app with check (true);
drop policy if exists anai_app_update_newsletter_subscribers on public.newsletter_subscribers;
create policy anai_app_update_newsletter_subscribers on public.newsletter_subscribers
  for update to anai_app using (true) with check (true);

drop policy if exists anai_app_select_support_requests on public.support_requests;
create policy anai_app_select_support_requests on public.support_requests
  for select to anai_app using (true);
drop policy if exists anai_app_insert_support_requests on public.support_requests;
create policy anai_app_insert_support_requests on public.support_requests
  for insert to anai_app with check (true);

drop policy if exists anai_app_select_order_email_notifications on public.order_email_notifications;
create policy anai_app_select_order_email_notifications on public.order_email_notifications
  for select to anai_app using (true);
drop policy if exists anai_app_insert_order_email_notifications on public.order_email_notifications;
create policy anai_app_insert_order_email_notifications on public.order_email_notifications
  for insert to anai_app with check (true);
drop policy if exists anai_app_update_order_email_notifications on public.order_email_notifications;
create policy anai_app_update_order_email_notifications on public.order_email_notifications
  for update to anai_app using (true) with check (true);
