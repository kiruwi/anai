import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { products } from '../app/data/homeContent.ts'
import {
  buildGoogleMerchantFeed,
  createGoogleMerchantItem,
} from '../server/utils/googleMerchantFeed.ts'

const siteUrl = 'https://anaibymurda.com'

test('Google Merchant route always uses the verified canonical store domain', async () => {
  const route = await readFile(
    new URL('../server/routes/google-merchant.xml.ts', import.meta.url),
    'utf8',
  )

  assert.match(route, /siteUrl: canonicalSiteUrl/g)
  assert.doesNotMatch(route, /useRuntimeConfig|config\.public\.siteUrl/)
})

test('Google Merchant items use live variant price, stock and a colour landing URL', () => {
  const product = products.find((item) => item.slug === 'strappy-bra')
  assert.ok(product)

  const item = createGoogleMerchantItem({
    product,
    siteUrl,
    variant: {
      id: 'variant-id',
      sku: 'ANAI-BRA-BROWN-OS',
      color: 'Brown',
      size: 'One size',
      price_kes: 1499,
      stock_quantity: 0,
    },
  })

  assert.ok(item)
  assert.equal(item.id, 'ANAI-BRA-BROWN-OS')
  assert.equal(item.mpn, 'ANAI-BRA-BROWN-OS')
  assert.equal(item.itemGroupId, 'ANAI-strappy-bra')
  assert.equal(item.title, 'Zuri bra - Brown')
  assert.equal(item.price, '1499.00 KES')
  assert.equal(item.availability, 'out_of_stock')
  assert.equal(item.size, 'one_size')
  assert.equal(item.link, 'https://anaibymurda.com/product/zuri-bra?colour=Brown')
  assert.match(item.imageLink, /Zuri%20bra\/brown\.webp\?v=/)
})

test('Google Merchant XML contains apparel attributes and does not invent a GTIN', () => {
  const product = products.find((item) => item.slug === 'strappy-bra')
  assert.ok(product)

  const item = createGoogleMerchantItem({
    product,
    siteUrl,
    variant: {
      id: 'variant-id',
      sku: 'ANAI-BRA-BROWN-OS',
      color: 'Brown & Cream',
      size: 'One size',
      price_kes: 1499,
      stock_quantity: 1,
    },
  })
  assert.ok(item)

  const xml = buildGoogleMerchantFeed({ items: [item], siteUrl })

  assert.match(xml, /xmlns:g="http:\/\/base\.google\.com\/ns\/1\.0"/)
  assert.match(xml, /<g:title>Zuri bra - Brown &amp; Cream<\/g:title>/)
  assert.match(xml, /<g:link>https:\/\/anaibymurda\.com\/product\/zuri-bra\?colour=Brown\+%26\+Cream<\/g:link>/)
  assert.match(xml, /<g:google_product_category>1604<\/g:google_product_category>/)
  assert.match(xml, /<g:brand>ANAI<\/g:brand>/)
  assert.match(xml, /<g:mpn>ANAI-BRA-BROWN-OS<\/g:mpn>/)
  assert.match(xml, /<g:gender>female<\/g:gender>/)
  assert.match(xml, /<g:age_group>adult<\/g:age_group>/)
  assert.match(xml, /Brown &amp; Cream/)
  assert.doesNotMatch(xml, /<g:gtin>|<g:identifier_exists>/)
})
