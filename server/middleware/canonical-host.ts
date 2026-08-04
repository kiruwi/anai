import { getRequestURL, sendRedirect } from 'h3'
import { canonicalSiteUrl } from '#shared/lib/catalogNavigation'

export default defineEventHandler((event) => {
  const requestUrl = getRequestURL(event)

  if (requestUrl.hostname.toLowerCase() !== 'www.anaibymurda.com') {
    return
  }

  return sendRedirect(
    event,
    `${canonicalSiteUrl}${requestUrl.pathname}${requestUrl.search}`,
    301,
  )
})
