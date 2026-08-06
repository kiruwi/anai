<template>
  <section class="product-rail">
    <div class="product-rail__benefits">
      <ul class="product-rail__benefits-inner container" aria-label="Clothing features">
        <li>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5M4 4l6 6M20 4l-6 6M4 20l6-6M20 20l-6-6" />
          </svg>
          <span>4-way stretch</span>
        </li>
        <li>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 21c-2-3 2-4 0-7s2-4 0-7 2-4 1-6M12 21c-2-3 2-4 0-7s2-4 0-7 2-4 1-6M17 21c-2-3 2-4 0-7s2-4 0-7 2-4 1-6" />
          </svg>
          <span>Breathable</span>
        </li>
        <li>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="16.5" cy="4.5" r="2" />
            <path d="m11 8 3-1.5 2.5 3 3 .5M14 8.5l-2 4.5-4 2M13 13l3 2 1.5 5M9.5 6H5M8 9H3M7 12H4" />
          </svg>
          <span>Made for motion</span>
        </li>
        <li>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 4C12 4 6 8.5 6 15c0 2.5 1.5 4 4 4 6.5 0 10-7 10-15Z" />
            <path d="M4 21c3.5-5 7.5-8.5 12-11M8 16h5M12 12V8" />
          </svg>
          <span>Soft material</span>
        </li>
      </ul>
    </div>

    <div class="product-rail__content container">
      <header v-if="title || (action && href)" class="product-rail__header">
        <h2 v-if="title">{{ title }}</h2>
        <span v-if="title" class="product-rail__rule" aria-hidden="true" />
        <NuxtLink v-if="action && href" :to="href">
          {{ action }}
          <span aria-hidden="true">→</span>
        </NuxtLink>
      </header>
      <div class="product-rail__track">
        <ProductCard
          v-for="product in visibleProducts"
          :key="product.slug"
          :product="product"
          hide-actions
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { HomepageProduct } from '../../data/homeContent'
import ProductCard from '../product/ProductCard.vue'

const props = defineProps<{
  title?: string
  products: HomepageProduct[]
  action?: string
  href?: string
}>()

const visibleProducts = computed(() => props.products.slice(0, 4))
</script>

<style scoped>
.product-rail {
  padding-bottom: var(--space-2xl);
}

.product-rail__benefits {
  color: var(--colour-black);
  background: var(--colour-cream);
}

.product-rail__benefits-inner {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-block: 0;
  padding-block: var(--space-md);
  list-style: none;
}

.product-rail__benefits li {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding-inline: var(--space-md);
  font-size: 1.2rem;
  letter-spacing: 0.055em;
  line-height: 1.15;
  text-transform: uppercase;
}

.product-rail__benefits li + li {
  border-left: 1px solid rgba(0, 0, 0, 0.2);
}

.product-rail__benefits svg {
  width: 2.4rem;
  height: 2.4rem;
  flex: 0 0 auto;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.5;
}

.product-rail__content {
  padding-top: var(--space-lg);
}

.product-rail__header {
  display: grid;
  grid-template-columns: max-content minmax(8rem, 1fr) max-content;
  gap: var(--space-lg);
  align-items: center;
  margin-bottom: var(--space-lg);
}

.product-rail__header h2 {
  margin: 0;
  font-family: var(--font-brand-display);
  font-size: clamp(3.2rem, 4vw, 5.6rem);
  font-weight: 400;
  letter-spacing: 0.055em;
  line-height: 1;
  white-space: nowrap;
}

.product-rail__rule {
  display: block;
  align-self: center;
  height: 1px;
  background: var(--colour-border);
}

.product-rail__header a {
  display: inline-flex;
  gap: var(--space-sm);
  align-items: center;
  flex: 0 0 auto;
  font-size: 1.2rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}

.product-rail__header a span {
  font-size: 1.8rem;
  line-height: 1;
  transition: transform 180ms ease;
}

.product-rail__header a:hover span {
  transform: translateX(0.3rem);
}

.product-rail__track {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--page-gutter);
}

@media (max-width: 680px) {
  .product-rail__benefits-inner {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding-block: 0;
  }

  .product-rail__benefits li {
    justify-content: flex-start;
    padding: 1.2rem var(--space-sm);
  }

  .product-rail__benefits li + li {
    border-left: 0;
  }

  .product-rail__benefits li:nth-child(even) {
    border-left: 1px solid rgba(0, 0, 0, 0.2);
  }

  .product-rail__benefits li:nth-child(n + 3) {
    border-top: 1px solid rgba(0, 0, 0, 0.2);
  }

  .product-rail__benefits svg {
    width: 2rem;
    height: 2rem;
  }

  .product-rail__header {
    grid-template-columns: max-content minmax(1.6rem, 1fr) max-content;
    gap: var(--space-sm);
    align-items: center;
    margin-bottom: 0;
    padding: var(--space-xl) 0;
  }

  .product-rail__content {
    padding-top: 0;
  }

  .product-rail__track {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
