<template>
  <section ref="productPageElement" class="product-page">
    <div class="product-page__media">
      <div ref="carouselElement" class="product-page__carousel" aria-label="Product photos">
        <div
          v-for="(imageUrl, index) in galleryImages"
          :key="imageUrl"
          :ref="(element) => setSlideRef(element, index)"
          class="product-page__slide"
        >
          <img :src="imageUrl" :alt="`${product.name} photo ${index + 1}`" />
        </div>
      </div>
    </div>
    <div class="product-page__details">
      <NuxtLink class="product-page__back" to="/" aria-label="Return to shop">
        <span aria-hidden="true">←</span>
        Return to Shop
      </NuxtLink>

      <h1>{{ product.name }}</h1>
      <p class="product-page__price">KES {{ product.priceKes.toLocaleString() }}</p>
      <p class="product-page__copy">{{ productCopy }}</p>
      <button class="product-page__add" type="button">
        Add to Bag
        <span aria-hidden="true">↗</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { gsap } from 'gsap'
import type { ComponentPublicInstance } from 'vue'
import { products } from '../../data/homeContent'

const route = useRoute()
const product = products.find((item) => item.slug === route.params.slug)

if (!product) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Product not found',
  })
}

const productCopy =
  product.category === 'Outerwear'
    ? 'A soft layer for movement, warmth, and everyday ease.'
    : 'A soft essential made for movement, rhythm, and everyday ease.'

const colourImageUrls = product.colours
  .map((colour) => (typeof colour === 'string' ? undefined : colour.imageUrl))
  .filter((imageUrl): imageUrl is string => Boolean(imageUrl))

const galleryImages = [...new Set(product.galleryImages ?? [product.imageUrl, ...colourImageUrls])]
const productPageElement = ref<HTMLElement | null>(null)
const carouselElement = ref<HTMLDivElement | null>(null)
const slideElements = ref<HTMLDivElement[]>([])
let galleryAnimation: gsap.core.Tween | undefined
let galleryWheelLock: number | undefined
let galleryIndex = 0

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

onMounted(() => {
  window.addEventListener('wheel', handleProductWheel, { capture: true, passive: false })

  const slides = slideElements.value.filter(Boolean)
  const randomSlides = gsap.utils.shuffle([...slides])

  gsap.set(slides, {
    opacity: 0,
    x: -96,
  })

  galleryAnimation = gsap.to(randomSlides, {
    opacity: 1,
    x: 0,
    duration: 0.95,
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

.product-page__slide {
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
  overflow: visible;
}

.product-page__back {
  display: inline-flex;
  align-items: center;
  gap: var(--space-md);
  width: fit-content;
  margin-bottom: var(--space-lg);
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
  font-size: clamp(5.2rem, 6vw, 9.6rem);
  font-weight: 400;
  letter-spacing: 0;
  line-height: 0.92;
}

.product-page__price {
  margin: var(--space-lg) 0 0;
  font-size: clamp(3.2rem, 3.6vw, 5.2rem);
  font-weight: 600;
  line-height: 1;
}

.product-page__copy {
  max-width: 52rem;
  margin: var(--space-lg) 0 0;
  font-size: clamp(2rem, 2vw, 2.8rem);
  line-height: 1.22;
}

.product-page__add {
  display: inline-flex;
  align-items: center;
  gap: var(--space-md);
  width: fit-content;
  margin-top: var(--space-lg);
  border: 0;
  padding: 0;
  color: #827d79;
  background: transparent;
  cursor: pointer;
  font-size: clamp(2rem, 2vw, 2.8rem);
  line-height: 1;
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
    font-size: clamp(2rem, 6vw, 3rem);
  }

  .product-page__add {
    margin-top: var(--space-xl);
    font-size: clamp(2rem, 6vw, 3rem);
  }
}
</style>
