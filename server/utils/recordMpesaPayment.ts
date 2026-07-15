import { createError } from 'h3'
import { getSupabaseAdmin } from './supabaseAdmin'

type CallbackItem = { Name?: string; Value?: string | number }

export type MpesaStkCallback = {
  MerchantRequestID?: string
  CheckoutRequestID?: string
  ResultCode?: number | string
  ResultDesc?: string
  CallbackMetadata?: { Item?: CallbackItem[] }
  [key: string]: unknown
}

const getMetadataValue = (callback: MpesaStkCallback, name: string) =>
  callback.CallbackMetadata?.Item?.find((item) => item.Name === name)?.Value

const getStringValue = (value: unknown) => {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

export const recordMpesaPayment = async (callback: MpesaStkCallback, rawPayload: unknown) => {
  const checkoutRequestId = typeof callback.CheckoutRequestID === 'string' ? callback.CheckoutRequestID.trim() : ''
  if (!checkoutRequestId) {
    throw createError({ statusCode: 400, statusMessage: 'M-Pesa callback has no checkout request ID.' })
  }

  const supabase = getSupabaseAdmin()
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('id, order_id, amount_kes, status, raw_payload')
    .eq('provider', 'mpesa')
    .eq('mpesa_checkout_request_id', checkoutRequestId)
    .maybeSingle()

  if (paymentError) throw createError({ statusCode: 500, statusMessage: paymentError.message })
  if (!payment) return { recorded: false, checkoutRequestId }
  if (payment.status === 'paid') return { recorded: true, checkoutRequestId, paid: true, failed: false }

  const resultCode = Number(callback.ResultCode)
  const amount = Number(getMetadataValue(callback, 'Amount'))
  const receipt = getStringValue(getMetadataValue(callback, 'MpesaReceiptNumber'))
  const merchantRequestId = getStringValue(callback.MerchantRequestID)
  const resultDescription = getStringValue(callback.ResultDesc)
  const phoneNumber = getStringValue(getMetadataValue(callback, 'PhoneNumber'))
  const transactionDate = getStringValue(getMetadataValue(callback, 'TransactionDate'))
  const paid = resultCode === 0 && Number.isFinite(amount) && amount === Number(payment.amount_kes) && Boolean(receipt)
  const failed = resultCode !== 0 || !paid
  const existingPayload =
    payment.raw_payload && typeof payment.raw_payload === 'object' && !Array.isArray(payment.raw_payload)
      ? payment.raw_payload
      : {}

  const { error: updatePaymentError } = await supabase
    .from('payments')
    .update({
      status: paid ? 'paid' : 'failed',
      paid_at: paid ? new Date().toISOString() : null,
      mpesa_merchant_request_id: merchantRequestId || null,
      mpesa_receipt_number: receipt || null,
      mpesa_result_code: Number.isInteger(resultCode) ? resultCode : null,
      mpesa_result_description: resultDescription || null,
      mpesa_phone_number: phoneNumber || null,
      mpesa_transaction_date: transactionDate || null,
      raw_payload: { ...existingPayload, callback: rawPayload },
    })
    .eq('id', payment.id)

  if (updatePaymentError) throw createError({ statusCode: 500, statusMessage: updatePaymentError.message })

  const { error: updateOrderError } = await supabase
    .from('orders')
    .update({
      payment_status: paid ? 'paid' : 'failed',
      ...(paid ? { status: 'confirmed' } : {}),
    })
    .eq('id', payment.order_id)

  if (updateOrderError) throw createError({ statusCode: 500, statusMessage: updateOrderError.message })

  return { recorded: true, checkoutRequestId, paid, failed }
}
