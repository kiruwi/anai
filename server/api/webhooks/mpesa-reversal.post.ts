import { createError, getQuery } from 'h3'
import { deliverReturnMail } from '../../utils/email/notifyReturns'
import { parseReversalResult, verifyReversalCallback } from '../../utils/mpesaReversal'
import { recordMpesaReversal } from '../../utils/recordMpesaReversal'
import { readReturnBody, returnUuid } from '../../utils/returnAccess'

export default defineEventHandler(async (event) => {
  const { attempt, kind, token } = getQuery(event)
  const secret = String(useRuntimeConfig().mpesaReversalCallbackSecret || '').trim()
  if (typeof attempt !== 'string' || !returnUuid.test(attempt) || (kind !== 'result' && kind !== 'timeout') ||
    !verifyReversalCallback(secret, attempt, kind, token)) {
    throw createError({ statusCode: 404, statusMessage: 'Callback not found.' })
  }
  const body = await readReturnBody(event)
  const update = parseReversalResult(body, kind)
  if (!update) throw createError({ statusCode: 400, statusMessage: 'Invalid M-Pesa reversal result.' })
  const request = await recordMpesaReversal(attempt, update)
  if (request) await deliverReturnMail(request).catch(() => {})
  return { ResultCode: 0, ResultDesc: 'Accepted' }
})
