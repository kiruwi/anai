import {
  getProductColourName,
  getProductDefaultColourName,
  products,
  type HomepageProduct,
} from '../data/homeContent'

export type CartItem = {
  slug: string
  quantity: number
  size?: string
  colour?: string
}

export type CartLine = CartItem & {
  key: string
  product: HomepageProduct
  lineTotalKes: number
}

const CART_STORAGE_KEY = 'anai-cart'

const getProductStockLimit = (product: HomepageProduct) => Math.max(Math.floor(product.stockQuantity), 0)

const clampQuantity = (product: HomepageProduct, quantity: number) =>
  Math.min(Math.max(Math.floor(quantity), 1), getProductStockLimit(product))

const getProductSizeLabels = (product: HomepageProduct) =>
  product.sizeOptions?.map((option) => option.label) ?? []

const getProductColourLabels = (product: HomepageProduct) =>
  product.colours.map((colour) => getProductColourName(colour))

const normalizeSize = (product: HomepageProduct, size: unknown) => {
  if (typeof size !== 'string') {
    return undefined
  }

  const trimmedSize = size.trim()
  const sizeLabels = getProductSizeLabels(product)

  return sizeLabels.includes(trimmedSize) ? trimmedSize : undefined
}

const normalizeColour = (product: HomepageProduct, colour: unknown) => {
  const colourLabels = getProductColourLabels(product)

  if (!colourLabels.length) {
    return undefined
  }

  if (typeof colour !== 'string') {
    return getProductDefaultColourName(product)
  }

  const trimmedColour = colour.trim()
  const matchingColour = colourLabels.find(
    (colourLabel) => colourLabel.toLowerCase() === trimmedColour.toLowerCase(),
  )

  return matchingColour ?? getProductDefaultColourName(product)
}

const getCartItemKey = (item: Pick<CartItem, 'slug' | 'colour'>) =>
  `${item.slug}:${item.colour ?? ''}`

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

        if (!product || !Number.isFinite(quantity) || quantity < 1 || getProductStockLimit(product) < 1) {
          return undefined
        }

        return {
          slug: product.slug,
          quantity: clampQuantity(product, quantity),
          size: normalizeSize(product, item.size),
          colour: normalizeColour(product, item.colour ?? item.color),
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

  const addToCart = (
    product: HomepageProduct,
    quantity = 1,
    options: {
      size?: string
      colour?: string
    } = {},
  ) => {
    hydrateCart()

    if (getProductStockLimit(product) < 1) {
      return
    }

    const colour = normalizeColour(product, options.colour)
    const existingItem = items.value.find(
      (item) => item.slug === product.slug && normalizeColour(product, item.colour) === colour,
    )

    if (existingItem) {
      existingItem.quantity = clampQuantity(product, existingItem.quantity + quantity)
      existingItem.size = normalizeSize(product, options.size) ?? existingItem.size
      existingItem.colour = colour
    } else {
      items.value = [
        ...items.value,
        {
          slug: product.slug,
          quantity: clampQuantity(product, quantity),
          size: normalizeSize(product, options.size),
          colour,
        },
      ]
    }

    persistCart()
  }

  const updateQuantity = (key: string, quantity: number) => {
    hydrateCart()
    const itemToUpdate = items.value.find((item) => getCartItemKey(item) === key)
    const product = itemToUpdate
      ? products.find((productItem) => productItem.slug === itemToUpdate.slug)
      : undefined

    if (quantity < 1 || !product || getProductStockLimit(product) < 1) {
      items.value = items.value.filter((item) => getCartItemKey(item) !== key)
    } else {
      items.value = items.value.map((item) =>
        getCartItemKey(item) === key
          ? {
              ...item,
              quantity: clampQuantity(product, quantity),
            }
          : item,
      )
    }

    persistCart()
  }

  const updateSize = (key: string, size: string) => {
    hydrateCart()

    items.value = items.value.map((item) => {
      if (getCartItemKey(item) !== key) {
        return item
      }

      const product = products.find((productItem) => productItem.slug === item.slug)

      return {
        ...item,
        size: product ? normalizeSize(product, size) : undefined,
      }
    })

    persistCart()
  }

  const updateColour = (key: string, colour: string) => {
    hydrateCart()

    const nextItems = [...items.value]
    const itemIndex = nextItems.findIndex((item) => getCartItemKey(item) === key)
    const item = nextItems[itemIndex]

    if (!item) {
      return
    }

    const product = products.find((productItem) => productItem.slug === item.slug)

    if (!product) {
      return
    }

    const nextColour = normalizeColour(product, colour)

    if (!nextColour || nextColour === item.colour) {
      return
    }

    const existingIndex = nextItems.findIndex(
      (nextItem, index) =>
        index !== itemIndex &&
        nextItem.slug === item.slug &&
        normalizeColour(product, nextItem.colour) === nextColour,
    )

    if (existingIndex >= 0) {
      const existingItem = nextItems[existingIndex]

      if (!existingItem) {
        return
      }

      nextItems[existingIndex] = {
        ...existingItem,
        quantity: clampQuantity(product, existingItem.quantity + item.quantity),
        size: existingItem.size ?? item.size,
        colour: nextColour,
      }
      nextItems.splice(itemIndex, 1)
    } else {
      nextItems[itemIndex] = {
        ...item,
        colour: nextColour,
      }
    }

    items.value = nextItems
    persistCart()
  }

  const removeFromCart = (key: string) => {
    hydrateCart()
    items.value = items.value.filter((item) => getCartItemKey(item) !== key)
    persistCart()
  }

  const clearCart = () => {
    hydrateCart()
    items.value = []
    persistCart()
  }

  const lines = computed<CartLine[]>(() =>
    items.value
      .map((item): CartLine | undefined => {
        const product = products.find((productItem) => productItem.slug === item.slug)

        if (!product) {
          return undefined
        }

        if (getProductStockLimit(product) < 1) {
          return undefined
        }

        const quantity = clampQuantity(product, item.quantity)

        return {
          ...item,
          key: getCartItemKey(item),
          quantity,
          colour: normalizeColour(product, item.colour),
          product,
          lineTotalKes: product.priceKes * quantity,
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
    updateSize,
    updateColour,
    removeFromCart,
    clearCart,
    hydrateCart,
  }
}
