import { getProductColourStockLimit, type HomepageProduct } from '../data/homeContent'
import type { InventoryResponse } from '../../shared/types/inventory'
import { resolveInventoryStock } from '#shared/lib/inventory'

export const useInventory = () => {
  const inventory = useState<InventoryResponse | null>('anai-live-inventory', () => null)

  const getProductStock = (product: HomepageProduct, colour?: string) => {
    return resolveInventoryStock({
      inventory: inventory.value,
      productSlug: product.slug,
      colour,
      fallbackStock: getProductColourStockLimit(product, colour),
    })
  }

  const getStockLabel = (stock: number) => {
    if (stock < 1) return 'Out of stock'
    return `${stock} ${stock === 1 ? 'piece' : 'pieces'} left`
  }

  return { inventory, getProductStock, getStockLabel }
}
