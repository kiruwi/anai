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
  position: relative;
  display: flex;
  align-items: end;
  justify-content: center;
  gap: var(--space-lg);
  margin-bottom: var(--space-lg);
  text-align: center;
}

.section-header > div {
  width: 100%;
}

h2 {
  margin: 0;
  font-family: var(--font-brand-display);
  font-weight: 400;
  font-size: clamp(3.2rem, 4vw, 5.6rem);
  letter-spacing: 0.055em;
  line-height: 1;
  text-transform: uppercase;
}

a {
  position: absolute;
  right: 0;
  bottom: 0;
  border-bottom: 1px solid currentColor;
  font-size: 1.3rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

@media (max-width: 680px) {
  .section-header {
    align-items: center;
    flex-direction: column;
  }

  a {
    position: static;
  }
}
</style>
