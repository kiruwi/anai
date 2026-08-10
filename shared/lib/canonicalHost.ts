import { canonicalSiteUrl } from './catalogNavigation.ts'

const canonicalHostname = new URL(canonicalSiteUrl).hostname
const localHostnames = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]'])

export const getCanonicalRedirectUrl = (requestUrl: URL) => {
  const requestHostname = requestUrl.hostname.toLowerCase()

  if (
    requestHostname === canonicalHostname ||
    localHostnames.has(requestHostname)
  ) {
    return null
  }

  return new URL(`${requestUrl.pathname}${requestUrl.search}`, canonicalSiteUrl).toString()
}
