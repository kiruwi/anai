import {
  fallbackProducts,
  getProductUrlSlug,
  type HomepageProduct,
  type ProductColour,
  type ProductSizeOption,
} from '../../app/data/homeContent.ts'
import type { CatalogResponse } from '../../shared/types/catalog'
import { getSupabaseAdmin } from './supabaseAdmin.ts'

type CategoryRecord = { name: string }
type VariantRecord = {
  id: string
  sku: string | null
  color: string | null
  color_value: string | null
  size: string | null
  price_kes: number
  stock_quantity: number
  is_active: boolean
}
type ImageRecord = {
  id: string
  variant_id: string | null
  image_url: string
  sort_order: number
}
export type CatalogProductRecord = {
  id: string
  name: string
  slug: string
  public_slug: string | null
  description: string | null
  image_url: string | null
  hover_image_url: string | null
  image_tone: string | null
  size_guide_text: string | null
  size_options: unknown
  image_revision: string | null
  is_new: boolean
  display_order: number
  updated_at: string
  category: CategoryRecord | CategoryRecord[] | null
  variants: VariantRecord[] | null
  images: ImageRecord[] | null
}

type CatalogResult = Pick<CatalogResponse, 'products' | 'source' | 'updatedAt'>
type CatalogCacheEntry = CatalogResult & { expiresAt: number }

const catalogueCacheTtlMs = 60_000
let catalogueCache: CatalogCacheEntry | undefined

const getRelatedRecord = <T>(record: T | T[] | null | undefined) =>
  Array.isArray(record) ? record[0] : record

const getVersionedImageUrl = (imageUrl: string | null | undefined, revision: string | null) => {
  if (!imageUrl) return undefined
  if (!revision || !imageUrl.startsWith('/images/products/')) return imageUrl

  return `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}v=${encodeURIComponent(revision)}`
}

const toFiniteNumber = (value: unknown) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : undefined
}

const mapSizeOptions = (value: unknown, variants: VariantRecord[]): ProductSizeOption[] | undefined => {
  if (!Array.isArray(value)) return undefined

  const options = value
    .map((item): ProductSizeOption | undefined => {
      if (!item || typeof item !== 'object') return undefined
      const record = item as Record<string, unknown>
      const label = typeof record.label === 'string' ? record.label.trim() : ''
      if (!label) return undefined

      return {
        label,
        available: variants.some(
          (variant) => variant.size === label && Math.max(0, Number(variant.stock_quantity) || 0) > 0,
        ),
        coatLengthCm: toFiniteNumber(record.coatLengthCm),
        shoulderCm: toFiniteNumber(record.shoulderCm),
        sleeveLengthCm: toFiniteNumber(record.sleeveLengthCm),
        bustCm: toFiniteNumber(record.bustCm),
        bottomCm: toFiniteNumber(record.bottomCm),
      }
    })
    .filter((option): option is ProductSizeOption => Boolean(option))

  return options.length ? options : undefined
}

export const mapCatalogProductRecord = (record: CatalogProductRecord): HomepageProduct | undefined => {
  const category = getRelatedRecord(record.category)
  const publicSlug = record.public_slug?.trim()
  const variants = (record.variants || [])
    .filter((variant) => variant.is_active)
    .sort((left, right) => (left.sku || '').localeCompare(right.sku || ''))
  const images = (record.images || [])
    .filter((image) => Boolean(image.image_url))
    .sort((left, right) => left.sort_order - right.sort_order || left.id.localeCompare(right.id))

  if (!record.name || !record.slug || !publicSlug || !category?.name || !variants.length) {
    return undefined
  }

  const coloursByName = new Map<string, Exclude<ProductColour, string>>()
  for (const variant of variants) {
    const name = variant.color?.trim()
    if (!name) continue

    const key = name.toLocaleLowerCase()
    const existing = coloursByName.get(key)
    const stockQuantity = Math.max(0, Number(variant.stock_quantity) || 0)
    const variantImage = images.find((image) => image.variant_id === variant.id)
    coloursByName.set(key, {
      name: existing?.name ?? name,
      value: existing?.value ?? variant.color_value ?? '#111111',
      imageUrl: existing?.imageUrl ?? getVersionedImageUrl(variantImage?.image_url, record.image_revision),
      stockQuantity: (existing?.stockQuantity ?? 0) + stockQuantity,
    })
  }

  const prices = variants
    .map((variant) => Number(variant.price_kes))
    .filter((price) => Number.isFinite(price) && price >= 0)
  if (!prices.length || !coloursByName.size) return undefined

  const colours = [...coloursByName.values()]
  const stockQuantity = colours.reduce((total, colour) => total + (colour.stockQuantity ?? 0), 0)
  const galleryImages = images
    .map((image) => getVersionedImageUrl(image.image_url, record.image_revision))
    .filter((imageUrl): imageUrl is string => Boolean(imageUrl))

  return {
    name: record.name,
    slug: record.slug,
    ...(publicSlug === record.slug ? {} : { urlSlug: publicSlug }),
    priceKes: Math.min(...prices),
    stockQuantity,
    category: category.name,
    colours,
    isNew: record.is_new,
    imageUrl: getVersionedImageUrl(record.image_url, record.image_revision),
    hoverImageUrl: getVersionedImageUrl(record.hover_image_url, record.image_revision),
    imageTone: record.image_tone || 'linear-gradient(135deg, #111111, #d7d4c9)',
    galleryImages: galleryImages.length ? galleryImages : undefined,
    description: record.description || undefined,
    sizeGuideText: record.size_guide_text || undefined,
    sizeOptions: mapSizeOptions(record.size_options, variants),
  }
}

export const mapCatalogProductRecords = (records: CatalogProductRecord[]) => {
  const products = records
    .sort((left, right) => left.display_order - right.display_order || left.id.localeCompare(right.id))
    .map(mapCatalogProductRecord)
    .filter((product): product is HomepageProduct => Boolean(product))

  if (!products.length || products.length !== records.length) {
    throw new Error('The database catalogue contains an incomplete active product record.')
  }

  const productsByInternalSlug = new Map(products.map((product) => [product.slug, product]))
  for (const fallbackProduct of fallbackProducts) {
    const databaseProduct = productsByInternalSlug.get(fallbackProduct.slug)
    if (!databaseProduct || getProductUrlSlug(databaseProduct) !== getProductUrlSlug(fallbackProduct)) {
      throw new Error(`The database catalogue changed the protected public URL for ${fallbackProduct.slug}.`)
    }
  }

  return products
}

const getFallbackResult = (): CatalogResult => ({
  products: fallbackProducts,
  source: 'fallback',
  updatedAt: new Date().toISOString(),
})

const getCachedResult = (): CatalogResult | undefined => catalogueCache
  ? {
      products: catalogueCache.products,
      source: catalogueCache.source,
      updatedAt: catalogueCache.updatedAt,
    }
  : undefined

export const getCatalogProducts = async (): Promise<CatalogResult> => {
  const now = Date.now()
  if (catalogueCache && catalogueCache.expiresAt > now) {
    return getCachedResult() as CatalogResult
  }

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        public_slug,
        description,
        image_url,
        hover_image_url,
        image_tone,
        size_guide_text,
        size_options,
        image_revision,
        is_new,
        display_order,
        updated_at,
        category:categories(name),
        variants:product_variants!inner(
          id,
          sku,
          color,
          color_value,
          size,
          price_kes,
          stock_quantity,
          is_active
        ),
        images:product_images(id, variant_id, image_url, sort_order)
      `)
      .eq('is_active', true)
      .not('public_slug', 'is', null)
      .eq('variants.is_active', true)
      .order('display_order', { ascending: true })

    if (error) throw error

    const records = (data || []) as unknown as CatalogProductRecord[]
    const products = mapCatalogProductRecords(records)
    const updatedAt = records.reduce(
      (latest, record) => record.updated_at > latest ? record.updated_at : latest,
      records[0]?.updated_at || new Date().toISOString(),
    )
    catalogueCache = {
      products,
      source: 'database',
      updatedAt,
      expiresAt: now + catalogueCacheTtlMs,
    }
    return getCachedResult() as CatalogResult
  } catch (catalogueError) {
    console.error('[ANAI] Database catalogue lookup or validation failed; using the SEO-safe fallback:', catalogueError)
    return getCachedResult() ?? getFallbackResult()
  }
}
