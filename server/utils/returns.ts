import { createError } from 'h3'
import { getDatabase } from './db'
import { returnUuid } from './returnAccess'
import type { ReplacementVariant } from '../../shared/types/returns'

export const cleanReturnText = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : ''

export function returnId(value: unknown) {
  if (typeof value !== 'string' || !returnUuid.test(value)) {
    throw createError({ statusCode: 400, statusMessage: 'A valid request or item is required.' })
  }
  return value
}

const returnErrors: Record<string, string> = {
  RETURN_LINK_INVALID: 'This action link has expired or is no longer current.',
  RETURN_ORDER_INELIGIBLE: 'This order is unavailable for a request.',
  RETURN_INVALID_REQUEST: 'Review the request type, reason, and photo requirements.',
  RETURN_INVALID_LINE: 'An item does not belong to this order.',
  RETURN_INVALID_QUANTITY: 'An item quantity exceeds the remaining eligible units.',
  RETURN_STOCK_UNAVAILABLE: 'The exact variant is unavailable. Review availability before confirming.',
  RETURN_NOTE_REQUIRED: 'Enter the requested instructions or reason.',
  RETURN_OUTSIDE_POLICY: 'The verified delivery date falls outside the request window.',
  RETURN_INSPECTION_REQUIRED: 'Verify the delivery date, policy conditions, and return instructions.',
  RETURN_INVALID_DELIVERY: 'Choose pickup or the original Nairobi delivery address.',
  RETURN_INVALID_AMOUNT: 'The amount exceeds the credit available or no longer matches the request.',
  RETURN_PRICE_CHANGED: 'The amount changed. Reopen the request to review the current breakdown.',
  RETURN_INVALID_INSPECTION: 'Count all received units as resellable or damaged.',
  RETURN_INVALID_PAYMENT: 'Verify the exact amount, reference and payment date against the business payment record.',
  RETURN_ORIGINAL_PAYMENT_UNVERIFIED: 'Verify the original M-Pesa receipt and payer before issuing the refund.',
  RETURN_STATE_CHANGED: 'This request changed. Reopen it before taking another action.',
  RETURN_DUPLICATE_RECEIPT: 'This payment reference has already been recorded.',
  RETURN_RESERVATION_EXPIRED: 'The replacement reservation expired. Ask AÑAI to confirm stock before paying.',
  RETURN_PAYMENT_RECONCILIATION: 'Verify the payment discrepancy before proceeding.',
  RETURN_REVERSAL_INELIGIBLE: 'This refund is not eligible for automatic M-Pesa reversal. Reopen the request to review the manual option.',
  RETURN_REVERSAL_PENDING: 'M-Pesa is processing the reversal. If it is still unresolved after 15 minutes, mark it for reconciliation and verify the transaction before taking another action.',
}

export async function runReturnQuery<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work()
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    const code = Object.keys(returnErrors).find((key) => message.includes(key))
    if (code) throw createError({ statusCode: code === 'RETURN_LINK_INVALID' ? 404 : 409, statusMessage: returnErrors[code] })
    if (message.includes('duplicate key')) {
      throw createError({ statusCode: 409, statusMessage: 'These items or this reference have already been recorded.' })
    }
    // Do not expose database errors or private request data.
    throw createError({ statusCode: 503, statusMessage: 'The request could not be saved or loaded. Please try again.' })
  }
}

export function validateReturnLines(value: unknown, exchange: boolean) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 30) {
    throw createError({ statusCode: 400, statusMessage: 'Choose at least one original item.' })
  }
  const seen = new Set<string>()
  return value.map((line) => {
    const itemId = returnId(line?.itemId)
    const quantity = line?.quantity
    if (seen.has(itemId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw createError({ statusCode: 400, statusMessage: 'Each original item needs a valid quantity.' })
    }
    seen.add(itemId)
    return { itemId, quantity, ...(exchange ? { replacementId: returnId(line?.replacementId) } : {}) }
  })
}

export function validateReturnPhotos(value: unknown) {
  if (!Array.isArray(value) || value.length > 3) {
    throw createError({ statusCode: 400, statusMessage: 'Choose up to three photos.' })
  }
  return value.map((photo) => {
    const data = typeof photo?.data === 'string' ? photo.data : ''
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(data) || data.length > 1_398_104) {
      throw createError({ statusCode: 400, statusMessage: 'Each photo must be 1 MB or less.' })
    }
    const bytes = Buffer.from(data, 'base64')
    const mime = bytes.subarray(0, 3).equals(Buffer.from([255,216,255])) ? 'image/jpeg'
      : bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'image/png'
      : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP' ? 'image/webp' : null
    if (!mime || bytes.length > 1_048_576 || bytes.toString('base64') !== data) {
      throw createError({ statusCode: 400, statusMessage: 'Upload a valid JPEG, PNG or WebP photo.' })
    }
    return { mime, data }
  })
}

export async function getReplacementVariants() {
  return getDatabase()`
    select v.id, p.name, v.color as colour, v.size, v.price_kes as "priceKes", v.stock_quantity as available
    from public.product_variants v join public.products p on p.id=v.product_id
    where p.is_active and v.is_active and v.stock_quantity>0
    order by p.name,v.color,v.size,v.id limit 600
  ` as unknown as Promise<ReplacementVariant[]>
}
