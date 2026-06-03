import { createError, readBody } from 'h3'
import { recordPaystackPayment } from '../../utils/recordPayment'
import { verifyPaystackTransaction } from '../../utils/paystack'

type VerifyPaymentRequestBody = {
  reference?: unknown
}

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as VerifyPaymentRequestBody
  const reference = typeof body.reference === 'string' ? body.reference.trim() : ''

  if (!reference) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Payment reference is required.',
    })
  }

  const transaction = await verifyPaystackTransaction(reference)

  return recordPaystackPayment({
    reference,
    transaction,
    rawPayload: {
      source: 'verify',
      data: transaction,
    },
  })
})
