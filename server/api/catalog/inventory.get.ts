import { createError, setResponseHeader } from 'h3'
import type { InventoryResponse } from '../../../shared/types/inventory'
import { getDatabase } from '../../utils/db'

type VariantRecord = {
  slug: string
  color: string | null
  stock_quantity: number
}

export default defineEventHandler(async (event): Promise<InventoryResponse> => {
  const sql = getDatabase()
  let variants: VariantRecord[]
  try {
    variants = await sql`
      select products.slug, variants.color, variants.stock_quantity
      from public.product_variants as variants
      join public.products as products on products.id = variants.product_id
      where variants.is_active and products.is_active
    ` as unknown as VariantRecord[]
  } catch (error) {
    console.error('[ANAI] Live inventory lookup failed:', error)
    throw createError({ statusCode: 503, statusMessage: 'Live inventory is temporarily unavailable.' })
  }

  const products: InventoryResponse['products'] = {}

  for (const variant of variants) {
    const stock = Math.max(0, Number(variant.stock_quantity) || 0)
    const colourKey = (variant.color || '').trim().toLowerCase()
    const inventoryProduct = products[variant.slug] || { total: 0, colours: {} }
    inventoryProduct.total += stock
    inventoryProduct.colours[colourKey] = (inventoryProduct.colours[colourKey] || 0) + stock
    products[variant.slug] = inventoryProduct
  }

  setResponseHeader(event, 'cache-control', 'no-store, max-age=0')
  return { updatedAt: new Date().toISOString(), products }
})
