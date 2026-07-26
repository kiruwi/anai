import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const migrationUrl = new URL(
  '../supabase/migrations/20260726141008_harden_updated_at_and_order_notifications.sql',
  import.meta.url,
)
const servicePrivilegeMigrationUrl = new URL(
  '../supabase/migrations/20260726141342_restrict_order_notification_service_privileges.sql',
  import.meta.url,
)

test('database hardening pins trigger search path and removes client notification grants', async () => {
  const migration = await readFile(migrationUrl, 'utf8')

  assert.match(migration, /alter function public\.set_updated_at\(\) set search_path = ''/i)
  assert.match(
    migration,
    /revoke all privileges on table public\.order_email_notifications from anon, authenticated/i,
  )
  assert.match(
    migration,
    /grant select, insert, update on table public\.order_email_notifications to service_role/i,
  )
})

test('order notification service role has only the worker privileges it needs', async () => {
  const migration = await readFile(servicePrivilegeMigrationUrl, 'utf8')

  assert.match(
    migration,
    /revoke all privileges on table public\.order_email_notifications from service_role/i,
  )
  assert.match(
    migration,
    /grant select, insert, update on table public\.order_email_notifications to service_role/i,
  )
  assert.doesNotMatch(migration, /grant[\s\S]*(delete|truncate|trigger|references)/i)
})
