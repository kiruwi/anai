<template>
  <section class="product-rail">
    <div class="container">
      <SectionHeader v-if="title || (action && href)" :title="title" :action="action" :href="href" />
      <div class="product-rail__track">
        <ProductCard
          v-for="product in products"
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
import SectionHeader from '../shared/SectionHeader.vue'

defineProps<{
  title?: string
  products: HomepageProduct[]
  action?: string
  href?: string
}>()
</script>

<style scoped>
.product-rail {
  padding: var(--space-lg) 0 var(--space-2xl);
}

.product-rail__track {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--page-gutter);
}

@media (max-width: 680px) {
  .product-rail__track {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
