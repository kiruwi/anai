import { createError, setResponseHeader } from 'h3'
import type { InventoryResponse } from '../../../shared/types/inventory'
import { getSupabaseAdmin } from '../../utils/supabaseAdmin'

type ProductRecord = { slug: string }
type VariantRecord = {
  color: string | null
  stock_quantity: number
  products: ProductRecord | ProductRecord[]
}

const getProduct = (variant: VariantRecord) =>
  Array.isArray(variant.products) ? variant.products[0] : variant.products

export default defineEventHandler(async (event): Promise<InventoryResponse> => {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('product_variants')
    .select('color, stock_quantity, products!inner(slug)')
    .eq('is_active', true)
    .eq('products.is_active', true)

  if (error) {
    console.error('[ANAI] Live inventory lookup failed:', error)
    throw createError({ statusCode: 503, statusMessage: 'Live inventory is temporarily unavailable.' })
  }

  const products: InventoryResponse['products'] = {}

  for (const variant of (data || []) as VariantRecord[]) {
    const product = getProduct(variant)
    if (!product) continue

    const stock = Math.max(0, Number(variant.stock_quantity) || 0)
    const colourKey = (variant.color || '').trim().toLowerCase()
    const inventoryProduct = products[product.slug] || { total: 0, colours: {} }
    inventoryProduct.total += stock
    inventoryProduct.colours[colourKey] = (inventoryProduct.colours[colourKey] || 0) + stock
    products[product.slug] = inventoryProduct
  }

  setResponseHeader(event, 'cache-control', 'no-store, max-age=0')
  return { updatedAt: new Date().toISOString(), products }
})
