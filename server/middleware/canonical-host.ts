import { getRequestURL, sendRedirect } from 'h3'
import { getCanonicalRedirectUrl } from '#shared/lib/canonicalHost'

export default defineEventHandler((event) => {
  const requestUrl = getRequestURL(event)
  const redirectUrl = getCanonicalRedirectUrl(requestUrl)

  if (!redirectUrl) {
    return
  }

  return sendRedirect(event, redirectUrl, 301)
})
