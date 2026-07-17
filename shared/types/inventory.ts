export type InventoryProduct = {
  total: number
  colours: Record<string, number>
}

export type InventoryResponse = {
  updatedAt: string
  products: Record<string, InventoryProduct>
}
