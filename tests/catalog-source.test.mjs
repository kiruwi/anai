import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { mapCatalogProductRecord, mapCatalogProductRecords } from '../server/utils/catalog.ts'
import { fallbackProducts, getProductUrlSlug } from '../app/data/homeContent.ts'

test('retiring products, including the last one, does not invalidate the active catalogue', () => {
  const records = fallbackProducts.map((product, index) => ({
    id: String(index), name: product.name, slug: product.slug, public_slug: getProductUrlSlug(product),
    category: { name: product.category }, display_order: index,
    variants: [{ id: String(index), sku: String(index), color: 'Black', size: 'M', price_kes: 1500, stock_quantity: 1, is_active: true }],
  }))
  assert.equal(mapCatalogProductRecords(records).length, records.length)
  records.shift()
  records[0].variants[0].price_kes = 1700
  assert.equal(mapCatalogProductRecords(records)[0].priceKes, 1700)
  assert.deepEqual(mapCatalogProductRecords([]), [])
  records[0].public_slug = 'changed-indexed-url'
  assert.throws(() => mapCatalogProductRecords(records), /protected public URL/)
})

const readProjectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('database catalogue mapping preserves public URLs and derives availability from variants', () => {
  const product = mapCatalogProductRecord({
    id: 'product-id',
    name: 'Zuri bra',
    slug: 'strappy-bra',
    public_slug: 'zuri-bra',
    description: 'A minimal square-neck bra top.',
    image_url: '/images/products/Zuri bra/white.webp',
    hover_image_url: '/images/products/Zuri bra/brown.webp',
    image_tone: 'linear-gradient(135deg, #111111, #f6f1ea)',
    size_guide_text: null,
    size_options: [{ label: 'S/8' }, { label: 'M/10' }],
    image_revision: 'catalogue-test',
    is_new: true,
    display_order: 10,
    updated_at: '2026-08-26T00:00:00.000Z',
    category: { name: 'Tops' },
    variants: [
      {
        id: 'black-medium',
        sku: 'ANAI-BRA-BLACK-M',
        color: 'Black',
        color_value: '#111111',
        size: 'M/10',
        price_kes: 1499,
        stock_quantity: 2,
        is_active: true,
      },
      {
        id: 'black-small',
        sku: 'ANAI-BRA-BLACK-S',
        color: 'Black',
        color_value: '#111111',
        size: 'S/8',
        price_kes: 1499,
        stock_quantity: 0,
        is_active: true,
      },
    ],
    images: [
      {
        id: 'image-id',
        variant_id: 'black-medium',
        image_url: '/images/products/Zuri bra/black.webp',
        sort_order: 0,
      },
    ],
  })

  assert.ok(product)
  assert.equal(product.slug, 'strappy-bra')
  assert.equal(product.urlSlug, 'zuri-bra')
  assert.equal(product.priceKes, 1499)
  assert.equal(product.stockQuantity, 2)
  assert.equal(product.colours[0].stockQuantity, 2)
  assert.match(product.imageUrl, /\?v=catalogue-test$/)
  assert.equal(product.sizeOptions.find((size) => size.label === 'M/10').available, true)
  assert.equal(product.sizeOptions.find((size) => size.label === 'S/8').available, false)
})

test('catalogue migration protects indexed slugs and makes sizes variant-driven', async () => {
  const migration = await readProjectFile(
    'supabase/migrations/20260826102514_consolidate_catalogue_authority.sql',
  )
  const checkout = await readProjectFile('server/api/checkout/create-payment.post.ts')

  for (const publicSlug of [
    'nuru-zip-up',
    'long-sleeve-round-neck',
    'long-sleeve-swirl-neck',
    'aya-mini-tee',
    'nia-jogger-set',
    'lela-set',
    'mvua-flannel',
    'zuri-bra',
    'terra-skirt',
    'jua-jogger-set',
    'mia-cropped-tee',
  ]) {
    assert.match(migration, new RegExp(`'${publicSlug}'`))
  }

  assert.match(migration, /create unique index if not exists products_public_slug_idx/i)
  assert.match(migration, /set size = 'M\/10'/i)
  assert.doesNotMatch(migration, /products_active_public_slug_check/)
  assert.match(checkout, /cleanString\(entry\.size\).*item\.size/is)
  assert.doesNotMatch(checkout, /inStockSizeLabels|validSizeLabels/)
})

test('all catalogue consumers use the shared database-backed path', async () => {
  const app = await readProjectFile('app/app.vue')
  const sitemap = await readProjectFile('server/routes/sitemap.xml.ts')
  const merchantFeed = await readProjectFile('server/routes/google-merchant.xml.ts')
  const catalogue = await readProjectFile('server/utils/catalog.ts')

  assert.match(app, /\/api\/catalog\/products/)
  assert.match(sitemap, /await getCatalogProducts\(\)/)
  assert.match(merchantFeed, /await getCatalogProducts\(\)/)
  assert.match(catalogue, /products\.public_slug is not null/)
  assert.match(catalogue, /fallbackProducts[\s\S]*protected public URL/)
})

test('catalogue cleanup removes obsolete galleries without touching unrelated products', async () => {
  const migration = await readProjectFile(
    'supabase/migrations/20260826115612_remove_obsolete_product_images.sql',
  )

  for (const canonicalDirectory of [
    'Nuru Zip-up',
    'Reya Long sleeve, round neck',
    'Reya Long sleeve, swirl neck',
    'Aya Mini tee',
    'Nia jogger set',
    'Lela set',
    'Mvua flannel',
    'Zuri bra',
    'Terra skirt - Padel tennis bubble set',
    'Jua jogger set',
    "Mia cropped t''S",
  ]) {
    assert.match(migration, new RegExp(canonicalDirectory.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }

  assert.match(migration, /using catalogue_products as products/i)
  assert.match(migration, /canonical_images\.product_slug = products\.slug/i)
  assert.match(migration, /canonical_images\.image_url = images\.image_url/i)
  assert.doesNotMatch(migration, /select id from public\.products/i)
  assert.doesNotMatch(migration, /ANAI Crew Socks|images\.unsplash\.com/i)
})
