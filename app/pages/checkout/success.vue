<template>
  <section class="checkout-result container">
    <h1>Thank you</h1>
    <p v-if="reference" class="checkout-result__reference">
      Reference: {{ reference }}
    </p>
    <p class="checkout-result__support">
      Keep this page as proof of purchase. For support, refunds, returns, or payment disputes,
      quote your order number and Paystack transaction reference.
    </p>
    <NuxtLink to="/">Continue shopping</NuxtLink>
  </section>
</template>

<script setup lang="ts">
const route = useRoute()
const reference = computed(() =>
  typeof route.query.reference === 'string' ? route.query.reference : '',
)
</script>

<style scoped>
.checkout-result {
  display: grid;
  justify-items: start;
  gap: var(--space-md);
  padding: var(--space-2xl) 0;
}

.checkout-result p {
  margin: 0;
  color: var(--colour-muted);
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: clamp(5.2rem, 8vw, 10rem);
  line-height: 0.92;
  text-align: start;
}

.checkout-result__reference {
  color: var(--colour-black);
  text-transform: none;
}

.checkout-result__support {
  max-width: 58rem;
  text-transform: none;
}

.checkout-result a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--colour-black);
  padding: 1.2rem 1.6rem;
  text-transform: uppercase;
}
</style>
