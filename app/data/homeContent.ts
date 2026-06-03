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
  imageTone: string
  galleryImages?: string[]
  sizeGuideText?: string
}

export type ImageTile = {
  title: string
  href: string
  imageUrl: string
  imageTone: string
}

export const products: HomepageProduct[] = [
  {
    name: 'Jackets',
    slug: 'jackets',
    priceKes: 3780,
    category: 'Outerwear',
    colours: [
      { name: 'Black', value: '#111111', imageUrl: '/images/products/Jackets/b-2.jpg' },
      { name: 'Beige', value: '#c8b69c', imageUrl: '/images/products/Jackets/be-f.jpg' },
      { name: 'Brown', value: '#6f4631', imageUrl: '/images/products/Jackets/br-4.jpg' },
      { name: 'Green', value: '#55624b', imageUrl: '/images/products/Jackets/g-3.jpg' },
      { name: 'Grey', value: '#74756d', imageUrl: '/images/products/Jackets/gr-fb.jpg' },
    ],
    isNew: true,
    imageUrl: '/images/products/Jackets/b-2.jpg',
    imageTone: 'linear-gradient(135deg, #461828, #c66747)',
    galleryImages: [
      '/images/products/Jackets/b-2.jpg',
      '/images/products/Jackets/be-f.jpg',
      '/images/products/Jackets/br-4.jpg',
      '/images/products/Jackets/g-3.jpg',
      '/images/products/Jackets/g-b.jpg',
      '/images/products/Jackets/gr-fb.jpg',
      '/images/products/Jackets/detail.jpg',
    ],
    sizeGuideText:
      'S: bust 35cm, length 48cm, shoulder 34cm, waistline 32cm. M: bust 37cm, length 49.5cm, shoulder 35.5cm, waistline 34cm. L: bust 39cm, length 51cm, shoulder 37cm, waistline 36cm. XL: bust 41cm, length 52.5cm, shoulder 38.5cm, waistline 38cm.',
  },
  {
    name: 'Long Sleeve, Round Neck',
    slug: 'long-sleeve-round-neck',
    priceKes: 2680,
    category: 'Tops',
    colours: [
      { name: 'Black', value: '#111111', imageUrl: '/images/products/Long sleeve, round neck/b-t.jpg' },
      { name: 'Blue', value: '#253b54', imageUrl: '/images/products/Long sleeve, round neck/bl-t.jpg' },
      { name: 'Brown', value: '#6f4631', imageUrl: '/images/products/Long sleeve, round neck/br-t.jpg' },
      { name: 'Green', value: '#586447', imageUrl: '/images/products/Long sleeve, round neck/g-t.jpg' },
      { name: 'Natural', value: '#b89d83', imageUrl: '/images/products/Long sleeve, round neck/n-t.jpg' },
      { name: 'White', value: '#f6f1ea', imageUrl: '/images/products/Long sleeve, round neck/w-t.jpg' },
    ],
    isNew: true,
    imageUrl: '/images/products/Long sleeve, round neck/b-t.jpg',
    imageTone: 'linear-gradient(135deg, #4a481d, #d7c1a9)',
    galleryImages: [
      '/images/products/Long sleeve, round neck/b-t.jpg',
      '/images/products/Long sleeve, round neck/bl-t.jpg',
      '/images/products/Long sleeve, round neck/br-t.jpg',
      '/images/products/Long sleeve, round neck/g-t.jpg',
      '/images/products/Long sleeve, round neck/g-tt.jpg',
      '/images/products/Long sleeve, round neck/n-t.jpg',
      '/images/products/Long sleeve, round neck/w-t.jpg',
    ],
    sizeGuideText:
      'Long-sleeved. S/8: coat length 43cm, sleeve length 63cm, bust 68cm, bottom 62cm. M/10: coat length 44cm, sleeve length 64cm, bust 72cm, bottom 66cm. L/12: coat length 45cm, sleeve length 65cm, bust 76cm, bottom 70cm. XL/14: coat length 46cm, sleeve length 66cm, bust 80cm, bottom 74cm.',
  },
  {
    name: 'Long Sleeve, Swirl Neck',
    slug: 'long-sleeve-swirl-neck',
    priceKes: 2980,
    category: 'Tops',
    colours: [
      { name: 'Black', value: '#111111', imageUrl: '/images/products/Long sleeve, swirl neck/bb-sw.jpg' },
      { name: 'Brown', value: '#6f4631', imageUrl: '/images/products/Long sleeve, swirl neck/br-sw.jpg' },
      { name: 'Off white', value: '#efe7dc', imageUrl: '/images/products/Long sleeve, swirl neck/ow-sw.jpg' },
    ],
    isNew: true,
    imageUrl: '/images/products/Long sleeve, swirl neck/bl-sw.jpg',
    imageTone: 'linear-gradient(135deg, #000000, #4a481d)',
    galleryImages: [
      '/images/products/Long sleeve, swirl neck/bl-sw.jpg',
      '/images/products/Long sleeve, swirl neck/br-sw.jpg',
      '/images/products/Long sleeve, swirl neck/ow-sw.jpg',
      '/images/products/Long sleeve, swirl neck/details.png',
    ],
    sizeGuideText:
      'Long-sleeved. Fabric: 78% nylon, 22% elastane. S/8: coat length 44cm, shoulder 35cm, sleeve length 60cm, bust 72cm, bottom 58cm. M/10: coat length 45cm, shoulder 36.2cm, sleeve length 61cm, bust 76cm, bottom 62cm. L/12: coat length 46cm, shoulder 37.4cm, sleeve length 62cm, bust 80cm, bottom 66cm. XL/14: coat length 47cm, shoulder 38.6cm, sleeve length 63cm, bust 84cm, bottom 70cm.',
  },
  {
    name: 'Minit T-Shirt',
    slug: 'minit-t-shirt',
    priceKes: 2980,
    category: 'Tops',
    colours: [
      { name: 'Black', value: '#111111', imageUrl: '/images/products/Mini T-Shirt/creme.jpg' },
      { name: 'Blue', value: '#253b54', imageUrl: '/images/products/Mini T-Shirt/black.jpg' },
      { name: 'Brown', value: '#6f4631', imageUrl: '/images/products/Mini T-Shirt/brown.jpg' },
      {
        name: 'Red Stripe',
        value: 'repeating-linear-gradient(90deg, #111111 0 8px, #9f2526 8px 14px)',
        imageUrl: '/images/products/Mini T-Shirt/brown.jpg',
      },
    ],
    isNew: true,
    imageUrl: '/images/products/Mini T-Shirt/black.jpg',
    imageTone: 'linear-gradient(135deg, #111111, #253b54)',
    galleryImages: [
      '/images/products/Mini T-Shirt/black.jpg',
      '/images/products/Mini T-Shirt/brown.jpg',
      '/images/products/Mini T-Shirt/creme.jpg',
    ],
  },
  {
    name: 'Sahara Corsage Set',
    slug: 'sahara-corsage-set',
    priceKes: 5060,
    category: 'Sets',
    colours: [
      { name: 'Beige', value: '#d7d4c9', imageUrl: '/images/products/Sahara/beige.jpg' },
      { name: 'Black', value: '#111111', imageUrl: '/images/products/Sahara/black.jpg' },
      { name: 'Brown', value: '#6f4631', imageUrl: '/images/products/Sahara/brown.jpg' },
    ],
    isNew: true,
    imageUrl: '/images/products/Sahara/beige.jpg',
    imageTone: 'linear-gradient(135deg, #d7d4c9, #111111)',
    galleryImages: [
      '/images/products/Sahara/beige.jpg',
      '/images/products/Sahara/black.jpg',
      '/images/products/Sahara/brown.jpg',
    ],
  },
  {
    name: 'Strappy Bra',
    slug: 'strappy-bra',
    priceKes: 2680,
    category: 'Tops',
    colours: [
      { name: 'Black', value: '#111111', imageUrl: '/images/products/Bra/black.jpg' },
      { name: 'Brown', value: '#6f4631', imageUrl: '/images/products/Bra/brown.jpg' },
      { name: 'White', value: '#f6f1ea', imageUrl: '/images/products/Bra/white.jpg' },
    ],
    isNew: true,
    imageUrl: '/images/products/Bra/black.jpg',
    imageTone: 'linear-gradient(135deg, #111111, #f6f1ea)',
    galleryImages: [
      '/images/products/Bra/black.jpg',
      '/images/products/Bra/brown.jpg',
      '/images/products/Bra/white.jpg',
    ],
  },
  {
    name: 'Cropped Training Tee',
    slug: 'cropped-training-tee',
    priceKes: 2980,
    category: 'Tops',
    colours: [
      { name: 'Black', value: '#111111', imageUrl: '/images/products/Tops/black.jpg' },
      { name: 'Burgundy', value: '#4a2428', imageUrl: '/images/products/Tops/burgandy.jpg' },
      { name: 'Green', value: '#4a5134', imageUrl: '/images/products/Tops/green.jpg' },
    ],
    isNew: true,
    imageUrl: '/images/products/Tops/black.jpg',
    imageTone: 'linear-gradient(135deg, #111111, #4a5134)',
    galleryImages: [
      '/images/products/Tops/black.jpg',
      '/images/products/Tops/burgandy.jpg',
      '/images/products/Tops/green.jpg',
    ],
  },
  {
    name: 'Nuru Short Set',
    slug: 'nuru-short-set',
    priceKes: 4920,
    category: 'Sets',
    colours: [
      { name: 'Beige', value: '#c9cbc6', imageUrl: '/images/products/Nuru, Short Set/beige.jpg' },
      { name: 'Black', value: '#111111', imageUrl: '/images/products/Nuru, Short Set/black.jpg' },
      { name: 'Brown', value: '#6f4631', imageUrl: '/images/products/Nuru, Short Set/brown.jpg' },
    ],
    imageUrl: '/images/products/Nuru, Short Set/beige.jpg',
    imageTone: 'linear-gradient(135deg, #d7c1a9, #4a481d)',
    galleryImages: [
      '/images/products/Nuru, Short Set/beige.jpg',
      '/images/products/Nuru, Short Set/black.jpg',
      '/images/products/Nuru, Short Set/brown.jpg',
    ],
  },
  {
    name: 'Mia Cropped Tee',
    slug: 'mia-cropped-tee',
    priceKes: 2800,
    category: 'Tops',
    colours: [
      { name: 'Black', value: '#111111', imageUrl: "/images/products/Mia Cropped Tee's/black.jpg" },
      { name: 'Brown', value: '#6f4631', imageUrl: "/images/products/Mia Cropped Tee's/brown.jpg" },
      { name: 'Cream', value: '#e8ddcd', imageUrl: "/images/products/Mia Cropped Tee's/cream.jpg" },
    ],
    imageUrl: "/images/products/Mia Cropped Tee's/black.jpg",
    imageTone: 'linear-gradient(135deg, #111111, #e8ddcd)',
    galleryImages: [
      "/images/products/Mia Cropped Tee's/black.jpg",
      "/images/products/Mia Cropped Tee's/brown.jpg",
      "/images/products/Mia Cropped Tee's/cream.jpg",
    ],
  },
  {
    name: 'ANAI Crew Socks',
    slug: 'anai-crew-socks',
    priceKes: 950,
    category: 'Accessories',
    colours: ['#ffffff', '#000000'],
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
    imageTone: 'linear-gradient(135deg, #ffffff, #461828)',
  },
]

export const categoryTiles: ImageTile[] = [
  {
    title: 'Men',
    href: '/shop?gender=men',
    imageUrl: '/images/categories/men.jpg?v=3',
    imageTone: 'linear-gradient(135deg, #000000, #4a481d)',
  },
  {
    title: 'Women',
    href: '/shop?gender=women',
    imageUrl: '/images/categories/women.png?v=2',
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
