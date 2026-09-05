import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFile, readdir } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { buildPaidOrderEmails } from '../server/utils/email/orderEmail.ts'

// This bootstraps schema and fixture data. Never point it at a hosted database.
const url = new URL(process.env.CHECKOUT_TEST_DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/neondb')
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname), 'Behavior tests require an isolated local PostgreSQL service')
assert.equal(url.pathname, '/neondb')
const exec = promisify(execFile)
const query = async (sql) => {
  const { stdout } = await exec('psql', ['-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-c', sql], {
    env: {
      ...process.env, PGHOST: url.hostname, PGPORT: url.port || '5432',
      PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password), PGDATABASE: 'neondb',
    }, maxBuffer: 4 * 1024 * 1024,
  })
  return stdout.trim()
}
const file = async (path) => query(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'))

// Fail before mutation if a schema is already present. Recreate the test database between runs.
assert.equal(await query("select count(*) from information_schema.tables where table_schema = 'public'"), '0')
await query(`
  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
    if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
    if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role; end if;
    if not exists (select 1 from pg_roles where rolname = 'neondb_owner') then create role neondb_owner; end if;
  end $$;
  create schema auth;
  create table auth.users(id uuid primary key);
  create function auth.uid() returns uuid language sql as 'select null::uuid';
  create function public.show_db_tree() returns text language sql as $$ select ''::text $$;
`)
const migrations = (await readdir(new URL('../supabase/migrations/', import.meta.url))).filter((name) => name.endsWith('.sql')).sort()
for (const name of migrations) {
  await file(`supabase/migrations/${name}`)
  if (name.startsWith('20260602')) await file('supabase/seed.sql')
}
await file('database/neon/20260902_access_control.sql')
await file('database/neon/20260905_checkout_recovery.sql')
await file('database/neon/20260905_checkout_recovery.sql') // Migration replay must be safe.

const variant = '33333333-3333-4333-8333-333333333333'
await query(`
  insert into products(id, name, slug, public_slug) values ('22222222-2222-4222-8222-222222222222', 'Race test', 'race-test', 'race-test');
  insert into product_variants(id, product_id, sku, color, size, price_kes, stock_quantity)
    values ('${variant}', '22222222-2222-4222-8222-222222222222', 'RACE-TEST', 'Black', 'M', 1000, 1);
`)
const checkout = (key, reference, phone = '254700000001') => `select row_to_json(result) from public.create_checkout_order(
  '${reference}', '${key}', '${key}', 'test@example.com', 'Test', '${phone}', '', 'town-pickup',
  '[{"variantId":"${variant}","quantity":1,"size":"M","color":"Black"}]'::jsonb, '{}'::jsonb
) as result`

// Distinct keys compete for the last unit on independent database connections.
const competing = await Promise.allSettled([
  query(checkout('competing-key-00001', 'ANAI-1000000000001-ABCDEF01')),
  query(checkout('competing-key-00002', 'ANAI-1000000000002-ABCDEF02', '254700000002')),
])
assert.equal(competing.filter((r) => r.status === 'fulfilled').length, 1)
assert.match(competing.find((r) => r.status === 'rejected').reason.stderr, /INSUFFICIENT_STOCK/)
assert.equal(await query(`select stock_quantity from product_variants where id = '${variant}'`), '0')
const order = JSON.parse(competing.find((r) => r.status === 'fulfilled').value)

// Expiry frees the reservation but preserves uncertainty. A later callback links using order ID.
await query(`update orders set checkout_expires_at = now() - interval '1 minute' where id = '${order.order_id}'`)
assert.equal(await query(`select public.expire_checkout_reservations('${order.order_id}')`), '1')
assert.equal(await query(`select payment_status from orders where id = '${order.order_id}'`), 'pending')
assert.equal(await query(`select stock_quantity from product_variants where id = '${variant}'`), '1')

assert.equal(await query(`select public.set_mpesa_checkout_request('${order.order_id}', 'ws_CO_TEST_RECOVERY', 'merchant', '{}')`), 't')
const finalize = `select row_to_json(result) from public.finalize_mpesa_payment('ws_CO_TEST_RECOVERY', 0, 'Success', 1000, 'RECEIPT01', 'merchant', '254700000001', '', '{}') as result`
const callbacks = await Promise.all([query(finalize), query(finalize)])
assert.ok(callbacks.every((result) => JSON.parse(result).paid))
assert.equal(await query(`select stock_quantity from product_variants where id = '${variant}'`), '0')
assert.equal(await query(`select status from orders where id = '${order.order_id}'`), 'confirmed')
assert.equal(await query(`select public.set_mpesa_checkout_request('${order.order_id}', 'ws_CO_OTHER_REQUEST', 'merchant', '{}')`), 'f')

// Concurrent retries of one checkout return the same order and reserve just once.
await query(`update product_variants set stock_quantity = 2 where id = '${variant}'`)
const duplicates = await Promise.all([
  query(checkout('same-checkout-key-001', 'ANAI-1000000000003-ABCDEF03')),
  query(checkout('same-checkout-key-001', 'ANAI-1000000000004-ABCDEF04')),
])
const sameOrders = duplicates.map(JSON.parse)
assert.equal(sameOrders[0].order_id, sameOrders[1].order_id)
assert.equal(sameOrders.filter((result) => result.created).length, 1)
assert.equal(await query(`select stock_quantity from product_variants where id = '${variant}'`), '1')

const lateOrderId = sameOrders[0].order_id
await query(`update orders set checkout_expires_at = now() - interval '1 minute' where id = '${lateOrderId}'`)
await query(`select public.expire_checkout_reservations('${lateOrderId}')`)
await query(`update product_variants set stock_quantity = 0 where id = '${variant}'`)
await query(`select public.set_mpesa_checkout_request('${lateOrderId}', 'ws_CO_LATE_NO_STOCK', 'merchant', '{}')`)
const lateCallback = `select paid from public.finalize_mpesa_payment('ws_CO_LATE_NO_STOCK',0,'Success',1000,'RECEIPT02','merchant','','','{}')`
assert.equal(await query(lateCallback), 't')
assert.equal(await query(lateCallback), 't')
assert.equal(await query(`select status from orders where id = '${lateOrderId}'`), 'processing')
assert.equal(await query(`select stock_quantity from product_variants where id = '${variant}'`), '0')
assert.equal(await query(`select public.release_checkout_inventory('${lateOrderId}')`), 'f')

// Independent connections share one atomic limit; app role cannot edit the counters.
const limits = await Promise.all(Array.from({ length: 12 }, () => query(`set role anai_app; select allowed from public.consume_request_limit(repeat('a',64),5,60000)`)))
assert.equal(limits.filter((result) => result === 't').length, 5)
await assert.rejects(query('set role anai_app; delete from anai_private.request_limits'), /permission denied/)

const supportId = await query("insert into support_requests(request_number,full_name,email,category,message) values('SUP-TEST','Test','test@example.com','general','Please help with my order') returning id")
const claims = await Promise.all([query(`select public.claim_support_email('${supportId}')`), query(`select public.claim_support_email('${supportId}')`)])
assert.equal(claims.filter(Boolean).length, 1)
await query(`select public.finish_support_email('${supportId}','${claims.find(Boolean)}','temporary outage')`)
await query(`update support_requests set email_claimed_at = now() - interval '6 minutes' where id = '${supportId}'`)
const retry = await query(`select public.claim_support_email('${supportId}')`)
assert.ok(retry)
await query(`select public.finish_support_email('${supportId}','${retry}',null)`)
assert.equal(await query(`select public.claim_support_email('${supportId}')`), '')
assert.equal(await query(`select email_attempts from support_requests where id = '${supportId}'`), '2')

// Execute the actual notifier against PostgreSQL, with only the outbound email transport replaced.
const sqlAdapter = async (strings, ...values) => {
  const literal = (value) => value == null ? 'null' : `'${String(value).replaceAll("'", "''")}'`
  let statement = strings.reduce((text, part, index) => text + part + (index < values.length ? literal(values[index]) : ''), '').trim()
  if (/^(insert|update|delete)/i.test(statement) && !/\breturning\b/i.test(statement)) statement += ' returning *'
  return JSON.parse(await query(`with result as (${statement}) select coalesce(json_agg(result), '[]'::json) from result`))
}
const notifierSource = (await readFile(new URL('../server/utils/email/notifyPaidOrder.ts', import.meta.url), 'utf8'))
  .replace(/^import[\s\S]*?from\s+['"][^'"]+['"]\s*;?/gm, '').replaceAll('export ', '')
let emailCalls = 0
const notifyPaidOrder = Function('getDatabase', 'useRuntimeConfig', 'sendBrevoEmail', 'buildPaidOrderEmails',
  stripTypeScriptTypes(notifierSource) + '\nreturn notifyPaidOrder')(
  () => sqlAdapter,
  () => ({ brevoApiKey: 'test', brevoSenderEmail: 'sender@example.com', salesNotificationEmail: 'sales@example.com' }),
  async () => {
    emailCalls += 1
    return emailCalls === 1
      ? { response: { ok: false, status: 503 }, result: { message: 'Temporary outage' } }
      : { response: { ok: true }, result: { messageId: 'test-message' } }
  },
  buildPaidOrderEmails,
)
await assert.rejects(notifyPaidOrder('ws_CO_TEST_RECOVERY'), /Temporary outage/)
assert.equal(await query(`select status from order_email_notifications where order_id = '${order.order_id}'`), 'failed')
await notifyPaidOrder('ws_CO_TEST_RECOVERY')
assert.equal(emailCalls, 1, 'Retry delay is enforced even during customer polling')
await query(`update order_email_notifications set claimed_at = now() - interval '6 minutes' where order_id = '${order.order_id}'`)
assert.equal((await notifyPaidOrder('ws_CO_TEST_RECOVERY')).sent, true)
assert.equal(await query(`select status from order_email_notifications where order_id = '${order.order_id}'`), 'sent')
await notifyPaidOrder('ws_CO_TEST_RECOVERY')
assert.equal(emailCalls, 2, 'Sent emails must not be resent')

const lease = await query('select public.claim_recovery_job()')
assert.ok(lease)
assert.equal(await query('select public.claim_recovery_job()'), '')
await query(`select public.finish_recovery_job('${lease}')`)
assert.ok(await query('select public.claim_recovery_job()'))

console.log('Passed: migration replay, competing purchases, idempotent checkout, expiry, late/duplicate callbacks, shared rate limits, email retries, and recovery leases.')
