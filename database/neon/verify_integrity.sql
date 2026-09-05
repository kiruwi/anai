\set ON_ERROR_STOP on

begin transaction read only;

do $$
declare
  table_count integer;
  column_count integer;
  constraint_count integer;
  index_count integer;
  trigger_count integer;
  function_count integer;
  invalid_foreign_key_count integer;
  total_rows bigint;
  vault_dependency_count integer;
  unsafe_definer_count integer;
  missing_owner_execute_count integer;
begin
  with application_tables(table_name) as (values
    ('categories'), ('collections'), ('products'), ('product_variants'),
    ('product_images'), ('customers'), ('orders'), ('order_items'), ('payments'),
    ('checkout_attempts'), ('mpesa_callback_events'), ('newsletter_subscribers'),
    ('support_requests'), ('order_email_notifications')
  )
  select
    (select count(*) from information_schema.tables as tables
      join application_tables using (table_name)
      where tables.table_schema = 'public' and tables.table_type = 'BASE TABLE'),
    (select count(*) from information_schema.columns as columns
      join application_tables using (table_name)
      where columns.table_schema = 'public'),
    (select count(*) from pg_constraint as constraints
      join pg_class as relations on relations.oid = constraints.conrelid
      join pg_namespace as schemas on schemas.oid = relations.relnamespace
      join application_tables on application_tables.table_name = relations.relname
      where schemas.nspname = 'public'),
    (select count(*) from pg_indexes as indexes
      join application_tables on application_tables.table_name = indexes.tablename
      where indexes.schemaname = 'public'),
    (select count(*) from information_schema.triggers as triggers
      join application_tables on application_tables.table_name = triggers.event_object_table
      where triggers.trigger_schema = 'public'),
    (select count(*) from pg_proc as functions
      join pg_namespace as schemas on schemas.oid = functions.pronamespace
      where schemas.nspname = 'public' and functions.proname in (
        'create_checkout_order', 'set_mpesa_checkout_request', 'finalize_mpesa_payment',
        'fail_checkout_order', 'release_checkout_inventory', 'set_updated_at'
      )),
    (select count(*) from pg_constraint as constraints
      join pg_class as relations on relations.oid = constraints.conrelid
      join pg_namespace as schemas on schemas.oid = relations.relnamespace
      where schemas.nspname = 'public' and constraints.contype = 'f' and not constraints.convalidated)
  into table_count, column_count, constraint_count, index_count,
    trigger_count, function_count, invalid_foreign_key_count;

  if (table_count, column_count, constraint_count, index_count, trigger_count, function_count, invalid_foreign_key_count)
    <> (14, 149, 56, 44, 9, 6, 0) then
    raise exception 'Database integrity mismatch: tables %, columns %, constraints %, indexes %, triggers %, functions %, invalid FKs %',
      table_count, column_count, constraint_count, index_count, trigger_count, function_count,
      invalid_foreign_key_count;
  end if;

  select
    (select count(*) from public.categories) +
    (select count(*) from public.collections) +
    (select count(*) from public.products) +
    (select count(*) from public.product_variants) +
    (select count(*) from public.product_images) +
    (select count(*) from public.customers) +
    (select count(*) from public.orders) +
    (select count(*) from public.order_items) +
    (select count(*) from public.payments) +
    (select count(*) from public.checkout_attempts) +
    (select count(*) from public.mpesa_callback_events) +
    (select count(*) from public.newsletter_subscribers) +
    (select count(*) from public.support_requests) +
    (select count(*) from public.order_email_notifications)
  into total_rows;

  -- Row counts change during normal checkout and recovery operations.
  raise notice 'Application row count: %', total_rows;

  select count(*) into vault_dependency_count
  from pg_proc as functions
  join pg_namespace as schemas on schemas.oid = functions.pronamespace
  where schemas.nspname = 'public'
    and functions.prokind in ('f', 'p')
    and pg_get_functiondef(functions.oid) ilike '%supabase_vault%';

  if vault_dependency_count <> 0 then
    raise exception 'Public application functions unexpectedly depend on supabase_vault';
  end if;

  select count(*) into unsafe_definer_count
  from pg_proc as functions
  join pg_namespace as schemas on schemas.oid = functions.pronamespace
  where schemas.nspname = 'public'
    and functions.proname in (
      'create_checkout_order', 'set_mpesa_checkout_request', 'finalize_mpesa_payment',
      'fail_checkout_order', 'release_checkout_inventory'
    )
    and (
      not functions.prosecdef
      or not (coalesce('search_path=public, pg_temp' = any(functions.proconfig), false)
        or coalesce('search_path=""' = any(functions.proconfig), false))
    );

  if unsafe_definer_count <> 0 then
    raise exception '% sensitive functions lack SECURITY DEFINER or a safe search_path', unsafe_definer_count;
  end if;

  select count(*) into missing_owner_execute_count
  from unnest(array[
    'public.create_checkout_order(text,text,text,text,text,text,text,text,jsonb,jsonb)'::regprocedure,
    'public.set_mpesa_checkout_request(uuid,text,text,jsonb)'::regprocedure,
    'public.finalize_mpesa_payment(text,integer,text,numeric,text,text,text,text,jsonb)'::regprocedure,
    'public.fail_checkout_order(uuid,text)'::regprocedure,
    'public.release_checkout_inventory(uuid)'::regprocedure
  ]) as required(function_oid)
  where not has_function_privilege(current_user, required.function_oid, 'EXECUTE');

  if missing_owner_execute_count <> 0 then
    raise exception 'The database owner cannot execute % required functions', missing_owner_execute_count;
  end if;

  raise notice 'Integrity verified: 14 tables, 149 columns, 56 constraints, 44 indexes, 6 functions, 9 triggers';
end
$$;

select table_name, row_count, content_checksum
from (
  select 'categories' as table_name, count(*) as row_count,
    md5(coalesce(string_agg(to_jsonb(rows)::text, E'\n' order by to_jsonb(rows)::text), '')) as content_checksum
    from public.categories as rows
  union all select 'collections', count(*), md5(coalesce(string_agg(to_jsonb(rows)::text, E'\n' order by to_jsonb(rows)::text), '')) from public.collections as rows
  union all select 'products', count(*), md5(coalesce(string_agg(to_jsonb(rows)::text, E'\n' order by to_jsonb(rows)::text), '')) from public.products as rows
  union all select 'product_variants', count(*), md5(coalesce(string_agg(to_jsonb(rows)::text, E'\n' order by to_jsonb(rows)::text), '')) from public.product_variants as rows
  union all select 'product_images', count(*), md5(coalesce(string_agg(to_jsonb(rows)::text, E'\n' order by to_jsonb(rows)::text), '')) from public.product_images as rows
  union all select 'customers', count(*), md5(coalesce(string_agg(to_jsonb(rows)::text, E'\n' order by to_jsonb(rows)::text), '')) from public.customers as rows
  union all select 'orders', count(*), md5(coalesce(string_agg(to_jsonb(rows)::text, E'\n' order by to_jsonb(rows)::text), '')) from public.orders as rows
  union all select 'order_items', count(*), md5(coalesce(string_agg(to_jsonb(rows)::text, E'\n' order by to_jsonb(rows)::text), '')) from public.order_items as rows
  union all select 'payments', count(*), md5(coalesce(string_agg(to_jsonb(rows)::text, E'\n' order by to_jsonb(rows)::text), '')) from public.payments as rows
  union all select 'checkout_attempts', count(*), md5(coalesce(string_agg(to_jsonb(rows)::text, E'\n' order by to_jsonb(rows)::text), '')) from public.checkout_attempts as rows
  union all select 'mpesa_callback_events', count(*), md5(coalesce(string_agg(to_jsonb(rows)::text, E'\n' order by to_jsonb(rows)::text), '')) from public.mpesa_callback_events as rows
  union all select 'newsletter_subscribers', count(*), md5(coalesce(string_agg(to_jsonb(rows)::text, E'\n' order by to_jsonb(rows)::text), '')) from public.newsletter_subscribers as rows
  union all select 'support_requests', count(*), md5(coalesce(string_agg(to_jsonb(rows)::text, E'\n' order by to_jsonb(rows)::text), '')) from public.support_requests as rows
  union all select 'order_email_notifications', count(*), md5(coalesce(string_agg(to_jsonb(rows)::text, E'\n' order by to_jsonb(rows)::text), '')) from public.order_email_notifications as rows
) as checksums
order by table_name;

select last_value, is_called from public.checkout_attempts_id_seq;

rollback;
