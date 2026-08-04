<template>
  <section class="shop-page">
    <div class="container">
      <header class="shop-page__header">
        <BreadcrumbTrail :items="breadcrumbItems" />
        <h1>{{ definition.heading }}</h1>
      </header>

      <!-- TODO: Restore catalogue search when the product range is large enough to require it.
      <form id="catalog-search" class="shop-page__search" role="search" @submit.prevent="submitSearch">
        <label for="shop-search">Search products</label>
        <div>
          <input
            id="shop-search"
            v-model.trim="searchDraft"
            name="search"
            type="search"
            autocomplete="off"
            placeholder="Search the collection"
          />
          <button type="submit">Search</button>
          <button v-if="searchTerm" type="button" class="shop-page__clear" @click="clearSearch">
            Clear
          </button>
        </div>
      </form>

      <p v-if="searchTerm" class="shop-page__result-summary">
        {{ visibleProducts.length }} {{ visibleProducts.length === 1 ? 'result' : 'results' }} for “{{ searchTerm }}”
      </p>
      -->

      <div v-if="visibleProducts.length" class="shop-page__grid">
        <ProductCard
          v-for="product in visibleProducts"
          :key="product.slug"
          :product="product"
          hide-actions
        />
      </div>

      <div v-else class="shop-page__empty">
        <p>{{ emptyMessage }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { products } from '../../data/homeContent'
import {
  allProductsDefinition,
  collectionDefinitions,
  type CollectionSlug,
} from '#shared/lib/catalogNavigation'
import BreadcrumbTrail, { type BreadcrumbItem } from '../shared/BreadcrumbTrail.vue'
import ProductCard from '../product/ProductCard.vue'

const props = defineProps<{
  collection?: CollectionSlug
}>()

const route = useRoute()
const definition = computed(() => props.collection
  ? collectionDefinitions[props.collection]
  : allProductsDefinition)

const baseProducts = computed(() => {
  if (!props.collection) return products

  const collection = collectionDefinitions[props.collection]

  if (collection.filter === 'new') {
    return products.filter((product) => product.isNew)
  }

  if (collection.filter === 'women') {
    return products
  }

  return products.filter((product) =>
    product.category.toLowerCase() === collection.category?.toLowerCase(),
  )
})

const searchTerm = computed(() => {
  const search = route.query.search
  return typeof search === 'string' ? search.trim() : ''
})
const searchDraft = ref(searchTerm.value)

watch(searchTerm, (value) => {
  searchDraft.value = value
})

const visibleProducts = computed(() => {
  if (!searchTerm.value) return baseProducts.value

  const term = searchTerm.value.toLocaleLowerCase()
  return baseProducts.value.filter((product) =>
    [product.name, product.category, product.description]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLocaleLowerCase().includes(term)),
  )
})

const breadcrumbItems = computed<BreadcrumbItem[]>(() => [
  { label: 'Home', to: '/' },
  ...(props.collection
    ? [
        { label: 'Shop', to: '/shop' },
        { label: definition.value.heading },
      ]
    : [{ label: definition.value.heading }]),
])

const emptyMessage = computed(() => searchTerm.value
  ? 'No products match your search.'
  : 'No products available.')

const collectionPath = computed(() => props.collection ? `/shop/${props.collection}` : '/shop')
const hasNonCanonicalQuery = computed(() => Object.keys(route.query).length > 0)
const isEmptyCollection = computed(() => Boolean(props.collection) && baseProducts.value.length === 0)

useSeoMeta({
  title: () => definition.value.title,
  description: () => definition.value.description,
  ogTitle: () => definition.value.title,
  ogDescription: () => definition.value.description,
  ogUrl: () => `https://anaibymurda.com${collectionPath.value}`,
  robots: () => hasNonCanonicalQuery.value || isEmptyCollection.value
    ? 'noindex, follow'
    : 'index, follow',
})

const submitSearch = async () => {
  const nextQuery = { ...route.query }

  if (searchDraft.value) {
    nextQuery.search = searchDraft.value
  } else {
    delete nextQuery.search
  }

  await navigateTo({ path: collectionPath.value, query: nextQuery })
}

const clearSearch = async () => {
  searchDraft.value = ''
  const nextQuery = { ...route.query }
  delete nextQuery.search
  await navigateTo({ path: collectionPath.value, query: nextQuery })
}
</script>

<style scoped>
.shop-page {
  padding: var(--space-2xl) 0;
}

.shop-page__header {
  margin-bottom: var(--space-xl);
}

h1 {
  margin: 0;
  font-family: var(--font-brand-display);
  font-size: clamp(4.8rem, 7vw, 9.6rem);
  font-weight: 400;
  letter-spacing: 0.055em;
  line-height: 0.92;
}

.shop-page__search {
  display: grid;
  gap: var(--space-sm);
  max-width: 64rem;
  margin-bottom: var(--space-xl);
}

.shop-page__search label {
  font-size: 1.2rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.shop-page__search div {
  display: flex;
}

.shop-page__search input {
  min-width: 0;
  flex: 1;
  border: 1px solid var(--colour-black);
  border-radius: 0;
  padding: 1.2rem;
}

.shop-page__search button {
  border: 1px solid var(--colour-black);
  border-left: 0;
  padding: 1.2rem 1.6rem;
  color: var(--colour-white);
  background: var(--colour-black);
  cursor: pointer;
  text-transform: uppercase;
}

.shop-page__search .shop-page__clear {
  color: var(--colour-black);
  background: var(--colour-white);
}

.shop-page__result-summary {
  margin: calc(var(--space-xl) * -0.5) 0 var(--space-lg);
  color: var(--colour-muted);
}

.shop-page__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--page-gutter);
}

.shop-page__empty {
  display: grid;
  min-height: 42rem;
  place-items: center;
  background: var(--colour-black);
  color: var(--colour-white);
}

.shop-page__empty p {
  margin: 0;
  font-size: var(--copy-font-size);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-align: center;
  text-transform: uppercase;
}

@media (max-width: 900px) {
  .shop-page__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .shop-page {
    padding-top: var(--space-xl);
  }

  .shop-page__search div {
    flex-wrap: wrap;
  }

  .shop-page__search input {
    flex-basis: 100%;
  }

  .shop-page__search button {
    border-top: 0;
    border-left: 1px solid var(--colour-black);
  }

  .shop-page__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
