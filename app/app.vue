<template>
  <div>
    <SiteHeader :over-hero="isHomeRoute" />
    <main>
      <NuxtPage />
    </main>
    <SiteFooter />
    <ClientOnly>
      <component :is="MouseCursorComponent" v-if="MouseCursorComponent" />
    </ClientOnly>
    <ClientOnly>
      <CookieBanner />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import CookieBanner from './components/layout/CookieBanner.vue'
import SiteFooter from './components/layout/SiteFooter.vue'
import SiteHeader from './components/layout/SiteHeader.vue'
import type { InventoryResponse } from '../shared/types/inventory'

const route = useRoute()
const router = useRouter()
const isHomeRoute = computed(() => route.path === '/')
const MouseCursorComponent = shallowRef()
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

onMounted(async () => {
  removeInventoryRouteHook = router.afterEach(() => {
    void refreshNuxtData('anai-live-inventory-request')
  })

  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!canHover || reduceMotion) {
    return
  }

  const component = await import('./components/shared/MouseCursor.vue')
  MouseCursorComponent.value = markRaw(component.default)
})

onBeforeUnmount(() => removeInventoryRouteHook?.())
</script>
