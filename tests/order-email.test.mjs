import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { buildPaidOrderEmails } from '../supabase/functions/notify-paid-order/orderEmail.ts'

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

test('paid payment paths invoke the idempotent order notifier', async () => {
  const recordPayment = await readFile(new URL('../server/utils/recordMpesaPayment.ts', import.meta.url), 'utf8')
  const paymentStatus = await readFile(new URL('../server/api/checkout/payment-status.post.ts', import.meta.url), 'utf8')
  const notifier = await readFile(new URL('../supabase/functions/notify-paid-order/index.ts', import.meta.url), 'utf8')

  assert.match(recordPayment, /result\.paid[\s\S]*notify-paid-order/)
  assert.match(paymentStatus, /status === 'paid'[\s\S]*notify-paid-order/)
  assert.match(notifier, /order_email_notifications/)
  assert.match(notifier, /Idempotency-Key/)
  assert.match(notifier, /messageVersions/)
})
