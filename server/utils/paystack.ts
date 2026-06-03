import { createError } from 'h3'

type PaystackTransactionData = {
  status?: string
  reference?: string
  amount?: number
  currency?: string
  paid_at?: string | null
  paidAt?: string | null
  transaction_date?: string | null
  [key: string]: unknown
}

type PaystackVerifyResponse = {
  status: boolean
  message: string
  data?: PaystackTransactionData
}

type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded'
type OrderPaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

const terminalFailureStatuses = new Set(['abandoned', 'failed'])

export const getPaystackSecretKey = () => {
  const config = useRuntimeConfig()

  if (!config.paystackSecretKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Paystack secret key is not configured.',
    })
  }

  return config.paystackSecretKey
}

export const getPaystackWebhookSecret = () => {
  const config = useRuntimeConfig()
  const webhookSecret = config.paystackWebhookSecret || config.paystackSecretKey

  if (!webhookSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Paystack webhook secret is not configured.',
    })
  }

  return webhookSecret
}

export const verifyPaystackTransaction = async (reference: string) => {
  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${getPaystackSecretKey()}`,
      },
    },
  )

  const payload = (await response.json()) as PaystackVerifyResponse

  if (!response.ok || !payload.status || !payload.data) {
    throw createError({
      statusCode: 502,
      statusMessage: payload.message || 'Paystack verification failed.',
    })
  }

  return payload.data
}

export const mapPaystackStatus = (status?: string) => {
  if (status === 'success') {
    return {
      paymentStatus: 'paid' as PaymentStatus,
      orderPaymentStatus: 'paid' as OrderPaymentStatus,
      orderStatus: 'confirmed',
    }
  }

  if (status === 'reversed') {
    return {
      paymentStatus: 'refunded' as PaymentStatus,
      orderPaymentStatus: 'refunded' as OrderPaymentStatus,
      orderStatus: undefined,
    }
  }

  if (terminalFailureStatuses.has(status || '')) {
    return {
      paymentStatus: 'failed' as PaymentStatus,
      orderPaymentStatus: 'failed' as OrderPaymentStatus,
      orderStatus: undefined,
    }
  }

  return {
    paymentStatus: 'pending' as PaymentStatus,
    orderPaymentStatus: 'pending' as OrderPaymentStatus,
    orderStatus: undefined,
  }
}

export const getPaystackPaidAt = (transaction: PaystackTransactionData) =>
  transaction.paid_at || transaction.paidAt || transaction.transaction_date || null
