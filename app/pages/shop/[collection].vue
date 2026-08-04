<template>
  <ShopCollection :collection="collection" />
</template>

<script setup lang="ts">
import ShopCollection from '../../components/shop/ShopCollection.vue'
import {
  isCollectionSlug,
  type CollectionSlug,
} from '#shared/lib/catalogNavigation'

const route = useRoute()
const collectionParam = Array.isArray(route.params.collection)
  ? route.params.collection[0] ?? ''
  : String(route.params.collection ?? '')

if (!isCollectionSlug(collectionParam)) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Collection not found',
  })
}

const collection = collectionParam as CollectionSlug
</script>
