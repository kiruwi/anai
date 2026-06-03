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
  </div>
</template>

<script setup lang="ts">
import SiteFooter from './components/layout/SiteFooter.vue'
import SiteHeader from './components/layout/SiteHeader.vue'

const route = useRoute()
const isHomeRoute = computed(() => route.path === '/')
const MouseCursorComponent = shallowRef()

onMounted(async () => {
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!canHover || reduceMotion) {
    return
  }

  const component = await import('./components/shared/MouseCursor.vue')
  MouseCursorComponent.value = markRaw(component.default)
})
</script>
