import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { sendBrevoEmail } from '../server/utils/email/brevo.ts'
import { createPaidOrderEmailPayload } from '../server/utils/email/notifyPaidOrder.ts'
import { buildPaidOrderEmails } from '../server/utils/email/orderEmail.ts'

const order = {
  id: '3f6534dc-4af8-4a22-a70e-99ce94ffb3ae',
  order_number: 'ANAI-1234567890123-ABCDEF12',
  customer_name: 'Amina Test',
  customer_email: 'amina@example.com',
  customer_phone: '254712345678',
  subtotal_kes: 5060,
  delivery_fee_kes: 300,
  total_kes: 5360,
  delivery_county: 'Nairobi',
  delivery_town: null,
  delivery_address: 'Westlands',
  paid_at: '2026-07-26T12:00:00.000Z',
  mpesa_receipt_number: 'TQ12345678',
  items: [{
    product_name: 'Lela set',
    sku: 'ANAI-LELA-BROWN',
    color: 'Brown',
    size: 'M/10',
    unit_price_kes: 5060,
    quantity: 1,
    line_total_kes: 5060,
  }],
}

test('paid order emails tell the customer and sales what was purchased', () => {
  const emails = buildPaidOrderEmails(order)

  assert.match(emails.customer.subject, /ANAI-1234567890123-ABCDEF12/)
  assert.match(emails.customer.textContent, /1 × Lela set/)
  assert.match(emails.customer.textContent, /Brown/)
  assert.match(emails.customer.textContent, /M\/10/)
  assert.match(emails.customer.textContent, /TQ12345678/)
  assert.match(emails.sales.subject, /\[PAID\]/)
  assert.match(emails.sales.textContent, /amina@example\.com/)
  assert.match(emails.sales.htmlContent, /Westlands/)
})

test('paid order emails escape customer and product HTML', () => {
  const emails = buildPaidOrderEmails({
    ...order,
    customer_name: '<script>alert(1)</script>',
    items: [{ ...order.items[0], product_name: '<img src=x>' }],
  })

  assert.doesNotMatch(emails.customer.htmlContent, /<script>/)
  assert.doesNotMatch(emails.customer.htmlContent, /<img src=x>/)
  assert.match(emails.customer.htmlContent, /&lt;script&gt;/)
  assert.match(emails.customer.htmlContent, /&lt;img src=x&gt;/)
})

test('paid order notification sends the expected Brevo payload through a mock', async () => {
  let request
  const payload = createPaidOrderEmailPayload(order, 'sender@example.com', 'sales@example.com')
  const fetchImpl = async (url, init) => {
    request = { url, init }
    return new Response(JSON.stringify({ messageIds: ['mock-customer', 'mock-sales'] }), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    })
  }

  const { response, result } = await sendBrevoEmail({ apiKey: 'test-key', payload, fetchImpl })
  const submitted = JSON.parse(request.init.body)

  assert.equal(response.status, 201)
  assert.deepEqual(result.messageIds, ['mock-customer', 'mock-sales'])
  assert.equal(request.url, 'https://api.brevo.com/v3/smtp/email')
  assert.equal(request.init.headers['api-key'], 'test-key')
  assert.equal(submitted.headers['Idempotency-Key'], order.id)
  assert.equal(submitted.messageVersions[0].to[0].email, order.customer_email)
  assert.equal(submitted.messageVersions[1].to[0].email, 'sales@example.com')
})

test('paid payment paths invoke the idempotent order notifier', async () => {
  const recordPayment = await readFile(new URL('../server/utils/recordMpesaPayment.ts', import.meta.url), 'utf8')
  const paymentStatus = await readFile(new URL('../server/api/checkout/payment-status.post.ts', import.meta.url), 'utf8')
  const notifier = await readFile(new URL('../server/utils/email/notifyPaidOrder.ts', import.meta.url), 'utf8')

  assert.match(recordPayment, /result\.paid[\s\S]*notifyPaidOrder/)
  assert.match(paymentStatus, /status === 'paid'[\s\S]*notifyPaidOrder/)
  assert.match(notifier, /order_email_notifications/)
  assert.match(notifier, /Idempotency-Key/)
  assert.match(notifier, /messageVersions/)
  assert.match(notifier, /claim\.status === 'sent'/)
  assert.match(notifier, /claimIsStale/)
  assert.match(notifier, /and updated_at = \$\{claim\.updated_at\}::timestamptz/)
})
