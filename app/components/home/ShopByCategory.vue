<template>
  <section class="shop-by-category">
    <div class="container">
      <SectionHeader title="Shop by collection" />
      <div class="shop-by-category__grid">
        <ImageTile v-for="tile in tiles" :key="tile.title" :tile="tile" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ImageTile as ImageTileType } from '../../data/homeContent'
import ImageTile from './ImageTile.vue'
import SectionHeader from '../shared/SectionHeader.vue'

defineProps<{
  tiles: ImageTileType[]
}>()
</script>

<style scoped>
.shop-by-category {
  background-color: #dbdad8;
  padding: var(--space-2xl) 0;
}

.shop-by-category__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--page-gutter);
  width: min(100%, 112rem);
  margin-inline: auto;
}

@media (max-width: 560px) {
  .shop-by-category__grid {
    grid-template-columns: 1fr;
  }
}
</style>
