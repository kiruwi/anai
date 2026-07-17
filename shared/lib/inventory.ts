import type { InventoryResponse } from '../types/inventory'

type ResolveInventoryStockOptions = {
  inventory: InventoryResponse | null
  productSlug: string
  colour?: string
  fallbackStock: number
}

export const resolveInventoryStock = ({
  inventory,
  productSlug,
  colour,
  fallbackStock,
}: ResolveInventoryStockOptions) => {
  if (!inventory) return Math.max(0, fallbackStock)

  const liveProduct = inventory.products[productSlug]
  if (!liveProduct) return 0
  if (!colour) return Math.max(0, liveProduct.total)

  return Math.max(0, liveProduct.colours[colour.trim().toLowerCase()] ?? 0)
}
