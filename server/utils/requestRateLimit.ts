import { createHash } from 'node:crypto'
import { createError, getRequestIP, setResponseHeader, type H3Event } from 'h3'

type RateEntry = { count: number; resetAt: number }

const rateLimitStore = new Map<string, RateEntry>()

export const enforceRequestRateLimit = (
  event: H3Event,
  scope: string,
  { max, windowMs }: { max: number; windowMs: number },
) => {
  const now = Date.now()
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const fingerprint = createHash('sha256').update(`${scope}|${ip}`).digest('hex')
  const entry = rateLimitStore.get(fingerprint)

  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(fingerprint, { count: 1, resetAt: now + windowMs })
  } else {
    entry.count += 1
    if (entry.count > max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000))
      setResponseHeader(event, 'retry-after', retryAfterSeconds)
      throw createError({ statusCode: 429, statusMessage: 'Too many requests. Please wait and try again.' })
    }
  }

  if (rateLimitStore.size > 1_000) {
    for (const [key, value] of rateLimitStore) {
      if (value.resetAt <= now) rateLimitStore.delete(key)
    }
  }
}
