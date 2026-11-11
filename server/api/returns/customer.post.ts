import { createError } from 'h3'
import { getDatabase } from '../../utils/db'
import { invalidateCatalogueCache } from '../../utils/catalog'
import { deliverReturnMail } from '../../utils/email/notifyReturns'
import { requestExchangeTopup } from '../../utils/exchangePayment'
import { enforceRequestRateLimit } from '../../utils/requestRateLimit'
import { readReturnBody, returnConfig, returnEmail, verifyGuestOrderToken } from '../../utils/returnAccess'
import { cleanReturnText, getReplacementVariants, returnId, runReturnQuery, validateReturnLines, validateReturnPhotos } from '../../utils/returns'
import type { ReturnOrder } from '../../../shared/types/returns'

export default defineEventHandler(async (event) => {
  const config = returnConfig()
  if (!config.enabled) throw createError({ statusCode: 503, statusMessage: 'Please contact AÑAI Support for help with your order.' })
  await enforceRequestRateLimit(event, 'returns-customer', { max: 100, windowMs: 15 * 60_000 })
  const body = await readReturnBody(event, 4_250_000)
  const sql = getDatabase()

  if (body.operation === 'link') {
    await enforceRequestRateLimit(event, 'returns-link', { max: 5, windowMs: 15 * 60_000 })
    const reference = cleanReturnText(body.reference, 80).toUpperCase()
    const email = cleanReturnText(body.email, 254).toLowerCase()
    if (reference && returnEmail.test(email)) {
      // The recovery job resolves ownership independently of this response.
      await runReturnQuery(async () => sql`select public.request_return_link(${reference},${email},false)`)
    }
    return { message: 'If the order details match, a new link will be sent to the order email.' }
  }

  const orderId = verifyGuestOrderToken(body.token, config.secret)
  if (!orderId) throw createError({ statusCode: 404, statusMessage: 'This order link is invalid or has expired.' })
  if (body.operation === 'view' || body.operation === 'variants') {
    const [row] = await runReturnQuery(async () => sql`
      select public.get_return_order(${orderId}::uuid) as details
    ` as unknown as Array<{ details: ReturnOrder | null }>)
    if (!row?.details) throw createError({ statusCode: 404, statusMessage: 'This order is unavailable.' })
    if (body.operation === 'variants') return { variants: await runReturnQuery(getReplacementVariants) }
    return { order: row.details }
  }

  if (body.operation === 'request') {
    await enforceRequestRateLimit(event, 'returns-submit', { max: 12, windowMs: 15 * 60_000 })
    const key = returnId(body.key)
    const kind = body.kind === 'refund' || body.kind === 'exchange' ? body.kind : ''
    const code = cleanReturnText(body.reasonCode, 30)
    const reason = cleanReturnText(body.reason, 1200)
    const lines = validateReturnLines(body.lines, kind === 'exchange')
    const photos = validateReturnPhotos(body.photos)
    const [row] = await runReturnQuery(async () => sql`
      select public.submit_return_request(${orderId}::uuid,${key}::uuid,${kind},${code},${reason},
        ${JSON.stringify(lines)}::jsonb,${JSON.stringify(photos)}::jsonb) as id
    ` as unknown as Array<{ id: string }>)
    if (!row?.id) throw createError({ statusCode: 503, statusMessage: 'The request could not be recorded.' })
    await deliverReturnMail(row.id).catch(() => {})
    return { requestId: row.id }
  }

  if (body.operation === 'topup') {
    await enforceRequestRateLimit(event, 'returns-topup', { max: 5, windowMs: 15 * 60_000 })
    const result = await requestExchangeTopup(orderId, returnId(body.requestId), cleanReturnText(body.phone, 40))
    invalidateCatalogueCache()
    return result
  }
  if (body.operation === 'accept') {
    const requestId = returnId(body.requestId)
    const version = body.version
    if (typeof version !== 'number' || !Number.isInteger(version) || version < 1 || version > 2_147_483_647) {
      throw createError({ statusCode: 400, statusMessage: 'Refresh the request before accepting the offer.' })
    }
    await runReturnQuery(async () => sql`
      select public.accept_return_alternative(${orderId}::uuid,${requestId}::uuid,${version}::integer)
    `)
    await deliverReturnMail(requestId).catch(() => {})
    return { message: 'Replacement offer accepted.' }
  }
  throw createError({ statusCode: 400, statusMessage: 'Unknown order action.' })
})
