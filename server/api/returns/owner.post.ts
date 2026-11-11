import { createError } from 'h3'
import { getDatabase } from '../../utils/db'
import { invalidateCatalogueCache } from '../../utils/catalog'
import { deliverReturnMail } from '../../utils/email/notifyReturns'
import { prepareMpesaReversal, reversalConfig } from '../../utils/mpesaReversal'
import { recordMpesaReversal } from '../../utils/recordMpesaReversal'
import { enforceRequestRateLimit } from '../../utils/requestRateLimit'
import { readReturnBody, requireOwnerToken, returnConfig, returnUuid } from '../../utils/returnAccess'
import { cleanReturnText, getReplacementVariants, returnId, runReturnQuery } from '../../utils/returns'
import type { OwnerReturn } from '../../../shared/types/returns'

export default defineEventHandler(async (event) => {
  const config = returnConfig()
  if (!config.enabled) throw createError({ statusCode: 503, statusMessage: 'Return management is unavailable.' })
  await enforceRequestRateLimit(event, 'returns-owner', { max: 75, windowMs: 15 * 60_000 })
  const body = await readReturnBody(event)
  const sql = getDatabase()

  if (body.operation === 'link') {
    await enforceRequestRateLimit(event, 'returns-owner-link', { max: 5, windowMs: 15 * 60_000 })
    const reference = cleanReturnText(body.reference, 80).toLowerCase()
    const email = cleanReturnText(body.email, 254).toLowerCase()
    if (returnUuid.test(reference)) {
      // A mismatch is queued with an impossible reference, so the response reveals no matching request.
      const queuedReference = email === config.owner ? reference : ''
      await runReturnQuery(async () => sql`select public.request_return_link(${queuedReference},${email},true)`)
    }
    return { message: 'If the request details match, fresh links will be sent to the configured owner address.' }
  }

  const hash = requireOwnerToken(body.token)
  if (body.operation === 'view') {
    const [row] = await runReturnQuery(async () => sql`
      select public.get_return_action(${hash},${config.owner}) as details
    ` as unknown as Array<{ details: OwnerReturn | null }>)
    if (row?.details) {
      const details = row.details
      let automaticRefund = false
      if (details.action === 'begin_refund' && reversalConfig()) {
        const [eligibility] = await runReturnQuery(async () => sql`
          select public.can_reverse_return(${details.id}::uuid) as eligible
        ` as unknown as Array<{ eligible: boolean }>)
        automaticRefund = eligibility?.eligible === true
      }
      return {
        request: { ...details, automaticRefund },
        variants: details.action === 'offer' ? await runReturnQuery(getReplacementVariants) : [],
      }
    }
  } else if (body.operation === 'photo') {
    const [row] = await runReturnQuery(async () => sql`
      select public.get_return_photo(${hash},${config.owner},${returnId(body.photoId)}::uuid) as photo
    ` as unknown as Array<{ photo: { mime: string; data: string } | null }>)
    if (row?.photo) return { photo: row.photo }
  } else if (body.operation === 'confirm') {
    if (body.confirmed !== true || !body.data || typeof body.data !== 'object' || Array.isArray(body.data)) {
      throw createError({ statusCode: 400, statusMessage: 'Review and confirm this action before continuing.' })
    }
    const data = body.data as Record<string, unknown>
    for (const key of ['deliveredAt', 'paidAt']) {
      if (data[key] != null && (typeof data[key] !== 'string' || !Number.isFinite(Date.parse(data[key] as string)))) {
        throw createError({ statusCode: 400, statusMessage: 'Enter a valid date and time.' })
      }
    }
    if (data.amount != null && (!Number.isSafeInteger(data.amount) || Number(data.amount) < 0 || Number(data.amount) > 2_147_483_647)) {
      throw createError({ statusCode: 400, statusMessage: 'Enter a valid amount in KES.' })
    }
    if (data.automaticRefund === true) {
      const reversal = reversalConfig()
      if (!reversal) throw createError({ statusCode: 409, statusMessage: 'Automatic M-Pesa refunds are unavailable. Reopen the request to continue.' })
      if (!Number.isSafeInteger(data.amount) || Number(data.amount) <= 0) {
        throw createError({ statusCode: 400, statusMessage: 'Enter a valid refund amount.' })
      }
      const action = await runReturnQuery(async () => sql`
        select public.get_return_action(${hash},${config.owner}) as details
      ` as unknown as Array<{ details: OwnerReturn | null }>)
      if (action[0]?.details?.action !== 'begin_refund') {
        throw createError({ statusCode: 404, statusMessage: 'This action link has expired or is no longer current.' })
      }
      // Authenticate before consuming Vivian's approval, so OAuth failures leave the action usable.
      const send = await prepareMpesaReversal(reversal).catch(() => {
        throw createError({ statusCode: 503, statusMessage: 'M-Pesa could not be reached. The refund has not been submitted.' })
      })
      const [pending] = await runReturnQuery(async () => sql`
        select public.begin_return_reversal(${hash},${config.owner},${Number(data.amount)}::integer) as attempt
      ` as unknown as Array<{ attempt: Parameters<typeof send>[0] }>)
      if (!pending?.attempt) throw createError({ statusCode: 503, statusMessage: 'The refund could not be prepared.' })
      const update = await send(pending.attempt)
      await recordMpesaReversal(pending.attempt.id, update).catch(() => {
        console.error('[ANAI] Could not save the M-Pesa reversal acknowledgement.')
      })
      await deliverReturnMail(pending.attempt.requestId).catch(() => {})
      return { message: update.outcome === 'accepted'
        ? 'Refund submitted to M-Pesa. You’ll receive an update when the result is confirmed.'
        : 'M-Pesa did not confirm the submission. Check the transaction before taking any further refund action.' }
    }
    const [row] = await runReturnQuery(async () => sql`
      select public.confirm_return_action(${hash},${config.owner},${JSON.stringify(data)}::jsonb) as id
    ` as unknown as Array<{ id: string }>)
    if (row?.id) {
      invalidateCatalogueCache()
      await deliverReturnMail(row.id).catch(() => {})
      return { message: 'Action recorded. The latest request status will be sent by email.' }
    }
  }

  throw createError({ statusCode: 404, statusMessage: 'This action link has expired or is no longer current.' })
})
