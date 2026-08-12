import type { AppNotification, NotificationType } from '../../app/composables/useNotifications'

export type CheckoutNoticeKind =
  | 'sending'
  | 'check-phone'
  | 'checking'
  | 'processing'
  | 'cancelled'
  | 'failed'
  | 'connection'
  | 'uncertain'
  | 'generic-error'

type CheckoutNoticeOptions = {
  reference?: string
}

type CheckoutErrorLike = {
  name?: unknown
  message?: unknown
  status?: unknown
  statusCode?: unknown
  data?: {
    code?: unknown
  }
}

const persistentNotice = (
  kind: CheckoutNoticeKind,
  type: NotificationType,
  title: string,
  message: string,
): AppNotification => ({
  id: `checkout-payment-${kind}`,
  type,
  title,
  message,
  dismissible: false,
  duration: null,
})

export const createCheckoutNotice = (
  kind: CheckoutNoticeKind,
  { reference = '' }: CheckoutNoticeOptions = {},
): AppNotification => {
  switch (kind) {
    case 'sending':
      return persistentNotice(
        kind,
        'info',
        'Sending M-Pesa request',
        'We are sending a secure payment prompt to your phone.',
      )
    case 'check-phone':
      return persistentNotice(
        kind,
        'info',
        'Check your phone',
        'Enter your M-Pesa PIN to complete the payment.',
      )
    case 'checking':
      return persistentNotice(
        kind,
        'info',
        'Checking payment status',
        reference
          ? `We are checking the latest M-Pesa status for order ${reference}.`
          : 'We are checking the latest M-Pesa payment status.',
      )
    case 'processing':
      return persistentNotice(
        kind,
        'warning',
        'Payment still processing',
        reference
          ? `We are waiting for confirmation for order ${reference}. Do not submit another payment request.`
          : 'We are waiting for M-Pesa confirmation. Do not submit another payment request.',
      )
    case 'cancelled':
      return persistentNotice(
        kind,
        'warning',
        'Payment cancelled',
        'The M-Pesa request was cancelled. You can try again when ready.',
      )
    case 'failed':
      return persistentNotice(
        kind,
        'error',
        'Payment not completed',
        'M-Pesa did not complete the payment. You can try again when ready.',
      )
    case 'connection':
      return persistentNotice(
        kind,
        'error',
        'Connection problem',
        'We could not reach the payment service. Check your connection and try again.',
      )
    case 'uncertain':
      return persistentNotice(
        kind,
        'warning',
        'Payment still processing',
        reference
          ? `We could not confirm the current status for order ${reference}. If you entered your M-Pesa PIN or see a deduction, do not submit another payment request. Use Check payment status or contact support.`
          : 'We could not confirm the current payment status. If you entered your M-Pesa PIN or see a deduction, do not submit another payment request. Check the existing payment status or contact support.',
      )
    default:
      return persistentNotice(
        kind,
        'error',
        'Checkout unavailable',
        'We could not complete this request. Review your details and try again. If you entered your M-Pesa PIN or see a deduction, check payment status before retrying.',
      )
  }
}

export const getCheckoutErrorStatus = (error: unknown) => {
  if (!error || typeof error !== 'object') return undefined
  const candidate = error as CheckoutErrorLike
  const status = typeof candidate.statusCode === 'number'
    ? candidate.statusCode
    : candidate.status

  return typeof status === 'number' && Number.isFinite(status) ? status : undefined
}

const getCheckoutErrorCode = (error: unknown) => {
  if (!error || typeof error !== 'object') return ''
  const code = (error as CheckoutErrorLike).data?.code
  return typeof code === 'string' ? code : ''
}

const isNetworkError = (error: unknown) => {
  if (!error || typeof error !== 'object') return false
  const candidate = error as CheckoutErrorLike
  const name = typeof candidate.name === 'string' ? candidate.name.toLowerCase() : ''
  const message = typeof candidate.message === 'string' ? candidate.message.toLowerCase() : ''

  return name === 'typeerror'
    || message.includes('fetch failed')
    || message.includes('failed to fetch')
    || message.includes('network error')
    || message.includes('network request failed')
}

export const shouldRecoverCheckout = (error: unknown) => {
  const status = getCheckoutErrorStatus(error)
  const code = getCheckoutErrorCode(error)
  return status === undefined
    || status === 409
    || status >= 500
    || code === 'PAYMENT_STATE_UNCERTAIN'
}

export const mapCheckoutError = (
  error: unknown,
  { reference = '', paymentMayHaveStarted = false }: CheckoutNoticeOptions & {
    paymentMayHaveStarted?: boolean
  } = {},
): AppNotification => {
  const status = getCheckoutErrorStatus(error)
  const code = getCheckoutErrorCode(error)

  if (paymentMayHaveStarted || status === 503 || code === 'PAYMENT_STATE_UNCERTAIN') {
    return createCheckoutNotice('uncertain', { reference })
  }

  if (isNetworkError(error) || status === undefined || status === 502) {
    return createCheckoutNotice('connection')
  }

  if (status === 400) {
    return persistentNotice(
      'generic-error',
      'error',
      'Checkout details need attention',
      'Review your contact, delivery, and bag details, then try again.',
    )
  }

  if (status === 404) {
    return persistentNotice(
      'generic-error',
      'error',
      'Payment status unavailable',
      'We could not find this order. Check the order reference or contact support.',
    )
  }

  if (status === 409) {
    return persistentNotice(
      'generic-error',
      'warning',
      'Checkout needs attention',
      'Review your bag. If you already requested payment, check its status before trying again.',
    )
  }

  if (status === 429) {
    return persistentNotice(
      'generic-error',
      'warning',
      'Please wait before retrying',
      'There have been several payment requests. Wait a few minutes, then try again.',
    )
  }

  return createCheckoutNotice('generic-error')
}
