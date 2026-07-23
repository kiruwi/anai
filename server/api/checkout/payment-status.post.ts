import { createError, readBody } from 'h3'
import { isMpesaCancellation } from '../../../shared/lib/mpesaStatus'
import { enforceRequestRateLimit } from '../../utils/requestRateLimit'
import { getSupabaseAdmin } from '../../utils/supabaseAdmin'

type PaymentStatusBody = { reference?: unknown; idempotencyKey?: unknown }

type MpesaPaymentStatus = {
  mpesa_result_code: number | null
  mpesa_result_description: string | null
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

  const supabase = getSupabaseAdmin()
  let orderQuery = supabase
    .from('orders')
    .select('id, order_number, payment_status, checkout_expires_at')

  orderQuery = referencePattern.test(reference)
    ? orderQuery.eq('order_number', reference)
    : orderQuery.eq('idempotency_key', idempotencyKey)

  const { data: order, error } = await orderQuery
    .maybeSingle()

  if (error) {
    console.error('[ANAI] Payment status lookup failed:', error)
    throw createError({ statusCode: 500, statusMessage: 'Payment status is temporarily unavailable.' })
  }
  if (!order) throw createError({ statusCode: 404, statusMessage: 'Order was not found.' })

  const orderReference = order.order_number

  if (
    order.payment_status === 'pending' &&
    order.checkout_expires_at &&
    new Date(order.checkout_expires_at).getTime() < Date.now()
  ) {
    const { error: expiryError } = await supabase.rpc('fail_checkout_order', {
      p_order_id: order.id,
      p_reason: 'Payment request expired',
    })
    if (expiryError) console.error('[ANAI] Could not expire pending checkout:', expiryError)
    else return { reference: orderReference, status: 'failed', paid: false }
  }

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('mpesa_result_code, mpesa_result_description')
    .eq('order_id', order.id)
    .eq('provider', 'mpesa')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (paymentError) {
    console.error('[ANAI] M-Pesa payment status lookup failed:', paymentError)
    throw createError({ statusCode: 500, statusMessage: 'Payment status is temporarily unavailable.' })
  }

  const mpesaPayment = payment as MpesaPaymentStatus | null
  const wasCanceled = order.payment_status === 'failed' && isMpesaCancellation(
    mpesaPayment?.mpesa_result_code,
    mpesaPayment?.mpesa_result_description,
  )
  const status = wasCanceled ? 'cancelled' : order.payment_status

  return { reference: orderReference, status, paid: status === 'paid' }
})
