import { fallbackProducts } from '../data/homeContent'
import type { CatalogProduct } from '../../shared/types/catalog'

export const useCatalogProducts = () =>
  useState<CatalogProduct[]>('anai-catalog-products', () => fallbackProducts)
