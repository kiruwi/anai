<template>
  <div>
    <SiteHeader :over-hero="isHomeRoute" />
    <main>
      <NuxtPage />
    </main>
    <SiteFooter />
    <MouseCursor />
    <ClientOnly>
      <CookieBanner />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import CookieBanner from './components/layout/CookieBanner.vue'
import SiteFooter from './components/layout/SiteFooter.vue'
import SiteHeader from './components/layout/SiteHeader.vue'
import MouseCursor from './components/shared/MouseCursor.vue'
import type { InventoryResponse } from '../shared/types/inventory'
import { canonicalSiteUrl } from '#shared/lib/catalogNavigation'

const route = useRoute()
const router = useRouter()
const isHomeRoute = computed(() => route.path === '/')
const canonicalUrl = computed(() => {
  const path = route.path === '/' ? '/' : route.path.replace(/\/$/, '')
  return `${canonicalSiteUrl}${path}`
})

useHead({
  link: [
    {
      key: 'canonical',
      rel: 'canonical',
      href: canonicalUrl,
    },
  ],
})
let removeInventoryRouteHook: (() => void) | undefined
const inventory = useState<InventoryResponse | null>('anai-live-inventory', () => null)
const { data: liveInventory, error: liveInventoryError } = await useFetch<InventoryResponse>('/api/catalog/inventory', {
  key: 'anai-live-inventory-request',
})

watch([liveInventory, liveInventoryError], ([value, error]) => {
  if (value) {
    inventory.value = value
  } else if (error) {
    inventory.value = { updatedAt: new Date().toISOString(), products: {} }
  }
}, { immediate: true })

onMounted(() => {
  removeInventoryRouteHook = router.afterEach(() => {
    void refreshNuxtData('anai-live-inventory-request')
  })
})

onBeforeUnmount(() => removeInventoryRouteHook?.())
</script>
