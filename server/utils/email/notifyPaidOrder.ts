import { getDatabase } from '../db.ts'
import { sendBrevoEmail } from './brevo.ts'
import { buildPaidOrderEmails, type PaidOrder, type PaidOrderItem } from './orderEmail.ts'

const checkoutRequestIdPattern = /^[A-Za-z0-9_-]{10,120}$/
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const staleClaimMilliseconds = 5 * 60_000

type NotificationRow = {
  order_id: string
  status: 'processing' | 'sent' | 'failed'
  attempts: number
  claimed_at: string
  updated_at: string
}

type PaidOrderRow = Omit<PaidOrder, 'customer_name' | 'paid_at' | 'mpesa_receipt_number' | 'items'> & {
  customer_id: string | null
}

type PaidPaymentRow = {
  order_id: string
  mpesa_receipt_number: string | null
  paid_at: string | null
}

type PaidOrderNotificationOptions = {
  fetchImpl?: typeof fetch
}

export const createPaidOrderEmailPayload = (
  paidOrder: PaidOrder,
  senderEmail: string,
  salesEmail: string,
) => {
  const emails = buildPaidOrderEmails(paidOrder)

  return {
    sender: { name: 'ANAI', email: senderEmail },
    subject: emails.customer.subject,
    textContent: emails.customer.textContent,
    htmlContent: emails.customer.htmlContent,
    messageVersions: [
      {
        to: [{ name: paidOrder.customer_name, email: paidOrder.customer_email }],
        subject: emails.customer.subject,
        textContent: emails.customer.textContent,
        htmlContent: emails.customer.htmlContent,
      },
      {
        to: [{ name: 'ANAI Sales', email: salesEmail }],
        replyTo: { name: paidOrder.customer_name, email: paidOrder.customer_email },
        subject: emails.sales.subject,
        textContent: emails.sales.textContent,
        htmlContent: emails.sales.htmlContent,
      },
    ],
    headers: { 'Idempotency-Key': paidOrder.id },
    tags: ['paid-order'],
  }
}

export const notifyPaidOrder = async (
  checkoutRequestId: string,
  { fetchImpl = fetch }: PaidOrderNotificationOptions = {},
) => {
  const normalizedCheckoutRequestId = checkoutRequestId.trim()
  if (!checkoutRequestIdPattern.test(normalizedCheckoutRequestId)) {
    throw new Error('A valid checkout request ID is required')
  }

  const sql = getDatabase()
  const paymentRows = await sql`
    select order_id, mpesa_receipt_number, paid_at::text as paid_at
    from public.payments
    where mpesa_checkout_request_id = ${normalizedCheckoutRequestId}
      and lower(provider) = 'mpesa'
      and status = 'paid'
    limit 1
  ` as unknown as PaidPaymentRow[]
  const payment = paymentRows[0]
  if (!payment) throw new Error('A paid order was not found')

  const now = new Date().toISOString()
  const insertedClaims = await sql`
    insert into public.order_email_notifications (
      order_id, status, attempts, claimed_at, updated_at
    ) values (${payment.order_id}::uuid, 'processing', 1, ${now}::timestamptz, ${now}::timestamptz)
    on conflict (order_id) do nothing
    returning order_id
  ` as unknown as Array<{ order_id: string }>

  let hasClaim = insertedClaims.length > 0
  if (!hasClaim) {
    const claimRows = await sql`
      select order_id, status, attempts, claimed_at::text as claimed_at, updated_at::text as updated_at
      from public.order_email_notifications
      where order_id = ${payment.order_id}::uuid
      limit 1
    ` as unknown as NotificationRow[]
    const claim = claimRows[0]
    if (!claim) throw new Error('Order email claim lookup failed')

    if (claim.status === 'sent') return { sent: true, alreadySent: true }

    const claimIsStale = Date.now() - new Date(claim.claimed_at).getTime() >= staleClaimMilliseconds
    if (claim.status === 'processing' && !claimIsStale) {
      return { sent: false, processing: true }
    }

    const reclaimed = await sql`
      update public.order_email_notifications
      set status = 'processing',
          attempts = ${claim.attempts + 1}::integer,
          claimed_at = ${now}::timestamptz,
          updated_at = ${now}::timestamptz,
          last_error = null
      where order_id = ${payment.order_id}::uuid
        and updated_at = ${claim.updated_at}::timestamptz
      returning order_id
    ` as unknown as Array<{ order_id: string }>
    hasClaim = reclaimed.length > 0
    if (!hasClaim) return { sent: false, processing: true }
  }

  const markFailed = async (message: string) => {
    const failedAt = new Date().toISOString()
    await sql`
      update public.order_email_notifications
      set status = 'failed', last_error = ${message.slice(0, 1_000)}, updated_at = ${failedAt}::timestamptz
      where order_id = ${payment.order_id}::uuid
    `
  }

  const config = useRuntimeConfig()
  const brevoApiKey = typeof config.brevoApiKey === 'string' ? config.brevoApiKey.trim() : ''
  const senderEmail = typeof config.brevoSenderEmail === 'string' ? config.brevoSenderEmail.trim() : ''
  const salesEmail = typeof config.salesNotificationEmail === 'string'
    ? config.salesNotificationEmail.trim()
    : ''
  if (!brevoApiKey || !senderEmail || !emailPattern.test(salesEmail)) {
    const errorMessage = 'Paid-order email secrets are incomplete'
    await markFailed(errorMessage)
    throw new Error(errorMessage)
  }

  const [orderRows, items] = await Promise.all([
    sql`
      select id, order_number, customer_id, customer_email, customer_phone,
        subtotal_kes, delivery_fee_kes, total_kes, delivery_county, delivery_town, delivery_address
      from public.orders
      where id = ${payment.order_id}::uuid and payment_status = 'paid'
      limit 1
    ` as unknown as Promise<PaidOrderRow[]>,
    sql`
      select product_name, sku, color, size, unit_price_kes, quantity, line_total_kes
      from public.order_items
      where order_id = ${payment.order_id}::uuid
      order by created_at asc
    ` as unknown as Promise<PaidOrderItem[]>,
  ])
  const order = orderRows[0]
  if (!order || !items.length || !emailPattern.test(order.customer_email || '')) {
    const errorMessage = 'Paid order details are incomplete'
    await markFailed(errorMessage)
    throw new Error(errorMessage)
  }

  let customerName = 'Customer'
  if (order.customer_id) {
    const customers = await sql`
      select full_name from public.customers where id = ${order.customer_id}::uuid limit 1
    ` as unknown as Array<{ full_name: string | null }>
    customerName = customers[0]?.full_name?.trim() || customerName
  }

  const paidOrder: PaidOrder = {
    id: order.id,
    order_number: order.order_number,
    customer_name: customerName,
    customer_email: order.customer_email,
    customer_phone: order.customer_phone || 'Not provided',
    subtotal_kes: order.subtotal_kes,
    delivery_fee_kes: order.delivery_fee_kes,
    total_kes: order.total_kes,
    delivery_county: order.delivery_county,
    delivery_town: order.delivery_town,
    delivery_address: order.delivery_address,
    paid_at: payment.paid_at || now,
    mpesa_receipt_number: payment.mpesa_receipt_number || 'Not provided',
    items,
  }
  const { response, result } = await sendBrevoEmail({
    apiKey: brevoApiKey,
    payload: createPaidOrderEmailPayload(paidOrder, senderEmail, salesEmail),
    fetchImpl,
  })
  const wasIdempotentDuplicate = result.code === 'duplicate_parameter'
  const messageIds = result.messageIds || (result.messageId ? [result.messageId] : [])
  if ((!response.ok || !messageIds.length) && !wasIdempotentDuplicate) {
    const errorMessage = result.message || `Brevo returned ${response.status}`
    await markFailed(errorMessage)
    throw new Error(errorMessage)
  }

  const sentAt = new Date().toISOString()
  try {
    await sql`
      update public.order_email_notifications
      set status = 'sent', sent_at = ${sentAt}::timestamptz,
          brevo_message_ids = array(
            select jsonb_array_elements_text(${JSON.stringify(messageIds)}::jsonb)
          ),
          last_error = null, updated_at = ${sentAt}::timestamptz
      where order_id = ${paidOrder.id}::uuid
    `
  } catch (statusError) {
    console.error('[ANAI] Paid-order email was sent but its delivery status could not be recorded:', statusError)
  }

  return { sent: true, messageIds }
}
