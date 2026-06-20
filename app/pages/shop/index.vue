<template>
  <section class="shop-page">
    <div class="container">
      <header class="shop-page__header">
        <h1>{{ pageTitle }}</h1>
      </header>

      <div v-if="visibleProducts.length" class="shop-page__grid">
        <ProductCard
          v-for="product in visibleProducts"
          :key="product.slug"
          :product="product"
          hide-actions
        />
      </div>

      <div v-else class="shop-page__empty">
        <p>No products available</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { products } from '../../data/homeContent'
import ProductCard from '../../components/product/ProductCard.vue'

const route = useRoute()

const selectedGender = computed(() => {
  const gender = route.query.gender

  return typeof gender === 'string' ? gender.toLowerCase() : ''
})

const selectedCategory = computed(() => {
  const category = route.query.category

  return typeof category === 'string' ? category.toLowerCase() : ''
})

const isNewInSelected = computed(() => route.query.new === 'true')

const categoryLabel = computed(() => {
  const product = products.find((item) => item.category.toLowerCase() === selectedCategory.value)

  return product?.category || ''
})

const pageTitle = computed(() => {
  if (isNewInSelected.value) {
    return 'New in'
  }

  if (categoryLabel.value) {
    return categoryLabel.value
  }

  if (selectedGender.value === 'women') {
    return 'Women'
  }

  if (selectedGender.value === 'men') {
    return 'Men'
  }

  return 'All products'
})

const visibleProducts = computed(() => {
  if (selectedGender.value === 'men') {
    return []
  }

  if (isNewInSelected.value) {
    return products.filter((product) => product.isNew)
  }

  if (selectedCategory.value) {
    return products.filter((product) => product.category.toLowerCase() === selectedCategory.value)
  }

  return products
})
</script>

<style scoped>
.shop-page {
  padding: var(--space-2xl) 0;
}

.shop-page__header {
  margin-bottom: var(--space-xl);
}

h1 {
  margin: 0;
  font-family: var(--font-brand-display);
  font-size: clamp(4.8rem, 7vw, 9.6rem);
  font-weight: 400;
  letter-spacing: 0.055em;
  line-height: 0.92;
  text-transform: uppercase;
}

.shop-page__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--page-gutter);
}

.shop-page__empty {
  display: grid;
  min-height: 42rem;
  place-items: center;
  background: var(--colour-black);
  color: var(--colour-white);
}

.shop-page__empty p {
  margin: 0;
  font-size: var(--copy-font-size);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-align: center;
  text-transform: uppercase;
}

@media (max-width: 900px) {
  .shop-page__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .shop-page {
    padding-top: var(--space-xl);
  }

  .shop-page__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
