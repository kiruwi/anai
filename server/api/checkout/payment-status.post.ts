import { createError, readBody } from 'h3'
import { isMpesaCancellation } from '../../../shared/lib/mpesaStatus'
import { getDatabase } from '../../utils/db'
import { notifyPaidOrder } from '../../utils/email/notifyPaidOrder'
import { enforceRequestRateLimit } from '../../utils/requestRateLimit'

type PaymentStatusBody = { reference?: unknown; idempotencyKey?: unknown }

type MpesaPaymentStatus = {
  mpesa_result_code: number | null
  mpesa_result_description: string | null
}

type OrderStatusRow = {
  id: string
  order_number: string
  payment_status: string
  checkout_expires_at: string | null
}

const referencePattern = /^ANAI-\d{10,}-[A-F0-9]{8}$/
const idempotencyPattern = /^[A-Za-z0-9_-]{16,100}$/

export default defineEventHandler(async (event) => {
  enforceRequestRateLimit(event, 'payment-status', { max: 60, windowMs: 10 * 60_000 })
  const body = (await readBody(event)) as PaymentStatusBody
  const reference = typeof body.reference === 'string' ? body.reference.trim() : ''
  const idempotencyKey = typeof body.idempotencyKey === 'string' ? body.idempotencyKey.trim() : ''
  if (!referencePattern.test(reference) && !idempotencyPattern.test(idempotencyKey)) {
    throw createError({ statusCode: 400, statusMessage: 'A valid checkout session is required.' })
  }

  const sql = getDatabase()
  let orders: OrderStatusRow[]
  try {
    orders = referencePattern.test(reference)
      ? await sql`
          select id, order_number, payment_status, checkout_expires_at::text as checkout_expires_at
          from public.orders where order_number = ${reference} limit 1
        ` as unknown as OrderStatusRow[]
      : await sql`
          select id, order_number, payment_status, checkout_expires_at::text as checkout_expires_at
          from public.orders where idempotency_key = ${idempotencyKey} limit 1
        ` as unknown as OrderStatusRow[]
  } catch (error) {
    console.error('[ANAI] Payment status lookup failed:', error)
    throw createError({ statusCode: 500, statusMessage: 'Payment status is temporarily unavailable.' })
  }
  const order = orders[0]
  if (!order) throw createError({ statusCode: 404, statusMessage: 'Order was not found.' })

  const orderReference = order.order_number

  if (
    order.payment_status === 'pending' &&
    order.checkout_expires_at &&
    new Date(order.checkout_expires_at).getTime() < Date.now()
  ) {
    try {
      await sql`
        select public.fail_checkout_order(${order.id}::uuid, ${'Payment request expired'}::text)
      `
      return { reference: orderReference, status: 'failed', paid: false }
    } catch (expiryError) {
      console.error('[ANAI] Could not expire pending checkout:', expiryError)
    }
  }

  let payments: MpesaPaymentStatus[]
  try {
    payments = await sql`
      select mpesa_result_code, mpesa_result_description
      from public.payments
      where order_id = ${order.id}::uuid and lower(provider) = 'mpesa'
      order by created_at desc
      limit 1
    ` as unknown as MpesaPaymentStatus[]
  } catch (paymentError) {
    console.error('[ANAI] M-Pesa payment status lookup failed:', paymentError)
    throw createError({ statusCode: 500, statusMessage: 'Payment status is temporarily unavailable.' })
  }

  const mpesaPayment = payments[0] || null
  const wasCanceled = order.payment_status === 'failed' && isMpesaCancellation(
    mpesaPayment?.mpesa_result_code,
    mpesaPayment?.mpesa_result_description,
  )
  const status = wasCanceled ? 'cancelled' : order.payment_status

  if (status === 'paid') {
    try {
      const paidPayments = await sql`
        select mpesa_checkout_request_id
        from public.payments
        where order_id = ${order.id}::uuid and lower(provider) = 'mpesa' and status = 'paid'
        order by created_at desc
        limit 1
      ` as unknown as Array<{ mpesa_checkout_request_id: string | null }>
      const paidPayment = paidPayments[0]
      if (paidPayment?.mpesa_checkout_request_id) {
        await notifyPaidOrder(paidPayment.mpesa_checkout_request_id)
      }
    } catch (notificationError) {
      console.error('[ANAI] Paid-order email retry failed:', notificationError)
    }
  }

  return { reference: orderReference, status, paid: status === 'paid' }
})
