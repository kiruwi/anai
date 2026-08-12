import { canonicalSiteUrl } from './catalogNavigation.ts'

const canonicalHostname = new URL(canonicalSiteUrl).hostname
const localHostnames = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]'])
const amplifyPreviewHostnameSuffix = '.amplifyapp.com'

export const isAmplifyPreviewHostname = (hostname: string) =>
  hostname.toLowerCase().endsWith(amplifyPreviewHostnameSuffix)

export const getCanonicalRedirectUrl = (requestUrl: URL) => {
  const requestHostname = requestUrl.hostname.toLowerCase()

  if (
    requestHostname === canonicalHostname ||
    localHostnames.has(requestHostname) ||
    isAmplifyPreviewHostname(requestHostname)
  ) {
    return null
  }

  return new URL(`${requestUrl.pathname}${requestUrl.search}`, canonicalSiteUrl).toString()
}
