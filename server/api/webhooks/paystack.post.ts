import { createError, getHeader, readRawBody } from 'h3'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { getPaystackWebhookSecret } from '../../utils/paystack'
import { recordPaystackPayment } from '../../utils/recordPayment'

type PaystackWebhookBody = {
  event?: string
  data?: {
    reference?: string
    status?: string
    amount?: number
    currency?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

const isValidSignature = (body: string, signature: string, secret: string) => {
  const expectedSignature = createHmac('sha512', secret).update(body).digest('hex')
  const expectedBuffer = Buffer.from(expectedSignature)
  const receivedBuffer = Buffer.from(signature)

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  )
}

const isNotFoundError = (error: unknown) =>
  Boolean(
    error &&
      typeof error === 'object' &&
      'statusCode' in error &&
      Number((error as { statusCode?: unknown }).statusCode) === 404,
  )

export default defineEventHandler(async (event) => {
  const rawBody = await readRawBody(event)
  const signature = getHeader(event, 'x-paystack-signature') || ''

  if (!rawBody || !signature || !isValidSignature(rawBody, signature, getPaystackWebhookSecret())) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid Paystack webhook signature.',
    })
  }

  const payload = JSON.parse(rawBody) as PaystackWebhookBody
  const reference = typeof payload.data?.reference === 'string' ? payload.data.reference.trim() : ''

  if (!reference || !payload.data) {
    return {
      received: true,
      recorded: false,
    }
  }

  let result

  try {
    result = await recordPaystackPayment({
      reference,
      transaction: payload.data,
      rawPayload: {
        source: 'webhook',
        event: payload.event,
        data: payload.data,
      },
    })
  } catch (error) {
    if (isNotFoundError(error)) {
      return {
        received: true,
        recorded: false,
        reference,
      }
    }

    throw error
  }

  return {
    received: true,
    recorded: true,
    ...result,
  }
})
