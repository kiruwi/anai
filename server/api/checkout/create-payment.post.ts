import { createHash, randomBytes } from 'node:crypto'
import { createError, readBody } from 'h3'
import { getDatabase } from '../../utils/db'
import { initiateMpesaStkPush, normalizeKenyanPhone } from '../../utils/mpesa'
import { preparePayment } from '../../utils/paymentInitiation'
import { enforceRequestRateLimit, getRateLimitIdentity } from '../../utils/requestRateLimit'
import { recordStoredMpesaCallback } from '../../utils/recordMpesaPayment'

type CheckoutItemInput = {
  slug?: unknown
  quantity?: unknown
  size?: unknown
  color?: unknown
  colour?: unknown
}

type CheckoutCustomerInput = {
  email?: unknown
  name?: unknown
  phone?: unknown
  address?: unknown
}

type CheckoutRequestBody = {
  customer?: CheckoutCustomerInput
  deliveryMethod?: unknown
  idempotencyKey?: unknown
  items?: CheckoutItemInput[]
}

type VariantRecord = {
  id: string
  sku: string | null
  color: string | null
  size: string | null
  price_kes: number
  stock_quantity: number
  product_id: string
  product_name: string
  product_slug: string
}

type ProductRecord = { id: string; name: string; slug: string }

type CheckoutRpcRow = {
  order_id: string
  order_number: string
  total_kes: number
  checkout_request_id: string | null
  created: boolean
}

const cleanString = (value: unknown) => (typeof value === 'string' ? value.trim() : '')
const createReference = () => `ANAI-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`
const validDeliveryMethods = new Set(['nairobi-delivery', 'town-pickup'])
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const idempotencyPattern = /^[A-Za-z0-9_-]{16,100}$/

const getVariantProduct = (variant: VariantRecord): ProductRecord => ({
  id: variant.product_id,
  name: variant.product_name,
  slug: variant.product_slug,
})

const normalizeItems = (items: CheckoutItemInput[] | undefined) => {
  if (!Array.isArray(items)) return []

  const itemMap = new Map<string, { slug: string; quantity: number; size: string; color: string }>()

  for (const item of items.slice(0, 40)) {
    const slug = cleanString(item.slug)
    const quantity = Number(item.quantity)
    const size = cleanString(item.size)
    const color = cleanString(item.color || item.colour)

    if (!slug || slug.length > 120 || !Number.isFinite(quantity) || quantity < 1) continue
    if (!size || size.length > 40) {
      throw createError({ statusCode: 400, statusMessage: `Choose a valid size for ${slug}.` })
    }

    const itemKey = `${slug}:${size}:${color.toLowerCase()}`
    const existingItem = itemMap.get(itemKey)
    itemMap.set(itemKey, {
      slug,
      size,
      color,
      quantity: Math.min((existingItem?.quantity || 0) + Math.floor(quantity), 99),
    })
  }

  return Array.from(itemMap.values())
}

const getRpcError = (message = '') => {
  if (message.includes('CHECKOUT_RATE_LIMITED')) {
    return createError({ statusCode: 429, statusMessage: 'Too many payment requests. Wait a few minutes and try again.' })
  }
  if (message.includes('INSUFFICIENT_STOCK:')) {
    const productName = message.split('INSUFFICIENT_STOCK:')[1]?.split(/[\n\r]/)[0]?.trim()
    return createError({ statusCode: 409, statusMessage: `${productName || 'An item'} does not have enough stock for this order.` })
  }
  if (message.includes('ITEM_UNAVAILABLE') || message.includes('INVALID_CART')) {
    return createError({ statusCode: 409, statusMessage: 'One or more cart items are no longer available.' })
  }
  if (message.includes('duplicate key') || message.includes('orders_idempotency_key_idx')) {
    return createError({ statusCode: 409, statusMessage: 'This payment request is already being prepared. Check again in a moment.' })
  }
  return createError({ statusCode: 500, statusMessage: 'Checkout could not be prepared. Please try again.' })
}

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds))

export default defineEventHandler(async (event) => {
  await enforceRequestRateLimit(event, 'checkout', { max: 10, windowMs: 10 * 60_000 })
  const body = (await readBody(event)) as CheckoutRequestBody
  const customer = body.customer || {}
  const items = normalizeItems(body.items)
  const email = cleanString(customer.email).toLowerCase()
  const fullName = cleanString(customer.name)
  const address = cleanString(customer.address)
  const deliveryMethod = cleanString(body.deliveryMethod)
  const idempotencyKey = cleanString(body.idempotencyKey)
  let phone = ''

  if (!validDeliveryMethods.has(deliveryMethod)) {
    throw createError({ statusCode: 400, statusMessage: 'Choose a delivery method.' })
  }
  if (!emailPattern.test(email) || email.length > 254) {
    throw createError({ statusCode: 400, statusMessage: 'Enter a valid email address.' })
  }
  if (!fullName || fullName.length > 120 || (deliveryMethod === 'nairobi-delivery' && (!address || address.length > 500))) {
    throw createError({ statusCode: 400, statusMessage: 'Customer contact and Nairobi delivery details are required.' })
  }
  if (!idempotencyPattern.test(idempotencyKey)) {
    throw createError({ statusCode: 400, statusMessage: 'The checkout session is invalid. Refresh and try again.' })
  }
  if (!items.length) {
    throw createError({ statusCode: 400, statusMessage: 'At least one cart item is required.' })
  }

  try {
    phone = normalizeKenyanPhone(cleanString(customer.phone))
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Enter a valid Kenyan M-Pesa phone number.' })
  }

  const sql = getDatabase()
  const slugs = [...new Set(items.map((item) => item.slug))]
  let variants: VariantRecord[]
  try {
    variants = await sql`
      select variants.id, variants.sku, variants.color, variants.size,
        variants.price_kes, variants.stock_quantity,
        products.id as product_id, products.name as product_name, products.slug as product_slug
      from public.product_variants as variants
      join public.products as products on products.id = variants.product_id
      where variants.is_active
        and products.is_active
        and products.slug in (
          select jsonb_array_elements_text(${JSON.stringify(slugs)}::jsonb)
        )
      order by variants.created_at asc
    ` as unknown as VariantRecord[]
  } catch (variantsError) {
    console.error('[ANAI] Could not load checkout variants:', variantsError)
    throw createError({ statusCode: 500, statusMessage: 'Checkout inventory is temporarily unavailable.' })
  }

  const variantsBySlug = new Map<string, VariantRecord[]>()
  for (const variant of variants) {
    const product = getVariantProduct(variant)
    if (product) variantsBySlug.set(product.slug, [...(variantsBySlug.get(product.slug) || []), variant])
  }

  const orderLines = items.map((item) => {
    const variantsForProduct = variantsBySlug.get(item.slug)
    const variant = variantsForProduct?.find((entry) =>
      cleanString(entry.size).toLowerCase() === item.size.toLowerCase()
      && (!item.color || cleanString(entry.color).toLowerCase() === item.color.toLowerCase()),
    )
    const product = variant ? getVariantProduct(variant) : undefined

    if (!variant || !product) {
      throw createError({
        statusCode: 409,
        statusMessage: `${item.slug} is no longer available in the selected colour and size.`,
      })
    }

    return {
      variantId: variant.id,
      quantity: item.quantity,
      size: item.size,
      color: item.color || variant.color || '',
    }
  })

  const requestIp = getRateLimitIdentity(event)
  const fingerprintHash = createHash('sha256')
    .update(requestIp)
    .digest('hex')
  const reference = createReference()

  let checkoutData: CheckoutRpcRow[]
  try {
    checkoutData = await sql`
      select * from public.create_checkout_order(
        ${reference}::text,
        ${idempotencyKey}::text,
        ${fingerprintHash}::text,
        ${email}::text,
        ${fullName}::text,
        ${phone}::text,
        ${address}::text,
        ${deliveryMethod}::text,
        ${JSON.stringify(orderLines)}::jsonb,
        ${JSON.stringify({ customer: { email, fullName, phone, address, deliveryMethod }, items })}::jsonb
      )
    ` as unknown as CheckoutRpcRow[]
  } catch (checkoutError) {
    console.error('[ANAI] Atomic checkout creation failed:', checkoutError)
    throw getRpcError((checkoutError as Error).message)
  }

  const order = checkoutData[0]
  if (!order) throw createError({ statusCode: 500, statusMessage: 'Checkout could not be prepared. Please try again.' })

  if (!order.created) {
    if (!order.checkout_request_id) {
      throw createError({ statusCode: 409, statusMessage: 'Your payment prompt is being prepared. Check again in a moment.' })
    }
    return {
      orderId: order.order_id,
      reference: order.order_number,
      amountKes: order.total_kes,
      currency: 'KES' as const,
      checkoutRequestId: order.checkout_request_id,
      customerMessage: 'An M-Pesa request is already pending. Do not submit another payment.',
    }
  }

  const initiation = await preparePayment({
    initiate: () => initiateMpesaStkPush({
      amountKes: order.total_kes,
      phoneNumber: phone,
      orderId: order.order_id,
      accountReference: `ANAI${order.order_number.replace(/[^A-Za-z0-9]/g, '').slice(-8)}`,
    }),
    persist: async (initiation) => {
      let initiationUpdateError: unknown
      for (let attempt = 0; attempt < 4; attempt += 1) {
        try {
          const updatedRows = await sql`
            select public.set_mpesa_checkout_request(
              ${order.order_id}::uuid,
              ${initiation.checkoutRequestId}::text,
              ${initiation.merchantRequestId}::text,
              ${JSON.stringify(initiation.raw)}::jsonb
            ) as updated
          ` as unknown as Array<{ updated: boolean }>
          initiationUpdateError = undefined
          if (updatedRows[0]?.updated) break
          initiationUpdateError = new Error('M-Pesa checkout request was not updated')
        } catch (error) {
          initiationUpdateError = error
        }
        await wait(200 * (attempt + 1))
      }

      if (initiationUpdateError) {
        console.error('[ANAI] M-Pesa started but its request ID could not be persisted:', initiationUpdateError)
        throw createError({ statusCode: 503, statusMessage: 'Payment started but confirmation is delayed. Do not retry yet; contact support.' })
      }

    },
    replay: (payment) => recordStoredMpesaCallback(payment.checkoutRequestId),
    fail: (reason) => sql`
      select public.fail_checkout_order(${order.order_id}::uuid, ${reason}::text)
    `,
  })

  return {
    orderId: order.order_id,
    reference: order.order_number,
    amountKes: order.total_kes,
    currency: 'KES' as const,
    checkoutRequestId: initiation.checkoutRequestId,
    customerMessage: initiation.customerMessage,
  }
})
