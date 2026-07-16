import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const readProjectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('checkout creation reserves inventory and is idempotent in one database function', async () => {
  const migration = await readProjectFile('supabase/migrations/20260716120000_harden_checkout_and_support.sql')

  assert.match(migration, /create or replace function public\.create_checkout_order/i)
  assert.match(migration, /orders\.idempotency_key = p_idempotency_key/i)
  assert.match(migration, /set stock_quantity = stock_quantity - v_quantity/i)
  assert.match(migration, /where id = v_variant\.id and stock_quantity >= v_quantity/i)
  assert.match(migration, /revoke all on function public\.create_checkout_order/i)
})

test('M-Pesa finalization updates payment and order in the same RPC', async () => {
  const migration = await readProjectFile('supabase/migrations/20260716120000_harden_checkout_and_support.sql')
  const finalizer = migration.slice(migration.indexOf('create or replace function public.finalize_mpesa_payment'))

  assert.match(finalizer, /update public\.payments/i)
  assert.match(finalizer, /update public\.orders set status = 'confirmed', payment_status = 'paid'/i)
  assert.match(finalizer, /release_checkout_inventory\(v_payment\.order_id\)/i)
})

test('cart identity includes selected size', async () => {
  const cart = await readProjectFile('app/composables/useCart.ts')
  assert.match(cart, /item\.slug.*item\.colour.*item\.size/s)
})

test('success page verifies payment status instead of trusting the URL', async () => {
  const successPage = await readProjectFile('app/pages/checkout/success.vue')
  assert.match(successPage, /\/api\/checkout\/payment-status/)
  assert.match(successPage, /v-if="payment\?\.paid"/)
  assert.match(successPage, /This page is not proof of payment/)
})
