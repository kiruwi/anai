import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildSupportEmail } from '../supabase/functions/notify-support-request/supportEmail.ts'

test('support notification includes request details and a plain-text fallback', () => {
  const email = buildSupportEmail({
    id: '3f6534dc-4af8-4a22-a70e-99ce94ffb3ae',
    request_number: 'SUP-123-ABCDEF',
    full_name: 'Amina Test',
    email: 'amina@example.com',
    phone: null,
    category: 'order',
    order_reference: 'ANAI-123',
    message: 'Please help with my order.',
    created_at: '2026-07-26T12:00:00.000Z',
  })

  assert.match(email.subject, /SUP-123-ABCDEF/)
  assert.match(email.textContent, /amina@example\.com/)
  assert.match(email.textContent, /Please help with my order\./)
  assert.match(email.htmlContent, /ANAI-123/)
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
