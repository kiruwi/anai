import assert from 'node:assert/strict'
import test from 'node:test'
import { parseReversalResult, prepareMpesaReversal, reversalCallbackToken, verifyReversalCallback } from '../server/utils/mpesaReversal.ts'

const secret = 'mock-callback-secret-for-isolated-tests'
const attempt = { id: '11111111-1111-4111-8111-111111111111', requestId: 'fixture', receipt: 'ORIGINAL01', amount: 500 }
const config = {
  environment: 'sandbox', consumerKey: 'test-key', consumerSecret: 'test-secret',
  initiator: 'test-operator', credential: 'encrypted-fixture', shortcode: '600001', secret, siteUrl: 'https://shop.example.test',
}

test('Daraja receives the original payment and separate authenticated result and timeout URLs', async t => {
  const replies = [Response.json({ access_token: 'fixture-token' }), Response.json({
    ResponseCode: '0', ConversationID: 'AG_123', OriginatorConversationID: 'origin-123',
  })]
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => replies.shift())
  const send = await prepareMpesaReversal(config)
  assert.deepEqual(await send(attempt), { outcome: 'accepted', conversation: 'AG_123', originator: 'origin-123' })
  const [url, options] = fetchMock.mock.calls[1].arguments
  assert.equal(url, 'https://sandbox.safaricom.co.ke/mpesa/reversal/v1/request')
  const payload = JSON.parse(options.body)
  assert.equal(payload.TransactionID, attempt.receipt)
  assert.equal(payload.Amount, attempt.amount)
  assert.equal(payload.ReceiverParty, config.shortcode)
  assert.equal(payload.RecieverIdentifierType, '11')
  const result = new URL(payload.ResultURL)
  const timeout = new URL(payload.QueueTimeOutURL)
  assert.equal(result.searchParams.get('attempt'), attempt.id)
  assert.ok(verifyReversalCallback(secret, attempt.id, 'result', result.searchParams.get('token')))
  assert.ok(verifyReversalCallback(secret, attempt.id, 'timeout', timeout.searchParams.get('token')))
  assert.equal(verifyReversalCallback(secret, attempt.id, 'result', timeout.searchParams.get('token')), false)
  assert.equal(verifyReversalCallback(secret, 'different-attempt', 'result', reversalCallbackToken(secret, attempt.id, 'result')), false)
  fetchMock.mock.mockImplementation(async () => { throw new Error('connection lost') })
  assert.deepEqual(await send(attempt), { outcome: 'unknown' })
  assert.equal(fetchMock.mock.callCount(), 3, 'A transport error does not resend the reversal')
})

test('a final success requires a provider receipt, original receipt and exact whole-shilling amount', () => {
  const Result = {
    ResultCode: 0, ResultType: 0, ConversationID: 'AG_123', OriginatorConversationID: 'origin-123', TransactionID: 'CREDIT01',
    ResultParameters: { ResultParameter: [{ Key: 'OriginalTransactionID', Value: 'ORIGINAL01' }, { Key: 'Amount', Value: '500.00' }] },
  }
  assert.deepEqual(parseReversalResult({ Result }, 'result'), {
    outcome: 'confirmed', conversation: 'AG_123', originator: 'origin-123', original: 'ORIGINAL01', receipt: 'CREDIT01', amount: 500,
  })
  assert.equal(parseReversalResult({ Result: { ...Result, ResultParameters: {} } }, 'result').outcome, 'unknown')
  assert.equal(parseReversalResult({ Result: { ...Result, ResultCode: 'R000001' } }, 'result').outcome, 'unknown')
  assert.deepEqual(parseReversalResult({}, 'timeout'), { outcome: 'unknown' })
})
