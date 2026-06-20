<template>
  <section class="shop-the-look">
    <div class="shop-the-look__inner container">
      <div class="shop-the-look__header">
        <h2>
          <span>Looks that</span>
          <span>move with you</span>
        </h2>
        <p>Curated sets for every kind of day.</p>
        <NuxtLink class="shop-the-look__button" to="/shop-the-look">Explore looks</NuxtLink>
      </div>

      <NuxtLink
        v-for="look in looks"
        :key="look.title"
        class="shop-the-look__card"
        :to="look.href"
        :aria-label="`Shop ${look.title}`"
      >
        <img
          :src="look.imageUrl"
          :alt="look.imageAlt"
          width="480"
          height="620"
          loading="lazy"
          decoding="async"
        />
        <span class="shop-the-look__overlay">
          <span class="shop-the-look__copy">
            <span class="shop-the-look__title">{{ look.title }}</span>
            <span class="shop-the-look__description">{{ look.products.join(' + ') }}</span>
          </span>
        </span>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ShopLook } from '../../data/homeContent'

defineProps<{
  looks: ShopLook[]
}>()
</script>

<style scoped>
.shop-the-look {
  padding: 1.2rem 0;
  background: var(--colour-black);
  color: var(--colour-white);
}

.shop-the-look__inner {
  --look-row-height: clamp(30rem, 24vw, 44rem);

  display: grid;
  grid-template-columns: minmax(38rem, 0.95fr) repeat(3, minmax(0, 1fr));
  gap: 1.2rem;
  align-items: stretch;
}

.shop-the-look__header {
  display: grid;
  align-content: center;
  justify-items: start;
  min-width: 0;
  min-height: 0;
  height: var(--look-row-height);
  overflow: hidden;
  padding: clamp(2.4rem, 3vw, 4.8rem);
  background: var(--colour-black);
  text-align: left;
}

h2,
p {
  margin: 0;
}

h2 {
  max-width: none;
  font-family: var(--font-brand-display);
  font-size: clamp(2.4rem, 2.35vw, 4rem);
  font-weight: 400;
  letter-spacing: 0.055em;
  line-height: 1;
  text-transform: uppercase;
}

h2 span {
  display: block;
  white-space: nowrap;
}

p {
  margin-top: var(--space-md);
  color: rgba(255, 255, 255, 0.78);
  font-size: var(--copy-font-size);
  white-space: nowrap;
}

.shop-the-look__button {
  display: inline-flex;
  margin-top: var(--space-lg);
  padding: 1.2rem 1.8rem;
  color: var(--colour-black);
  background: var(--colour-surface);
  font-size: 1.3rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border: 1px solid rgba(0, 0, 0, 0.16);
}

.shop-the-look__card {
  position: relative;
  display: block;
  min-width: 0;
  height: var(--look-row-height);
  overflow: hidden;
  color: var(--colour-white);
  background: #222;
}

.shop-the-look__card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 520ms cubic-bezier(0.22, 1, 0.36, 1);
}

.shop-the-look__card:hover img,
.shop-the-look__card:focus-visible img {
  transform: scale(1.04);
}

.shop-the-look__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  padding: clamp(1.6rem, 2vw, 2.4rem);
  background: linear-gradient(rgba(0, 0, 0, 0.02) 40%, rgba(0, 0, 0, 0.68));
}

.shop-the-look__copy {
  display: grid;
  gap: var(--space-xs);
}

.shop-the-look__title,
.shop-the-look__description {
  display: block;
}

.shop-the-look__title {
  font-size: clamp(1.7rem, 1.6vw, 2.4rem);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.shop-the-look__description {
  color: rgba(255, 255, 255, 0.74);
  font-size: var(--copy-font-size);
}

@media (max-width: 860px) {
  .shop-the-look__inner {
    grid-template-columns: 1fr;
  }

  .shop-the-look__header,
  .shop-the-look__card {
    width: 100%;
    height: auto;
    aspect-ratio: 1 / 1;
  }
}
</style>
