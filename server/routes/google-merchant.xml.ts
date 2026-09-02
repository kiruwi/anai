import { createError, setResponseHeader } from 'h3'
import { canonicalSiteUrl } from '#shared/lib/catalogNavigation'
import { getDatabase } from '../utils/db'
import { getCatalogProducts } from '../utils/catalog'
import {
  buildGoogleMerchantFeed,
  createGoogleMerchantItem,
  type MerchantVariant,
} from '../utils/googleMerchantFeed'

type VariantRecord = MerchantVariant & { product_slug: string }

export default defineEventHandler(async (event) => {
  const { products } = await getCatalogProducts()
  const sql = getDatabase()
  let variants: VariantRecord[]
  try {
    variants = await sql`
      select variants.id, variants.sku, variants.color, variants.size,
        variants.price_kes, variants.stock_quantity, products.slug as product_slug
      from public.product_variants as variants
      join public.products as products on products.id = variants.product_id
      where variants.is_active and products.is_active
      order by variants.sku asc
    ` as unknown as VariantRecord[]
  } catch (error) {
    console.error('[ANAI] Google Merchant feed lookup failed:', error)
    throw createError({
      statusCode: 503,
      statusMessage: 'The product feed is temporarily unavailable.',
    })
  }

  const catalogBySlug = new Map(products.map((product) => [product.slug, product]))
  const items = variants
    .map((variant) => {
      const product = catalogBySlug.get(variant.product_slug)

      return product
        ? createGoogleMerchantItem({ product, variant, siteUrl: canonicalSiteUrl })
        : null
    })
    .filter((item) => item !== null)

  setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setResponseHeader(event, 'cache-control', 'public, max-age=300, s-maxage=300')

  return buildGoogleMerchantFeed({ items, siteUrl: canonicalSiteUrl })
})
