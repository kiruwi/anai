<template>
  <section class="shop-the-look">
    <div class="shop-the-look__inner container">
      <div class="shop-the-look__image" />
      <div class="shop-the-look__content">
        <SectionHeader title="Shop the look" />
        <div class="shop-the-look__list">
          <article v-for="look in looks" :key="look.title">
            <h3>{{ look.title }}</h3>
            <p>{{ look.products.join(' + ') }}</p>
          </article>
        </div>
        <NuxtLink to="/shop-the-look">Add full look</NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import SectionHeader from '../shared/SectionHeader.vue'

defineProps<{
  looks: Array<{
    title: string
    products: string[]
  }>
}>()
</script>

<style scoped>
.shop-the-look {
  padding: var(--space-2xl) 0;
  background: var(--colour-black);
}

.shop-the-look__inner {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(32rem, 0.9fr);
  gap: var(--page-gutter);
  color: var(--colour-white);
}

.shop-the-look__image {
  min-height: 62rem;
  background:
    linear-gradient(rgba(0, 0, 0, 0.02), rgba(0, 0, 0, 0.32)),
    url('https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=1200&q=80'),
    linear-gradient(135deg, var(--colour-plum), var(--colour-clay));
  background-position: center;
  background-size: cover;
}

.shop-the-look__content {
  align-self: center;
}

.shop-the-look__content :deep(p) {
  color: rgba(255, 255, 255, 0.68);
}

.shop-the-look__list {
  display: grid;
  gap: var(--space-sm);
}

article {
  border-top: 1px solid rgba(255, 255, 255, 0.24);
  padding: var(--space-md) 0;
}

h3,
p {
  margin: 0;
}

h3 {
  font-size: 2rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

p {
  margin-top: var(--space-xs);
  color: rgba(255, 255, 255, 0.72);
}

a {
  display: inline-flex;
  margin-top: var(--space-md);
  padding: 1.2rem 1.8rem;
  border-radius: var(--radius-sm);
  color: var(--colour-black);
  background: var(--colour-surface);
  text-transform: uppercase;
}

@media (max-width: 860px) {
  .shop-the-look__inner {
    grid-template-columns: 1fr;
  }

  .shop-the-look__image {
    min-height: 42rem;
  }
}
</style>
