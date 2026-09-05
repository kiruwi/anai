import assert from 'node:assert/strict'
import { neon } from '@neondatabase/serverless'

const databaseUrl = process.env.NEON_TEST_DATABASE_URL?.trim()
if (!databaseUrl) {
  if (process.env.CI) {
    throw new Error('NEON_TEST_DATABASE_URL is required in CI.')
  }
  console.log('Skipping Neon integration verification: NEON_TEST_DATABASE_URL is not configured.')
  process.exit(0)
}

const expectedEndpoint = process.env.NEON_TEST_ENDPOINT?.trim()
if (!expectedEndpoint) {
  throw new Error('NEON_TEST_ENDPOINT is required to prevent accidental production testing.')
}

const actualEndpoint = new URL(databaseUrl).hostname.replace('-pooler.', '.')
const normalizedExpectedEndpoint = expectedEndpoint.replace('-pooler.', '.')
assert.equal(actualEndpoint, normalizedExpectedEndpoint, 'The test URL does not target the approved Neon test endpoint.')

const sql = neon(databaseUrl)
const [database] = await sql`select current_database() as name`
assert.equal(database?.name, 'neondb')

const [integrity] = await sql`
  with application_tables(table_name) as (values
    ('categories'), ('collections'), ('products'), ('product_variants'),
    ('product_images'), ('customers'), ('orders'), ('order_items'), ('payments'),
    ('checkout_attempts'), ('mpesa_callback_events'), ('newsletter_subscribers'),
    ('support_requests'), ('order_email_notifications')
  )
  select
    (select count(*)::integer from information_schema.tables as tables
      join application_tables using (table_name)
      where tables.table_schema = 'public' and tables.table_type = 'BASE TABLE') as tables,
    (select count(*)::integer from information_schema.columns as columns
      join application_tables using (table_name)
      where columns.table_schema = 'public') as columns,
    (select count(*)::integer from pg_constraint as constraints
      join pg_class as relations on relations.oid = constraints.conrelid
      join pg_namespace as schemas on schemas.oid = relations.relnamespace
      join application_tables on application_tables.table_name = relations.relname
      where schemas.nspname = 'public') as constraints,
    (select count(*)::integer from pg_indexes as indexes
      join application_tables on application_tables.table_name = indexes.tablename
      where indexes.schemaname = 'public') as indexes,
    (select count(*)::integer from information_schema.triggers as triggers
      join application_tables on application_tables.table_name = triggers.event_object_table
      where triggers.trigger_schema = 'public') as triggers,
    (select count(*)::integer from pg_constraint as constraints
      join pg_class as relations on relations.oid = constraints.conrelid
      join pg_namespace as schemas on schemas.oid = relations.relnamespace
      where schemas.nspname = 'public' and constraints.contype = 'f' and not constraints.convalidated) as invalid_foreign_keys
`

assert.deepEqual(integrity, {
  tables: 14,
  columns: 149,
  constraints: 56,
  indexes: 44,
  triggers: 9,
  invalid_foreign_keys: 0,
})

const [rows] = await sql`
  select (
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
  )::integer as total
`
assert.ok(Number.isInteger(rows?.total) && rows.total >= 0)

const [role] = await sql`
  select rolcanlogin, rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls
  from pg_roles where rolname = 'anai_app'
`
assert.deepEqual(role, {
  rolcanlogin: false,
  rolsuper: false,
  rolcreatedb: false,
  rolcreaterole: false,
  rolreplication: false,
  rolbypassrls: false,
})

const [sequence] = await sql`select last_value, is_called from public.checkout_attempts_id_seq`
console.log(JSON.stringify({ verified: true, database: database.name, integrity, rows: rows.total, sequence }))
