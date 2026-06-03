<template>
  <article class="product-card" :class="{ 'product-card--pending': isPhotoPending }">
    <NuxtLink
      class="product-card__image"
      :to="`/product/${product.slug}`"
      :aria-label="`View ${product.name}`"
    >
      <img
        ref="photoElement"
        class="product-card__photo"
        :src="selectedImageUrl"
        :alt="product.name"
      />
      <img
        v-if="hoverImageUrl"
        class="product-card__photo product-card__photo--hover"
        :src="hoverImageUrl"
        alt=""
        aria-hidden="true"
      />
      <span class="product-card__arrow" aria-hidden="true" />
    </NuxtLink>
    <div class="product-card__body">
      <h3>{{ product.name }}</h3>
      <strong>KES {{ product.priceKes.toLocaleString() }}</strong>
      <p class="product-card__category">{{ product.category }}</p>
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
import { gsap } from 'gsap'
import type { HomepageProduct, ProductColour } from '../../data/homeContent'

const props = defineProps<{
  product: HomepageProduct
  hideActions?: boolean
}>()

const selectedImageUrl = ref(props.product.imageUrl)
const isPhotoPending = ref(true)
const photoElement = ref<HTMLImageElement | null>(null)
const hasJustAdded = ref(false)
const { addToCart } = useCart()
let imageAnimation: gsap.core.Tween | undefined
let addedTimer: number | undefined

const hoverImageUrl = computed(() => {
  const colourImages = props.product.colours
    .filter((colour): colour is Exclude<ProductColour, string> =>
      typeof colour !== 'string' && Boolean(colour.imageUrl),
    )
    .map((colour) => ({
      ...colour,
      imageUrl: colour.imageUrl as string,
    }))

  const getWarmColourPriority = (colour: (typeof colourImages)[number]) => {
    const label = colour.name.toLowerCase()
    const value = colour.value.toLowerCase()

    if (label.includes('red') || label.includes('burgundy') || value.startsWith('#9') || value.startsWith('#a')) {
      return 1
    }

    if (label.includes('pink') || label.includes('clay') || value.startsWith('#c6') || value.startsWith('#d8')) {
      return 2
    }

    if (label.includes('brown') || value.startsWith('#6f')) {
      return 3
    }

    return 0
  }
  const preferredColour = [...colourImages]
    .filter((colour) => getWarmColourPriority(colour) > 0)
    .sort((colourA, colourB) => getWarmColourPriority(colourA) - getWarmColourPriority(colourB))[0]
  const fallbackColour = colourImages.find((colour) => colour.imageUrl !== selectedImageUrl.value)
  const galleryFallback = props.product.galleryImages?.find((imageUrl) => imageUrl !== selectedImageUrl.value)

  return preferredColour?.imageUrl ?? fallbackColour?.imageUrl ?? galleryFallback
})
const quickAddLabel = computed(() => (hasJustAdded.value ? 'Added' : 'Quick add'))

watch(
  () => props.product.imageUrl,
  (imageUrl) => {
    selectedImageUrl.value = imageUrl
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

onMounted(() => {
  gsap.set(photoElement.value, {
    opacity: 0,
    x: -72,
  })

  isPhotoPending.value = false

  imageAnimation = gsap.to(photoElement.value, {
    opacity: 1,
    x: 0,
    duration: 0.95,
    delay: gsap.utils.random(0, 0.28, 0.01),
    ease: 'power3.out',
    clearProps: 'opacity,transform',
  })
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

.product-card__image {
  position: relative;
  display: block;
  aspect-ratio: 4 / 5;
  overflow: hidden;
}

.product-card__image::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.16));
  content: '';
  pointer-events: none;
}

.product-card__photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  gap: var(--space-md);
  margin-top: var(--space-sm);
}

.product-card__category {
  grid-column: 1;
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
  font-size: 1.2rem;
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
  font-weight: 400;
  letter-spacing: 0.04em;
}

strong {
  grid-column: 2;
  grid-row: 1;
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
    grid-template-columns: 1fr;
    gap: var(--space-xs);
  }

  strong {
    grid-column: 1;
    grid-row: auto;
  }
}
</style>
