<template>
  <HomeHero />
  <ProductRail
    id="products"
    title="New Items"
    action="View all new"
    href="/shop/new-in"
    :products="newReleaseProducts"
  />
  <ShopByCategory :tiles="categoryTiles" />
  <ShopTheLook :looks="shopLooks" />
  <NewsletterSignup />
</template>

<script setup lang="ts">
import HomeHero from '../components/home/HomeHero.vue'
import NewsletterSignup from '../components/home/NewsletterSignup.vue'
import ProductRail from '../components/home/ProductRail.vue'
import ShopByCategory from '../components/home/ShopByCategory.vue'
import ShopTheLook from '../components/home/ShopTheLook.vue'
import { sortProductsByViews, type ProductPopularity } from '#shared/lib/productPopularity'
import {
  categoryTiles,
  shopLooks,
} from '../data/homeContent'

const products = useCatalogProducts()
const homepageProductSlugsWithoutPhotos = new Set<string>()
const photographedProducts = computed(() => products.value.filter((product) =>
  product.imageUrl?.startsWith('/images/products/') || homepageProductSlugsWithoutPhotos.has(product.slug),
))
// Popularity changes the order only; it must not delay rendering the catalogue.
const { data: popularity } = useFetch<ProductPopularity>('/api/catalog/popularity', {
  server: false,
  lazy: true,
})
const newReleaseProducts = computed(() => sortProductsByViews(
  photographedProducts.value,
  popularity.value?.viewsBySlug ?? {},
))

useSeoMeta({
  title: 'AÑAI | Activewear and Athleisure in Kenya',
  description: 'Shop AÑAI activewear, athleisure sets, tops, outerwear, and movement-ready essentials in Kenya.',
})
</script>
