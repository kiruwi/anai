<template>
  <section class="wishlist-page container">
    <header class="wishlist-page__header">
      <h1>Saved pieces</h1>
    </header>

    <div v-if="lines.length" class="wishlist-page__grid">
      <ProductCard
        v-for="line in lines"
        :key="line.slug"
        :product="line.product"
      />
    </div>

    <div v-else class="wishlist-page__empty">
      <p>Your wishlist is empty.</p>
      <NuxtLink to="/shop">Continue shopping</NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import ProductCard from '../../components/product/ProductCard.vue'

const { lines } = useWishlist()
</script>

<style scoped>
.wishlist-page {
  padding: var(--space-2xl) 0;
}

.wishlist-page__header {
  margin-bottom: var(--space-xl);
}

h1 {
  margin: 0;
  font-size: clamp(5.2rem, 8vw, 10rem);
  line-height: 0.92;
  text-align: start;
}

.wishlist-page__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--page-gutter);
}

.wishlist-page__empty {
  display: grid;
  justify-items: start;
  gap: var(--space-md);
}

.wishlist-page__empty p {
  margin: 0;
  color: var(--colour-muted);
  text-transform: uppercase;
}

.wishlist-page__empty a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--colour-black);
  padding: 1.2rem 1.6rem;
  text-transform: uppercase;
}

@media (max-width: 900px) {
  .wishlist-page__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .wishlist-page__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
