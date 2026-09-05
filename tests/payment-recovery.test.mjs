import assert from 'node:assert/strict'
import { test } from 'node:test'
import { preparePayment, PaymentInitiationRejected } from '../server/utils/paymentInitiation.ts'
import { initiateMpesaStkPush } from '../server/utils/mpesa.ts'

test('lost response, persistence failure, and callback replay failure never cancel an accepted payment', async () => {
  for (const stage of ['initiate', 'persist', 'replay']) {
    const calls = []
    const action = (name) => async () => {
      calls.push(name)
      if (name === stage) throw new Error('Connection lost')
      return { checkoutRequestId: 'accepted-payment' }
    }
    await assert.rejects(preparePayment({
      initiate: action('initiate'), persist: action('persist'), replay: action('replay'), fail: action('fail'),
    }), { statusCode: 503 })
    assert.equal(calls.includes('fail'), false, stage)
  }
})

test('an explicit rejection releases the reservation exactly once', async () => {
  let failures = 0
  await assert.rejects(preparePayment({
    initiate: async () => { throw new PaymentInitiationRejected('Rejected') },
    persist: async () => assert.fail('No accepted request'),
    replay: async () => assert.fail('No accepted request'),
    fail: async () => { failures += 1 },
  }), { statusCode: 502 })
  assert.equal(failures, 1)
})

test('M-Pesa request includes order correlation before a response can be lost', async () => {
  const previousConfig = globalThis.useRuntimeConfig
  const previousFetch = globalThis.fetch
  globalThis.useRuntimeConfig = () => ({
    mpesaEnvironment: 'sandbox', mpesaConsumerKey: 'test', mpesaConsumerSecret: 'test',
    mpesaShortcode: '123456', mpesaPasskey: 'test', mpesaCallbackToken: 'test-token',
    mpesaCallbackUrl: 'https://example.com/api/webhooks/mpesa', mpesaTransactionType: 'CustomerPayBillOnline',
  })
  const orderId = '11111111-1111-4111-8111-111111111111'
  let callbackUrl
  globalThis.fetch = async (url, options) => {
    if (url.includes('/oauth/')) return Response.json({ access_token: 'test-token' })
    callbackUrl = new URL(JSON.parse(options.body).CallBackURL)
    throw new DOMException('Request timed out after dispatch', 'TimeoutError')
  }
  try {
    await assert.rejects(initiateMpesaStkPush({ orderId, amountKes: 100, phoneNumber: '254700000000', accountReference: 'TEST' }), { name: 'TimeoutError' })
    assert.equal(callbackUrl.searchParams.get('orderId'), orderId)
    assert.equal(callbackUrl.searchParams.get('token'), 'test-token')
  } finally {
    globalThis.fetch = previousFetch
    globalThis.useRuntimeConfig = previousConfig
  }
})
