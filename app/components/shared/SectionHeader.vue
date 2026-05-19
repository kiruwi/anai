<template>
  <div class="section-header">
    <div>
      <h2 v-if="title">{{ title }}</h2>
    </div>
    <NuxtLink v-if="href && action" :to="href">{{ action }}</NuxtLink>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  action?: string
  href?: string
}>()
</script>

<style scoped>
.section-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: var(--space-lg);
  margin-bottom: var(--space-lg);
}

h2 {
  margin: 0;
  font-size: clamp(3.2rem, 4vw, 5.6rem);
  line-height: 1;
  text-transform: uppercase;
}

a {
  border-bottom: 1px solid currentColor;
  font-size: 1.3rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

@media (max-width: 680px) {
  .section-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
