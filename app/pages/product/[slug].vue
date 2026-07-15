<template>
  <section
    ref="productPageElement"
    class="product-page"
    :class="{ 'product-page--sold-out': isSoldOut }"
  >
    <div class="product-page__media">
      <div
        v-if="galleryImages.length"
        ref="carouselElement"
        class="product-page__carousel"
        aria-label="Product photos"
      >
        <div
          v-for="(imageUrl, index) in galleryImages"
          :key="imageUrl"
          :ref="(element) => setSlideRef(element, index)"
          class="product-page__slide"
        >
          <img
            :src="imageUrl"
            :alt="`${product.name} photo ${index + 1}`"
            width="720"
            height="720"
            :loading="index === 0 ? 'eager' : 'lazy'"
            :fetchpriority="index === 0 ? 'high' : 'auto'"
            decoding="async"
          />
        </div>
      </div>
      <div v-else class="product-page__media-placeholder">
        <span>Coming soon</span>
      </div>
      <span
        v-if="productBadgeLabel"
        class="product-page__badge"
        :class="{ 'product-page__badge--sold-out': isSoldOut }"
      >
        {{ productBadgeLabel }}
      </span>
    </div>
    <div class="product-page__details">
      <NuxtLink class="product-page__back" to="/" aria-label="Return to shop">
        <span aria-hidden="true">←</span>
        Return to Shop
      </NuxtLink>

      <h1>{{ product.name }}</h1>
      <p class="product-page__price">KES {{ product.priceKes.toLocaleString() }}</p>
      <p class="product-page__copy">{{ productCopy }}</p>
      <div v-if="product.colours.length" class="product-page__colours">
        <p>
          Colour
          <span>{{ selectedColourName ?? 'Out of stock' }}</span>
        </p>
        <div>
          <button
            v-for="colour in product.colours"
            :key="getProductColourName(colour)"
            class="product-page__colour"
            :class="{
              'product-page__colour--selected': selectedColourName === getProductColourName(colour),
              'product-page__colour--unavailable': !isProductColourAvailable(colour),
            }"
            type="button"
            :disabled="!isProductColourAvailable(colour)"
            :aria-label="`${getProductColourName(colour)}${isProductColourAvailable(colour) ? '' : ' — out of stock'}`"
            :aria-pressed="selectedColourName === getProductColourName(colour)"
            :title="isProductColourAvailable(colour) ? getProductColourName(colour) : `${getProductColourName(colour)} — out of stock`"
            :style="{ background: getProductColourValue(colour) }"
            @click="selectedColourName = getProductColourName(colour)"
          />
        </div>
      </div>
      <div class="product-page__actions">
        <button
          class="product-page__add"
          type="button"
          :disabled="isSoldOut"
          @click="handleAddToCart"
        >
          {{ addButtonLabel }}
          <span aria-hidden="true">↗</span>
        </button>
        <button
          class="product-page__wishlist"
          type="button"
          :aria-pressed="isWishlistSaved"
          @click="handleWishlistToggle"
        >
          {{ isWishlistSaved ? 'Saved' : 'Add to Wishlist' }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import {
  getProductBadgeLabel,
  getProductColourName,
  getProductColourValue,
  getProductDefaultColourName,
  isProductColourAvailable,
  isProductOutOfStock,
  products,
} from '../../data/homeContent'

const route = useRoute()
const { addToCart } = useCart()
const { toggleWishlist, isInWishlist } = useWishlist()
const product = products.find((item) => item.slug === route.params.slug)

if (!product) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Product not found',
  })
}

const fallbackProductCopyByCategory: Record<string, string> = {
  Outerwear: 'A soft layer for movement, warmth, and everyday ease.',
  Tops: 'A movement-ready top made for training, layering, and everyday wear.',
  Bottoms: 'A movement-ready bottom made for training, court days, and everyday wear.',
  Sets: 'A coordinated two-piece set made for movement and everyday wear.',
}

const productCopy = product.description
  ?? fallbackProductCopyByCategory[product.category]
  ?? 'A movement-ready essential for training and everyday wear.'

const colourImageUrls = product.colours
  .map((colour) => (typeof colour === 'string' ? undefined : colour.imageUrl))
  .filter((imageUrl): imageUrl is string => Boolean(imageUrl))

const galleryImages = [
  ...new Set(product.galleryImages ?? [product.imageUrl, ...colourImageUrls]),
].filter((imageUrl): imageUrl is string => Boolean(imageUrl))
const productPageElement = ref<HTMLElement | null>(null)
const carouselElement = ref<HTMLDivElement | null>(null)
const slideElements = ref<HTMLDivElement[]>([])
const selectedColourName = ref(getProductDefaultColourName(product))
const hasJustAdded = ref(false)
let galleryAnimation: { kill: () => void } | undefined
let galleryWheelLock: number | undefined
let addedTimer: number | undefined
let galleryIndex = 0

const isSoldOut = computed(() => isProductOutOfStock(product))
const productBadgeLabel = computed(() => getProductBadgeLabel(product))
const addButtonLabel = computed(() => {
  if (isSoldOut.value) {
    return 'Out of stock'
  }

  return hasJustAdded.value ? 'Added to Bag' : 'Add to Bag'
})
const isWishlistSaved = computed(() => isInWishlist(product.slug))

const isDesktopGallery = () => window.matchMedia('(min-width: 981px)').matches

const handleProductWheel = (event: WheelEvent) => {
  const productPage = productPageElement.value
  const carousel = carouselElement.value
  const slides = slideElements.value.filter(Boolean)

  if (
    !productPage ||
    !carousel ||
    slides.length < 2 ||
    !isDesktopGallery() ||
    !(event.target instanceof Node) ||
    !productPage.contains(event.target)
  ) {
    return
  }

  const scrollAmount = Math.abs(event.deltaY) >= Math.abs(event.deltaX)
    ? event.deltaY
    : event.deltaX

  if (scrollAmount === 0) {
    return
  }

  const isScrollingDown = scrollAmount > 0
  const isAtFirstImage = galleryIndex <= 0
  const isAtLastImage = galleryIndex >= slides.length - 1

  if ((isScrollingDown && isAtLastImage) || (!isScrollingDown && isAtFirstImage)) {
    return
  }

  event.preventDefault()
  event.stopImmediatePropagation()

  if (galleryWheelLock) {
    return
  }

  galleryIndex = isScrollingDown
    ? Math.min(galleryIndex + 1, slides.length - 1)
    : Math.max(galleryIndex - 1, 0)
  const targetSlide = slides[galleryIndex]

  if (!targetSlide) {
    return
  }

  carousel.scrollTo({
    top: targetSlide.offsetTop,
    behavior: 'smooth',
  })

  galleryWheelLock = window.setTimeout(() => {
    galleryWheelLock = undefined
  }, 520)
}

const setSlideRef = (
  element: Element | ComponentPublicInstance | null,
  index: number,
) => {
  if (element instanceof HTMLDivElement) {
    slideElements.value[index] = element
  }
}

const handleAddToCart = () => {
  if (isSoldOut.value) {
    return
  }

  addToCart(product, 1, { colour: selectedColourName.value })
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
  toggleWishlist(product)
}

onMounted(async () => {
  window.addEventListener('wheel', handleProductWheel, { capture: true, passive: false })

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const isMobile = window.matchMedia('(max-width: 980px)').matches

  if (prefersReducedMotion || isMobile) {
    return
  }

  const { gsap } = await import('gsap')
  const slides = slideElements.value.filter(Boolean)

  if (!slides.length) {
    return
  }

  const randomSlides = gsap.utils.shuffle([...slides])

  gsap.set(slides, {
    opacity: 0,
    x: -48,
  })

  galleryAnimation = gsap.to(randomSlides, {
    opacity: 1,
    x: 0,
    duration: 0.56,
    ease: 'power3.out',
    stagger: 0.12,
    clearProps: 'opacity,transform',
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('wheel', handleProductWheel, { capture: true })
  if (galleryWheelLock) {
    window.clearTimeout(galleryWheelLock)
  }
  if (addedTimer) {
    window.clearTimeout(addedTimer)
  }
  galleryAnimation?.kill()
})
</script>

<style scoped>
.product-page {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(34rem, 0.92fr);
  gap: var(--space-xl);
  height: calc(100vh - 7.2rem);
  min-height: 62rem;
  overflow: hidden;
  padding: var(--space-xl) var(--page-gutter);
}

.product-page__media {
  position: relative;
  min-height: 0;
  overflow: hidden;
}

.product-page--sold-out .product-page__carousel,
.product-page--sold-out .product-page__media-placeholder {
  filter: grayscale(1);
  opacity: 0.42;
}

.product-page__badge {
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
  z-index: 4;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 3rem;
  padding: 0.7rem 1rem;
  color: var(--colour-black);
  background: #8ee66f;
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
}

.product-page__badge--sold-out {
  color: var(--colour-white);
  background: var(--colour-black);
}

.product-page__carousel {
  display: flex;
  flex-direction: column;
  gap: var(--page-gutter);
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
  scrollbar-width: none;
}

.product-page__carousel::-webkit-scrollbar {
  display: none;
}

.product-page__media-placeholder {
  display: grid;
  place-items: center;
  width: 100%;
  aspect-ratio: 1 / 1;
  color: var(--colour-white);
  background: var(--colour-black);
  text-align: center;
  text-transform: uppercase;
}

.product-page__media-placeholder span {
  border: 1px solid currentColor;
  padding: 0.9rem 1.2rem;
  font-size: 1.3rem;
  letter-spacing: 0.08em;
}

.product-page__slide {
  position: relative;
  flex: 0 0 auto;
  width: 100%;
  aspect-ratio: 1 / 1;
  min-width: 0;
  overflow: hidden;
  scroll-snap-align: start;
  scroll-snap-stop: always;
}

.product-page__slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  transform: scale(1.12);
  transform-origin: center top;
}

.product-page__details {
  position: sticky;
  top: var(--space-xl);
  display: flex;
  flex-direction: column;
  align-self: start;
  max-height: calc(100vh - 7.2rem - (var(--space-xl) * 2));
  min-height: 0;
  overflow-y: auto;
  padding-right: var(--space-sm);
}

.product-page__back {
  display: inline-flex;
  align-items: center;
  gap: var(--space-md);
  width: fit-content;
  margin-bottom: var(--space-md);
  font-size: clamp(1.8rem, 1.8vw, 2.4rem);
  line-height: 1;
}

.product-page__back span {
  font-size: 1.4em;
  line-height: 0.8;
}

h1 {
  max-width: 58rem;
  margin: 0;
  font-family: var(--font-brand-display);
  font-size: clamp(4.8rem, 5vw, 7.6rem);
  font-weight: 400;
  letter-spacing: 0.055em;
  line-height: 0.9;
  text-align: start;
  text-wrap: balance;
  text-transform: uppercase;
}

.product-page__price {
  margin: var(--space-md) 0 0;
  font-size: clamp(3rem, 3.2vw, 4.8rem);
  font-weight: 600;
  line-height: 1;
}

.product-page__copy {
  max-width: 52rem;
  margin: var(--space-lg) 0 0;
  font-size: var(--copy-font-size);
  line-height: var(--copy-line-height);
}

.product-page__colours {
  display: grid;
  gap: var(--space-xs);
  margin-top: var(--space-lg);
}

.product-page__colours p {
  margin: 0;
  color: var(--colour-muted);
  font-size: var(--copy-font-size);
  text-transform: uppercase;
}

.product-page__colours p span {
  color: var(--colour-black);
}

.product-page__colours > div {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.product-page__colour {
  flex: 0 0 2.8rem;
  width: 2.8rem;
  height: 2.8rem;
  aspect-ratio: 1;
  box-sizing: border-box;
  border: 1px solid var(--colour-border);
  border-radius: 50%;
  padding: 0;
  cursor: pointer;
}

.product-page__colour--selected {
  outline: 1px solid var(--colour-black);
  outline-offset: 0.2rem;
}

.product-page__colour--unavailable {
  cursor: not-allowed;
  filter: grayscale(1);
  opacity: 0.3;
}

.product-page__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  align-items: center;
  margin-top: var(--space-lg);
}

.product-page__add,
.product-page__wishlist {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  cursor: pointer;
}

.product-page__add {
  gap: var(--space-md);
  border: 0;
  padding: 0;
  color: #827d79;
  background: transparent;
  font-size: clamp(2rem, 2vw, 2.8rem);
  line-height: 1;
}

.product-page__add:disabled {
  color: var(--colour-muted);
  cursor: not-allowed;
}

.product-page__wishlist {
  border: 1px solid var(--colour-black);
  padding: 1rem 1.2rem;
  color: var(--colour-black);
  background: var(--colour-surface);
  font-size: 1.2rem;
  line-height: 1;
  text-transform: uppercase;
}

.product-page__wishlist[aria-pressed='true'] {
  color: var(--colour-white);
  background: var(--colour-black);
}

.product-page__add span {
  font-size: 0.68em;
  line-height: 1;
}

@media (max-width: 980px) {
  .product-page {
    grid-template-columns: 1fr;
    gap: var(--space-lg);
    height: auto;
    min-height: calc(100vh - 6.4rem);
    overflow: visible;
  }

  .product-page__media {
    min-height: auto;
  }

  .product-page__carousel {
    flex-direction: row;
    height: auto;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x mandatory;
  }

  .product-page__slide {
    flex-basis: 80%;
  }

  .product-page__details {
    position: static;
    max-height: none;
    overflow: visible;
  }

  .product-page__slide img {
    aspect-ratio: 1;
  }

  .product-page__back {
    margin-bottom: var(--space-md);
    font-size: 1.8rem;
  }

  .product-page__back span {
    font-size: 3rem;
  }

  h1 {
    font-size: clamp(4.8rem, 15vw, 8rem);
  }

  .product-page__price {
    margin-top: var(--space-md);
    font-size: clamp(3.2rem, 10vw, 5.2rem);
  }

  .product-page__copy {
    margin-top: var(--space-md);
    font-size: var(--copy-font-size);
    line-height: var(--copy-line-height);
  }

  .product-page__actions {
    margin-top: var(--space-xl);
  }

  .product-page__add {
    font-size: clamp(2rem, 6vw, 3rem);
  }
}
</style>
