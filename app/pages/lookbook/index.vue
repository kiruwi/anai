<template>
  <section class="editorial-placeholder container">
    <p>Editorial</p>
    <h1>Lookbook coming soon</h1>
    <NuxtLink to="/shop">Shop the collection</NuxtLink>
  </section>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'Lookbook Coming Soon | AÑAI',
  robots: 'noindex, nofollow',
})
</script>

<style scoped>
.editorial-placeholder {
  display: grid;
  gap: var(--space-md);
  min-height: 64vh;
  padding: var(--space-2xl) 0;
  place-content: center;
  text-align: center;
}

p,
h1 {
  margin: 0;
}

p,
a {
  font-size: 1.2rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

h1 {
  font-family: var(--font-brand-display);
  font-size: clamp(4.8rem, 8vw, 9.6rem);
  font-weight: 400;
  line-height: 0.94;
}

a {
  justify-self: center;
  border: 1px solid currentColor;
  padding: 1.2rem 1.6rem;
}
</style>
