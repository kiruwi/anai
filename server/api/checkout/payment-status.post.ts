import { createError, readBody } from 'h3'
import { getSupabaseAdmin } from '../../utils/supabaseAdmin'

type PaymentStatusBody = { reference?: unknown }

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as PaymentStatusBody
  const reference = typeof body.reference === 'string' ? body.reference.trim() : ''
  if (!reference) throw createError({ statusCode: 400, statusMessage: 'Order reference is required.' })

  const supabase = getSupabaseAdmin()
  const { data: order, error } = await supabase
    .from('orders')
    .select('payment_status')
    .eq('order_number', reference)
    .maybeSingle()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  if (!order) throw createError({ statusCode: 404, statusMessage: 'Order was not found.' })

  return { reference, status: order.payment_status, paid: order.payment_status === 'paid' }
})
