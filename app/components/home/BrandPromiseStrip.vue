<template>
  <section class="brand-promise">
    <div class="brand-promise__grid container">
      <article v-for="promise in promises" :key="promise">
        <span />
        <p>{{ promise }}</p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  promises: string[]
}>()
</script>

<style scoped>
.brand-promise {
  padding: var(--space-xl) 0;
}

.brand-promise__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--page-gutter);
}

article {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  min-height: 8rem;
  border: 1px solid var(--colour-border);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
}

span {
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background: var(--colour-clay);
}

p {
  margin: 0;
  font-weight: 700;
  text-transform: uppercase;
}

@media (max-width: 760px) {
  .brand-promise__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
