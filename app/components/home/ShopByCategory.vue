<template>
  <section class="shop-by-category">
    <div class="container">
      <SectionHeader title="Shop by category" />
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
  padding: var(--space-2xl) 0;
}

.shop-by-category__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--page-gutter);
}

@media (max-width: 560px) {
  .shop-by-category__grid {
    grid-template-columns: 1fr;
  }
}
</style>
