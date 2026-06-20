import { getRequestURL, setHeader } from 'h3'
import { products } from '../../app/data/homeContent'
import { legalPaths } from '../../app/data/legalContent'

const staticPaths = [
  '/',
  '/shop',
  '/new-in',
  '/sets',
  '/tops',
  '/outerwear',
  '/accessories',
  '/lookbook',
  '/shop-the-look',
  '/about',
  '/delivery-returns',
  '/size-guide',
  '/contact',
  '/legal',
  ...legalPaths,
]

const lastmod = '2026-06-10'

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const configuredSiteUrl =
    typeof config.public.siteUrl === 'string' ? config.public.siteUrl.trim() : ''
  const requestUrl = getRequestURL(event)
  const siteUrl = (configuredSiteUrl || `${requestUrl.protocol}//${requestUrl.host}`).replace(/\/$/, '')
  const paths = [
    ...staticPaths,
    ...products.map((product) => `/product/${product.slug}`),
  ]

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...paths.map((path) => {
      const priority = path === '/' ? '1.0' : path.startsWith('/product/') ? '0.7' : '0.8'

      return [
        '  <url>',
        `    <loc>${escapeXml(`${siteUrl}${path}`)}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        `    <priority>${priority}</priority>`,
        '  </url>',
      ].join('\n')
    }),
    '</urlset>',
  ].join('\n')
})
