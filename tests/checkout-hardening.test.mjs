import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { resolveInventoryStock } from '../shared/lib/inventory.ts'

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

test('storefront stock is read from active Supabase variants', async () => {
  const inventoryApi = await readProjectFile('server/api/catalog/inventory.get.ts')
  const inventoryComposable = await readProjectFile('app/composables/useInventory.ts')

  assert.match(inventoryApi, /from\('product_variants'\)/)
  assert.match(inventoryApi, /stock_quantity/)
  assert.match(inventoryApi, /products!inner\(slug\)/)
  assert.match(inventoryComposable, /resolveInventoryStock/)
})

test('loaded inventory fails closed for products and colours omitted by Supabase', () => {
  const inventory = {
    updatedAt: '2026-07-16T12:00:00.000Z',
    products: {
      jackets: {
        total: 2,
        colours: { black: 2 },
      },
    },
  }

  assert.equal(resolveInventoryStock({
    inventory,
    productSlug: 'inactive-product',
    fallbackStock: 10,
  }), 0)
  assert.equal(resolveInventoryStock({
    inventory,
    productSlug: 'jackets',
    colour: 'Brown',
    fallbackStock: 10,
  }), 0)
  assert.equal(resolveInventoryStock({
    inventory: null,
    productSlug: 'jackets',
    fallbackStock: 2,
  }), 2)
})

test('product cards hide live pieces left while continuing to enforce colour stock', async () => {
  const productCard = await readProjectFile('app/components/product/ProductCard.vue')
  const productPage = await readProjectFile('app/pages/product/[slug].vue')
  const cart = await readProjectFile('app/composables/useCart.ts')

  assert.match(productCard, /<!-- Temporarily hidden: show the number of pieces left\.[\s\S]*?\{\{ stockLabel \}\}[\s\S]*?-->/)
  assert.match(productPage, /<!-- Temporarily hidden: show the number of pieces left\.[\s\S]*?\{\{ stockLabel \}\}[\s\S]*?-->/)
  assert.match(productCard, /getProductStock\(props\.product, getProductColourName\(colour\)\)/)
  assert.match(cart, /clampLiveQuantity/)
})

test('stocktake quantities remain wired to the temporarily hidden photo labels', async () => {
  const productCard = await readProjectFile('app/components/product/ProductCard.vue')
  const productPage = await readProjectFile('app/pages/product/[slug].vue')
  const stocktake = await readProjectFile('supabase/migrations/20260716170000_apply_stocktake_quantities.sql')

  assert.match(productCard, /product-card__media[\s\S]*product-card__stock[\s\S]*product-card__body/)
  assert.match(productPage, /product-page__media[\s\S]*product-page__stock[\s\S]*product-page__details/)
  assert.match(productCard, /getStockLabel\(totalStock\.value\)/)
  assert.match(stocktake, /'ANAI-MVUA-BLACK-OS', 3/)
  assert.match(stocktake, /'ANAI-MIA-WHITE-OS', 2/)
})
