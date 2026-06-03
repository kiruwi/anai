<template>
  <section class="shop-the-look">
    <div class="shop-the-look__inner container">
      <div class="shop-the-look__image">
        <img
          src="/images/products/Nuru, Short Set/brown.webp"
          alt="Nuru Short Set styling"
          width="720"
          height="720"
          loading="lazy"
          decoding="async"
        />
      </div>
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
  position: relative;
  min-height: 62rem;
  overflow: hidden;
  background: linear-gradient(135deg, var(--colour-plum), var(--colour-clay));
}

.shop-the-look__image::after {
  position: absolute;
  inset: 0;
  content: "";
  background: linear-gradient(rgba(0, 0, 0, 0.02), rgba(0, 0, 0, 0.32));
  pointer-events: none;
}

.shop-the-look__image img {
  width: 100%;
  height: 100%;
  min-height: inherit;
  object-fit: cover;
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
