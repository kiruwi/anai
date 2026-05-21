<template>
  <div>
    <SiteHeader />
    <main>
      <NuxtPage />
    </main>
    <SiteFooter />
    <MouseCursor />
  </div>
</template>

<script setup lang="ts">
import SiteFooter from './components/layout/SiteFooter.vue'
import SiteHeader from './components/layout/SiteHeader.vue'
import MouseCursor from './components/shared/MouseCursor.vue'
</script>
