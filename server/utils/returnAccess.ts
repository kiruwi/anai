import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { createError, getRequestHeader, getRequestWebStream, setResponseHeader, type H3Event } from 'h3'

export const returnUuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i
export const returnEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ownerTokenPattern = /^[A-Za-z0-9_-]{43}$/
const guestLinkLifetime = 14 * 24 * 60 * 60

export function returnConfig() {
  const config = useRuntimeConfig()
  const secret = String(config.returnsLinkSecret || '')
  const owner = String(config.returnsOwnerEmail || '').trim().toLowerCase()
  return { enabled: secret.length >= 32 && returnEmail.test(owner), secret, owner }
}

export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex')
const sign = (value: string, secret: string) => createHmac('sha256', secret).update(value).digest('base64url')

export function createGuestOrderToken(orderId: string, secret: string, now = Date.now()) {
  const claims = orderId + '.' + (Math.floor(now / 1000) + guestLinkLifetime)
  return claims + '.' + sign('anai:order:' + claims, secret)
}

export function verifyGuestOrderToken(token: unknown, secret: string, now = Date.now()) {
  if (typeof token !== 'string' || token.length > 110 || secret.length < 32) return null
  const [orderId, expires, supplied, ...extra] = token.split('.')
  if (extra.length || !orderId || !returnUuid.test(orderId) || !expires || !/^\d{10}$/.test(expires)
    || Number(expires) <= Math.floor(now / 1000) || !supplied || !ownerTokenPattern.test(supplied)) return null
  const expected = sign('anai:order:' + orderId + '.' + expires, secret)
  return timingSafeEqual(Buffer.from(expected), Buffer.from(supplied)) ? orderId : null
}

export function createOwnerReturnToken(mailId: string, requestId: string, version: number, action: string, owner: string, secret: string) {
  return sign(['anai:owner', mailId, requestId, version, action, owner].join(':'), secret)
}

export function privateReturnLink(path: 'order' | 'manage-return', token?: string) {
  const url = new URL('/' + path, String(useRuntimeConfig().public.siteUrl))
  if (token) url.hash = token
  return url.toString()
}

export function requireOwnerToken(token: unknown) {
  if (typeof token !== 'string' || !ownerTokenPattern.test(token)) {
    throw createError({ statusCode: 404, statusMessage: 'This action link has expired or is no longer current.' })
  }
  return tokenHash(token)
}

export async function readReturnBody(event: H3Event, max = 12_000): Promise<Record<string, unknown>> {
  setResponseHeader(event, 'cache-control', 'private, no-store')
  setResponseHeader(event, 'referrer-policy', 'no-referrer')
  setResponseHeader(event, 'x-robots-tag', 'noindex, nofollow')
  const contentType = getRequestHeader(event, 'content-type') || ''
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
    throw createError({ statusCode: 415, statusMessage: 'JSON is required.' })
  }
  const length = Number(getRequestHeader(event, 'content-length'))
  if (length > max) throw createError({ statusCode: 413, statusMessage: 'The request is too large.' })
  const stream = getRequestWebStream(event)
  if (!stream) throw createError({ statusCode: 400, statusMessage: 'Request data is required.' })
  const reader = stream.getReader()
  const chunks: Buffer[] = []
  let total = 0
  try {
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      const chunk = Buffer.from(value)
      total += chunk.length
      if (total > max) {
        void reader.cancel().catch(() => {})
        throw createError({ statusCode: 413, statusMessage: 'The request is too large.' })
      }
      chunks.push(chunk)
    }
  } finally {
    reader.releaseLock()
  }
  try {
    const data: unknown = JSON.parse(Buffer.concat(chunks, total).toString('utf8'))
    if (data && typeof data === 'object' && !Array.isArray(data)) return data as Record<string, unknown>
  } catch {}
  throw createError({ statusCode: 400, statusMessage: 'Invalid request data.' })
}
