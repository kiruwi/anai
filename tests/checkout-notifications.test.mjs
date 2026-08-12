import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  createCheckoutNotice,
  mapCheckoutError,
  shouldRecoverCheckout,
} from '../shared/lib/checkoutNotifications.ts'

test('technical fetch failures become a safe connection notice', () => {
  const notice = mapCheckoutError(new TypeError('fetch failed'))

  assert.equal(notice.title, 'Connection problem')
  assert.equal(
    notice.message,
    'We could not reach the payment service. Check your connection and try again.',
  )
  assert.doesNotMatch(JSON.stringify(notice), /TypeError|fetch failed/i)
})

test('unknown checkout errors never expose raw technical text', () => {
  const rawError = {
    statusCode: 500,
    data: { statusMessage: 'Nuxt $fetch /api/checkout/create-payment exploded' },
    message: 'stack trace: secret endpoint details',
  }
  const notice = mapCheckoutError(rawError)

  assert.equal(notice.title, 'Checkout unavailable')
  assert.doesNotMatch(JSON.stringify(notice), /Nuxt|\$fetch|endpoint|stack trace|exploded/i)
})

test('uncertain payment errors prevent duplicate payment advice', () => {
  const notice = mapCheckoutError(
    { statusCode: 503, data: { statusMessage: 'internal persistence failure' } },
    { reference: 'ANAI-123', paymentMayHaveStarted: true },
  )

  assert.equal(notice.title, 'Payment still processing')
  assert.match(notice.message ?? '', /do not submit another payment request/i)
  assert.match(notice.message ?? '', /Check payment status|check the existing payment status/i)
  assert.equal(shouldRecoverCheckout({ statusCode: 503 }), true)
})

test('checkout notices remain persistent inline state', () => {
  const notice = createCheckoutNotice('check-phone')
  assert.equal(notice.duration, null)
  assert.equal(notice.dismissible, false)
})
