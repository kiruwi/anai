import { createError, getQuery, readBody } from 'h3'
import { getMpesaCallbackToken } from '../../utils/mpesa'
import { recordMpesaPayment, type MpesaStkCallback } from '../../utils/recordMpesaPayment'

type MpesaWebhookBody = { Body?: { stkCallback?: MpesaStkCallback } }

export default defineEventHandler(async (event) => {
  const token = getQuery(event).token
  if (typeof token !== 'string' || token !== getMpesaCallbackToken()) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid M-Pesa callback token.' })
  }

  const payload = (await readBody(event)) as MpesaWebhookBody
  const callback = payload?.Body?.stkCallback

  if (!callback) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid M-Pesa callback payload.' })
  }

  const orderId = getQuery(event).orderId
  if (orderId !== undefined && (typeof orderId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId))) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid order ID.' })
  }
  return recordMpesaPayment(callback, payload, typeof orderId === 'string' ? orderId : null)
})
