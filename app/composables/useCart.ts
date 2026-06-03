import { products, type HomepageProduct } from '../data/homeContent'

export type CartItem = {
  slug: string
  quantity: number
}

export type CartLine = CartItem & {
  product: HomepageProduct
  lineTotalKes: number
}

const CART_STORAGE_KEY = 'anai-cart'

const clampQuantity = (quantity: number) => Math.min(Math.max(Math.floor(quantity), 1), 99)

const getStoredCart = () => {
  if (!import.meta.client) {
    return []
  }

  try {
    const storedValue = window.localStorage.getItem(CART_STORAGE_KEY)

    if (!storedValue) {
      return []
    }

    const parsedValue = JSON.parse(storedValue)

    if (!Array.isArray(parsedValue)) {
      return []
    }

    return parsedValue
      .map((item): CartItem | undefined => {
        if (!item || typeof item.slug !== 'string') {
          return undefined
        }

        const product = products.find((productItem) => productItem.slug === item.slug)
        const quantity = Number(item.quantity)

        if (!product || !Number.isFinite(quantity) || quantity < 1) {
          return undefined
        }

        return {
          slug: product.slug,
          quantity: clampQuantity(quantity),
        }
      })
      .filter((item): item is CartItem => Boolean(item))
  } catch {
    return []
  }
}

export const useCart = () => {
  const items = useState<CartItem[]>('anai-cart-items', () => [])
  const isLoaded = useState('anai-cart-loaded', () => false)

  const persistCart = () => {
    if (!import.meta.client) {
      return
    }

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items.value))
  }

  const hydrateCart = () => {
    if (isLoaded.value || !import.meta.client) {
      return
    }

    items.value = getStoredCart()
    isLoaded.value = true
  }

  const addToCart = (product: HomepageProduct, quantity = 1) => {
    hydrateCart()

    const existingItem = items.value.find((item) => item.slug === product.slug)

    if (existingItem) {
      existingItem.quantity = clampQuantity(existingItem.quantity + quantity)
    } else {
      items.value = [
        ...items.value,
        {
          slug: product.slug,
          quantity: clampQuantity(quantity),
        },
      ]
    }

    persistCart()
  }

  const updateQuantity = (slug: string, quantity: number) => {
    hydrateCart()

    if (quantity < 1) {
      items.value = items.value.filter((item) => item.slug !== slug)
    } else {
      items.value = items.value.map((item) =>
        item.slug === slug
          ? {
              ...item,
              quantity: clampQuantity(quantity),
            }
          : item,
      )
    }

    persistCart()
  }

  const removeFromCart = (slug: string) => {
    hydrateCart()
    items.value = items.value.filter((item) => item.slug !== slug)
    persistCart()
  }

  const clearCart = () => {
    hydrateCart()
    items.value = []
    persistCart()
  }

  const lines = computed<CartLine[]>(() =>
    items.value
      .map((item) => {
        const product = products.find((productItem) => productItem.slug === item.slug)

        if (!product) {
          return undefined
        }

        return {
          ...item,
          product,
          lineTotalKes: product.priceKes * item.quantity,
        }
      })
      .filter((line): line is CartLine => Boolean(line)),
  )

  const itemCount = computed(() =>
    items.value.reduce((totalItems, item) => totalItems + item.quantity, 0),
  )
  const subtotalKes = computed(() =>
    lines.value.reduce((totalPrice, line) => totalPrice + line.lineTotalKes, 0),
  )

  if (import.meta.client) {
    onMounted(hydrateCart)
  }

  return {
    items,
    lines,
    itemCount,
    subtotalKes,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    hydrateCart,
  }
}
