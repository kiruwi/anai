<template>
  <div />
</template>

<script setup lang="ts">
import { legalPolicies } from '../../data/legalContent'

const defaultPolicy = legalPolicies[0]?.slug ?? 'refund-policy'

await navigateTo(`/legal/${defaultPolicy}`, { redirectCode: 301 })
</script>
