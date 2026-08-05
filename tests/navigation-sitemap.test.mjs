import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import {
  getProductUrlSlug,
  products,
} from '../app/data/homeContent.ts'
import {
  canonicalSiteUrl,
  collectionDefinitions,
  collectionSlugs,
} from '../shared/lib/catalogNavigation.ts'

const readProjectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('clean collection routes have unique SEO definitions', () => {
  assert.deepEqual(collectionSlugs, [
    'new-in',
    'women',
    'sets',
    'tops',
    'bottoms',
    'outerwear',
    'accessories',
  ])

  const titles = collectionSlugs.map((slug) => collectionDefinitions[slug].title)
  const descriptions = collectionSlugs.map((slug) => collectionDefinitions[slug].description)

  assert.equal(new Set(titles).size, titles.length)
  assert.equal(new Set(descriptions).size, descriptions.length)
  assert.equal(canonicalSiteUrl, 'https://anaibymurda.com')
})

test('public product URLs use corrected slugs without changing inventory IDs', () => {
  const expectedRoutesByInventorySlug = {
    jackets: 'nuru-zip-up',
    'minit-t-shirt': 'aya-mini-tee',
    'sahara-corsage-set': 'nia-jogger-set',
    'strappy-bra': 'zuri-bra',
    'nuru-short-set': 'jua-jogger-set',
  }

  for (const [inventorySlug, routeSlug] of Object.entries(expectedRoutesByInventorySlug)) {
    const product = products.find((item) => item.slug === inventorySlug)
    assert.ok(product, `Expected inventory product ${inventorySlug}`)
    assert.equal(getProductUrlSlug(product), routeSlug)
  }
})

test('mobile Shop navigation is a dialog trigger with complete close behavior', async () => {
  const header = await readProjectFile('app/components/layout/SiteHeader.vue')

  assert.match(header, /<button[\s\S]*aria-label="Open Shop menu"[\s\S]*aria-expanded/)
  assert.match(header, /role="dialog"/)
  assert.match(header, /aria-modal="true"/)
  assert.match(header, /event\.key === 'Escape'/)
  assert.match(header, /mobile-shop__backdrop/)
  assert.match(header, /document\.documentElement\.classList\.add\('anai-shop-menu-open'\)/)
  assert.match(header, /firstMobileShopLinkElement\.value\?\.focus\(\)/)
  assert.match(header, /mobileShopTriggerElement\.value\?\.focus\(\)/)
})

test('navigation labels use sentence case and contact areas show the support number', async () => {
  const header = await readProjectFile('app/components/layout/SiteHeader.vue')
  const footer = await readProjectFile('app/components/layout/SiteFooter.vue')
  const contactPage = await readProjectFile('app/pages/contact/index.vue')

  assert.doesNotMatch(header, /\.site-header__desktop-links\s*\{[^}]*text-transform:\s*uppercase/s)
  assert.match(footer, /href="tel:\+254758807077">\+254 758 807 077<\/a>/)
  assert.match(contactPage, /href="tel:\+254758807077">\+254 758 807 077<\/a>/)
})

test('unfinished editorial links remain commented out and noindexed', async () => {
  const footer = await readProjectFile('app/components/layout/SiteFooter.vue')
  const shopTheLookSection = await readProjectFile('app/components/home/ShopTheLook.vue')
  const lookbookPage = await readProjectFile('app/pages/lookbook/index.vue')
  const shopTheLookPage = await readProjectFile('app/pages/shop-the-look/index.vue')
  const footerEditorialComment = footer.match(/<!-- TODO: Restore these links[\s\S]*?-->/)?.[0]
  const homepageEditorialComment = shopTheLookSection.match(/<!-- TODO: Restore this link[\s\S]*?-->/)?.[0]

  assert.ok(footerEditorialComment)
  assert.match(footerEditorialComment, /\/lookbook/)
  assert.match(footerEditorialComment, /\/shop-the-look/)
  assert.ok(homepageEditorialComment)
  assert.match(homepageEditorialComment, /\/shop-the-look/)
  assert.match(lookbookPage, /robots: 'noindex, nofollow'/)
  assert.match(shopTheLookPage, /robots: 'noindex, nofollow'/)
})

test('sitemap uses canonical collection and public product routes', async () => {
  const sitemap = await readProjectFile('server/routes/sitemap.xml.ts')
  const robots = await readProjectFile('server/routes/robots.txt.ts')

  assert.match(sitemap, /collectionSlugs[\s\S]*filter\(hasProductsForCollection\)/)
  assert.match(sitemap, /getProductUrlSlug\(product\)/)
  assert.doesNotMatch(sitemap, /\/lookbook|\/shop-the-look|\/wishlist|\/checkout|\/cart/)
  assert.match(robots, /canonicalSiteUrl.*\/sitemap\.xml/s)
})
