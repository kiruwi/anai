import { createError, readBody } from 'h3'
import { enforceRequestRateLimit } from '../../utils/requestRateLimit'
import { getSupabaseAdmin } from '../../utils/supabaseAdmin'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default defineEventHandler(async (event) => {
  enforceRequestRateLimit(event, 'newsletter', { max: 5, windowMs: 10 * 60_000 })
  const body = (await readBody(event)) as { email?: unknown }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (!emailPattern.test(email) || email.length > 254) {
    throw createError({ statusCode: 400, statusMessage: 'Enter a valid email address.' })
  }

  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('newsletter_subscribers').upsert(
    { email, status: 'active', subscribed_at: new Date().toISOString() },
    { onConflict: 'email' },
  )

  if (error) {
    console.error('[ANAI] Newsletter signup failed:', error)
    throw createError({ statusCode: 500, statusMessage: 'Signup is temporarily unavailable.' })
  }

  return { subscribed: true }
})
