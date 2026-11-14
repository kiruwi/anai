import type { CatalogProduct } from '#shared/types/catalog'
import { ecommerceValue, ecommerceVariant, type EcommerceItem, type EcommercePurchase } from '#shared/lib/ecommerceAnalytics'

type ShoppingEvent = 'view_item' | 'add_to_cart' | 'begin_checkout' | 'purchase'

export const toEcommerceItem = (
  product: CatalogProduct,
  quantity: number,
  colour?: string,
  size?: string,
): EcommerceItem => ({
  item_id: product.slug,
  item_name: product.name,
  item_variant: ecommerceVariant(colour, size),
  price: product.priceKes,
  quantity,
})

export const useEcommerceAnalytics = () => {
  const analyticsReady = useState('anai-analytics-ready', () => false)
  const sentPurchases = useState<string[]>('anai-analytics-purchases', () => [])
  const config = useRuntimeConfig()

  const trackShoppingEvent = (
    event: ShoppingEvent,
    items: EcommerceItem[],
    order?: Pick<EcommercePurchase, 'transaction_id' | 'shipping'>,
  ) => {
    if (!import.meta.client || !analyticsReady.value || !items.length) return false
    const { gtag } = window as Window & { gtag?: (...args: unknown[]) => void }
    if (typeof gtag !== 'function') return false

    try {
      gtag('event', event, {
        send_to: config.public.googleTagId.trim(),
        currency: 'KES',
        value: ecommerceValue(items),
        items,
        ...order,
      })
      return true
    } catch {
      return false
    }
  }

  const trackPurchase = ({ items, ...order }: EcommercePurchase) => {
    if (!import.meta.client || !analyticsReady.value) return
    const reference = order.transaction_id
    if (sentPurchases.value.includes(reference)) return
    const storageKey = `anai-analytics-purchase:${reference}`
    try {
      if (localStorage.getItem(storageKey)) return
    } catch {
      // GA4 also deduplicates web purchases by transaction ID.
    }
    if (!trackShoppingEvent('purchase', items, order)) return
    sentPurchases.value.push(reference)
    try {
      localStorage.setItem(storageKey, '1')
    } catch {
      // Tracking must never interrupt a confirmed checkout.
    }
  }

  return { analyticsReady, trackShoppingEvent, trackPurchase }
}
