import { createError } from 'h3'

/** Only use for errors known to have happened before dispatch, or an explicit rejection. */
export class PaymentInitiationRejected extends Error {}

export const preparePayment = async <T>({
  initiate, persist, replay, fail,
}: {
  initiate: () => Promise<T>
  persist: (payment: T) => Promise<void>
  replay: (payment: T) => Promise<unknown>
  fail: (reason: string) => Promise<unknown>
}): Promise<T> => {
  let payment: T
  try {
    payment = await initiate()
  } catch (error) {
    if (error instanceof PaymentInitiationRejected) {
      await fail(error.message)
      throw createError({ statusCode: 502, statusMessage: 'M-Pesa could not start this payment. Please try again.' })
    }
    throw createError({ statusCode: 503, statusMessage: 'Payment confirmation is delayed. Check payment status before retrying.' })
  }

  // Once dispatched, persistence/replay failures must never cancel the order.
  try {
    await persist(payment)
    await replay(payment)
  } catch (error) {
    console.error('[ANAI] Payment started; reconciliation is required:', error)
    throw createError({ statusCode: 503, statusMessage: 'Payment confirmation is delayed. Check payment status before retrying.' })
  }
  return payment
}
