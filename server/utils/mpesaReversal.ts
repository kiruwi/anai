import { createHmac, timingSafeEqual } from 'node:crypto'
import { getMpesaAccessToken, getMpesaBaseUrl } from './mpesa.ts'

type CallbackKind = 'result' | 'timeout'
type ReversalAttempt = { id: string; requestId: string; receipt: string; amount: number }
export type ReversalUpdate = {
  outcome: 'accepted' | 'confirmed' | 'unknown'
  conversation?: string
  originator?: string
  original?: string
  receipt?: string
  amount?: number
}

const value = (input: unknown) => typeof input === 'string' ? input.trim() : ''
const identifier = (input: unknown) => {
  const id = value(input)
  return /^[A-Za-z0-9_-]{1,100}$/.test(id) ? id : undefined
}

export function reversalConfig() {
  const runtime = useRuntimeConfig()
  const environment = value(runtime.mpesaEnvironment).toLowerCase()
  const consumerKey = value(runtime.mpesaConsumerKey)
  const consumerSecret = value(runtime.mpesaConsumerSecret)
  const initiator = value(runtime.mpesaReversalInitiator)
  const credential = value(runtime.mpesaReversalCredential)
  const shortcode = value(runtime.mpesaReversalShortcode)
  const secret = value(runtime.mpesaReversalCallbackSecret)
  const siteUrl = String(runtime.public.siteUrl)
  if (value(runtime.mpesaReversalEnabled) !== 'true' || (environment !== 'sandbox' && environment !== 'production') ||
    !consumerKey || !consumerSecret || !initiator || !credential || !/^\d{5,12}$/.test(shortcode) || secret.length < 32 ||
    !URL.canParse(siteUrl) || new URL(siteUrl).protocol !== 'https:') return null
  return { environment, consumerKey, consumerSecret, initiator, credential, shortcode, secret, siteUrl } as const
}

export function reversalCallbackToken(secret: string, attempt: string, kind: CallbackKind) {
  return createHmac('sha256', secret).update(`anai:mpesa-reversal:${kind}:${attempt}`).digest('base64url')
}

export function verifyReversalCallback(secret: string, attempt: string, kind: CallbackKind, token: unknown) {
  if (secret.length < 32 || typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) return false
  return timingSafeEqual(Buffer.from(token), Buffer.from(reversalCallbackToken(secret, attempt, kind)))
}

export async function prepareMpesaReversal(config: NonNullable<ReturnType<typeof reversalConfig>>) {
  const accessToken = await getMpesaAccessToken(config)
  return async (attempt: ReversalAttempt): Promise<ReversalUpdate> => {
    const callback = (kind: CallbackKind) => {
      const url = new URL('/api/webhooks/mpesa-reversal', config.siteUrl)
      url.search = new URLSearchParams({ attempt: attempt.id, kind, token: reversalCallbackToken(config.secret, attempt.id, kind) }).toString()
      return url.toString()
    }
    try {
      const response = await fetch(`${getMpesaBaseUrl(config.environment)}/mpesa/reversal/v1/request`, {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(12_000),
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Initiator: config.initiator, SecurityCredential: config.credential, CommandID: 'TransactionReversal',
          TransactionID: attempt.receipt, Amount: attempt.amount, ReceiverParty: config.shortcode,
          RecieverIdentifierType: '11', ResultURL: callback('result'), QueueTimeOutURL: callback('timeout'),
          Remarks: 'ANAI approved return',
        }),
      })
      const reply = await response.json() as Record<string, unknown>
      const conversation = identifier(reply.ConversationID)
      const originator = identifier(reply.OriginatorConversationID)
      if (response.ok && String(reply.ResponseCode) === '0' && conversation && originator) {
        return { outcome: 'accepted', conversation, originator }
      }
    } catch {
      // The request may have reached M-Pesa even if the response did not reach us.
    }
    return { outcome: 'unknown' }
  }
}

export function parseReversalResult(body: Record<string, unknown>, kind: CallbackKind): ReversalUpdate | null {
  const result = body.Result
  if (kind === 'timeout') return { outcome: 'unknown' }
  if (!result || typeof result !== 'object' || Array.isArray(result)) return null
  const fields = result as Record<string, unknown>
  const conversation = identifier(fields.ConversationID)
  const originator = identifier(fields.OriginatorConversationID)
  if (!conversation || !originator || fields.ResultCode == null) return null
  if (String(fields.ResultCode) !== '0' || String(fields.ResultType) !== '0') return { outcome: 'unknown', conversation, originator }
  const parameters = (fields.ResultParameters as { ResultParameter?: unknown } | undefined)?.ResultParameter
  if (!Array.isArray(parameters)) return { outcome: 'unknown', conversation, originator }
  const parameter = (key: string) => {
    const matches = parameters.filter(entry => entry?.Key === key)
    return matches.length === 1 ? matches[0].Value as unknown : undefined
  }
  const original = value(parameter('OriginalTransactionID')).toUpperCase()
  const receipt = value(fields.TransactionID).toUpperCase()
  const rawAmount = parameter('Amount')
  const amount = typeof rawAmount === 'number' || (typeof rawAmount === 'string' && /^\d+(?:\.0+)?$/.test(rawAmount))
    ? Number(rawAmount) : NaN
  if (!/^[A-Z0-9]{5,30}$/.test(original) || !/^[A-Z0-9-]{5,60}$/.test(receipt) ||
    !Number.isSafeInteger(amount) || amount < 1 || amount > 2_147_483_647) return { outcome: 'unknown', conversation, originator }
  return { outcome: 'confirmed', conversation, originator, original, receipt, amount }
}
