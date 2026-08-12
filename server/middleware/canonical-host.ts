import { getRequestURL, sendRedirect, setResponseHeader } from 'h3'
import {
  getCanonicalRedirectUrl,
  isAmplifyPreviewHostname,
} from '#shared/lib/canonicalHost'

export default defineEventHandler((event) => {
  const requestUrl = getRequestURL(event)

  if (isAmplifyPreviewHostname(requestUrl.hostname)) {
    setResponseHeader(event, 'x-robots-tag', 'noindex, nofollow')
    return
  }

  const redirectUrl = getCanonicalRedirectUrl(requestUrl)

  if (!redirectUrl) {
    return
  }

  return sendRedirect(event, redirectUrl, 301)
})
