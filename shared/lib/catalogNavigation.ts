export const canonicalSiteUrl = 'https://anaibymurda.com'

export const collectionSlugs = [
  'new-in',
  'women',
  'sets',
  'tops',
  'bottoms',
  'outerwear',
  'accessories',
] as const

export type CollectionSlug = (typeof collectionSlugs)[number]

export type CollectionDefinition = {
  heading: string
  title: string
  description: string
  filter: 'new' | 'women' | 'category'
  category?: string
}

export const allProductsDefinition = {
  heading: 'All products',
  title: 'Shop All Activewear & Athleisure | AÑAI Kenya',
  description: 'Shop AÑAI activewear and athleisure designed in Kenya for training, movement, and everyday life.',
} as const

export const collectionDefinitions: Record<CollectionSlug, CollectionDefinition> = {
  'new-in': {
    heading: 'New in',
    title: 'New Activewear & Athleisure | AÑAI Kenya',
    description: 'Discover the newest AÑAI activewear, coordinated sets, tops, outerwear, and movement-ready essentials.',
    filter: 'new',
  },
  women: {
    heading: 'Women',
    title: "Women's Activewear & Athleisure | AÑAI Kenya",
    description: "Shop women's activewear and athleisure by AÑAI, designed for movement, comfort, and everyday wear.",
    filter: 'women',
  },
  sets: {
    heading: 'Sets',
    title: "Women's Activewear Sets | AÑAI Kenya",
    description: 'Shop coordinated AÑAI activewear sets designed for training, errands, travel, and everyday comfort.',
    filter: 'category',
    category: 'Sets',
  },
  tops: {
    heading: 'Tops',
    title: "Women's Activewear Tops | AÑAI Kenya",
    description: 'Shop AÑAI activewear tops, cropped tees, long sleeves, bras, and versatile movement-ready layers.',
    filter: 'category',
    category: 'Tops',
  },
  bottoms: {
    heading: 'Bottoms',
    title: "Women's Activewear Bottoms | AÑAI Kenya",
    description: 'Shop AÑAI activewear bottoms designed for court days, workouts, and comfortable everyday movement.',
    filter: 'category',
    category: 'Bottoms',
  },
  outerwear: {
    heading: 'Outerwear',
    title: "Women's Activewear Outerwear | AÑAI Kenya",
    description: 'Shop AÑAI activewear outerwear and versatile layers for warm-ups, cool-downs, and everyday wear.',
    filter: 'category',
    category: 'Outerwear',
  },
  accessories: {
    heading: 'Accessories',
    title: 'Activewear Accessories | AÑAI Kenya',
    description: 'Shop AÑAI activewear accessories created to complement training, movement, and everyday routines.',
    filter: 'category',
    category: 'Accessories',
  },
}

export const isCollectionSlug = (value: string): value is CollectionSlug =>
  collectionSlugs.includes(value as CollectionSlug)

export const getCollectionPathForCategory = (category: string) => {
  const slug = category.trim().toLowerCase()

  return isCollectionSlug(slug) ? `/shop/${slug}` : '/shop/women'
}

export const legacyShopQueryPaths: Record<string, string> = {
  'new=true': '/shop/new-in',
  'gender=women': '/shop/women',
  'category=sets': '/shop/sets',
  'category=tops': '/shop/tops',
  'category=bottoms': '/shop/bottoms',
  'category=outerwear': '/shop/outerwear',
  'category=accessories': '/shop/accessories',
}
