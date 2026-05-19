<template>
  <NuxtLink class="image-tile" :style="tileStyle" :to="tile.href">
    <span>{{ tile.title }}</span>
    <strong>View</strong>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { ImageTile } from '../../data/homeContent'

const props = defineProps<{
  tile: ImageTile
}>()

const tileStyle = computed(() => ({
  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.42)), url("${props.tile.imageUrl}"), ${props.tile.imageTone}`,
}))
</script>

<style scoped>
.image-tile {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  padding: var(--space-md);
  color: var(--colour-white);
  background-color: var(--colour-plum);
  background-position: center;
  background-size: cover;
  transition: transform 180ms ease;
}

.image-tile:hover {
  transform: scale(1.015);
}

span {
  font-size: 2.4rem;
  font-weight: 700;
  text-transform: uppercase;
}

strong {
  font-size: 1.2rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
</style>
