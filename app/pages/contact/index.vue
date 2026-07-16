<template>
  <section class="contact-page container">
    <header class="contact-page__hero">
      <h1>How can we help?</h1>
      <p>
        Contact us for orders, delivery, refunds, returns, payment issues, or general support.
      </p>
    </header>

    <form class="contact-page__form" @submit.prevent="submitRequest">
      <h2>Send a support request</h2>
      <div class="contact-page__fields">
        <label>
          Full name
          <input v-model.trim="form.fullName" type="text" autocomplete="name" maxlength="120" required />
        </label>
        <label>
          Email address
          <input v-model.trim="form.email" type="email" autocomplete="email" maxlength="254" required />
        </label>
        <label>
          Phone or WhatsApp number
          <input v-model.trim="form.phone" type="tel" autocomplete="tel" maxlength="30" />
        </label>
        <label>
          Help with
          <select v-model="form.category" required>
            <option value="order">An order</option>
            <option value="payment">M-Pesa payment</option>
            <option value="delivery">Delivery</option>
            <option value="return">Return or refund</option>
            <option value="product">A product</option>
            <option value="general">Something else</option>
          </select>
        </label>
        <label class="contact-page__field--wide">
          Order number or M-Pesa reference, if applicable
          <input v-model.trim="form.orderReference" type="text" maxlength="80" />
        </label>
        <label class="contact-page__field--wide">
          How can we help?
          <textarea v-model.trim="form.message" rows="6" minlength="10" maxlength="3000" required />
        </label>
      </div>
      <p v-if="successMessage" class="contact-page__success" role="status">{{ successMessage }}</p>
      <p v-if="errorMessage" class="contact-page__error" role="alert">{{ errorMessage }}</p>
      <button type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? 'Sending…' : 'Send request' }}
      </button>
    </form>

    <div class="contact-page__grid">
      <article>
        <h2>Customer support</h2>
        <p>Use this page for order, delivery, return, refund, and product support.</p>
        <p>Include your name, order number, phone number, and the email used at checkout.</p>
      </article>

      <article>
        <h2>Payment support</h2>
        <p>
          If your M-Pesa payment failed, was deducted, or was duplicated, send your order number
          and M-Pesa transaction reference so we can trace the payment.
        </p>
      </article>

      <article>
        <h2>Returns and refunds</h2>
        <p>
          For returns, include your order number, payment reference, photos where needed, and a
          short description of the issue.
        </p>
      </article>

      <article>
        <h2>Business location</h2>
        <p>Anai operates from Nairobi, Kenya.</p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
const form = reactive({
  fullName: '',
  email: '',
  phone: '',
  category: 'order',
  orderReference: '',
  message: '',
})
const isSubmitting = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const submitRequest = async () => {
  isSubmitting.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const response = await $fetch<{ requestNumber: string }>('/api/support/request', {
      method: 'POST',
      body: form,
    })
    successMessage.value = `Your request ${response.requestNumber} was received. Keep this number for follow-up.`
    form.orderReference = ''
    form.message = ''
  } catch (error) {
    const fetchError = error as { data?: { statusMessage?: string }; statusMessage?: string }
    errorMessage.value = fetchError.data?.statusMessage || fetchError.statusMessage || 'Your request could not be sent. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

useSeoMeta({
  title: 'Contact | Anai',
  description: 'Contact Anai for orders, payments, delivery, refunds, returns, and general support.',
})
</script>

<style scoped>
.contact-page {
  padding: var(--space-2xl) 0;
}

.contact-page__hero {
  display: grid;
  gap: var(--space-sm);
  max-width: 78rem;
  margin-bottom: var(--space-xl);
}

.contact-page__hero p {
  margin: 0;
  color: var(--colour-muted);
}

h1 {
  margin: 0;
  font-size: clamp(5.2rem, 8vw, 10rem);
  line-height: 0.92;
  text-align: start;
}

.contact-page__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-lg);
}

.contact-page__form {
  display: grid;
  gap: var(--space-md);
  max-width: 90rem;
  margin-bottom: var(--space-2xl);
  border: 1px solid var(--colour-border);
  padding: var(--space-lg);
}

.contact-page__fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-md);
}

.contact-page__form label {
  display: grid;
  gap: var(--space-xs);
  color: var(--colour-muted);
  font-size: 1.2rem;
  text-transform: uppercase;
}

.contact-page__field--wide {
  grid-column: 1 / -1;
}

.contact-page__form input,
.contact-page__form select,
.contact-page__form textarea {
  width: 100%;
  border: 1px solid var(--colour-border);
  border-radius: 0;
  padding: 1.2rem;
  color: var(--colour-black);
  background: var(--colour-surface);
  font: inherit;
  font-size: 1.6rem;
  text-transform: none;
}

.contact-page__form button {
  justify-self: start;
  border: 1px solid var(--colour-black);
  padding: 1.2rem 1.6rem;
  color: var(--colour-white);
  background: var(--colour-black);
  cursor: pointer;
  text-transform: uppercase;
}

.contact-page__form button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.contact-page__success,
.contact-page__error {
  margin: 0;
}

.contact-page__error {
  color: var(--colour-plum);
}

article {
  display: grid;
  gap: var(--space-sm);
  border-top: 1px solid var(--colour-border);
  padding-top: var(--space-md);
}

h2,
p {
  margin: 0;
}

h2 {
  font-size: clamp(2rem, 2.8vw, 3.2rem);
  line-height: 1.1;
}

article p {
  color: var(--colour-muted);
  font-size: var(--copy-font-size);
  line-height: var(--copy-line-height);
}

@media (max-width: 760px) {
  .contact-page__fields,
  .contact-page__grid {
    grid-template-columns: 1fr;
  }

  .contact-page__field--wide {
    grid-column: auto;
  }
}
</style>
