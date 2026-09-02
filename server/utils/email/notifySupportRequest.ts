import { getDatabase } from '../db.ts'
import { sendBrevoEmail } from './brevo.ts'
import { buildSupportEmail, type SupportRequest } from './supportEmail.ts'

const requestIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type SupportNotificationOptions = {
  fetchImpl?: typeof fetch
}

export const createSupportEmailPayload = (
  supportRequest: SupportRequest,
  senderEmail: string,
  notificationEmail: string,
) => {
  const email = buildSupportEmail(supportRequest)

  return {
    sender: { name: 'ANAI Support', email: senderEmail },
    to: [{ name: 'ANAI Support', email: notificationEmail }],
    replyTo: { name: supportRequest.full_name, email: supportRequest.email },
    subject: email.subject,
    textContent: email.textContent,
    htmlContent: email.htmlContent,
    headers: { 'Idempotency-Key': `support-request-${supportRequest.id}` },
    tags: ['support-request'],
  }
}

export const notifySupportRequest = async (
  requestId: string,
  { fetchImpl = fetch }: SupportNotificationOptions = {},
) => {
  const normalizedRequestId = requestId.trim()
  if (!requestIdPattern.test(normalizedRequestId)) {
    throw new Error('A valid support request ID is required')
  }

  const config = useRuntimeConfig()
  const brevoApiKey = typeof config.brevoApiKey === 'string' ? config.brevoApiKey.trim() : ''
  const senderEmail = typeof config.brevoSenderEmail === 'string' ? config.brevoSenderEmail.trim() : ''
  const notificationEmail = typeof config.supportNotificationEmail === 'string'
    ? config.supportNotificationEmail.trim()
    : ''
  if (!brevoApiKey || !senderEmail || !notificationEmail) {
    throw new Error('Support notification secrets are incomplete')
  }

  const sql = getDatabase()
  const rows = await sql`
    select id, request_number, full_name, email, phone, category,
      order_reference, message, created_at::text as created_at
    from public.support_requests
    where id = ${normalizedRequestId}::uuid
    limit 1
  ` as unknown as SupportRequest[]
  const supportRequest = rows[0]
  if (!supportRequest) throw new Error('Support request was not found')

  const { response, result } = await sendBrevoEmail({
    apiKey: brevoApiKey,
    payload: createSupportEmailPayload(supportRequest, senderEmail, notificationEmail),
    fetchImpl,
  })
  if (!response.ok || !result.messageId) {
    throw new Error(result.message || `Brevo returned ${response.status}`)
  }

  return { sent: true, messageId: result.messageId }
}
