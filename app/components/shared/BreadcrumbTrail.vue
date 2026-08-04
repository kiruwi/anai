<template>
  <nav class="breadcrumb-trail" aria-label="Breadcrumb">
    <ol>
      <li v-for="(item, index) in items" :key="`${item.label}-${index}`">
        <NuxtLink v-if="item.to" :to="item.to">{{ item.label }}</NuxtLink>
        <span v-else aria-current="page">{{ item.label }}</span>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { canonicalSiteUrl } from '#shared/lib/catalogNavigation'

export type BreadcrumbItem = {
  label: string
  to?: string
}

const props = defineProps<{
  items: BreadcrumbItem[]
}>()

useHead({
  script: [
    {
      key: 'breadcrumb-structured-data',
      type: 'application/ld+json',
      textContent: computed(() => JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: props.items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.label,
          ...(item.to ? { item: `${canonicalSiteUrl}${item.to}` } : {}),
        })),
      })),
    },
  ],
})
</script>

<style scoped>
.breadcrumb-trail {
  margin-bottom: var(--space-md);
}

ol {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin: 0;
  padding: 0;
  color: var(--colour-muted);
  font-size: 1.2rem;
  letter-spacing: 0.055em;
  list-style: none;
  text-transform: uppercase;
}

li {
  display: inline-flex;
  gap: 0.6rem;
  align-items: center;
}

li:not(:last-child)::after {
  content: "→";
  color: currentColor;
}

a:hover {
  color: var(--colour-black);
}
</style>
