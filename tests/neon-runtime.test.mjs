import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const readProjectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('Neon is configured as a private server-only database', async () => {
  const config = await readProjectFile('nuxt.config.ts')
  const database = await readProjectFile('server/utils/db.ts')
  const packageJson = await readProjectFile('package.json')
  const legacySupabaseConfig = await readProjectFile('supabase/config.toml')

  assert.match(config, /const databaseUrl = process\.env\.NUXT_DATABASE_URL \|\| ''/)
  assert.doesNotMatch(config, /process\.env\.DATABASE_URL/)
  assert.match(config, /runtimeConfig:\s*\{[\s\S]*databaseUrl/)
  assert.doesNotMatch(config, /public:\s*\{[\s\S]*databaseUrl/)
  assert.match(database, /neon\(databaseUrl\)/)
  assert.match(database, /Neon database URL is not configured/)
  assert.doesNotMatch(packageJson, /@supabase\/supabase-js|"supabase"\s*:/)
  assert.doesNotMatch(legacySupabaseConfig, /^\[functions\./m)
})

test('runtime SQL uses tagged parameters and never unsafe query composition', async () => {
  const paths = [
    'server/utils/catalog.ts',
    'server/utils/recordMpesaPayment.ts',
    'server/utils/email/notifyPaidOrder.ts',
    'server/utils/email/notifySupportRequest.ts',
    'server/api/catalog/inventory.get.ts',
    'server/api/newsletter/subscribe.post.ts',
    'server/api/support/request.post.ts',
    'server/api/checkout/create-payment.post.ts',
    'server/api/checkout/payment-status.post.ts',
    'server/routes/google-merchant.xml.ts',
  ]
  const sources = await Promise.all(paths.map(readProjectFile))

  for (const source of sources) {
    assert.doesNotMatch(source, /sql\.unsafe|\.query\s*\(/)
    assert.doesNotMatch(source, /getSupabaseAdmin|functions\.invoke|\.from\s*\(['"]|\.rpc\s*\(/)
  }

  const checkout = sources[7]
  assert.match(checkout, /\$\{JSON\.stringify\(slugs\)\}::jsonb/)
  assert.match(checkout, /\$\{idempotencyKey\}::text/)
})

test('Neon role migration is least privilege and preserves sensitive function restrictions', async () => {
  const migration = await readProjectFile('database/neon/20260902_access_control.sql')

  assert.match(migration, /create role anai_app[\s\S]*nologin[\s\S]*nobypassrls/i)
  assert.doesNotMatch(migration, /grant\s+delete/i)
  assert.match(migration, /revoke execute on function public\.create_checkout_order[\s\S]*from public/i)
  assert.match(migration, /grant execute on function public\.create_checkout_order[\s\S]*to anai_app/i)
  assert.match(migration, /for update to anai_app using \(true\) with check \(true\)/i)
})
