import { createSign } from 'node:crypto'
import type { ProductPopularity } from '../../shared/lib/productPopularity'

type AnalyticsConfig = {
  propertyId: string
  clientEmail: string
  privateKey: string
  siteUrl: string
}

type ReportRow = {
  dimensionValues?: { value?: string }[]
  metricValues?: { value?: string }[]
}

export const aggregateProductViews = (rows: ReportRow[]): Record<string, number> => {
  const counts = new Map<string, number>()
  for (const row of rows) {
    const path = row.dimensionValues?.[0]?.value || ''
    const match = /^\/product\/([^/?#]+)\/?(?:[?#].*)?$/.exec(path)
    const views = Number(row.metricValues?.[0]?.value)
    if (!match || !Number.isSafeInteger(views) || views <= 0) continue
    try {
      const slug = decodeURIComponent(match[1]!)
      if (!slug || /[/\\?#]/.test(slug)) continue
      counts.set(slug, (counts.get(slug) || 0) + views)
    } catch {
      // Ignore malformed URLs rather than discarding the entire report.
    }
  }
  return Object.fromEntries(counts)
}

export const fetchGoogleProductViews = async (
  config: AnalyticsConfig,
  request: typeof fetch = fetch,
): Promise<Record<string, number>> => {
  if (!/^\d+$/.test(config.propertyId)) throw new Error('Invalid GA4 property ID')
  const hostname = new URL(config.siteUrl).hostname.replace(/^www\./, '')
  const issuedAt = Math.floor(Date.now() / 1000)
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url')
  const payload = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({
    iss: config.clientEmail,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: issuedAt,
    exp: issuedAt + 3600,
  })}`
  const signature = createSign('RSA-SHA256').update(payload)
    .sign(config.privateKey.replace(/\\n/g, '\n'), 'base64url')
  // Bound the whole refresh, including authentication and report pagination.
  const signal = AbortSignal.timeout(3000)
  const tokenResponse = await request('https://oauth2.googleapis.com/token', {
    method: 'POST',
    signal,
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${payload}.${signature}`,
    }),
  })
  if (!tokenResponse.ok) throw new Error('Google Analytics authentication failed')
  const token = await tokenResponse.json() as { access_token?: string }
  if (!token.access_token) throw new Error('Google Analytics access token missing')

  const rows: ReportRow[] = []
  const limit = 10000
  for (let offset = 0; ; offset += limit) {
    const response = await request(
      `https://analyticsdata.googleapis.com/v1beta/properties/${config.propertyId}:runReport`,
      {
        method: 'POST',
        signal,
        headers: { authorization: `Bearer ${token.access_token}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          dateRanges: [{ startDate: '30daysAgo', endDate: 'yesterday' }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }],
          dimensionFilter: {
            andGroup: { expressions: [
              { filter: { fieldName: 'hostName', inListFilter: { values: [hostname, `www.${hostname}`] } } },
              { filter: { fieldName: 'pagePath', stringFilter: { matchType: 'BEGINS_WITH', value: '/product/', caseSensitive: true } } },
            ] },
          },
          orderBys: [{ dimension: { dimensionName: 'pagePath' } }],
          limit: String(limit),
          offset: String(offset),
        }),
      },
    )
    if (!response.ok) throw new Error('Google Analytics report failed')
    const report = await response.json() as { rows?: ReportRow[], rowCount?: number }
    rows.push(...(report.rows || []))
    if (offset + limit >= (report.rowCount || 0)) break
  }
  return aggregateProductViews(rows)
}

export const createProductPopularityReader = (
  load: typeof fetchGoogleProductViews = fetchGoogleProductViews,
  now: () => number = Date.now,
  warn: () => void = () => console.warn('[product-popularity] GA4 refresh failed; using fallback order or cached views.'),
) => {
  let cache: ProductPopularity | undefined
  let cachedFor: string | undefined
  let retryAt = 0
  let pending: Promise<ProductPopularity> | undefined
  const fallback = (): ProductPopularity => ({ viewsBySlug: {}, source: 'fallback', updatedAt: null })
  return async (config: AnalyticsConfig): Promise<ProductPopularity> => {
    if (!config.propertyId || !config.clientEmail || !config.privateKey) return fallback()
    const key = JSON.stringify([config.propertyId, config.clientEmail, config.siteUrl])
    if (key !== cachedFor) {
      cache = undefined
      retryAt = 0
      cachedFor = key
    }
    const available = () => cache?.updatedAt && now() - Date.parse(cache.updatedAt) < 86_400_000
      ? cache : fallback()
    if (now() < retryAt) return available()
    if (pending) return pending
    pending = (async () => {
      try {
        const viewsBySlug = await load(config)
        cache = { viewsBySlug, source: 'google-analytics', updatedAt: new Date(now()).toISOString() }
        retryAt = now() + 3_600_000
        return cache
      } catch {
        warn()
        retryAt = now() + 60_000
        return available()
      } finally {
        pending = undefined
      }
    })()
    return pending
  }
}

export const getProductPopularity = createProductPopularityReader()
