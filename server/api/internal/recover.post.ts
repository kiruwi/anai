import { timingSafeEqual } from 'node:crypto'
import { createError, getRequestHeader, setResponseHeader } from 'h3'
import { runRecoveryBatch } from '../../utils/recoverCheckout'

export default defineEventHandler(async (event) => {
  const expected = String(useRuntimeConfig().recoveryToken || '')
  const supplied = getRequestHeader(event, 'authorization') || ''
  const expectedHeader = Buffer.from(`Bearer ${expected}`)
  const suppliedHeader = Buffer.from(supplied)
  if (expected.length < 32 || expectedHeader.length !== suppliedHeader.length || !timingSafeEqual(expectedHeader, suppliedHeader)) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  setResponseHeader(event, 'cache-control', 'no-store')
  const result = await runRecoveryBatch()
  if ('failed' in result && result.failed) {
    throw createError({ statusCode: 503, statusMessage: 'Some recovery attempts failed; remaining work was preserved.', data: result })
  }
  return result
})
