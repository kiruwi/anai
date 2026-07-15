<template>
  <section class="checkout-page container">
    <div class="checkout-page__header">
      <h1>Complete order</h1>
    </div>

    <div v-if="lines.length" class="checkout-page__layout">
      <form class="checkout-form" @submit.prevent="startPayment">
        <fieldset>
          <legend>Contact</legend>
          <label>
            Email address
            <input v-model.trim="customer.email" type="email" autocomplete="email" required />
          </label>
          <label>
            Full name
            <input v-model.trim="customer.name" type="text" autocomplete="name" required />
          </label>
          <label>
            Phone number
            <input v-model.trim="customer.phone" type="tel" autocomplete="tel" required />
          </label>
        </fieldset>

        <fieldset>
          <legend>Delivery</legend>
          <label>
            Delivery address
            <textarea v-model.trim="customer.address" rows="4" autocomplete="street-address" required />
          </label>
        </fieldset>

        <p v-if="paymentMessage" class="checkout-form__message" role="status">
          {{ paymentMessage }}
        </p>
        <p v-if="paymentError" class="checkout-form__error" role="alert">
          {{ paymentError }}
        </p>

        <div class="checkout-form__payment-note">
          <p>
            You will receive an M-Pesa prompt on the phone number above. Enter your M-Pesa PIN
            only in the M-Pesa prompt to complete your order.
          </p>
          <p>
            If you are debited but the confirmation takes longer than expected, use your order
            number below to contact us. Do not submit a second payment request.
          </p>
        </div>

        <button class="checkout-form__submit" type="submit" :disabled="isPaymentButtonDisabled">
          {{ paymentButtonLabel }}
        </button>
      </form>

      <aside class="checkout-summary" aria-label="Order summary">
        <h2>Order summary</h2>
        <div class="checkout-summary__items">
          <article v-for="line in lines" :key="line.key" class="checkout-summary__item">
            <img
              v-if="line.product.imageUrl"
              :src="line.product.imageUrl"
              :alt="line.product.name"
              width="72"
              height="90"
              loading="lazy"
              decoding="async"
            />
            <span v-else>Coming soon</span>
            <div>
              <h3>{{ line.product.name }}</h3>
              <p>Qty {{ line.quantity }}</p>
              <p v-if="line.colour" class="checkout-summary__meta">
                <span
                  class="checkout-summary__swatch"
                  :style="{ background: getLineColourValue(line) }"
                  aria-hidden="true"
                />
                Colour {{ line.colour }}
              </p>
              <p v-if="line.size">Size {{ line.size }}</p>
            </div>
            <strong>KES {{ line.lineTotalKes.toLocaleString() }}</strong>
          </article>
        </div>
        <dl>
          <div>
            <dt>Subtotal</dt>
            <dd>KES {{ subtotalKes.toLocaleString() }}</dd>
          </div>
          <div>
            <dt>Delivery</dt>
            <dd>Calculated after confirmation</dd>
          </div>
          <div class="checkout-summary__total">
            <dt>Total due now</dt>
            <dd>KES {{ subtotalKes.toLocaleString() }}</dd>
          </div>
        </dl>
      </aside>
    </div>

    <div v-else class="checkout-page__empty">
      <p>Your bag is empty.</p>
      <NuxtLink to="/shop">Continue shopping</NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  getProductColourName,
  getProductColourValue,
  isSizeLabelInStock,
  type ProductColour,
} from '../../data/homeContent'

const { lines, subtotalKes, clearCart } = useCart()
const router = useRouter()

const customer = reactive({
  email: '',
  name: '',
  phone: '',
  address: '',
})
const isPaymentLoading = ref(false)
const paymentError = ref('')
const paymentMessage = ref('')
const pendingReference = ref('')

type CreatePaymentResponse = {
  orderId: string
  reference: string
  amountKes: number
  currency: 'KES'
  checkoutRequestId: string
  customerMessage: string
}

type PaymentStatusResponse = {
  paid: boolean
  status: string
  reference: string
}

type FetchErrorLike = {
  data?: {
    statusMessage?: string
    message?: string
  }
  statusMessage?: string
  message?: string
}

const hasMissingSizes = computed(() =>
  lines.value.some((line) => line.product.sizeOptions?.length && !line.size),
)
const hasUnavailableSizes = computed(() =>
  lines.value.some((line) => line.size && !isSizeLabelInStock(line.size)),
)
const isPaymentButtonDisabled = computed(() =>
  isPaymentLoading.value ||
  hasMissingSizes.value ||
  hasUnavailableSizes.value,
)
const paymentButtonLabel = computed(() => {
  if (hasMissingSizes.value) {
    return 'Select sizes in bag'
  }

  if (hasUnavailableSizes.value) {
    return 'Not in stock'
  }

  if (isPaymentLoading.value) {
    return 'Waiting for M-Pesa confirmation...'
  }

  return pendingReference.value ? 'Check payment status' : 'Pay with M-Pesa'
})

const getLineColourValue = (line: { product: { colours: ProductColour[] }; colour?: string }) => {
  const matchingColour = line.product.colours.find(
    (colour: ProductColour) => getProductColourName(colour) === line.colour,
  )

  return matchingColour ? getProductColourValue(matchingColour) : 'transparent'
}

const getCheckoutErrorMessage = (error: unknown) => {
  const fetchError = error as FetchErrorLike
  const message =
    fetchError.data?.statusMessage ||
    fetchError.data?.message ||
    fetchError.statusMessage ||
    fetchError.message

  return message
    ? `Checkout could not start: ${message}`
    : 'Checkout could not start. Please refresh and try again.'
}

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds))

const checkPaymentStatus = (reference: string) =>
  $fetch<PaymentStatusResponse>('/api/checkout/payment-status', {
    method: 'POST',
    body: { reference },
  })

const completePayment = async (reference: string) => {
  clearCart()
  await router.push({ path: '/checkout/success', query: { reference } })
}

const waitForPaymentConfirmation = async (reference: string) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await wait(3_000)
    const payment = await checkPaymentStatus(reference)

    if (payment.paid) {
      await completePayment(reference)
      return true
    }

    if (payment.status === 'failed') {
      pendingReference.value = ''
      paymentError.value = 'M-Pesa did not complete the payment. You can try again when ready.'
      return false
    }
  }

  paymentMessage.value = `We are still waiting for M-Pesa confirmation for order ${reference}. If you entered your PIN, do not pay again—use “Check payment status” or contact support.`
  return false
}

const startPayment = async () => {
  paymentError.value = ''
  paymentMessage.value = ''

  if (!lines.value.length) {
    paymentError.value = 'Your bag is empty.'
    return
  }

  if (hasMissingSizes.value) {
    paymentError.value = 'Choose a size for every item in your bag before checkout.'
    return
  }

  if (hasUnavailableSizes.value) {
    paymentError.value = 'That size is not in stock. More sizes will be restocked in a few months.'
    return
  }

  isPaymentLoading.value = true

  try {
    if (pendingReference.value) {
      paymentMessage.value = 'Checking M-Pesa payment status.'
      const status = await checkPaymentStatus(pendingReference.value)

      if (status.paid) {
        await completePayment(pendingReference.value)
        return
      }

      if (status.status === 'failed') {
        pendingReference.value = ''
        paymentError.value = 'M-Pesa did not complete the payment. You can try again when ready.'
        return
      }

      paymentMessage.value = `M-Pesa confirmation for order ${pendingReference.value} is still pending. If you entered your PIN, do not pay again.`
      return
    }

    paymentMessage.value = 'Sending an M-Pesa prompt to your phone.'
    const payment = await $fetch<CreatePaymentResponse>('/api/checkout/create-payment', {
      method: 'POST',
      body: {
        customer,
        items: lines.value.map((line) => ({
          slug: line.slug,
          quantity: line.quantity,
          size: line.size,
          color: line.colour,
        })),
      },
    })

    pendingReference.value = payment.reference
    paymentMessage.value = payment.customerMessage || 'Check your phone and enter your M-Pesa PIN to pay.'
    await waitForPaymentConfirmation(payment.reference)
  } catch (error) {
    paymentMessage.value = ''
    paymentError.value = getCheckoutErrorMessage(error)
  } finally {
    isPaymentLoading.value = false
  }
}
</script>

<style scoped>
.checkout-page {
  padding: var(--space-2xl) 0;
}

.checkout-page__header {
  display: grid;
  gap: var(--space-sm);
  margin-bottom: var(--space-xl);
}

.checkout-page__empty p {
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

.checkout-page__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(30rem, 42rem);
  gap: var(--space-xl);
  align-items: start;
}

.checkout-form,
.checkout-summary {
  display: grid;
  gap: var(--space-lg);
}

.checkout-form fieldset {
  display: grid;
  gap: var(--space-md);
  border: 1px solid var(--colour-border);
  margin: 0;
  padding: var(--space-md);
}

.checkout-form legend,
.checkout-summary h2 {
  padding: 0;
  font-size: 1.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.checkout-form label {
  display: grid;
  gap: var(--space-xs);
  color: var(--colour-muted);
  font-size: 1.2rem;
  text-transform: uppercase;
}

.checkout-form input,
.checkout-form textarea {
  width: 100%;
  border: 1px solid var(--colour-border);
  border-radius: 0;
  padding: 1.2rem;
  color: var(--colour-black);
  background: var(--colour-surface);
  font-size: 1.6rem;
  text-transform: none;
}

.checkout-form__submit,
.checkout-page__empty a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--colour-black);
  padding: 1.2rem 1.6rem;
  color: var(--colour-white);
  background: var(--colour-black);
  cursor: pointer;
  text-transform: uppercase;
}

.checkout-form__submit:disabled {
  border-color: var(--colour-border);
  color: var(--colour-muted);
  background: var(--colour-border);
  cursor: not-allowed;
}

.checkout-form__message,
.checkout-form__error {
  margin: 0;
}

.checkout-form__payment-note {
  display: grid;
  gap: var(--space-xs);
  border: 1px solid var(--colour-border);
  padding: var(--space-md);
  color: var(--colour-muted);
  font-size: var(--copy-font-size);
}

.checkout-form__payment-note p {
  margin: 0;
}

.checkout-form__error {
  color: var(--colour-plum);
}

.checkout-summary {
  position: sticky;
  top: 9.6rem;
  border: 1px solid var(--colour-border);
  padding: var(--space-md);
}

.checkout-summary h2,
.checkout-summary h3,
.checkout-summary p,
.checkout-summary dl {
  margin: 0;
}

.checkout-summary__items {
  display: grid;
  gap: var(--space-md);
}

.checkout-summary__item {
  display: grid;
  grid-template-columns: 7.2rem minmax(0, 1fr) auto;
  gap: var(--space-sm);
  align-items: center;
}

.checkout-summary__item img,
.checkout-summary__item span {
  width: 7.2rem;
  aspect-ratio: 4 / 5;
}

.checkout-summary__item img {
  object-fit: cover;
}

.checkout-summary__item span {
  display: grid;
  place-items: center;
  background: var(--colour-border);
  color: var(--colour-muted);
  font-size: 0.9rem;
  letter-spacing: 0.08em;
  text-align: center;
  text-transform: uppercase;
}

.checkout-summary__item h3 {
  font-size: 1.4rem;
}

.checkout-summary__item p {
  color: var(--colour-muted);
  font-size: var(--copy-font-size);
  text-transform: uppercase;
}

.checkout-summary__meta {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.checkout-summary__swatch {
  display: inline-block;
  width: 1.1rem;
  height: 1.1rem;
  border: 1px solid var(--colour-border);
  border-radius: 50%;
}

.checkout-summary dl {
  display: grid;
  gap: var(--space-sm);
  border-top: 1px solid var(--colour-border);
  padding-top: var(--space-md);
}

.checkout-summary dl div {
  display: flex;
  justify-content: space-between;
  gap: var(--space-md);
}

.checkout-summary dt {
  color: var(--colour-muted);
}

.checkout-summary dd {
  margin: 0;
  text-align: end;
}

.checkout-summary__total {
  font-weight: 600;
}

.checkout-page__empty {
  display: grid;
  justify-items: start;
  gap: var(--space-md);
}

.checkout-page__empty a {
  color: var(--colour-black);
  background: var(--colour-surface);
}

@media (max-width: 840px) {
  .checkout-page__layout {
    grid-template-columns: 1fr;
  }

  .checkout-summary {
    position: static;
  }
}
</style>
