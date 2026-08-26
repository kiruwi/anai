export type ProductColour =
  | string
  | {
      name: string
      value: string
      imageUrl?: string
      stockQuantity?: number
    }

export type ProductSizeOption = {
  label: string
  available?: boolean
  coatLengthCm?: number
  shoulderCm?: number
  sleeveLengthCm?: number
  bustCm?: number
  bottomCm?: number
}

export type CatalogProduct = {
  name: string
  slug: string
  urlSlug?: string
  priceKes: number
  stockQuantity: number
  category: string
  colours: ProductColour[]
  isNew?: boolean
  imageUrl?: string
  hoverImageUrl?: string
  imageTone: string
  galleryImages?: string[]
  description?: string
  sizeGuideText?: string
  sizeOptions?: ProductSizeOption[]
}

export type CatalogResponse = {
  products: CatalogProduct[]
  source: 'database' | 'fallback'
  updatedAt: string
}
