import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const readProjectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('the New Items heading uses the same trailing rule treatment as Shop the Look', async () => {
  const productRail = await readProjectFile('app/components/home/ProductRail.vue')
  const shopTheLook = await readProjectFile('app/components/home/ShopTheLook.vue')

  assert.match(productRail, /<h2 v-if="title">\{\{ title \}\}<\/h2>\s*<span v-if="title" class="product-rail__rule"/)
  assert.match(productRail, /grid-template-columns: max-content minmax\(8rem, 1fr\) max-content/)
  assert.match(productRail, /grid-template-columns: max-content minmax\(1\.6rem, 1fr\) max-content/)
  assert.match(productRail, /\.product-rail__header h2\s*\{[^}]*white-space: nowrap/s)
  assert.match(productRail, /\.product-rail__header a\s*\{[^}]*white-space: nowrap/s)
  assert.match(productRail, /\.product-rail__rule\s*\{[\s\S]*height: 1px;[\s\S]*background: var\(--colour-border\)/)
  assert.match(shopTheLook, /\.shop-the-look__rule\s*\{[\s\S]*height: 1px;[\s\S]*background: var\(--colour-border\)/)
})
