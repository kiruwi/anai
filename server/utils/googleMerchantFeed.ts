import {
  getProductImageUrlForColour,
  getProductUrlSlug,
  type HomepageProduct,
} from '../../app/data/homeContent'

export type MerchantVariant = {
  id: string
  sku: string | null
  color: string | null
  size: string | null
  price_kes: number
  stock_quantity: number
}

export type GoogleMerchantItem = {
  id: string
  itemGroupId: string
  title: string
  description: string
  link: string
  imageLink: string
  availability: 'in_stock' | 'out_of_stock'
  price: string
  brand: string
  mpn?: string
  condition: 'new'
  productType: string
  color?: string
  size?: string
  gender: 'female'
  ageGroup: 'adult'
}

const normalizeSiteUrl = (siteUrl: string) => siteUrl.replace(/\/+$/, '')

const absoluteUrl = (siteUrl: string, path: string) =>
  new URL(path, `${normalizeSiteUrl(siteUrl)}/`).toString()

const normalizeSize = (size: string | null) => {
  const value = size?.trim()
  if (!value) return undefined

  return /^one[ _-]?size$/i.test(value) ? 'one_size' : value
}

export const createGoogleMerchantItem = ({
  product,
  variant,
  siteUrl,
}: {
  product: HomepageProduct
  variant: MerchantVariant
  siteUrl: string
}): GoogleMerchantItem | null => {
  const color = variant.color?.trim() || undefined
  const imagePath = getProductImageUrlForColour(product, color)

  if (!imagePath || !Number.isFinite(variant.price_kes) || variant.price_kes < 0) {
    return null
  }

  const productUrl = new URL(
    `/product/${encodeURIComponent(getProductUrlSlug(product))}`,
    `${normalizeSiteUrl(siteUrl)}/`,
  )
  if (color) productUrl.searchParams.set('colour', color)

  return {
    id: variant.sku?.trim() || variant.id,
    itemGroupId: `ANAI-${product.slug}`,
    title: color ? `${product.name} - ${color}` : product.name,
    description: product.description || `${product.name} by ANAI.`,
    link: productUrl.toString(),
    imageLink: absoluteUrl(siteUrl, imagePath),
    availability: variant.stock_quantity > 0 ? 'in_stock' : 'out_of_stock',
    price: `${variant.price_kes.toFixed(2)} KES`,
    brand: 'ANAI',
    mpn: variant.sku?.trim() || undefined,
    condition: 'new',
    productType: `Apparel & Accessories > Clothing > ${product.category}`,
    color,
    size: normalizeSize(variant.size),
    gender: 'female',
    ageGroup: 'adult',
  }
}

export const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')

const xmlElement = (name: string, value: string | undefined, indent = '      ') =>
  value ? `${indent}<${name}>${escapeXml(value)}</${name}>` : undefined

export const buildGoogleMerchantFeed = ({
  items,
  siteUrl,
}: {
  items: GoogleMerchantItem[]
  siteUrl: string
}) => {
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl)

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    '  <channel>',
    xmlElement('title', 'ANAI product catalogue', '    '),
    xmlElement('link', normalizedSiteUrl, '    '),
    xmlElement('description', 'ANAI activewear and athleisure products available in Kenya.', '    '),
    ...items.flatMap((item) => [
      '    <item>',
      xmlElement('g:id', item.id),
      xmlElement('g:item_group_id', item.itemGroupId),
      xmlElement('g:title', item.title),
      xmlElement('g:description', item.description),
      xmlElement('g:link', item.link),
      xmlElement('g:image_link', item.imageLink),
      xmlElement('g:availability', item.availability),
      xmlElement('g:price', item.price),
      xmlElement('g:brand', item.brand),
      xmlElement('g:mpn', item.mpn),
      xmlElement('g:condition', item.condition),
      xmlElement('g:google_product_category', '1604'),
      xmlElement('g:product_type', item.productType),
      xmlElement('g:color', item.color),
      xmlElement('g:size', item.size),
      xmlElement('g:gender', item.gender),
      xmlElement('g:age_group', item.ageGroup),
      '    </item>',
    ].filter((line): line is string => Boolean(line))),
    '  </channel>',
    '</rss>',
  ].filter((line): line is string => Boolean(line)).join('\n')
}
