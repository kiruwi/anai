import { setHeader } from 'h3'
import { canonicalSiteUrl } from '#shared/lib/catalogNavigation'

export default defineEventHandler((event) => {
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')

  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /account',
    'Disallow: /cart',
    'Disallow: /checkout',
    `Sitemap: ${canonicalSiteUrl}/sitemap.xml`,
    '',
  ].join('\n')
})
