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
  imageUrl?: string
  hoverImageUrl?: string
  imageTone: string
  galleryImages?: string[]
  description?: string
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
  isComingSoon?: boolean
}

export type ShopLook = {
  title: string
  href: string
  imageUrl: string
  imageAlt: string
  products: string[]
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
    name: 'Nuru Zip-up',
    slug: 'jackets',
    priceKes: 3870,
    category: 'Outerwear',
    colours: [
      { name: 'Black', value: '#111111', imageUrl: '/images/products/Nuru Zip-up/black.webp' },
      { name: 'Brown', value: '#6f4631', imageUrl: '/images/products/Nuru Zip-up/brown.webp' },
      { name: 'Navy', value: '#253b54', imageUrl: '/images/products/Nuru Zip-up/navy.webp' },
    ],
    isNew: true,
    imageUrl: '/images/products/Nuru Zip-up/navy.webp',
    hoverImageUrl: '/images/products/Nuru Zip-up/brown.webp',
    imageTone: 'linear-gradient(135deg, #461828, #c66747)',
    galleryImages: [
      '/images/products/Nuru Zip-up/navy.webp',
      '/images/products/Nuru Zip-up/black.webp',
      '/images/products/Nuru Zip-up/brown.webp',
    ],
    description: 'A fitted cropped zip-up jacket with a high collar, paneled front, and contrast sleeve stripes.',
    sizeGuideText:
      'S: bust 35cm, length 48cm, shoulder 34cm, waistline 32cm. M: bust 37cm, length 49.5cm, shoulder 35.5cm, waistline 34cm. L: bust 39cm, length 51cm, shoulder 37cm, waistline 36cm. XL: bust 41cm, length 52.5cm, shoulder 38.5cm, waistline 38cm.',
    sizeOptions: commonSizeOptions,
  },
  {
    name: 'Reya Long sleeve, round neck',
    slug: 'long-sleeve-round-neck',
    priceKes: 2680,
    category: 'Tops',
    colours: [
      { name: 'Black', value: '#111111', imageUrl: '/images/products/Reya Long sleeve, round neck/black.webp' },
      { name: 'Brown', value: '#6f4631', imageUrl: '/images/products/Reya Long sleeve, round neck/brown.webp' },
      { name: 'White', value: '#f6f1ea', imageUrl: '/images/products/Reya Long sleeve, round neck/white.webp' },
    ],
    isNew: true,
    imageUrl: '/images/products/Reya Long sleeve, round neck/white.webp',
    hoverImageUrl: '/images/products/Reya Long sleeve, round neck/brown.webp',
    imageTone: 'linear-gradient(135deg, #4a481d, #d7c1a9)',
    galleryImages: [
      '/images/products/Reya Long sleeve, round neck/white.webp',
      '/images/products/Reya Long sleeve, round neck/black.webp',
      '/images/products/Reya Long sleeve, round neck/brown.webp',
    ],
    description: 'A cropped long-sleeve top with a round neckline, smooth fitted body, and flared wrist cuffs.',
    sizeGuideText:
      'Long-sleeved. S/8: coat length 43cm, sleeve length 63cm, bust 68cm, bottom 62cm. M/10: coat length 44cm, sleeve length 64cm, bust 72cm, bottom 66cm. L/12: coat length 45cm, sleeve length 65cm, bust 76cm, bottom 70cm. XL/14: coat length 46cm, sleeve length 66cm, bust 80cm, bottom 74cm.',
    sizeOptions: commonSizeOptions,
  },
  {
    name: 'Reya Long sleeve, swirl neck',
    slug: 'long-sleeve-swirl-neck',
    priceKes: 2980,
    category: 'Tops',
    colours: [
      { name: 'Black', value: '#111111', imageUrl: '/images/products/Reya Long sleeve, swirl neck/black.webp' },
      { name: 'Brown', value: '#6f4631', imageUrl: '/images/products/Reya Long sleeve, swirl neck/brown.webp' },
      { name: 'Cream', value: '#efe7dc', imageUrl: '/images/products/Reya Long sleeve, swirl neck/cream.webp' },
    ],
    isNew: true,
    imageUrl: '/images/products/Reya Long sleeve, swirl neck/cream.webp',
    hoverImageUrl: '/images/products/Reya Long sleeve, swirl neck/brown.webp',
    imageTone: 'linear-gradient(135deg, #000000, #4a481d)',
    galleryImages: [
      '/images/products/Reya Long sleeve, swirl neck/cream.webp',
      '/images/products/Reya Long sleeve, swirl neck/black.webp',
      '/images/products/Reya Long sleeve, swirl neck/brown.webp',
    ],
    description: 'A cropped long-sleeve top with a high neckline, smooth fitted body, and clean minimal finish.',
    sizeGuideText:
      'Long-sleeved. Fabric: 78% nylon, 22% elastane. S/8: coat length 44cm, shoulder 35cm, sleeve length 60cm, bust 72cm, bottom 58cm. M/10: coat length 45cm, shoulder 36.2cm, sleeve length 61cm, bust 76cm, bottom 62cm. L/12: coat length 46cm, shoulder 37.4cm, sleeve length 62cm, bust 80cm, bottom 66cm. XL/14: coat length 47cm, shoulder 38.6cm, sleeve length 63cm, bust 84cm, bottom 70cm.',
    sizeOptions: commonSizeOptions,
  },
  {
    name: 'Aya Mini tee',
    slug: 'minit-t-shirt',
    priceKes: 2980,
    category: 'Tops',
    colours: [
      { name: 'Black', value: '#111111', imageUrl: '/images/products/Aya Mini tee/black.webp' },
    ],
    isNew: true,
    imageUrl: '/images/products/Aya Mini tee/black.webp',
    imageTone: 'linear-gradient(135deg, #111111, #253b54)',
    galleryImages: [
      '/images/products/Aya Mini tee/black.webp',
    ],
    description: 'A fitted cropped mini tee with cap sleeves, a round neckline, and subtle contour seam details.',
    sizeOptions: commonSizeOptions,
  },
  {
    name: 'Nia jogger set',
    slug: 'sahara-corsage-set',
    priceKes: 5510,
    category: 'Sets',
    colours: [
      { name: 'Black', value: '#111111', imageUrl: '/images/products/Nia jogger set/black.webp' },
      { name: 'Grey', value: '#d7d4c9', imageUrl: '/images/products/Nia jogger set/grey.webp' },
      { name: 'Navy blue', value: '#253b54', imageUrl: '/images/products/Nia jogger set/navy blue.webp' },
    ],
    isNew: true,
    imageUrl: '/images/products/Nia jogger set/navy blue.webp',
    hoverImageUrl: '/images/products/Nia jogger set/grey.webp',
    imageTone: 'linear-gradient(135deg, #d7d4c9, #111111)',
    galleryImages: [
      '/images/products/Nia jogger set/navy blue.webp',
      '/images/products/Nia jogger set/black.webp',
      '/images/products/Nia jogger set/grey.webp',
    ],
    description: 'A two-piece set with a layered-look crop top and high-waist biker shorts finished with contrast trim.',
    sizeOptions: commonSizeOptions,
  },
  {
    name: 'Lela set',
    slug: 'lela-set',
    priceKes: 5060,
    category: 'Sets',
    colours: [
      { name: 'Black', value: '#111111', imageUrl: '/images/products/Lela set/black.webp' },
      { name: 'Brown', value: '#6f4631', imageUrl: '/images/products/Lela set/brown.webp' },
      { name: 'White', value: '#f6f1ea', imageUrl: '/images/products/Lela set/white.webp' },
    ],
    isNew: true,
    imageUrl: '/images/products/Lela set/white.webp',
    hoverImageUrl: '/images/products/Lela set/brown.webp',
    imageTone: 'linear-gradient(135deg, #d7d4c9, #111111)',
    galleryImages: [
      '/images/products/Lela set/white.webp',
      '/images/products/Lela set/brown.webp',
      '/images/products/Lela set/black.webp',
    ],
    description: 'A two-piece set with a high-neck crop top and matching high-waist tights with a crossover waistband.',
    sizeOptions: commonSizeOptions,
  },
  {
    name: 'Mvua flannel',
    slug: 'mvua-flannel',
    priceKes: 4770,
    category: 'Tops',
    colours: [
      { name: 'Black', value: '#111111', imageUrl: '/images/products/Mvua flannel/black.webp' },
      { name: 'Brown', value: '#6f4631' },
      { name: 'Cream', value: '#efe7dc' },
    ],
    isNew: true,
    imageUrl: '/images/products/Mvua flannel/black.webp',
    galleryImages: [
      '/images/products/Mvua flannel/black.webp',
    ],
    imageTone: 'linear-gradient(135deg, #111111, #6f4631)',
    description: 'A relaxed zip-collar pullover with a front pocket, elastic cuffs, and a cinched hem.',
    sizeOptions: commonSizeOptions,
  },
  {
    name: 'Zuri bra',
    slug: 'strappy-bra',
    priceKes: 2680,
    category: 'Tops',
    colours: [
      { name: 'Black', value: '#111111', imageUrl: '/images/products/Zuri bra/black.webp' },
      { name: 'Brown', value: '#6f4631', imageUrl: '/images/products/Zuri bra/brown.webp' },
      { name: 'White', value: '#f6f1ea', imageUrl: '/images/products/Zuri bra/white.webp' },
    ],
    isNew: true,
    imageUrl: '/images/products/Zuri bra/white.webp',
    hoverImageUrl: '/images/products/Zuri bra/brown.webp',
    imageTone: 'linear-gradient(135deg, #111111, #f6f1ea)',
    galleryImages: [
      '/images/products/Zuri bra/white.webp',
      '/images/products/Zuri bra/black.webp',
      '/images/products/Zuri bra/brown.webp',
    ],
    description: 'A minimal square-neck bra top with slim straps and a clean cropped band.',
    sizeOptions: commonSizeOptions,
  },
  {
    name: 'Terra skirt - Padel/tennis bubble set',
    slug: 'terra-skirt',
    priceKes: 2680,
    category: 'Bottoms',
    colours: [
      { name: 'Black', value: '#111111' },
      { name: 'Burgundy', value: '#4a2428' },
      { name: 'Green', value: '#4a5134' },
    ],
    isNew: true,
    imageUrl: '/images/products/Terra skirt - Padel tennis bubble set/brown.webp',
    galleryImages: [
      '/images/products/Terra skirt - Padel tennis bubble set/brown.webp',
    ],
    imageTone: 'linear-gradient(135deg, #111111, #4a5134)',
    description: 'A court-ready bubble skirt with a smooth waistband, gathered volume, and a matching cropped top.',
    sizeOptions: commonSizeOptions,
  },
  {
    name: 'Jua jogger set',
    slug: 'nuru-short-set',
    priceKes: 4920,
    category: 'Sets',
    colours: [
      { name: 'Black', value: '#111111', imageUrl: '/images/products/Jua jogger set/black.webp' },
      { name: 'Grey', value: '#c9cbc6', imageUrl: '/images/products/Jua jogger set/grey.webp' },
      { name: 'Navy blue', value: '#253b54', imageUrl: '/images/products/Jua jogger set/navy blue.webp' },
    ],
    imageUrl: '/images/products/Jua jogger set/navy blue.webp',
    hoverImageUrl: '/images/products/Jua jogger set/grey.webp',
    imageTone: 'linear-gradient(135deg, #d7c1a9, #4a481d)',
    galleryImages: [
      '/images/products/Jua jogger set/navy blue.webp',
      '/images/products/Jua jogger set/black.webp',
      '/images/products/Jua jogger set/grey.webp',
    ],
    description: 'A two-piece set with a scoop-neck crop top and high-waist biker shorts finished with contrast trim.',
    sizeOptions: commonSizeOptions,
  },
  {
    name: "Mia cropped t'S",
    slug: 'mia-cropped-tee',
    priceKes: 2980,
    category: 'Tops',
    colours: [
      { name: 'Black', value: '#111111', imageUrl: "/images/products/Mia cropped t'S/black.webp" },
      { name: 'Burgundy', value: '#4a2428', imageUrl: "/images/products/Mia cropped t'S/burgandy.webp" },
      { name: 'White', value: '#f6f1ea', imageUrl: "/images/products/Mia cropped t'S/white.webp" },
    ],
    imageUrl: "/images/products/Mia cropped t'S/burgandy.webp",
    hoverImageUrl: "/images/products/Mia cropped t'S/white.webp",
    imageTone: 'linear-gradient(135deg, #111111, #e8ddcd)',
    galleryImages: [
      "/images/products/Mia cropped t'S/burgandy.webp",
      "/images/products/Mia cropped t'S/black.webp",
      "/images/products/Mia cropped t'S/white.webp",
    ],
    description: 'A short-sleeve cropped tee with a relaxed boxy shape and clean round neckline.',
    sizeOptions: commonSizeOptions,
  },
]

export const categoryTiles: ImageTile[] = [
  {
    title: 'Men',
    href: '/shop?gender=men',
    imageUrl: '/images/categories/men.webp',
    imageTone: 'linear-gradient(135deg, #000000, #4a481d)',
    isComingSoon: true,
  },
  {
    title: 'Women',
    href: '/shop?gender=women',
    imageUrl: '/images/categories/women.webp',
    imageTone: 'linear-gradient(135deg, #d7c1a9, #ffffff)',
  },
]

export const shopLooks: ShopLook[] = [
  {
    title: 'Studio Look',
    href: '/product/lela-set',
    imageUrl: '/images/products/Lela set/white.webp',
    imageAlt: 'Lela set styled for a studio look',
    products: ['Lela set', 'Yoga mat', 'Socks'],
  },
  {
    title: 'Training Look',
    href: '/product/nuru-short-set',
    imageUrl: '/images/products/Jua jogger set/navy blue.webp',
    imageAlt: 'Jua jogger set styled for a training look',
    products: ['Jua jogger set', 'Ankle weights', 'Resistance bands'],
  },
  {
    title: 'Court Look',
    href: '/product/terra-skirt',
    imageUrl: '/images/products/Terra skirt - Padel tennis bubble set/brown.webp',
    imageAlt: 'Terra skirt styled for a court look',
    products: ['Terra skirt', 'Socks', 'Hat'],
  },
]

export const brandPromises = ['M-Pesa checkout', 'Easy returns', 'Fast delivery', 'Secure payment']
