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
      <button class="product-card__quick-add" type="button">Quick add</button>
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
let imageAnimation: gsap.core.Tween | undefined

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
