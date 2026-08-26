import { setResponseHeader } from 'h3'
import type { CatalogResponse } from '../../../shared/types/catalog'
import { getCatalogProducts } from '../../utils/catalog'

export default defineEventHandler(async (event): Promise<CatalogResponse> => {
  const catalogue = await getCatalogProducts()

  setResponseHeader(event, 'cache-control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300')
  setResponseHeader(event, 'x-anai-catalog-source', catalogue.source)

  return catalogue
})
