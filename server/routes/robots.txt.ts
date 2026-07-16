import { getRequestURL, setHeader } from 'h3'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const configuredSiteUrl = typeof config.public.siteUrl === 'string' ? config.public.siteUrl.trim() : ''
  const requestUrl = getRequestURL(event)
  const siteUrl = (configuredSiteUrl || `${requestUrl.protocol}//${requestUrl.host}`).replace(/\/$/, '')

  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return `User-agent: *\nAllow: /\nDisallow: /checkout\nDisallow: /cart\nSitemap: ${siteUrl}/sitemap.xml\n`
})
