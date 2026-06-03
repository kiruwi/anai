<template>
  <NuxtLink class="image-tile" :to="tile.href">
    <img
      :src="tile.imageUrl"
      :alt="tile.title"
      width="546"
      height="683"
      loading="lazy"
      decoding="async"
    />
    <span>{{ tile.title }}</span>
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
  content: "";
  background: linear-gradient(rgba(0, 0, 0, 0.02), rgba(0, 0, 0, 0.34));
  pointer-events: none;
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

span {
  position: relative;
  z-index: 1;
  font-size: 2.4rem;
  font-weight: 400;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

</style>
