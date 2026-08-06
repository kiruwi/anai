import { createError, setResponseHeader } from 'h3'
import { products } from '../../app/data/homeContent'
import { canonicalSiteUrl } from '#shared/lib/catalogNavigation'
import { getSupabaseAdmin } from '../utils/supabaseAdmin'
import {
  buildGoogleMerchantFeed,
  createGoogleMerchantItem,
  type MerchantVariant,
} from '../utils/googleMerchantFeed'

type ProductRecord = { slug: string }
type VariantRecord = MerchantVariant & {
  products: ProductRecord | ProductRecord[]
}

const getProductRecord = (variant: VariantRecord) =>
  Array.isArray(variant.products) ? variant.products[0] : variant.products

export default defineEventHandler(async (event) => {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('product_variants')
    .select('id, sku, color, size, price_kes, stock_quantity, products!inner(slug)')
    .eq('is_active', true)
    .eq('products.is_active', true)
    .order('sku', { ascending: true })

  if (error) {
    console.error('[ANAI] Google Merchant feed lookup failed:', error)
    throw createError({
      statusCode: 503,
      statusMessage: 'The product feed is temporarily unavailable.',
    })
  }

  const catalogBySlug = new Map(products.map((product) => [product.slug, product]))
  const items = ((data || []) as VariantRecord[])
    .map((variant) => {
      const productRecord = getProductRecord(variant)
      const product = productRecord ? catalogBySlug.get(productRecord.slug) : undefined

      return product
        ? createGoogleMerchantItem({ product, variant, siteUrl: canonicalSiteUrl })
        : null
    })
    .filter((item) => item !== null)

  setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setResponseHeader(event, 'cache-control', 'public, max-age=300, s-maxage=300')

  return buildGoogleMerchantFeed({ items, siteUrl: canonicalSiteUrl })
})
