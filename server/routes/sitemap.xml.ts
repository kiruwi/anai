import { setHeader } from 'h3'
import {
  getProductUrlSlug,
  products,
} from '../../app/data/homeContent'
import { legalPaths } from '../../app/data/legalContent'
import {
  canonicalSiteUrl,
  collectionDefinitions,
  collectionSlugs,
} from '#shared/lib/catalogNavigation'

const staticPaths = [
  '/',
  '/shop',
  '/about',
  '/size-guide',
  '/contact',
  '/legal',
  ...legalPaths,
]

const hasProductsForCollection = (slug: (typeof collectionSlugs)[number]) => {
  const collection = collectionDefinitions[slug]

  if (collection.filter === 'new') return products.some((product) => product.isNew)
  if (collection.filter === 'women') return products.length > 0

  return products.some((product) =>
    product.category.toLowerCase() === collection.category?.toLowerCase(),
  )
}

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')

export default defineEventHandler((event) => {
  const collectionPaths = collectionSlugs
    .filter(hasProductsForCollection)
    .map((slug) => `/shop/${slug}`)
  const productPaths = products.map((product) => `/product/${getProductUrlSlug(product)}`)
  const paths = [...new Set([...staticPaths, ...collectionPaths, ...productPaths])]

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...paths.map((path) => [
      '  <url>',
      `    <loc>${escapeXml(`${canonicalSiteUrl}${path}`)}</loc>`,
      '  </url>',
    ].join('\n')),
    '</urlset>',
  ].join('\n')
})
