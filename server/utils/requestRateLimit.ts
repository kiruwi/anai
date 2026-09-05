import { createHash } from 'node:crypto'
import { isIP } from 'node:net'
import { createError, getRequestHeader, getRequestIP, setResponseHeader, type H3Event } from 'h3'
import { getDatabase } from './db.ts'

/** Trust only a header overwritten by the configured ingress, never an arbitrary forwarded chain. */
export const getRateLimitIdentity = (event: H3Event) => {
  const header = String(useRuntimeConfig().trustedClientIpHeader || '').toLowerCase()
  const candidate = header ? getRequestHeader(event, header)?.trim() : getRequestIP(event)
  return candidate && isIP(candidate) ? candidate : 'unknown'
}

export const enforceRequestRateLimit = async (
  event: H3Event,
  scope: string,
  { max, windowMs }: { max: number; windowMs: number },
) => {
  const fingerprint = createHash('sha256').update(`${scope}|${getRateLimitIdentity(event)}`).digest('hex')
  let rows: Array<{ allowed: boolean; retry_after: number }>
  try {
    rows = await getDatabase()`
      select * from public.consume_request_limit(${fingerprint}::text, ${max}::integer, ${windowMs}::integer)
    ` as unknown as typeof rows
  } catch (error) {
    console.error('[ANAI] Request limit storage is unavailable:', error)
    throw createError({ statusCode: 503, statusMessage: 'Service temporarily unavailable. Please try again shortly.' })
  }
  if (!rows[0]?.allowed) {
    setResponseHeader(event, 'retry-after', rows[0]?.retry_after || 60)
    throw createError({ statusCode: 429, statusMessage: 'Too many requests. Please wait and try again.' })
  }
}
