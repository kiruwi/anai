import { randomBytes } from 'node:crypto'
import { createError, readBody } from 'h3'
import { enforceRequestRateLimit } from '../../utils/requestRateLimit'
import { getSupabaseAdmin } from '../../utils/supabaseAdmin'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const allowedCategories = new Set(['order', 'payment', 'delivery', 'return', 'product', 'general'])
const cleanString = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

export default defineEventHandler(async (event) => {
  enforceRequestRateLimit(event, 'support', { max: 5, windowMs: 30 * 60_000 })
  const body = (await readBody(event)) as Record<string, unknown>
  const fullName = cleanString(body.fullName)
  const email = cleanString(body.email).toLowerCase()
  const phone = cleanString(body.phone)
  const category = cleanString(body.category)
  const orderReference = cleanString(body.orderReference).toUpperCase()
  const message = cleanString(body.message)

  if (!fullName || fullName.length > 120) {
    throw createError({ statusCode: 400, statusMessage: 'Enter your full name.' })
  }
  if (!emailPattern.test(email) || email.length > 254) {
    throw createError({ statusCode: 400, statusMessage: 'Enter a valid email address.' })
  }
  if (!allowedCategories.has(category)) {
    throw createError({ statusCode: 400, statusMessage: 'Choose a support category.' })
  }
  if (phone.length > 30 || orderReference.length > 80 || message.length < 10 || message.length > 3_000) {
    throw createError({ statusCode: 400, statusMessage: 'Check the support details and message length.' })
  }

  const requestNumber = `SUP-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('support_requests').insert({
    request_number: requestNumber,
    full_name: fullName,
    email,
    phone: phone || null,
    category,
    order_reference: orderReference || null,
    message,
  })

  if (error) {
    console.error('[ANAI] Support request failed:', error)
    throw createError({ statusCode: 500, statusMessage: 'Support requests are temporarily unavailable.' })
  }

  return { submitted: true, requestNumber }
})
