<template>
  <section class="checkout-result container">
    <template v-if="payment?.paid">
      <h1>Thank you</h1>
      <p class="checkout-result__reference">Reference: {{ reference }}</p>
      <p class="checkout-result__support">
        Your payment is confirmed. Keep this order number for support, refunds, returns, or
        payment questions.
      </p>
      <NuxtLink to="/">Continue shopping</NuxtLink>
    </template>

    <template v-else-if="payment?.status === 'pending'">
      <h1>Confirming payment</h1>
      <p class="checkout-result__reference">Reference: {{ reference }}</p>
      <p class="checkout-result__support">
        M-Pesa confirmation has not arrived yet. If you entered your PIN, do not pay again.
      </p>
      <button type="button" :disabled="status === 'pending'" @click="refreshStatus">
        {{ status === 'pending' ? 'Checking…' : 'Check payment status' }}
      </button>
    </template>

    <template v-else-if="payment?.status === 'cancelled'">
      <h1>Checkout canceled</h1>
      <p class="checkout-result__reference">Reference: {{ reference }}</p>
      <p class="checkout-result__support">No payment was completed. You can return to checkout when ready.</p>
      <NuxtLink to="/checkout">Return to checkout</NuxtLink>
    </template>

    <template v-else>
      <h1>Payment not confirmed</h1>
      <p v-if="reference" class="checkout-result__reference">Reference: {{ reference }}</p>
      <p class="checkout-result__support">
        This page is not proof of payment. Return to checkout or contact support if M-Pesa
        deducted money from your account.
      </p>
      <div class="checkout-result__actions">
        <NuxtLink to="/checkout">Return to checkout</NuxtLink>
        <NuxtLink to="/contact">Contact support</NuxtLink>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
type PaymentStatusResponse = { paid: boolean; status: string; reference: string }

const route = useRoute()
const reference = computed(() =>
  typeof route.query.reference === 'string' ? route.query.reference.trim() : '',
)

const { data: payment, status, refresh } = await useAsyncData(
  () => `checkout-result-${reference.value}`,
  () => {
    if (!reference.value) return Promise.resolve(null)
    return $fetch<PaymentStatusResponse>('/api/checkout/payment-status', {
      method: 'POST',
      body: { reference: reference.value },
    }).catch(() => null)
  },
  { watch: [reference] },
)

const refreshStatus = () => refresh()

useSeoMeta({
  title: () => (payment.value?.paid ? 'Order confirmed | Anai' : 'Payment status | Anai'),
  robots: 'noindex, nofollow',
})
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
}

h1 {
  margin: 0;
  font-size: clamp(5.2rem, 8vw, 10rem);
  line-height: 0.92;
  text-align: start;
}

.checkout-result__reference {
  color: var(--colour-black);
}

.checkout-result__support {
  max-width: 58rem;
}

.checkout-result__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.checkout-result a,
.checkout-result button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--colour-black);
  padding: 1.2rem 1.6rem;
  color: var(--colour-black);
  background: var(--colour-surface);
  cursor: pointer;
  text-transform: uppercase;
}

.checkout-result button:disabled {
  color: var(--colour-muted);
  cursor: wait;
}
</style>
