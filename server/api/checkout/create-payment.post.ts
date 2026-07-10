import { createError, readBody } from 'h3'
import { randomBytes } from 'node:crypto'
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
  items?: CheckoutItemInput[]
}

type VariantRecord = {
  id: string
  sku: string | null
  color: string | null
  size: string | null
  price_kes: number
  stock_quantity: number
  products:
    | {
        id: string
        name: string
        slug: string
      }
    | {
        id: string
        name: string
        slug: string
      }[]
}

type ProductRecord = {
  id: string
  name: string
  slug: string
}

const cleanString = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

const createReference = () => `ANAI-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`

const validSizeLabels = new Set(['XS/6', 'S/8', 'M/10', 'L/12', 'XL/14'])
const inStockSizeLabels = new Set(['M/10'])

const getVariantProduct = (variant: VariantRecord): ProductRecord | undefined =>
  Array.isArray(variant.products) ? variant.products[0] : variant.products

const normalizeItems = (items: CheckoutItemInput[] | undefined) => {
  if (!Array.isArray(items)) {
    return []
  }

  const itemMap = new Map<string, {
    slug: string
    quantity: number
    size: string
    color: string
  }>()

  for (const item of items) {
    const slug = cleanString(item.slug)
    const quantity = Number(item.quantity)
    const size = cleanString(item.size)
    const color = cleanString(item.color || item.colour)

    if (!slug || !Number.isFinite(quantity) || quantity < 1) {
      continue
    }

    if (!validSizeLabels.has(size)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Choose a valid size for ${slug}.`,
      })
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

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as CheckoutRequestBody
  const customer = body.customer || {}
  const items = normalizeItems(body.items)
  const email = cleanString(customer.email).toLowerCase()
  const fullName = cleanString(customer.name)
  const phone = cleanString(customer.phone)
  const address = cleanString(customer.address)

  if (!email || !fullName || !phone || !address) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Customer contact and delivery details are required.',
    })
  }

  if (!items.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'At least one cart item is required.',
    })
  }

  const supabase = getSupabaseAdmin()
  const slugs = items.map((item) => item.slug)

  const { data: variants, error: variantsError } = await supabase
    .from('product_variants')
    .select('id, sku, color, size, price_kes, stock_quantity, products!inner(id, name, slug)')
    .eq('is_active', true)
    .eq('products.is_active', true)
    .in('products.slug', slugs)
    .order('created_at', { ascending: true })

  if (variantsError) {
    throw createError({
      statusCode: 500,
      statusMessage: variantsError.message,
    })
  }

  const variantsBySlug = new Map<string, VariantRecord[]>()

  for (const variant of (variants || []) as VariantRecord[]) {
    const product = getVariantProduct(variant)

    if (product) {
      variantsBySlug.set(product.slug, [...(variantsBySlug.get(product.slug) || []), variant])
    }
  }

  const missingSlugs = slugs.filter((slug) => !variantsBySlug.has(slug))

  if (missingSlugs.length) {
    throw createError({
      statusCode: 400,
      statusMessage: `Some cart items are unavailable: ${missingSlugs.join(', ')}.`,
    })
  }

  const orderLines = items.map((item) => {
    const variantsForProduct = variantsBySlug.get(item.slug)

    if (!variantsForProduct?.length) {
      throw createError({
        statusCode: 400,
        statusMessage: `Cart item is unavailable: ${item.slug}.`,
      })
    }

    const fallbackVariant = variantsForProduct[0]

    if (!fallbackVariant) {
      throw createError({
        statusCode: 400,
        statusMessage: `Cart item is unavailable: ${item.slug}.`,
      })
    }

    const variant = item.color
      ? variantsForProduct.find(
          (variantItem) =>
            cleanString(variantItem.color).toLowerCase() === item.color.toLowerCase(),
        )
      : fallbackVariant
    const product = variant ? getVariantProduct(variant) : getVariantProduct(fallbackVariant)

    if (!variant || !product) {
      throw createError({
        statusCode: 400,
        statusMessage: item.color
          ? `${product?.name || item.slug} is not available in ${item.color}.`
          : `Cart item is unavailable: ${item.slug}.`,
      })
    }

    if (variant.stock_quantity < item.quantity) {
      throw createError({
        statusCode: 409,
        statusMessage: `${product.name} does not have enough stock for this order.`,
      })
    }

    return {
      variant,
      product,
      quantity: item.quantity,
      size: item.size,
      color: item.color || variant.color || '',
      lineTotalKes: variant.price_kes * item.quantity,
    }
  })

  const subtotalKes = orderLines.reduce((total, line) => total + line.lineTotalKes, 0)
  const reference = createReference()

  const { data: customerRecord, error: customerError } = await supabase
    .from('customers')
    .upsert(
      {
        email,
        full_name: fullName,
        phone,
      },
      {
        onConflict: 'email',
      },
    )
    .select('id')
    .single()

  if (customerError) {
    throw createError({
      statusCode: 500,
      statusMessage: customerError.message,
    })
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: reference,
      customer_id: customerRecord.id,
      status: 'pending',
      payment_status: 'pending',
      subtotal_kes: subtotalKes,
      delivery_fee_kes: 0,
      total_kes: subtotalKes,
      delivery_address: address,
      customer_phone: phone,
      customer_email: email,
    })
    .select('id, order_number, total_kes')
    .single()

  if (orderError) {
    throw createError({
      statusCode: 500,
      statusMessage: orderError.message,
    })
  }

  const { error: orderItemsError } = await supabase.from('order_items').insert(
    orderLines.map((line) => ({
      order_id: order.id,
      variant_id: line.variant.id,
      product_name: line.product.name,
      sku: line.variant.sku,
      color: line.color,
      size: line.size,
      unit_price_kes: line.variant.price_kes,
      quantity: line.quantity,
      line_total_kes: line.lineTotalKes,
    })),
  )

  if (orderItemsError) {
    throw createError({
      statusCode: 500,
      statusMessage: orderItemsError.message,
    })
  }

  const { error: paymentError } = await supabase.from('payments').insert({
    order_id: order.id,
    provider: 'paystack',
    provider_reference: reference,
    amount_kes: order.total_kes,
    status: 'pending',
    raw_payload: {
      checkout: {
        customer: {
          email,
          fullName,
          phone,
          address,
        },
        items,
      },
    },
  })

  if (paymentError) {
    throw createError({
      statusCode: 500,
      statusMessage: paymentError.message,
    })
  }

  return {
    orderId: order.id,
    reference: order.order_number,
    amountKes: order.total_kes,
    currency: 'KES',
  }
})
