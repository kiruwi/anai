import { createError, readBody } from 'h3'
import { enforceRequestRateLimit } from '../../utils/requestRateLimit'
import { getSupabaseAdmin } from '../../utils/supabaseAdmin'

type PaymentStatusBody = { reference?: unknown }

export default defineEventHandler(async (event) => {
  enforceRequestRateLimit(event, 'payment-status', { max: 60, windowMs: 10 * 60_000 })
  const body = (await readBody(event)) as PaymentStatusBody
  const reference = typeof body.reference === 'string' ? body.reference.trim() : ''
  if (!/^ANAI-\d{10,}-[A-F0-9]{8}$/.test(reference)) {
    throw createError({ statusCode: 400, statusMessage: 'A valid order reference is required.' })
  }

  const supabase = getSupabaseAdmin()
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, payment_status, checkout_expires_at')
    .eq('order_number', reference)
    .maybeSingle()

  if (error) {
    console.error('[ANAI] Payment status lookup failed:', error)
    throw createError({ statusCode: 500, statusMessage: 'Payment status is temporarily unavailable.' })
  }
  if (!order) throw createError({ statusCode: 404, statusMessage: 'Order was not found.' })

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
    else return { reference, status: 'failed', paid: false }
  }

  return { reference, status: order.payment_status, paid: order.payment_status === 'paid' }
})
