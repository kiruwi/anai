import {
  getProductColourName,
  getProductColourStockLimit,
  getProductDefaultColourName,
  products,
  type HomepageProduct,
} from '../data/homeContent'
import {
  clampCartQuantity,
  createHydratedCartWarning,
  createQuantityAdjustedNotification,
} from '#shared/lib/cartNotifications'

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

const getProductStockLimit = (product: HomepageProduct, colour?: string) =>
  getProductColourStockLimit(product, colour)

const getProductSizeLabels = (product: HomepageProduct) =>
  product.sizeOptions?.map((option) => option.label) ?? []

const getProductColourLabels = (product: HomepageProduct) =>
  product.colours
    .map((colour) => getProductColourName(colour))

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

export const getCartItemKey = (item: Pick<CartItem, 'slug' | 'colour' | 'size'>) =>
  `${item.slug}:${item.colour ?? ''}:${item.size ?? ''}`

type StoredCartResult = {
  items: CartItem[]
  removedItems: boolean
  quantityAdjustments: Array<{ product: HomepageProduct; quantity: number }>
}

const emptyStoredCart = (removedItems = false): StoredCartResult => ({
  items: [],
  removedItems,
  quantityAdjustments: [],
})

const getStoredCart = (
  getStockLimit: (product: HomepageProduct, colour?: string) => number = getProductStockLimit,
): StoredCartResult => {
  if (!import.meta.client) {
    return emptyStoredCart()
  }

  try {
    const storedValue = window.localStorage.getItem(CART_STORAGE_KEY)

    if (!storedValue) {
      return emptyStoredCart()
    }

    const parsedValue = JSON.parse(storedValue)

    if (!Array.isArray(parsedValue)) {
      return emptyStoredCart(true)
    }

    let removedItems = false
    const quantityAdjustments: StoredCartResult['quantityAdjustments'] = []
    const normalizedItems = parsedValue
      .map((item): CartItem | undefined => {
        if (!item || typeof item.slug !== 'string') {
          removedItems = true
          return undefined
        }

        const product = products.find((productItem) => productItem.slug === item.slug)
        const quantity = Number(item.quantity)

        const colour = product ? normalizeColour(product, item.colour ?? item.color) : undefined

        const stockLimit = product && colour ? getStockLimit(product, colour) : 0

        if (
          !product ||
          !Number.isFinite(quantity) ||
          quantity < 1 ||
          !colour ||
          stockLimit < 1
        ) {
          removedItems = true
          return undefined
        }

        const quantityResult = clampCartQuantity(quantity, stockLimit)
        if (quantityResult.wasAdjusted) {
          quantityAdjustments.push({ product, quantity: quantityResult.quantity })
        }

        return {
          slug: product.slug,
          quantity: quantityResult.quantity,
          size: normalizeSize(product, item.size),
          colour,
        }
      })
      .filter((item): item is CartItem => Boolean(item))

    const items = normalizedItems.reduce<CartItem[]>((mergedItems, item) => {
      const existingItem = mergedItems.find((candidate) => getCartItemKey(candidate) === getCartItemKey(item))
      const product = products.find((candidate) => candidate.slug === item.slug)
      if (!existingItem || !product) return [...mergedItems, item]
      const quantityResult = clampCartQuantity(
        existingItem.quantity + item.quantity,
        getStockLimit(product, item.colour),
      )
      existingItem.quantity = quantityResult.quantity
      if (quantityResult.wasAdjusted) {
        quantityAdjustments.push({ product, quantity: quantityResult.quantity })
      }
      return mergedItems
    }, [])

    return { items, removedItems, quantityAdjustments }
  } catch {
    return emptyStoredCart(true)
  }
}

export const useCart = () => {
  const items = useState<CartItem[]>('anai-cart-items', () => [])
  const isLoaded = useState('anai-cart-loaded', () => false)
  const hasShownHydrationWarning = useState('anai-cart-hydration-warning-shown', () => false)
  const { inventory, getProductStock } = useInventory()
  const { notify } = useNotifications()
  const getLiveStockLimit = (product: HomepageProduct, colour?: string) =>
    getProductStock(product, colour)
  const clampLiveQuantity = (product: HomepageProduct, quantity: number, colour?: string) =>
    clampCartQuantity(quantity, getLiveStockLimit(product, colour)).quantity

  const notifyQuantityAdjustment = (product: HomepageProduct, quantity: number) => {
    notify(createQuantityAdjustedNotification(product.name, quantity))
  }

  const notifyHydratedCartUpdate = () => {
    if (hasShownHydrationWarning.value) return
    hasShownHydrationWarning.value = true
    notify(createHydratedCartWarning())
  }

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

    const storedCart = getStoredCart(getLiveStockLimit)
    items.value = storedCart.items
    isLoaded.value = true

    if (storedCart.removedItems) {
      notifyHydratedCartUpdate()
    }

    for (const adjustment of storedCart.quantityAdjustments) {
      notifyQuantityAdjustment(adjustment.product, adjustment.quantity)
    }

    if (storedCart.removedItems || storedCart.quantityAdjustments.length) {
      persistCart()
    }
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

    const colour = normalizeColour(product, options.colour)

    if (!colour || getLiveStockLimit(product, colour) < 1) {
      return { added: false, quantity: 0, adjusted: false }
    }
    const size = normalizeSize(product, options.size)
    const existingItem = items.value.find((item) =>
      item.slug === product.slug &&
      normalizeColour(product, item.colour) === colour &&
      normalizeSize(product, item.size) === size,
    )

    const previousQuantity = existingItem?.quantity ?? 0
    const requestedQuantity = previousQuantity + quantity
    const quantityResult = clampCartQuantity(requestedQuantity, getLiveStockLimit(product, colour))

    if (existingItem) {
      existingItem.quantity = quantityResult.quantity
      existingItem.size = size
      existingItem.colour = colour
    } else {
      items.value = [
        ...items.value,
        {
          slug: product.slug,
          quantity: quantityResult.quantity,
          size,
          colour,
        },
      ]
    }

    persistCart()

    if (quantityResult.wasAdjusted) {
      notifyQuantityAdjustment(product, quantityResult.quantity)
    }

    return {
      added: quantityResult.quantity > previousQuantity,
      quantity: quantityResult.quantity,
      adjusted: quantityResult.wasAdjusted,
    }
  }

  const updateQuantity = (key: string, quantity: number) => {
    hydrateCart()
    const itemToUpdate = items.value.find((item) => getCartItemKey(item) === key)
    const product = itemToUpdate
      ? products.find((productItem) => productItem.slug === itemToUpdate.slug)
      : undefined

    const colour = product && itemToUpdate ? normalizeColour(product, itemToUpdate.colour) : undefined

    if (quantity < 1 || !product || !colour || getLiveStockLimit(product, colour) < 1) {
      items.value = items.value.filter((item) => getCartItemKey(item) !== key)
    } else {
      const quantityResult = clampCartQuantity(quantity, getLiveStockLimit(product, colour))
      items.value = items.value.map((item) =>
        getCartItemKey(item) === key
          ? {
              ...item,
              quantity: quantityResult.quantity,
            }
          : item,
      )

      if (quantityResult.wasAdjusted) {
        notifyQuantityAdjustment(product, quantityResult.quantity)
      }
    }

    persistCart()
  }

  const updateSize = (key: string, size: string) => {
    hydrateCart()

    const nextItems = [...items.value]
    const itemIndex = nextItems.findIndex((item) => getCartItemKey(item) === key)
    const item = nextItems[itemIndex]
    const product = item ? products.find((candidate) => candidate.slug === item.slug) : undefined
    if (!item || !product) return

    const nextSize = normalizeSize(product, size)
    const existingIndex = nextItems.findIndex(
      (candidate, index) =>
        index !== itemIndex &&
        candidate.slug === item.slug &&
        normalizeColour(product, candidate.colour) === normalizeColour(product, item.colour) &&
        normalizeSize(product, candidate.size) === nextSize,
    )

    if (existingIndex >= 0) {
      const existingItem = nextItems[existingIndex]
      if (!existingItem) return
      const quantityResult = clampCartQuantity(
        existingItem.quantity + item.quantity,
        getLiveStockLimit(product, existingItem.colour),
      )
      nextItems[existingIndex] = {
        ...existingItem,
        quantity: quantityResult.quantity,
        size: nextSize,
      }
      nextItems.splice(itemIndex, 1)
      if (quantityResult.wasAdjusted) {
        notifyQuantityAdjustment(product, quantityResult.quantity)
      }
    } else {
      nextItems[itemIndex] = { ...item, size: nextSize }
    }

    items.value = nextItems

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

    if (!nextColour || nextColour === item.colour || getLiveStockLimit(product, nextColour) < 1) {
      return
    }

    const existingIndex = nextItems.findIndex(
      (nextItem, index) =>
        index !== itemIndex &&
        nextItem.slug === item.slug &&
        normalizeColour(product, nextItem.colour) === nextColour &&
        normalizeSize(product, nextItem.size) === normalizeSize(product, item.size),
    )

    if (existingIndex >= 0) {
      const existingItem = nextItems[existingIndex]

      if (!existingItem) {
        return
      }

      const quantityResult = clampCartQuantity(
        existingItem.quantity + item.quantity,
        getLiveStockLimit(product, nextColour),
      )
      nextItems[existingIndex] = {
        ...existingItem,
        quantity: quantityResult.quantity,
        size: existingItem.size,
        colour: nextColour,
      }
      nextItems.splice(itemIndex, 1)
      if (quantityResult.wasAdjusted) {
        notifyQuantityAdjustment(product, quantityResult.quantity)
      }
    } else {
      const quantityResult = clampCartQuantity(item.quantity, getLiveStockLimit(product, nextColour))
      nextItems[itemIndex] = {
        ...item,
        colour: nextColour,
        quantity: quantityResult.quantity,
      }
      if (quantityResult.wasAdjusted) {
        notifyQuantityAdjustment(product, quantityResult.quantity)
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

  const reconcileCartStock = () => {
    if (!import.meta.client || !isLoaded.value) return

    let removedItems = false
    const adjustments: Array<{ product: HomepageProduct; quantity: number }> = []
    const reconciledItems = items.value
      .map((item): CartItem | undefined => {
        const product = products.find((candidate) => candidate.slug === item.slug)
        const colour = product ? normalizeColour(product, item.colour) : undefined
        const stockLimit = product && colour ? getLiveStockLimit(product, colour) : 0

        if (!product || !colour || stockLimit < 1) {
          removedItems = true
          return undefined
        }

        const quantityResult = clampCartQuantity(item.quantity, stockLimit)
        if (quantityResult.wasAdjusted) {
          adjustments.push({ product, quantity: quantityResult.quantity })
        }

        return {
          ...item,
          quantity: quantityResult.quantity,
          colour,
        }
      })
      .filter((item): item is CartItem => Boolean(item))

    if (!removedItems && !adjustments.length) return

    items.value = reconciledItems
    persistCart()

    if (removedItems) {
      notifyHydratedCartUpdate()
    }
    for (const adjustment of adjustments) {
      notifyQuantityAdjustment(adjustment.product, adjustment.quantity)
    }
  }

  const lines = computed<CartLine[]>(() =>
    items.value
      .map((item): CartLine | undefined => {
        const product = products.find((productItem) => productItem.slug === item.slug)

        if (!product) {
          return undefined
        }

        const colour = normalizeColour(product, item.colour)

        if (!colour || getLiveStockLimit(product, colour) < 1) {
          return undefined
        }

        const quantity = clampLiveQuantity(product, item.quantity, colour)

        return {
          ...item,
          key: getCartItemKey(item),
          quantity,
          colour,
          product,
          lineTotalKes: product.priceKes * quantity,
        }
      })
      .filter((line): line is CartLine => Boolean(line)),
  )

  const itemCount = computed(() =>
    lines.value.reduce((totalItems, line) => totalItems + line.quantity, 0),
  )
  const subtotalKes = computed(() =>
    lines.value.reduce((totalPrice, line) => totalPrice + line.lineTotalKes, 0),
  )

  if (import.meta.client) {
    onMounted(hydrateCart)
    watch(inventory, reconcileCartStock)
  }

  return {
    items,
    isLoaded,
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
