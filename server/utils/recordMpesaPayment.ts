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

type FinalizeResult = { recorded: boolean; paid: boolean; failed: boolean }

const getMetadataValue = (callback: MpesaStkCallback, name: string) =>
  callback.CallbackMetadata?.Item?.find((item) => item.Name === name)?.Value

const getStringValue = (value: unknown) => {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

const getStoredCallback = (payload: unknown): MpesaStkCallback | undefined => {
  if (!payload || typeof payload !== 'object') return undefined
  const body = (payload as { Body?: unknown }).Body
  if (!body || typeof body !== 'object') return undefined
  const callback = (body as { stkCallback?: unknown }).stkCallback
  return callback && typeof callback === 'object' ? (callback as MpesaStkCallback) : undefined
}

export const recordMpesaPayment = async (callback: MpesaStkCallback, rawPayload: unknown) => {
  const checkoutRequestId = getStringValue(callback.CheckoutRequestID)
  if (!checkoutRequestId) {
    throw createError({ statusCode: 400, statusMessage: 'M-Pesa callback has no checkout request ID.' })
  }

  const supabase = getSupabaseAdmin()
  const { error: inboxError } = await supabase.from('mpesa_callback_events').upsert(
    { checkout_request_id: checkoutRequestId, payload: rawPayload },
    { onConflict: 'checkout_request_id' },
  )
  if (inboxError) {
    console.error('[ANAI] Could not persist M-Pesa callback inbox event:', inboxError)
    throw createError({ statusCode: 500, statusMessage: 'Payment callback could not be recorded.' })
  }

  const resultCode = Number(callback.ResultCode)
  const amountValue = Number(getMetadataValue(callback, 'Amount'))
  const amount = Number.isFinite(amountValue) ? amountValue : null
  const receipt = getStringValue(getMetadataValue(callback, 'MpesaReceiptNumber'))

  const { data, error } = await supabase.rpc('finalize_mpesa_payment', {
    p_checkout_request_id: checkoutRequestId,
    p_result_code: Number.isInteger(resultCode) ? resultCode : -1,
    p_result_description: getStringValue(callback.ResultDesc),
    p_amount: amount,
    p_receipt: receipt,
    p_merchant_request_id: getStringValue(callback.MerchantRequestID),
    p_phone_number: getStringValue(getMetadataValue(callback, 'PhoneNumber')),
    p_transaction_date: getStringValue(getMetadataValue(callback, 'TransactionDate')),
    p_raw_payload: rawPayload,
  })

  if (error) {
    console.error('[ANAI] Atomic M-Pesa finalization failed:', error)
    throw createError({ statusCode: 500, statusMessage: 'Payment callback could not be finalized.' })
  }

  const result = (Array.isArray(data) ? data[0] : data) as FinalizeResult | undefined
  if (!result?.recorded) return { recorded: false, checkoutRequestId, paid: false, failed: false }

  const { error: processedError } = await supabase
    .from('mpesa_callback_events')
    .update({ processed_at: new Date().toISOString() })
    .eq('checkout_request_id', checkoutRequestId)
  if (processedError) console.error('[ANAI] Could not mark M-Pesa callback as processed:', processedError)

  return { ...result, checkoutRequestId }
}

export const recordStoredMpesaCallback = async (checkoutRequestId: string) => {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('mpesa_callback_events')
    .select('payload, processed_at')
    .eq('checkout_request_id', checkoutRequestId)
    .is('processed_at', null)
    .maybeSingle()

  if (error) {
    console.error('[ANAI] Could not check the M-Pesa callback inbox:', error)
    return false
  }

  const payload = data?.payload
  const callback = getStoredCallback(payload)
  if (!callback) return false
  const result = await recordMpesaPayment(callback, payload)
  return result.recorded
}
