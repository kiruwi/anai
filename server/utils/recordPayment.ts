import { createError } from 'h3'
import { getPaystackPaidAt, mapPaystackStatus } from './paystack'
import { getSupabaseAdmin } from './supabaseAdmin'

type PaystackTransactionData = {
  status?: string
  reference?: string
  amount?: number
  currency?: string
  [key: string]: unknown
}

type RecordPaymentOptions = {
  reference: string
  transaction: PaystackTransactionData
  rawPayload: unknown
}

export const recordPaystackPayment = async ({
  reference,
  transaction,
  rawPayload,
}: RecordPaymentOptions) => {
  const supabase = getSupabaseAdmin()
  const transactionReference = transaction.reference || reference

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('id, order_id, amount_kes, status')
    .eq('provider', 'paystack')
    .eq('provider_reference', transactionReference)
    .maybeSingle()

  if (paymentError) {
    throw createError({
      statusCode: 500,
      statusMessage: paymentError.message,
    })
  }

  if (!payment) {
    throw createError({
      statusCode: 404,
      statusMessage: 'No local payment record was found for this Paystack reference.',
    })
  }

  const currency = String(transaction.currency || '').toUpperCase()
  const expectedAmount = Number(payment.amount_kes) * 100
  const receivedAmount = Number(transaction.amount)
  const hasAmountMismatch =
    Number.isFinite(receivedAmount) && expectedAmount > 0 && receivedAmount !== expectedAmount
  const hasCurrencyMismatch = Boolean(currency && currency !== 'KES')
  const mappedStatus =
    hasAmountMismatch || hasCurrencyMismatch
      ? {
          paymentStatus: 'failed' as const,
          orderPaymentStatus: 'failed' as const,
          orderStatus: undefined,
        }
      : mapPaystackStatus(transaction.status)

  const paidAt =
    mappedStatus.paymentStatus === 'paid' ? getPaystackPaidAt(transaction) || new Date().toISOString() : null

  const { error: updatePaymentError } = await supabase
    .from('payments')
    .update({
      status: mappedStatus.paymentStatus,
      paid_at: paidAt,
      raw_payload: rawPayload,
    })
    .eq('id', payment.id)

  if (updatePaymentError) {
    throw createError({
      statusCode: 500,
      statusMessage: updatePaymentError.message,
    })
  }

  const orderUpdate: Record<string, string> = {
    payment_status: mappedStatus.orderPaymentStatus,
  }

  if (mappedStatus.orderStatus) {
    orderUpdate.status = mappedStatus.orderStatus
  }

  const { error: updateOrderError } = await supabase
    .from('orders')
    .update(orderUpdate)
    .eq('id', payment.order_id)

  if (updateOrderError) {
    throw createError({
      statusCode: 500,
      statusMessage: updateOrderError.message,
    })
  }

  return {
    reference: transactionReference,
    status: mappedStatus.paymentStatus,
    paid: mappedStatus.paymentStatus === 'paid',
    amountMismatch: hasAmountMismatch,
    currencyMismatch: hasCurrencyMismatch,
  }
}
