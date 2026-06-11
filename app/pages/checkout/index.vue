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

        <button class="checkout-form__submit" type="submit" :disabled="isPaymentButtonDisabled">
          {{ paymentButtonLabel }}
        </button>
      </form>

      <aside class="checkout-summary" aria-label="Order summary">
        <h2>Order summary</h2>
        <div class="checkout-summary__items">
          <article v-for="line in lines" :key="line.slug" class="checkout-summary__item">
            <img
              :src="line.product.imageUrl"
              :alt="line.product.name"
              width="72"
              height="90"
              loading="lazy"
              decoding="async"
            />
            <div>
              <h3>{{ line.product.name }}</h3>
              <p>Qty {{ line.quantity }}</p>
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
const config = useRuntimeConfig()
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

const paystackPublicKey = computed(() =>
  typeof config.public.paystackPublicKey === 'string' ? config.public.paystackPublicKey : '',
)
const isPaymentConfigured = computed(() => Boolean(paystackPublicKey.value))

type PaystackInline = {
  id?: number
  message?: string
  reference: string
}

type PaystackTransactionOptions = {
  key: string
  email: string
  amount: number
  currency: string
  firstName?: string
  lastName?: string
  phone?: string
  reference: string
  metadata?: Record<string, unknown>
  onSuccess?: (transaction: PaystackInline) => void | Promise<void>
  onCancel?: () => void
  onError?: (error: unknown) => void
}

type CreatePaymentResponse = {
  orderId: string
  reference: string
  amountKes: number
  currency: 'KES'
}

type VerifyPaymentResponse = {
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
const isPaymentButtonDisabled = computed(() =>
  isPaymentLoading.value || !isPaymentConfigured.value || hasMissingSizes.value,
)
const paymentButtonLabel = computed(() => {
  if (!isPaymentConfigured.value) {
    return 'Paystack key missing'
  }

  if (hasMissingSizes.value) {
    return 'Select sizes in bag'
  }

  return isPaymentLoading.value ? 'Loading Paystack...' : 'Pay with Paystack'
})

const getCustomerNames = () => {
  const [firstName = '', ...lastNameParts] = customer.name.trim().split(/\s+/)

  return {
    firstName,
    lastName: lastNameParts.join(' '),
  }
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

const createPaystackTransaction = async (options: PaystackTransactionOptions) => {
  const { default: PaystackPop } = await import('@paystack/inline-js')
  const paystack = new PaystackPop()

  return paystack.newTransaction(options)
}

const startPayment = async () => {
  paymentError.value = ''
  paymentMessage.value = ''

  if (!isPaymentConfigured.value) {
    paymentError.value = 'Paystack is not configured. Add PAYSTACK_PUBLIC_KEY to your local .env file.'
    return
  }

  if (!lines.value.length) {
    paymentError.value = 'Your bag is empty.'
    return
  }

  if (hasMissingSizes.value) {
    paymentError.value = 'Choose a size for every item in your bag before checkout.'
    return
  }

  const { firstName, lastName } = getCustomerNames()
  isPaymentLoading.value = true
  paymentMessage.value = 'Preparing secure checkout.'

  try {
    const payment = await $fetch<CreatePaymentResponse>('/api/checkout/create-payment', {
      method: 'POST',
      body: {
        customer,
        items: lines.value.map((line) => ({
          slug: line.slug,
          quantity: line.quantity,
          size: line.size,
        })),
      },
    })

    paymentMessage.value = 'Opening Paystack checkout.'
    let hasPaymentCallback = false

    await createPaystackTransaction({
      key: paystackPublicKey.value,
      email: customer.email,
      amount: payment.amountKes * 100,
      currency: payment.currency,
      firstName,
      lastName,
      phone: customer.phone,
      reference: payment.reference,
      metadata: {
        orderId: payment.orderId,
        deliveryAddress: customer.address,
        cartItems: lines.value.map((line) => ({
          slug: line.slug,
          name: line.product.name,
          quantity: line.quantity,
          size: line.size,
          unitPriceKes: line.product.priceKes,
        })),
        custom_fields: [
          {
            display_name: 'Phone number',
            variable_name: 'phone',
            value: customer.phone,
          },
          {
            display_name: 'Delivery address',
            variable_name: 'delivery_address',
            value: customer.address,
          },
        ],
      },
      onSuccess: async (transaction: PaystackInline) => {
        hasPaymentCallback = true
        const reference = transaction.reference || payment.reference
        paymentMessage.value = 'Confirming payment.'

        try {
          const verification = await $fetch<VerifyPaymentResponse>('/api/checkout/verify-payment', {
            method: 'POST',
            body: {
              reference,
            },
          })

          if (!verification.paid) {
            paymentError.value = `Payment is ${verification.status}. Please contact support with reference ${reference}.`
            return
          }

          clearCart()
          router.push({
            path: '/checkout/success',
            query: {
              reference,
            },
          })
        } catch {
          paymentError.value = `Payment could not be confirmed yet. Please contact support with reference ${reference}.`
        } finally {
          isPaymentLoading.value = false
          paymentMessage.value = ''
        }
      },
      onCancel: () => {
        if (hasPaymentCallback) {
          return
        }

        isPaymentLoading.value = false
        paymentMessage.value = 'Payment cancelled. You can try again when ready.'
      },
      onError: (error: unknown) => {
        const message = error instanceof Error ? error.message : ''

        isPaymentLoading.value = false
        paymentMessage.value = ''
        paymentError.value = message
          ? `Paystack could not open: ${message}`
          : 'Paystack could not open. Please refresh and try again.'
      },
    })
  } catch (error) {
    paymentMessage.value = ''
    paymentError.value = getCheckoutErrorMessage(error)
  } finally {
    if (paymentError.value) {
      isPaymentLoading.value = false
    }
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

.checkout-summary__item img {
  width: 7.2rem;
  aspect-ratio: 4 / 5;
  object-fit: cover;
}

.checkout-summary__item h3 {
  font-size: 1.4rem;
}

.checkout-summary__item p {
  color: var(--colour-muted);
  font-size: 1.2rem;
  text-transform: uppercase;
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
