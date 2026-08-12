<template>
  <div>
    <SiteHeader :over-hero="isHomeRoute" />
    <NotificationStack />
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
import NotificationStack from './components/shared/NotificationStack.vue'
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
const isInventoryOutage = useState('anai-inventory-outage', () => false)
const { notify, dismissNotification } = useNotifications()
const inventoryOutageNotificationId = 'inventory-refresh-outage'
const { data: liveInventory, error: liveInventoryError } = await useFetch<InventoryResponse>('/api/catalog/inventory', {
  key: 'anai-live-inventory-request',
})

watch([liveInventory, liveInventoryError], ([value, error]) => {
  if (value) {
    inventory.value = value
    if (isInventoryOutage.value) {
      isInventoryOutage.value = false
      dismissNotification(inventoryOutageNotificationId)
    }
  } else if (error) {
    inventory.value = null
    if (!isInventoryOutage.value) {
      isInventoryOutage.value = true
      notify({
        id: inventoryOutageNotificationId,
        type: 'warning',
        title: 'Stock information unavailable',
        message: 'Current availability could not be refreshed. Catalogue stock is shown for now.',
      })
    }
  }
}, { immediate: true })

onMounted(() => {
  removeInventoryRouteHook = router.afterEach(() => {
    void refreshNuxtData('anai-live-inventory-request')
  })
})

onBeforeUnmount(() => removeInventoryRouteHook?.())
</script>
