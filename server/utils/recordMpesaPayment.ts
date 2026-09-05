import { createError } from 'h3'
import { getDatabase } from './db'
import { notifyPaidOrder } from './email/notifyPaidOrder'

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

export const recordMpesaPayment = async (callback: MpesaStkCallback, rawPayload: unknown, orderId: string | null = null) => {
  const checkoutRequestId = getStringValue(callback.CheckoutRequestID)
  if (!checkoutRequestId) {
    throw createError({ statusCode: 400, statusMessage: 'M-Pesa callback has no checkout request ID.' })
  }

  const sql = getDatabase()
  try {
    await sql`
      insert into public.mpesa_callback_events (checkout_request_id, payload, order_id)
      values (${checkoutRequestId}, ${JSON.stringify(rawPayload)}::jsonb, ${orderId}::uuid)
      on conflict (checkout_request_id) do update
      set payload = excluded.payload,
          order_id = coalesce(public.mpesa_callback_events.order_id, excluded.order_id),
          processed_at = null
    `
  } catch (inboxError) {
    console.error('[ANAI] Could not persist M-Pesa callback inbox event:', inboxError)
    throw createError({ statusCode: 500, statusMessage: 'Payment callback could not be recorded.' })
  }

  const resultCode = Number(callback.ResultCode)
  const amountValue = Number(getMetadataValue(callback, 'Amount'))
  const amount = Number.isFinite(amountValue) ? amountValue : null
  const receipt = getStringValue(getMetadataValue(callback, 'MpesaReceiptNumber'))

  let results: FinalizeResult[]
  try {
    if (orderId) {
      await sql`
        select public.set_mpesa_checkout_request(
          ${orderId}::uuid, ${checkoutRequestId}::text,
          ${getStringValue(callback.MerchantRequestID)}::text, ${'{}'}::jsonb
        )
      `
    }
    results = await sql`
      select * from public.finalize_mpesa_payment(
        ${checkoutRequestId}::text,
        ${Number.isInteger(resultCode) ? resultCode : -1}::integer,
        ${getStringValue(callback.ResultDesc)}::text,
        ${amount}::numeric,
        ${receipt}::text,
        ${getStringValue(callback.MerchantRequestID)}::text,
        ${getStringValue(getMetadataValue(callback, 'PhoneNumber'))}::text,
        ${getStringValue(getMetadataValue(callback, 'TransactionDate'))}::text,
        ${JSON.stringify(rawPayload)}::jsonb
      )
    ` as unknown as FinalizeResult[]
  } catch (error) {
    console.error('[ANAI] Atomic M-Pesa finalization failed:', error)
    throw createError({ statusCode: 500, statusMessage: 'Payment callback could not be finalized.' })
  }

  const result = results[0]
  if (!result?.recorded) return { recorded: false, checkoutRequestId, paid: false, failed: false }

  if (result.paid) {
    try {
      await notifyPaidOrder(checkoutRequestId)
    } catch (notificationError) {
      console.error('[ANAI] Payment was recorded but paid-order email notification failed:', notificationError)
    }
  }

  try {
    const processedAt = new Date().toISOString()
    await sql`
      update public.mpesa_callback_events
      set processed_at = ${processedAt}::timestamptz
      where checkout_request_id = ${checkoutRequestId}
        and payload = ${JSON.stringify(rawPayload)}::jsonb
    `
  } catch (processedError) {
    console.error('[ANAI] Could not mark M-Pesa callback as processed:', processedError)
  }

  return { ...result, checkoutRequestId }
}

export const recordStoredMpesaCallback = async (checkoutRequestId: string) => {
  const sql = getDatabase()
  let rows: Array<{ payload: unknown; processed_at: string | null; order_id: string | null }>
  try {
    rows = await sql`
      select payload, processed_at::text as processed_at, order_id
      from public.mpesa_callback_events
      where checkout_request_id = ${checkoutRequestId} and processed_at is null
      limit 1
    ` as unknown as Array<{ payload: unknown; processed_at: string | null; order_id: string | null }>
  } catch (error) {
    console.error('[ANAI] Could not check the M-Pesa callback inbox:', error)
    return false
  }

  const payload = rows[0]?.payload
  const callback = getStoredCallback(payload)
  if (!callback) return false
  const result = await recordMpesaPayment(callback, payload, rows[0]?.order_id)
  return result.recorded
}
