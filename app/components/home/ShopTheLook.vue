<template>
  <section class="shop-the-look">
    <div class="shop-the-look__inner container">
      <header class="shop-the-look__header">
        <div>
          <h2>Looks that move with you</h2>
        </div>
        <span class="shop-the-look__rule" aria-hidden="true" />
        <!-- TODO: Restore this link when the Shop the Look editorial page is ready.
        <NuxtLink class="shop-the-look__button" to="/shop-the-look">
          Explore looks
          <span aria-hidden="true">→</span>
        </NuxtLink>
        -->
      </header>

      <div class="shop-the-look__grid">
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
            <span class="shop-the-look__arrow" aria-hidden="true">→</span>
          </span>
        </NuxtLink>
      </div>
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
  padding: var(--space-2xl) 0 var(--page-gutter);
  color: var(--colour-black);
  background: var(--colour-surface);
}

.shop-the-look__inner {
  display: grid;
  gap: var(--space-lg);
}

.shop-the-look__header {
  display: grid;
  grid-template-columns: max-content minmax(8rem, 1fr);
  gap: var(--space-lg);
  align-items: center;
}

h2 {
  margin: 0;
}

h2 {
  max-width: none;
  font-family: var(--font-brand-display);
  font-size: clamp(3.2rem, 4vw, 5.6rem);
  font-weight: 400;
  letter-spacing: 0.055em;
  line-height: 0.98;
  white-space: nowrap;
}

.shop-the-look__rule {
  display: block;
  align-self: center;
  height: 1px;
  background: var(--colour-border);
}

.shop-the-look__button {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
  color: var(--colour-black);
  font-size: 1.3rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}

.shop-the-look__button span {
  font-size: 1.8rem;
  line-height: 1;
  transition: transform 180ms ease;
}

.shop-the-look__button:hover span {
  transform: translateX(0.4rem);
}

.shop-the-look__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.2rem;
}

.shop-the-look__card {
  position: relative;
  display: block;
  min-width: 0;
  aspect-ratio: 0.92;
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
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  padding: clamp(1.6rem, 2.2vw, 3.2rem);
  background: linear-gradient(rgba(0, 0, 0, 0.02) 34%, rgba(0, 0, 0, 0.76));
}

.shop-the-look__copy {
  display: grid;
  gap: var(--space-xs);
  width: 100%;
  min-width: 0;
}

.shop-the-look__title,
.shop-the-look__description {
  display: block;
}

.shop-the-look__title {
  font-size: clamp(2.4rem, 2.4vw, 3.8rem);
  font-weight: 400;
  line-height: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.shop-the-look__description {
  display: block;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.8);
  font-size: var(--copy-font-size);
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.shop-the-look__arrow {
  display: grid;
  width: 4.4rem;
  height: 4.4rem;
  margin-top: var(--space-lg);
  border: 1px solid rgba(255, 255, 255, 0.78);
  border-radius: 50%;
  place-items: center;
  font-size: 2rem;
  line-height: 1;
  transition: color 180ms ease, background 180ms ease, transform 180ms ease;
}

.shop-the-look__card:hover .shop-the-look__arrow,
.shop-the-look__card:focus-visible .shop-the-look__arrow {
  color: var(--colour-black);
  background: var(--colour-white);
  transform: translateX(0.3rem);
}

@media (max-width: 860px) {
  .shop-the-look {
    padding: var(--space-xl) 0 var(--page-gutter);
  }

  .shop-the-look__header {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--space-md);
  }

  .shop-the-look__header > div {
    grid-column: 1 / -1;
  }

  h2 {
    font-size: clamp(2.4rem, 8vw, 4rem);
  }

  .shop-the-look__rule {
    grid-column: 1;
    grid-row: 2;
  }

  .shop-the-look__button {
    grid-column: 2;
    grid-row: 2;
  }

  .shop-the-look__grid {
    grid-auto-columns: minmax(27rem, 78vw);
    grid-auto-flow: column;
    grid-template-columns: none;
    overflow-x: auto;
    padding-bottom: var(--space-sm);
    scroll-snap-type: x mandatory;
    scrollbar-width: thin;
  }

  .shop-the-look__card {
    scroll-snap-align: start;
  }
}
</style>
