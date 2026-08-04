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
import {
  categoryTiles,
  products,
  shopLooks,
} from '../data/homeContent'

const homepageProductSlugsWithoutPhotos = new Set<string>()
const photographedProducts = products.filter((product) =>
  product.imageUrl?.startsWith('/images/products/') || homepageProductSlugsWithoutPhotos.has(product.slug),
)
const newReleaseProducts = photographedProducts

useSeoMeta({
  title: 'AÑAI | Activewear and Athleisure in Kenya',
  description: 'Shop AÑAI activewear, athleisure sets, tops, outerwear, and movement-ready essentials in Kenya.',
})
</script>
