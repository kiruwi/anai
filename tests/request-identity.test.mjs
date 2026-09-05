import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createEvent } from 'h3'
import { getRateLimitIdentity } from '../server/utils/requestRateLimit.ts'

test('rate limit identity ignores spoofed forwarded headers unless an ingress header is explicitly configured', () => {
  const previous = globalThis.useRuntimeConfig
  const event = createEvent({ headers: { 'x-forwarded-for': '203.0.113.99', 'x-client-ip': '203.0.113.5' }, socket: { remoteAddress: '127.0.0.1' } }, {})
  try {
    globalThis.useRuntimeConfig = () => ({ trustedClientIpHeader: '' })
    assert.equal(getRateLimitIdentity(event), '127.0.0.1')
    globalThis.useRuntimeConfig = () => ({ trustedClientIpHeader: 'x-client-ip' })
    assert.equal(getRateLimitIdentity(event), '203.0.113.5')
    event.node.req.headers['x-client-ip'] = '203.0.113.5, 203.0.113.99'
    assert.equal(getRateLimitIdentity(event), 'unknown', 'An unvalidated chain must not create a new bucket')
  } finally {
    globalThis.useRuntimeConfig = previous
  }
})
