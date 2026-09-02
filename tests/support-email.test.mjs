import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sendBrevoEmail } from '../server/utils/email/brevo.ts'
import { createSupportEmailPayload } from '../server/utils/email/notifySupportRequest.ts'
import { buildSupportEmail } from '../server/utils/email/supportEmail.ts'

const supportRequest = {
  id: '3f6534dc-4af8-4a22-a70e-99ce94ffb3ae',
  request_number: 'SUP-123-ABCDEF',
  full_name: 'Amina Test',
  email: 'amina@example.com',
  phone: null,
  category: 'order',
  order_reference: 'ANAI-123',
  message: 'Please help with my order.',
  created_at: '2026-07-26T12:00:00.000Z',
}

test('support notification includes request details and a plain-text fallback', () => {
  const email = buildSupportEmail(supportRequest)

  assert.match(email.subject, /SUP-123-ABCDEF/)
  assert.match(email.textContent, /amina@example\.com/)
  assert.match(email.textContent, /Please help with my order\./)
  assert.match(email.htmlContent, /ANAI-123/)
})

test('support notification sends the expected Brevo payload through a mock', async () => {
  let request
  const payload = createSupportEmailPayload(supportRequest, 'sender@example.com', 'support@example.com')
  const fetchImpl = async (url, init) => {
    request = { url, init }
    return new Response(JSON.stringify({ messageId: 'mock-support' }), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    })
  }

  const { response, result } = await sendBrevoEmail({ apiKey: 'test-key', payload, fetchImpl })
  const submitted = JSON.parse(request.init.body)

  assert.equal(response.status, 201)
  assert.equal(result.messageId, 'mock-support')
  assert.equal(request.url, 'https://api.brevo.com/v3/smtp/email')
  assert.equal(request.init.headers['api-key'], 'test-key')
  assert.equal(submitted.to[0].email, 'support@example.com')
  assert.equal(submitted.replyTo.email, supportRequest.email)
  assert.equal(submitted.headers['Idempotency-Key'], `support-request-${supportRequest.id}`)
})

test('support notification escapes customer-controlled HTML', () => {
  const email = buildSupportEmail({
    id: '3f6534dc-4af8-4a22-a70e-99ce94ffb3ae',
    request_number: 'SUP-123-ABCDEF',
    full_name: '<img src=x onerror=alert(1)>',
    email: 'amina@example.com',
    phone: '+254700000000',
    category: 'general',
    order_reference: null,
    message: '<script>alert("bad")</script>',
    created_at: '2026-07-26T12:00:00.000Z',
  })

  assert.doesNotMatch(email.htmlContent, /<script>/)
  assert.doesNotMatch(email.htmlContent, /<img/)
  assert.match(email.htmlContent, /&lt;script&gt;/)
  assert.match(email.htmlContent, /&lt;img/)
})
