import { createError } from 'h3'
import { getDatabase } from './db'
import { initiateMpesaStkPush, normalizeKenyanPhone } from './mpesa'
import { preparePayment } from './paymentInitiation'
import { recordStoredMpesaCallback } from './recordMpesaPayment'
import { runReturnQuery } from './returns'

type ExchangeTopup = { orderId: string; reference: string; amountKes: number }

export async function requestExchangeTopup(orderId: string, requestId: string, suppliedPhone: string) {
  let phone: string
  try {
    phone = normalizeKenyanPhone(suppliedPhone)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Enter a valid Kenyan M-Pesa number.' })
  }
  const sql = getDatabase()
  const [row] = await runReturnQuery(async () => sql`
    select public.start_exchange_topup(${orderId}::uuid,${requestId}::uuid,${phone}) as topup
  ` as unknown as Array<{ topup: ExchangeTopup }>)
  if (!row?.topup) throw createError({ statusCode: 503, statusMessage: 'Exchange checkout is unavailable.' })
  const topup = row.topup
  const result = await preparePayment({
    initiate: () => initiateMpesaStkPush({
      amountKes: topup.amountKes, phoneNumber: phone, orderId: topup.orderId,
      accountReference: 'ANAIX' + topup.reference.replace(/[^A-Za-z0-9]/g, '').slice(-7),
    }),
    persist: async (payment) => {
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          const [row] = await sql`
            select public.set_mpesa_checkout_request(${topup.orderId}::uuid,${payment.checkoutRequestId},${payment.merchantRequestId},
              ${JSON.stringify(payment.raw)}::jsonb) as saved
          ` as unknown as Array<{ saved: boolean }>
          if (row?.saved) return
        } catch {
          // A provider acceptance must never cause a fresh payment attempt.
        }
        await new Promise(resolve => setTimeout(resolve, 200 * (attempt + 1)))
      }
      throw new Error('Exchange payment needs callback reconciliation')
    },
    replay: (payment) => recordStoredMpesaCallback(payment.checkoutRequestId),
    fail: () => sql`select public.reject_exchange_topup(${topup.orderId}::uuid)`,
  })
  return { message: result.customerMessage, amountKes: topup.amountKes }
}
