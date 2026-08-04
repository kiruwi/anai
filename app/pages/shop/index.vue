<template>
  <ShopCollection />
</template>

<script setup lang="ts">
import ShopCollection from '../../components/shop/ShopCollection.vue'
import { legacyShopQueryPaths } from '#shared/lib/catalogNavigation'

const route = useRoute()
const query = { ...route.query }

const primaryFilter = typeof query.new === 'string' && query.new === 'true'
  ? 'new=true'
  : typeof query.gender === 'string' && query.gender.toLowerCase() === 'women'
    ? 'gender=women'
    : typeof query.category === 'string'
      ? `category=${query.category.toLowerCase()}`
      : ''
const redirectPath = legacyShopQueryPaths[primaryFilter]

if (redirectPath) {
  delete query.new
  delete query.gender
  delete query.category
  await navigateTo({ path: redirectPath, query }, { redirectCode: 301, replace: true })
}
</script>
