import { createError } from 'h3'

type MpesaRuntimeConfig = {
  environment: 'sandbox' | 'production'
  consumerKey: string
  consumerSecret: string
  shortcode: string
  passkey: string
  callbackUrl: string
  callbackToken: string
  transactionType: 'CustomerPayBillOnline' | 'CustomerBuyGoodsOnline'
  transactionDescription: string
}

type MpesaStkResponse = {
  ResponseCode?: string
  ResponseDescription?: string
  CustomerMessage?: string
  MerchantRequestID?: string
  CheckoutRequestID?: string
  errorCode?: string
  errorMessage?: string
  [key: string]: unknown
}

let accessToken = ''
let accessTokenExpiresAt = 0

const getStringConfig = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

const getConfig = (): MpesaRuntimeConfig => {
  const runtimeConfig = useRuntimeConfig()
  const environment = getStringConfig(runtimeConfig.mpesaEnvironment).toLowerCase()
  const consumerKey = getStringConfig(runtimeConfig.mpesaConsumerKey)
  const consumerSecret = getStringConfig(runtimeConfig.mpesaConsumerSecret)
  const shortcode = getStringConfig(runtimeConfig.mpesaShortcode)
  const passkey = getStringConfig(runtimeConfig.mpesaPasskey)
  const callbackUrl = getStringConfig(runtimeConfig.mpesaCallbackUrl)
  const callbackToken = getStringConfig(runtimeConfig.mpesaCallbackToken)
  const transactionType = getStringConfig(runtimeConfig.mpesaTransactionType)
  const transactionDescription = getStringConfig(runtimeConfig.mpesaTransactionDescription)

  if (environment !== 'sandbox' && environment !== 'production') {
    throw createError({ statusCode: 500, statusMessage: 'M-Pesa environment must be sandbox or production.' })
  }

  const missingConfiguration = [
    !consumerKey && 'NUXT_MPESA_CONSUMER_KEY',
    !consumerSecret && 'NUXT_MPESA_CONSUMER_SECRET',
    !shortcode && 'NUXT_MPESA_SHORTCODE',
    !passkey && 'NUXT_MPESA_PASSKEY',
    !callbackUrl && 'NUXT_MPESA_CALLBACK_URL',
    !callbackToken && 'NUXT_MPESA_CALLBACK_TOKEN',
  ].filter(Boolean)

  if (missingConfiguration.length) {
    throw createError({
      statusCode: 500,
      statusMessage: `M-Pesa configuration is missing: ${missingConfiguration.join(', ')}.`,
    })
  }

  if (!/^\d+$/.test(shortcode)) {
    throw createError({ statusCode: 500, statusMessage: 'M-Pesa shortcode must contain only numbers.' })
  }

  try {
    const parsedUrl = new URL(callbackUrl)
    if (parsedUrl.protocol !== 'https:') {
      throw new Error('not HTTPS')
    }
  } catch {
    throw createError({ statusCode: 500, statusMessage: 'M-Pesa callback URL must be a public HTTPS URL.' })
  }

  if (transactionType !== 'CustomerPayBillOnline' && transactionType !== 'CustomerBuyGoodsOnline') {
    throw createError({ statusCode: 500, statusMessage: 'M-Pesa transaction type is invalid.' })
  }

  return {
    environment,
    consumerKey,
    consumerSecret,
    shortcode,
    passkey,
    callbackUrl,
    callbackToken,
    transactionType,
    transactionDescription: transactionDescription || 'ANAI payment',
  }
}

const getBaseUrl = (environment: MpesaRuntimeConfig['environment']) =>
  environment === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke'

const getCallbackUrl = (config: MpesaRuntimeConfig) => {
  const callbackUrl = new URL(config.callbackUrl)
  callbackUrl.searchParams.set('token', config.callbackToken)
  return callbackUrl.toString()
}

export const getMpesaCallbackToken = () => getConfig().callbackToken

const getTimestamp = () => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value || ''

  return `${part('year')}${part('month')}${part('day')}${part('hour')}${part('minute')}${part('second')}`
}

const getAccessToken = async (config: MpesaRuntimeConfig) => {
  if (accessToken && Date.now() < accessTokenExpiresAt) {
    return accessToken
  }

  const credentials = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64')
  const response = await fetch(`${getBaseUrl(config.environment)}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
    signal: AbortSignal.timeout(15_000),
  })
  const payload = (await response.json()) as { access_token?: string; expires_in?: string | number; error_description?: string }

  if (!response.ok || !payload.access_token) {
    throw createError({
      statusCode: 502,
      statusMessage: payload.error_description || 'M-Pesa authentication failed.',
    })
  }

  accessToken = payload.access_token
  accessTokenExpiresAt = Date.now() + Math.max(60, Number(payload.expires_in || 300) - 60) * 1000
  return accessToken
}

export const normalizeKenyanPhone = (value: string) => {
  const phone = value.replace(/[^\d]/g, '')
  if (/^0[17]\d{8}$/.test(phone)) return `254${phone.slice(1)}`
  if (/^254[17]\d{8}$/.test(phone)) return phone
  throw new Error('Invalid Kenyan phone number')
}

export const initiateMpesaStkPush = async ({
  amountKes,
  phoneNumber,
  accountReference,
}: {
  amountKes: number
  phoneNumber: string
  accountReference: string
}) => {
  const config = getConfig()
  const timestamp = getTimestamp()
  const password = Buffer.from(`${config.shortcode}${config.passkey}${timestamp}`).toString('base64')
  const response = await fetch(`${getBaseUrl(config.environment)}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${await getAccessToken(config)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      BusinessShortCode: config.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: config.transactionType,
      Amount: Math.round(amountKes),
      PartyA: phoneNumber,
      PartyB: config.shortcode,
      PhoneNumber: phoneNumber,
      CallBackURL: getCallbackUrl(config),
      AccountReference: accountReference,
      TransactionDesc: config.transactionDescription.slice(0, 13),
    }),
    signal: AbortSignal.timeout(20_000),
  })
  const payload = (await response.json()) as MpesaStkResponse

  if (!response.ok || payload.ResponseCode !== '0' || !payload.CheckoutRequestID) {
    throw createError({
      statusCode: 502,
      statusMessage: payload.errorMessage || payload.ResponseDescription || 'M-Pesa could not start the payment request.',
    })
  }

  return {
    checkoutRequestId: payload.CheckoutRequestID,
    merchantRequestId: payload.MerchantRequestID || null,
    customerMessage: payload.CustomerMessage || 'Check your phone and enter your M-Pesa PIN to pay.',
    raw: payload,
  }
}
