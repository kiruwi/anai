export type ProductColour =
  | string
  | {
      name: string
      value: string
      imageUrl?: string
    }

export type HomepageProduct = {
  name: string
  slug: string
  priceKes: number
  category: string
  colours: ProductColour[]
  isNew?: boolean
  imageUrl: string
  hoverImageUrl?: string
  imageTone: string
  galleryImages?: string[]
  sizeGuideText?: string
  sizeOptions?: ProductSizeOption[]
}

export type ProductSizeOption = {
  label: string
  coatLengthCm?: number
  shoulderCm?: number
  sleeveLengthCm?: number
  bustCm?: number
  bottomCm?: number
}

export type ImageTile = {
  title: string
  href: string
  imageUrl: string
  imageTone: string
  comingSoon?: boolean
}

export const commonSizeOptions: ProductSizeOption[] = [
  { label: 'XS/6' },
  { label: 'S/8', coatLengthCm: 44, shoulderCm: 35, sleeveLengthCm: 60, bustCm: 72, bottomCm: 58 },
  { label: 'M/10', coatLengthCm: 45, shoulderCm: 36.2, sleeveLengthCm: 61, bustCm: 76, bottomCm: 62 },
  { label: 'L/12', coatLengthCm: 46, shoulderCm: 37.4, sleeveLengthCm: 62, bustCm: 80, bottomCm: 66 },
  { label: 'XL/14', coatLengthCm: 47, shoulderCm: 38.6, sleeveLengthCm: 63, bustCm: 84, bottomCm: 70 },
]

export const products: HomepageProduct[] = [
  {
    name: 'Jackets',
    slug: 'jackets',
    priceKes: 3780,
    category: 'Outerwear',
    colours: [
      { name: 'Black', value: '#111111', imageUrl: '/images/products/Jackets/black.webp' },
      { name: 'Beige', value: '#c8b69c', imageUrl: '/images/products/Jackets/beige.webp' },
      { name: 'Brown', value: '#6f4631', imageUrl: '/images/products/Jackets/brown.webp' },
    ],
    isNew: true,
    imageUrl: '/images/products/Jackets/black.webp',
    hoverImageUrl: '/images/products/Jackets/brown.webp',
    imageTone: 'linear-gradient(135deg, #461828, #c66747)',
    galleryImages: [
      '/images/products/Jackets/black.webp',
      '/images/products/Jackets/brown.webp',
      '/images/products/Jackets/beige.webp',
    ],
    sizeGuideText:
      'S: bust 35cm, length 48cm, shoulder 34cm, waistline 32cm. M: bust 37cm, length 49.5cm, shoulder 35.5cm, waistline 34cm. L: bust 39cm, length 51cm, shoulder 37cm, waistline 36cm. XL: bust 41cm, length 52.5cm, shoulder 38.5cm, waistline 38cm.',
    sizeOptions: commonSizeOptions,
  },
  {
    name: 'Long Sleeve, Round Neck',
    slug: 'long-sleeve-round-neck',
    priceKes: 2680,
    category: 'Tops',
    colours: [
      { name: 'Black', value: '#111111', imageUrl: '/images/products/Long sleeve, round neck/black.webp' },
      { name: 'Brown', value: '#6f4631', imageUrl: '/images/products/Long sleeve, round neck/brown.webp' },
      { name: 'White', value: '#f6f1ea', imageUrl: '/images/products/Long sleeve, round neck/white.webp' },
    ],
    isNew: true,
    imageUrl: '/images/products/Long sleeve, round neck/black.webp',
    hoverImageUrl: '/images/products/Long sleeve, round neck/brown.webp',
    imageTone: 'linear-gradient(135deg, #4a481d, #d7c1a9)',
    galleryImages: [
      '/images/products/Long sleeve, round neck/black.webp',
      '/images/products/Long sleeve, round neck/brown.webp',
      '/images/products/Long sleeve, round neck/white.webp',
    ],
    sizeGuideText:
      'Long-sleeved. S/8: coat length 43cm, sleeve length 63cm, bust 68cm, bottom 62cm. M/10: coat length 44cm, sleeve length 64cm, bust 72cm, bottom 66cm. L/12: coat length 45cm, sleeve length 65cm, bust 76cm, bottom 70cm. XL/14: coat length 46cm, sleeve length 66cm, bust 80cm, bottom 74cm.',
    sizeOptions: commonSizeOptions,
  },
  {
    name: 'Long Sleeve, Swirl Neck',
    slug: 'long-sleeve-swirl-neck',
    priceKes: 2980,
    category: 'Tops',
    colours: [
      { name: 'Black', value: '#111111', imageUrl: '/images/products/Long sleeve, swirl neck/black.webp' },
      { name: 'Brown', value: '#6f4631', imageUrl: '/images/products/Long sleeve, swirl neck/brown.webp' },
      { name: 'Cream', value: '#efe7dc', imageUrl: '/images/products/Long sleeve, swirl neck/cream.webp' },
    ],
    isNew: true,
    imageUrl: '/images/products/Long sleeve, swirl neck/black.webp',
    hoverImageUrl: '/images/products/Long sleeve, swirl neck/brown.webp',
    imageTone: 'linear-gradient(135deg, #000000, #4a481d)',
    galleryImages: [
      '/images/products/Long sleeve, swirl neck/black.webp',
      '/images/products/Long sleeve, swirl neck/brown.webp',
      '/images/products/Long sleeve, swirl neck/cream.webp',
    ],
    sizeGuideText:
      'Long-sleeved. Fabric: 78% nylon, 22% elastane. S/8: coat length 44cm, shoulder 35cm, sleeve length 60cm, bust 72cm, bottom 58cm. M/10: coat length 45cm, shoulder 36.2cm, sleeve length 61cm, bust 76cm, bottom 62cm. L/12: coat length 46cm, shoulder 37.4cm, sleeve length 62cm, bust 80cm, bottom 66cm. XL/14: coat length 47cm, shoulder 38.6cm, sleeve length 63cm, bust 84cm, bottom 70cm.',
    sizeOptions: commonSizeOptions,
  },
  {
    name: 'Minit T-Shirt',
    slug: 'minit-t-shirt',
    priceKes: 2980,
    category: 'Tops',
    colours: [
      { name: 'Black', value: '#111111', imageUrl: '/images/products/Mini T-Shirt/black.webp' },
      { name: 'Brown', value: '#6f4631', imageUrl: '/images/products/Mini T-Shirt/brown.webp' },
      { name: 'Cream', value: '#efe7dc', imageUrl: '/images/products/Mini T-Shirt/cream.webp' },
    ],
    isNew: true,
    imageUrl: '/images/products/Mini T-Shirt/black.webp',
    hoverImageUrl: '/images/products/Mini T-Shirt/brown.webp',
    imageTone: 'linear-gradient(135deg, #111111, #253b54)',
    galleryImages: [
      '/images/products/Mini T-Shirt/black.webp',
      '/images/products/Mini T-Shirt/brown.webp',
      '/images/products/Mini T-Shirt/cream.webp',
    ],
    sizeOptions: commonSizeOptions,
  },
  {
    name: 'Sahara Corsage Set',
    slug: 'sahara-corsage-set',
    priceKes: 5060,
    category: 'Sets',
    colours: [
      { name: 'Black', value: '#111111', imageUrl: '/images/products/Sahara/black.webp' },
      { name: 'Brown', value: '#6f4631', imageUrl: '/images/products/Sahara/brown.webp' },
      { name: 'Beige', value: '#d7d4c9', imageUrl: '/images/products/Sahara/beige.webp' },
    ],
    isNew: true,
    imageUrl: '/images/products/Sahara/black.webp',
    hoverImageUrl: '/images/products/Sahara/brown.webp',
    imageTone: 'linear-gradient(135deg, #d7d4c9, #111111)',
    galleryImages: [
      '/images/products/Sahara/black.webp',
      '/images/products/Sahara/brown.webp',
      '/images/products/Sahara/beige.webp',
    ],
    sizeOptions: commonSizeOptions,
  },
  {
    name: 'Strappy Bra',
    slug: 'strappy-bra',
    priceKes: 2680,
    category: 'Tops',
    colours: [
      { name: 'Black', value: '#111111', imageUrl: '/images/products/Bra/black.webp' },
      { name: 'Brown', value: '#6f4631', imageUrl: '/images/products/Bra/brown.webp' },
      { name: 'White', value: '#f6f1ea', imageUrl: '/images/products/Bra/white.webp' },
    ],
    isNew: true,
    imageUrl: '/images/products/Bra/black.webp',
    hoverImageUrl: '/images/products/Bra/brown.webp',
    imageTone: 'linear-gradient(135deg, #111111, #f6f1ea)',
    galleryImages: [
      '/images/products/Bra/black.webp',
      '/images/products/Bra/brown.webp',
      '/images/products/Bra/white.webp',
    ],
    sizeOptions: commonSizeOptions,
  },
  {
    name: 'Cropped Training Tee',
    slug: 'cropped-training-tee',
    priceKes: 2980,
    category: 'Tops',
    colours: [
      { name: 'Black', value: '#111111', imageUrl: "/images/products/Mia Cropped Tee's/black.jpg" },
      { name: 'Burgundy', value: '#4a2428', imageUrl: "/images/products/Mia Cropped Tee's/burgandy.jpg" },
      { name: 'Green', value: '#4a5134', imageUrl: "/images/products/Mia Cropped Tee's/green.jpg" },
    ],
    isNew: true,
    imageUrl: "/images/products/Mia Cropped Tee's/black.jpg",
    hoverImageUrl: "/images/products/Mia Cropped Tee's/burgandy.jpg",
    imageTone: 'linear-gradient(135deg, #111111, #4a5134)',
    galleryImages: [
      "/images/products/Mia Cropped Tee's/black.jpg",
      "/images/products/Mia Cropped Tee's/burgandy.jpg",
      "/images/products/Mia Cropped Tee's/green.jpg",
    ],
    sizeOptions: commonSizeOptions,
  },
  {
    name: 'Nuru Short Set',
    slug: 'nuru-short-set',
    priceKes: 4920,
    category: 'Sets',
    colours: [
      { name: 'Black', value: '#111111', imageUrl: '/images/products/Nuru, Short Set/black.webp' },
      { name: 'Brown', value: '#6f4631', imageUrl: '/images/products/Nuru, Short Set/brown.webp' },
      { name: 'Beige', value: '#c9cbc6', imageUrl: '/images/products/Nuru, Short Set/beige.webp' },
    ],
    imageUrl: '/images/products/Nuru, Short Set/black.webp',
    hoverImageUrl: '/images/products/Nuru, Short Set/brown.webp',
    imageTone: 'linear-gradient(135deg, #d7c1a9, #4a481d)',
    galleryImages: [
      '/images/products/Nuru, Short Set/black.webp',
      '/images/products/Nuru, Short Set/brown.webp',
      '/images/products/Nuru, Short Set/beige.webp',
    ],
    sizeOptions: commonSizeOptions,
  },
  {
    name: 'Mia Cropped Tee',
    slug: 'mia-cropped-tee',
    priceKes: 2800,
    category: 'Tops',
    colours: [
      { name: 'Black', value: '#111111', imageUrl: "/images/products/Mia Cropped Tee's/black.jpg" },
      { name: 'Brown', value: '#6f4631', imageUrl: "/images/products/Mia Cropped Tee's/burgandy.jpg" },
      { name: 'Cream', value: '#e8ddcd', imageUrl: "/images/products/Mia Cropped Tee's/green.jpg" },
    ],
    imageUrl: "/images/products/Mia Cropped Tee's/black.jpg",
    hoverImageUrl: "/images/products/Mia Cropped Tee's/burgandy.jpg",
    imageTone: 'linear-gradient(135deg, #111111, #e8ddcd)',
    galleryImages: [
      "/images/products/Mia Cropped Tee's/black.jpg",
      "/images/products/Mia Cropped Tee's/burgandy.jpg",
      "/images/products/Mia Cropped Tee's/green.jpg",
    ],
    sizeOptions: commonSizeOptions,
  },
  {
    name: 'ANAI Crew Socks',
    slug: 'anai-crew-socks',
    priceKes: 950,
    category: 'Accessories',
    colours: ['#ffffff', '#000000'],
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
    imageTone: 'linear-gradient(135deg, #ffffff, #461828)',
    sizeOptions: commonSizeOptions,
  },
]

export const categoryTiles: ImageTile[] = [
  {
    title: 'Men',
    href: '/shop?gender=men',
    imageUrl: '/images/categories/men.webp',
    imageTone: 'linear-gradient(135deg, #000000, #4a481d)',
    comingSoon: true,
  },
  {
    title: 'Women',
    href: '/shop?gender=women',
    imageUrl: '/images/categories/women.webp',
    imageTone: 'linear-gradient(135deg, #d7c1a9, #ffffff)',
  },
]

export const shopLooks = [
  {
    title: 'Studio Look',
    products: ['Sahara set', 'Yoga mat', 'Socks'],
  },
  {
    title: 'Training Look',
    products: ['Nia set', 'Ankle weights', 'Resistance bands'],
  },
  {
    title: 'Court Look',
    products: ['Terra set', 'Socks', 'Hat'],
  },
]

export const brandPromises = ['M-Pesa checkout', 'Easy returns', 'Fast delivery', 'Secure payment']
