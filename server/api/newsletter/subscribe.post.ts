import { createError, readBody } from 'h3'
import { enforceRequestRateLimit } from '../../utils/requestRateLimit'
import { getDatabase } from '../../utils/db'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default defineEventHandler(async (event) => {
  await enforceRequestRateLimit(event, 'newsletter', { max: 5, windowMs: 10 * 60_000 })
  const body = (await readBody(event)) as { email?: unknown }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (!emailPattern.test(email) || email.length > 254) {
    throw createError({ statusCode: 400, statusMessage: 'Enter a valid email address.' })
  }

  const sql = getDatabase()
  try {
    const subscribedAt = new Date().toISOString()
    await sql`
      insert into public.newsletter_subscribers (email, status, subscribed_at)
      values (${email}, 'active', ${subscribedAt}::timestamptz)
      on conflict (email) do update
      set status = excluded.status, subscribed_at = excluded.subscribed_at
    `
  } catch (error) {
    console.error('[ANAI] Newsletter signup failed:', error)
    throw createError({ statusCode: 500, statusMessage: 'Signup is temporarily unavailable.' })
  }

  return { subscribed: true }
})
