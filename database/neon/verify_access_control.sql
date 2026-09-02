\set ON_ERROR_STOP on

do $$
declare
  app_role record;
  unsafe_public_functions integer;
  missing_app_execute integer;
begin
  select rolcanlogin, rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls
  into strict app_role
  from pg_roles
  where rolname = 'anai_app';

  if app_role.rolcanlogin or app_role.rolsuper or app_role.rolcreatedb
    or app_role.rolcreaterole or app_role.rolreplication or app_role.rolbypassrls then
    raise exception 'anai_app has unsafe attributes';
  end if;

  select count(*) into unsafe_public_functions
  from pg_proc as functions
  join pg_namespace as schemas on schemas.oid = functions.pronamespace
  cross join lateral aclexplode(
    coalesce(functions.proacl, acldefault('f', functions.proowner))
  ) as privileges
  where schemas.nspname = 'public'
    and functions.proname in (
      'create_checkout_order', 'set_mpesa_checkout_request', 'finalize_mpesa_payment',
      'fail_checkout_order', 'release_checkout_inventory', 'set_updated_at', 'show_db_tree'
    )
    and privileges.grantee = 0
    and privileges.privilege_type = 'EXECUTE';

  if unsafe_public_functions <> 0 then
    raise exception 'PUBLIC can execute % sensitive functions', unsafe_public_functions;
  end if;

  select count(*) into missing_app_execute
  from unnest(array[
    'public.create_checkout_order(text,text,text,text,text,text,text,text,jsonb,jsonb)'::regprocedure,
    'public.set_mpesa_checkout_request(uuid,text,text,jsonb)'::regprocedure,
    'public.finalize_mpesa_payment(text,integer,text,numeric,text,text,text,text,jsonb)'::regprocedure,
    'public.fail_checkout_order(uuid,text)'::regprocedure,
    'public.release_checkout_inventory(uuid)'::regprocedure
  ]) as required(function_oid)
  where not has_function_privilege('anai_app', required.function_oid, 'EXECUTE');

  if missing_app_execute <> 0 then
    raise exception 'anai_app cannot execute % required functions', missing_app_execute;
  end if;

  if has_function_privilege('anai_app', 'public.set_updated_at()', 'EXECUTE')
    or has_function_privilege('anai_app', 'public.show_db_tree()', 'EXECUTE') then
    raise exception 'anai_app can execute a function outside its required five-function set';
  end if;
end
$$;

begin;
set local role anai_app;

select count(*) from public.products;
select count(*) from public.product_variants;
select count(*) from public.categories;
select count(*) from public.product_images;
select count(*) from public.customers;
select count(*) from public.orders;
select count(*) from public.order_items;
select count(*) from public.payments;
select count(*) from public.mpesa_callback_events;
select count(*) from public.newsletter_subscribers;
select count(*) from public.support_requests;
select count(*) from public.order_email_notifications;

insert into public.newsletter_subscribers (id, email, status, subscribed_at)
values (
  '00000000-0000-4000-8000-000000000101',
  'codex-neon-test@example.invalid',
  'active',
  now()
)
on conflict (email) do update set status = excluded.status, subscribed_at = excluded.subscribed_at;

insert into public.support_requests (
  id, request_number, full_name, email, category, message
) values (
  '00000000-0000-4000-8000-000000000102',
  'SUP-CODEX-NEON-TEST',
  'Codex Test',
  'codex-neon-test@example.invalid',
  'general',
  'Rolled back access-control verification.'
)
on conflict (id) do nothing;

insert into public.mpesa_callback_events (checkout_request_id, payload)
values ('codex-neon-test-callback', '{"test":true}'::jsonb)
on conflict (checkout_request_id) do update set payload = excluded.payload;

update public.mpesa_callback_events
set processed_at = now()
where checkout_request_id = 'codex-neon-test-callback';

update public.order_email_notifications
set status = status, updated_at = updated_at;

select public.release_checkout_inventory('00000000-0000-4000-8000-000000000103'::uuid);
select public.set_mpesa_checkout_request(
  '00000000-0000-4000-8000-000000000103'::uuid,
  'codex-noop-checkout',
  'codex-noop-merchant',
  '{}'::jsonb
);
select * from public.finalize_mpesa_payment(
  'codex-noop-checkout', -1, 'test', null, '', '', '', '', '{}'::jsonb
);
select public.fail_checkout_order(
  '00000000-0000-4000-8000-000000000103'::uuid,
  'Rolled back access-control verification'
);

do $$
begin
  begin
    perform public.create_checkout_order(
      'ANAI-CODEX-TEST', 'codex-test-idempotency-key', 'codex-test-fingerprint',
      'codex-neon-test@example.invalid', 'Codex Test', '254700000000', '',
      'town-pickup', '[]'::jsonb, '{}'::jsonb
    );
    raise exception 'create_checkout_order unexpectedly accepted an empty cart';
  exception
    when sqlstate '22023' then null;
  end;

  begin
    perform 1 from public.collections;
    raise exception 'anai_app unexpectedly read collections';
  exception
    when insufficient_privilege then null;
  end;

  begin
    perform 1 from public.checkout_attempts;
    raise exception 'anai_app unexpectedly read checkout_attempts';
  exception
    when insufficient_privilege then null;
  end;

  begin
    perform nextval('public.checkout_attempts_id_seq');
    raise exception 'anai_app unexpectedly advanced checkout_attempts_id_seq';
  exception
    when insufficient_privilege then null;
  end;

  begin
    delete from public.newsletter_subscribers
    where email = 'codex-neon-test@example.invalid';
    raise exception 'anai_app unexpectedly deleted newsletter rows';
  exception
    when insufficient_privilege then null;
  end;
end
$$;

rollback;
