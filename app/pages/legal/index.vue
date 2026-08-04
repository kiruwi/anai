<template>
  <section class="legal-index container">
    <BreadcrumbTrail :items="breadcrumbItems" />
    <header>
      <h1>Policies</h1>
      <p>Read AÑAI’s shopping, delivery, privacy, cookie, and website policies.</p>
    </header>
    <div class="legal-index__grid">
      <NuxtLink
        v-for="policy in legalPolicies"
        :key="policy.slug"
        :to="`/legal/${policy.slug}`"
      >
        <h2>{{ policy.title }}</h2>
        <p>{{ policy.subtitle }}</p>
        <span aria-hidden="true">→</span>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import BreadcrumbTrail, { type BreadcrumbItem } from '../../components/shared/BreadcrumbTrail.vue'
import { legalPolicies } from '../../data/legalContent'

const breadcrumbItems: BreadcrumbItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Policies' },
]

useSeoMeta({
  title: 'Policies | AÑAI Kenya',
  description: 'Read AÑAI policies covering returns, delivery, privacy, cookies, terms of use, and copyright.',
})
</script>

<style scoped>
.legal-index {
  padding: var(--space-2xl) 0;
}

header {
  display: grid;
  gap: var(--space-md);
  max-width: 72rem;
  margin-bottom: var(--space-xl);
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  font-family: var(--font-brand-display);
  font-size: clamp(4.8rem, 7vw, 9.6rem);
  font-weight: 400;
  letter-spacing: 0.055em;
  line-height: 0.92;
}

header p,
.legal-index__grid p {
  color: var(--colour-muted);
}

.legal-index__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-md);
}

.legal-index__grid a {
  position: relative;
  display: grid;
  gap: var(--space-sm);
  min-height: 20rem;
  border: 1px solid var(--colour-border);
  padding: var(--space-lg);
  transition: color 180ms ease, background 180ms ease;
}

.legal-index__grid a:hover {
  color: var(--colour-white);
  background: var(--colour-black);
}

.legal-index__grid a:hover p {
  color: rgba(255, 255, 255, 0.72);
}

.legal-index__grid h2 {
  font-size: clamp(2.4rem, 3vw, 4rem);
  font-weight: 400;
}

.legal-index__grid span {
  align-self: end;
  font-size: 2rem;
}

@media (max-width: 680px) {
  .legal-index__grid {
    grid-template-columns: 1fr;
  }
}
</style>
