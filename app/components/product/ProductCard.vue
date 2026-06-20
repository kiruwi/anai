<template>
  <article class="product-card" :class="{ 'product-card--pending': isPhotoPending }">
    <div class="product-card__media">
      <NuxtLink
        class="product-card__image"
        :to="`/product/${product.slug}`"
        :aria-label="`View ${product.name}`"
      >
        <img
          v-if="selectedImageUrl"
          ref="photoElement"
          class="product-card__photo"
          :src="selectedImageUrl"
          :alt="product.name"
          width="341"
          height="341"
          loading="lazy"
          decoding="async"
        />
        <span v-else class="product-card__photo-placeholder">
          <span>Coming soon</span>
        </span>
        <img
          v-if="hoverImageUrl"
          class="product-card__photo product-card__photo--hover"
          :src="hoverImageUrl"
          :alt="`${product.name} alternate colour`"
          width="341"
          height="341"
          loading="lazy"
          decoding="async"
          aria-hidden="true"
        />
        <span class="product-card__arrow" aria-hidden="true" />
      </NuxtLink>
      <span class="product-card__badge">New</span>
      <button
        class="product-card__wishlist"
        type="button"
        :aria-pressed="isWishlistSaved"
        :aria-label="wishlistLabel"
        @click="handleWishlistToggle"
      >
        <svg
          class="product-card__wishlist-icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M12 21s-7.2-4.5-9.4-9.1C.9 8.2 2.9 4 6.8 4c2 0 3.7 1.1 4.7 2.7C12.5 5.1 14.2 4 16.2 4c3.9 0 5.9 4.2 4.2 7.9C19.2 16.5 12 21 12 21Z"
          />
        </svg>
      </button>
    </div>
    <div class="product-card__body">
      <p class="product-card__category">{{ product.category }}</p>
      <h3>{{ product.name }}</h3>
      <strong>KES {{ product.priceKes.toLocaleString() }}</strong>
    </div>
    <div v-if="!hideActions" class="product-card__footer">
      <div class="product-card__swatches" aria-label="Available colours">
        <button
          v-for="colour in product.colours"
          :key="getColourKey(colour)"
          class="product-card__swatch"
          type="button"
          :aria-label="`Show ${getColourName(colour)}`"
          :aria-pressed="selectedImageUrl === getColourImageUrl(colour)"
          :style="{ background: getColourValue(colour) }"
          @click="selectColour(colour)"
        />
      </div>
      <button class="product-card__quick-add" type="button" @click="handleQuickAdd">
        {{ quickAddLabel }}
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { HomepageProduct, ProductColour } from '../../data/homeContent'

const props = defineProps<{
  product: HomepageProduct
  hideActions?: boolean
}>()

const selectedImageUrl = ref(props.product.imageUrl ?? '')
const isPhotoPending = ref(true)
const photoElement = ref<HTMLImageElement | null>(null)
const hasJustAdded = ref(false)
const { toggleWishlist, isInWishlist } = useWishlist()
let imageAnimation: { kill: () => void } | undefined
let addedTimer: number | undefined
const imageAnimationSetupTimeoutMs = 3000

const isWishlistSaved = computed(() => isInWishlist(props.product.slug))
const wishlistLabel = computed(() =>
  isWishlistSaved.value
    ? `Remove ${props.product.name} from wishlist`
    : `Add ${props.product.name} to wishlist`,
)
const hoverImageUrl = computed(() => {
  if (props.product.hoverImageUrl && props.product.hoverImageUrl !== selectedImageUrl.value) {
    return props.product.hoverImageUrl
  }

  const colourImages = props.product.colours
    .filter((colour): colour is Exclude<ProductColour, string> =>
      typeof colour !== 'string' && Boolean(colour.imageUrl),
    )
    .map((colour) => ({
      ...colour,
      imageUrl: colour.imageUrl as string,
    }))

  const brownColour = colourImages.find((colour) => colour.name.toLowerCase().includes('brown'))
  const fallbackColour = colourImages.find((colour) => colour.imageUrl !== selectedImageUrl.value)
  const galleryFallback = props.product.galleryImages?.find((imageUrl) => imageUrl !== selectedImageUrl.value)

  return brownColour?.imageUrl ?? fallbackColour?.imageUrl ?? galleryFallback
})
const quickAddLabel = computed(() => (hasJustAdded.value ? 'Added' : 'Quick add'))

watch(
  () => props.product.imageUrl,
  (imageUrl) => {
    selectedImageUrl.value = imageUrl ?? ''
  },
)

const getColourName = (colour: ProductColour) =>
  typeof colour === 'string' ? colour : colour.name

const getColourValue = (colour: ProductColour) =>
  typeof colour === 'string' ? colour : colour.value

const getColourImageUrl = (colour: ProductColour) =>
  typeof colour === 'string' ? undefined : colour.imageUrl

const getColourKey = (colour: ProductColour) =>
  `${getColourName(colour)}-${getColourValue(colour)}`

const selectColour = (colour: ProductColour) => {
  const imageUrl = getColourImageUrl(colour)

  if (imageUrl) {
    selectedImageUrl.value = imageUrl
  }
}

const handleQuickAdd = () => {
  const { addToCart } = useCart()

  addToCart(props.product)
  hasJustAdded.value = true

  if (addedTimer) {
    window.clearTimeout(addedTimer)
  }

  addedTimer = window.setTimeout(() => {
    hasJustAdded.value = false
    addedTimer = undefined
  }, 1600)
}

const handleWishlistToggle = () => {
  toggleWishlist(props.product)
}

const loadAnimationModule = async () => {
  let timeoutId: ReturnType<typeof globalThis.setTimeout> | undefined

  try {
    return await Promise.race([
      import('gsap'),
      new Promise<never>((_, reject) => {
        timeoutId = globalThis.setTimeout(() => {
          reject(new Error('Timed out loading product image animation module.'))
        }, imageAnimationSetupTimeoutMs)
      }),
    ])
  } finally {
    if (timeoutId) {
      globalThis.clearTimeout(timeoutId)
    }
  }
}

onMounted(async () => {
  if (!selectedImageUrl.value) {
    isPhotoPending.value = false
    return
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const isMobile = window.matchMedia('(max-width: 680px)').matches

  if (prefersReducedMotion || isMobile) {
    isPhotoPending.value = false
    return
  }

  try {
    const { gsap } = await loadAnimationModule()

    gsap.set(photoElement.value, {
      opacity: 0,
      x: -36,
    })

    isPhotoPending.value = false

    imageAnimation = gsap.to(photoElement.value, {
      opacity: 1,
      x: 0,
      duration: 0.52,
      delay: gsap.utils.random(0, 0.12, 0.01),
      ease: 'power3.out',
      clearProps: 'opacity,transform',
    })
  } catch (error) {
    console.warn('[ANAI] Product image animation skipped:', error)
    isPhotoPending.value = false
  }
})

onBeforeUnmount(() => {
  if (addedTimer) {
    window.clearTimeout(addedTimer)
  }
  imageAnimation?.kill()
})
</script>

<style scoped>
.product-card {
  min-width: 0;
}

.product-card__media {
  position: relative;
}

.product-card__image {
  position: relative;
  display: block;
  aspect-ratio: 1 / 1;
  overflow: hidden;
}

.product-card__badge,
.product-card__wishlist {
  position: absolute;
  z-index: 4;
  top: var(--space-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 3rem;
  border: 0;
  padding: 0.7rem 1rem;
  color: var(--colour-black);
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
}

.product-card__badge {
  right: var(--space-sm);
  background: #8ee66f;
}

.product-card__wishlist {
  top: auto;
  right: var(--space-sm);
  bottom: var(--space-sm);
  width: 4.4rem;
  min-height: 4.4rem;
  padding: 0;
  border-radius: 50%;
  background: var(--colour-white);
  cursor: pointer;
}

.product-card__wishlist[aria-pressed='true'] {
  color: var(--colour-white);
  background: var(--colour-black);
}

.product-card__wishlist-icon {
  width: 2rem;
  height: 2rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
  transition:
    fill 160ms ease,
    transform 180ms ease;
}

.product-card__wishlist:hover .product-card__wishlist-icon,
.product-card__wishlist:focus-visible .product-card__wishlist-icon {
  transform: scale(0.86);
}

.product-card__wishlist:active .product-card__wishlist-icon {
  transform: scale(0.74);
}

.product-card__wishlist[aria-pressed='true'] .product-card__wishlist-icon {
  fill: currentColor;
}

.product-card__image::after {
  position: absolute;
  inset: 0;
  z-index: 2;
  background: linear-gradient(rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.16));
  content: '';
  pointer-events: none;
}

.product-card__photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-card__photo-placeholder {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  padding: var(--space-md);
  color: var(--colour-white);
  text-align: center;
  text-transform: uppercase;
  background: var(--colour-black);
}

.product-card__photo-placeholder span {
  position: relative;
  z-index: 3;
  border: 1px solid currentColor;
  padding: 0.8rem 1rem;
  font-size: 1.2rem;
  letter-spacing: 0.08em;
}

.product-card__photo--hover {
  position: absolute;
  inset: 0;
  z-index: 1;
  transform: translateX(101%);
  transition: transform 520ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.product-card:hover .product-card__photo--hover,
.product-card:focus-within .product-card__photo--hover {
  transform: translateX(0);
}

.product-card--pending .product-card__photo {
  opacity: 0;
  transform: translateX(-72px);
}

/* .product-card__arrow {
  position: absolute;
  bottom: var(--space-sm);
  left: var(--space-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 6.4rem;
  height: 6.4rem;
  border-radius: 50%;
  color: var(--colour-white);
  background: var(--colour-black);
}

.product-card__arrow::before {
  position: absolute;
  width: 2.8rem;
  height: 2.8rem;
  border-top: 0.4rem solid currentColor;
  border-right: 0.4rem solid currentColor;
  content: '';
  transform: translate(-0.2rem, 0.2rem);
}

.product-card__arrow::after {
  position: absolute;
  width: 3.4rem;
  height: 0.4rem;
  background: currentColor;
  content: '';
  transform: rotate(-45deg) translate(-0.1rem, 0);
  transform-origin: center;
} */

.product-card__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: flex-start;
  column-gap: var(--space-md);
  row-gap: 0.4rem;
  margin-top: var(--space-sm);
}

.product-card__category {
  grid-column: 1 / -1;
}

p,
h3 {
  margin: 0;
}

.product-card__category {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--colour-muted);
  font-size: var(--copy-font-size);
  text-transform: uppercase;
}

.product-card__category::before {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  background: currentColor;
  content: '';
}

h3,
strong {
  font-size: 1.5rem;
}

h3 {
  grid-column: 1;
  font-weight: 400;
  letter-spacing: 0.04em;
}

strong {
  grid-column: 2;
  font-weight: 600;
  white-space: nowrap;
}

.product-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

.product-card__swatches {
  display: flex;
  gap: 0.5rem;
}

.product-card__swatch {
  width: 1.4rem;
  height: 1.4rem;
  border: 1px solid var(--colour-border);
  border-radius: 50%;
  padding: 0;
  cursor: pointer;
}

.product-card__swatch[aria-pressed='true'] {
  outline: 1px solid var(--colour-black);
  outline-offset: 0.2rem;
}

.product-card__quick-add {
  border: 1px solid var(--colour-black);
  border-radius: var(--radius-sm);
  padding: 0.7rem 1rem;
  background: var(--colour-surface);
  cursor: pointer;
  font-size: 1.2rem;
  text-transform: uppercase;
}

@media (max-width: 680px) {
  .product-card__body {
    gap: var(--space-xs);
  }
}
</style>
