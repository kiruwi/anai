import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const migrationUrl = new URL(
  '../supabase/migrations/20260726142258_optimize_rls_and_variant_foreign_keys.sql',
  import.meta.url,
)

test('performance migration indexes variant foreign keys', async () => {
  const migration = await readFile(migrationUrl, 'utf8')

  assert.match(
    migration,
    /create index if not exists order_items_variant_id_idx\s+on public\.order_items \(variant_id\)/i,
  )
  assert.match(
    migration,
    /create index if not exists product_images_variant_id_idx\s+on public\.product_images \(variant_id\)/i,
  )
})

test('performance migration evaluates auth uid once per RLS query', async () => {
  const migration = await readFile(migrationUrl, 'utf8')
  const optimizedAuthCalls = migration.match(/\(select auth\.uid\(\)\)/gi) ?? []

  assert.equal(optimizedAuthCalls.length, 7)
  assert.doesNotMatch(migration, /(?<!select )auth\.uid\(\)/i)
})
