<template>
  <article
    v-if="tile.isComingSoon"
    class="image-tile image-tile--locked"
    :aria-label="`${tile.title} coming soon`"
  >
    <img
      :src="tile.imageUrl"
      :alt="tile.title"
      width="546"
      height="683"
      loading="lazy"
      decoding="async"
    />
    <span class="image-tile__title">{{ tile.title }}</span>
    <span class="image-tile__status">Coming soon</span>
  </article>
  <NuxtLink
    v-else
    class="image-tile"
    :to="tile.href"
  >
    <img
      :src="tile.imageUrl"
      :alt="tile.title"
      width="546"
      height="683"
      loading="lazy"
      decoding="async"
    />
    <span class="image-tile__title">{{ tile.title }}</span>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { ImageTile } from '../../data/homeContent'

defineProps<{
  tile: ImageTile
}>()
</script>

<style scoped>
.image-tile {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  padding: var(--space-md);
  color: var(--colour-white);
  background-color: var(--colour-plum);
  transition: transform 180ms ease;
}

.image-tile::after {
  position: absolute;
  inset: 0;
  z-index: 1;
  content: "";
  background: linear-gradient(rgba(0, 0, 0, 0.02), rgba(0, 0, 0, 0.34));
  pointer-events: none;
}

.image-tile--locked::after {
  background: rgba(0, 0, 0, 0.48);
}

img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-tile:hover {
  transform: scale(1.015);
}

.image-tile--locked {
  cursor: default;
}

.image-tile--locked:hover {
  transform: none;
}

.image-tile__title,
.image-tile__status {
  position: relative;
  z-index: 2;
}

.image-tile__title {
  font-size: 2.4rem;
  font-weight: 400;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.image-tile__status {
  position: absolute;
  top: 50%;
  left: 50%;
  border: 1px solid currentColor;
  padding: 1rem 1.4rem;
  font-size: 1.4rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transform: translate(-50%, -50%);
}
</style>
