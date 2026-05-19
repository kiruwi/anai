<template>
  <HomeHero />
  <ProductRail
    :products="newReleaseProducts"
  />
  <ShopByCategory :tiles="categoryTiles" />
  <ShopTheLook :looks="shopLooks" />
  <ProductRail
    title="Best sellers"
    action="Shop all"
    href="/"
    :products="bestSellerProducts"
  />
  <BrandPromiseStrip :promises="brandPromises" />
  <NewsletterSignup />
</template>

<script setup lang="ts">
import BrandPromiseStrip from '../components/home/BrandPromiseStrip.vue'
import HomeHero from '../components/home/HomeHero.vue'
import NewsletterSignup from '../components/home/NewsletterSignup.vue'
import ProductRail from '../components/home/ProductRail.vue'
import ShopByCategory from '../components/home/ShopByCategory.vue'
import ShopTheLook from '../components/home/ShopTheLook.vue'
import {
  brandPromises,
  categoryTiles,
  products,
  shopLooks,
} from '../data/homeContent'

const photographedProducts = products.filter((product) => product.imageUrl.startsWith('/images/products/'))
const newReleaseProducts = photographedProducts
const bestSellerSlugs = [
  'nuru-short-set',
  'mia-cropped-tee',
  'anai-crew-socks',
]
const bestSellerProducts = products.filter((product) => bestSellerSlugs.includes(product.slug))
</script>
