export type EcommerceItem = {
  item_id: string
  item_name: string
  item_variant?: string
  price: number
  quantity: number
}

export type EcommercePurchase = {
  transaction_id: string
  shipping: number
  items: EcommerceItem[]
}

export const ecommerceVariant = (colour?: string | null, size?: string | null) =>
  [colour, size].filter(Boolean).join(' / ') || undefined

export const ecommerceValue = (items: EcommerceItem[]) =>
  items.reduce((total, item) => total + item.price * item.quantity, 0)
