import { createHash, randomBytes } from 'node:crypto'
import { createError, getRequestIP, readBody } from 'h3'
import { initiateMpesaStkPush, normalizeKenyanPhone } from '../../utils/mpesa'
import { recordStoredMpesaCallback } from '../../utils/recordMpesaPayment'
import { getSupabaseAdmin } from '../../utils/supabaseAdmin'

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
  products: ProductRecord | ProductRecord[]
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
const validSizeLabels = new Set(['XS/6', 'S/8', 'M/10', 'L/12', 'XL/14'])
const inStockSizeLabels = new Set(['M/10'])
const validDeliveryMethods = new Set(['nairobi-delivery', 'town-pickup'])
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const idempotencyPattern = /^[A-Za-z0-9_-]{16,100}$/

const getVariantProduct = (variant: VariantRecord): ProductRecord | undefined =>
  Array.isArray(variant.products) ? variant.products[0] : variant.products

const normalizeItems = (items: CheckoutItemInput[] | undefined) => {
  if (!Array.isArray(items)) return []

  const itemMap = new Map<string, { slug: string; quantity: number; size: string; color: string }>()

  for (const item of items.slice(0, 40)) {
    const slug = cleanString(item.slug)
    const quantity = Number(item.quantity)
    const size = cleanString(item.size)
    const color = cleanString(item.color || item.colour)

    if (!slug || slug.length > 120 || !Number.isFinite(quantity) || quantity < 1) continue
    if (!validSizeLabels.has(size)) {
      throw createError({ statusCode: 400, statusMessage: `Choose a valid size for ${slug}.` })
    }
    if (!inStockSizeLabels.has(size)) {
      throw createError({
        statusCode: 409,
        statusMessage: `${size} is not in stock. More sizes will be restocked in a few months.`,
      })
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

  const supabase = getSupabaseAdmin()
  const slugs = [...new Set(items.map((item) => item.slug))]
  const { data: variants, error: variantsError } = await supabase
    .from('product_variants')
    .select('id, sku, color, size, price_kes, stock_quantity, products!inner(id, name, slug)')
    .eq('is_active', true)
    .eq('products.is_active', true)
    .in('products.slug', slugs)
    .order('created_at', { ascending: true })

  if (variantsError) {
    console.error('[ANAI] Could not load checkout variants:', variantsError)
    throw createError({ statusCode: 500, statusMessage: 'Checkout inventory is temporarily unavailable.' })
  }

  const variantsBySlug = new Map<string, VariantRecord[]>()
  for (const variant of (variants || []) as VariantRecord[]) {
    const product = getVariantProduct(variant)
    if (product) variantsBySlug.set(product.slug, [...(variantsBySlug.get(product.slug) || []), variant])
  }

  const orderLines = items.map((item) => {
    const variantsForProduct = variantsBySlug.get(item.slug)
    const variant = item.color
      ? variantsForProduct?.find((entry) => cleanString(entry.color).toLowerCase() === item.color.toLowerCase())
      : variantsForProduct?.[0]
    const product = variant ? getVariantProduct(variant) : undefined

    if (!variant || !product) {
      throw createError({ statusCode: 409, statusMessage: `${item.slug} is no longer available in the selected colour.` })
    }

    return {
      variantId: variant.id,
      quantity: item.quantity,
      size: item.size,
      color: item.color || variant.color || '',
    }
  })

  const requestIp = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const fingerprintHash = createHash('sha256')
    .update(`${requestIp}|${event.node.req.headers['user-agent'] || 'unknown'}`)
    .digest('hex')
  const reference = createReference()

  const { data: checkoutData, error: checkoutError } = await supabase.rpc('create_checkout_order', {
    p_order_number: reference,
    p_idempotency_key: idempotencyKey,
    p_fingerprint_hash: fingerprintHash,
    p_email: email,
    p_full_name: fullName,
    p_phone: phone,
    p_address: address,
    p_delivery_method: deliveryMethod,
    p_lines: orderLines,
    p_checkout_payload: { customer: { email, fullName, phone, address, deliveryMethod }, items },
  })

  if (checkoutError) {
    console.error('[ANAI] Atomic checkout creation failed:', checkoutError)
    throw getRpcError(checkoutError.message)
  }

  const order = (Array.isArray(checkoutData) ? checkoutData[0] : checkoutData) as CheckoutRpcRow | undefined
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

  try {
    const initiation = await initiateMpesaStkPush({
      amountKes: order.total_kes,
      phoneNumber: phone,
      accountReference: `ANAI${order.order_number.replace(/[^A-Za-z0-9]/g, '').slice(-8)}`,
    })

    let initiationUpdateError: unknown
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const { data: updated, error } = await supabase.rpc('set_mpesa_checkout_request', {
        p_order_id: order.order_id,
        p_checkout_request_id: initiation.checkoutRequestId,
        p_merchant_request_id: initiation.merchantRequestId,
        p_initiation_payload: initiation.raw,
      })
      initiationUpdateError = error
      if (!error && updated) {
        initiationUpdateError = undefined
        break
      }
      await wait(200 * (attempt + 1))
    }

    if (initiationUpdateError) {
      console.error('[ANAI] M-Pesa started but its request ID could not be persisted:', initiationUpdateError)
      throw createError({ statusCode: 503, statusMessage: 'Payment started but confirmation is delayed. Do not retry yet; contact support.' })
    }

    await recordStoredMpesaCallback(initiation.checkoutRequestId)

    return {
      orderId: order.order_id,
      reference: order.order_number,
      amountKes: order.total_kes,
      currency: 'KES' as const,
      checkoutRequestId: initiation.checkoutRequestId,
      customerMessage: initiation.customerMessage,
    }
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode
    if (statusCode !== 503) {
      const { error: failError } = await supabase.rpc('fail_checkout_order', {
        p_order_id: order.order_id,
        p_reason: (error as Error)?.message || 'M-Pesa initiation failed',
      })
      if (failError) console.error('[ANAI] Could not release a failed checkout reservation:', failError)
    }
    throw error
  }
})
