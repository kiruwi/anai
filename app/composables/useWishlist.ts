import { products, type HomepageProduct } from '../data/homeContent'

export type WishlistLine = {
  slug: string
  product: HomepageProduct
}

const WISHLIST_STORAGE_KEY = 'anai-wishlist'

const getStoredWishlist = () => {
  if (!import.meta.client) {
    return []
  }

  try {
    const storedValue = window.localStorage.getItem(WISHLIST_STORAGE_KEY)

    if (!storedValue) {
      return []
    }

    const parsedValue = JSON.parse(storedValue)

    if (!Array.isArray(parsedValue)) {
      return []
    }

    return parsedValue
      .filter((slug): slug is string =>
        typeof slug === 'string' && products.some((product) => product.slug === slug),
      )
      .filter((slug, index, slugs) => slugs.indexOf(slug) === index)
  } catch {
    return []
  }
}

export const useWishlist = () => {
  const items = useState<string[]>('anai-wishlist-items', () => [])
  const isLoaded = useState('anai-wishlist-loaded', () => false)

  const persistWishlist = () => {
    if (!import.meta.client) {
      return
    }

    window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items.value))
  }

  const hydrateWishlist = () => {
    if (isLoaded.value || !import.meta.client) {
      return
    }

    items.value = getStoredWishlist()
    isLoaded.value = true
  }

  const addToWishlist = (product: HomepageProduct) => {
    hydrateWishlist()

    if (!items.value.includes(product.slug)) {
      items.value = [...items.value, product.slug]
      persistWishlist()
    }
  }

  const removeFromWishlist = (slug: string) => {
    hydrateWishlist()
    items.value = items.value.filter((itemSlug) => itemSlug !== slug)
    persistWishlist()
  }

  const toggleWishlist = (product: HomepageProduct) => {
    hydrateWishlist()

    if (items.value.includes(product.slug)) {
      removeFromWishlist(product.slug)
      return
    }

    addToWishlist(product)
  }

  const isInWishlist = (slug: string) => {
    return items.value.includes(slug)
  }

  const lines = computed<WishlistLine[]>(() =>
    items.value
      .map((slug) => {
        const product = products.find((productItem) => productItem.slug === slug)

        if (!product) {
          return undefined
        }

        return {
          slug,
          product,
        }
      })
      .filter((line): line is WishlistLine => Boolean(line)),
  )

  const itemCount = computed(() => items.value.length)

  if (import.meta.client) {
    onMounted(hydrateWishlist)
  }

  return {
    items,
    lines,
    itemCount,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    hydrateWishlist,
  }
}
