<template>
  <section class="contact-page container">
    <header class="contact-page__hero">
      <h1>How can we help?</h1>
      <p>
        Contact us for orders, delivery, refunds, returns, payment issues, or general support.
      </p>
    </header>

    <section class="contact-page__direct" aria-labelledby="direct-contact-heading">
      <h2 id="direct-contact-heading">Contact support directly</h2>
      <div class="contact-page__direct-options">
        <article>
          <h3>Email</h3>
          <a href="mailto:support@anaibymurda.com">support@anaibymurda.com</a>
        </article>
        <article>
          <h3>WhatsApp</h3>
          <a href="#phone">Add your number for a WhatsApp reply</a>
        </article>
        <article>
          <h3>Response time</h3>
          <p>We usually respond within 1 business day.</p>
        </article>
      </div>
    </section>

    <form class="contact-page__form" @submit.prevent="submitRequest">
      <h2>Send a support request</h2>
      <div class="contact-page__fields">
        <label>
          <span>Full name <span class="contact-page__required" aria-hidden="true">*</span></span>
          <input v-model.trim="form.fullName" type="text" autocomplete="name" maxlength="120" required />
        </label>
        <label>
          <span>Email address <span class="contact-page__required" aria-hidden="true">*</span></span>
          <input v-model.trim="form.email" type="email" autocomplete="email" maxlength="254" required />
        </label>
        <label for="phone">
          <span>Phone number (optional)</span>
          <input
            id="phone"
            v-model.trim="form.phone"
            type="tel"
            autocomplete="tel"
            maxlength="30"
            placeholder="+254 7XX XXX XXX"
            aria-describedby="phone-example"
          />
          <small id="phone-example">Include your country code, for example +254 7XX XXX XXX.</small>
        </label>
        <label>
          <span>Help with <span class="contact-page__required" aria-hidden="true">*</span></span>
          <select v-model="form.category" required>
            <option value="order">An order</option>
            <option value="payment">M-Pesa payment</option>
            <option value="delivery">Delivery</option>
            <option value="return">Return or refund</option>
            <option value="product">A product</option>
            <option value="general">Something else</option>
          </select>
        </label>
        <label v-if="showOrderReference" class="contact-page__field--wide">
          <span>Order number or M-Pesa reference (optional)</span>
          <input v-model.trim="form.orderReference" type="text" maxlength="80" />
        </label>
        <label class="contact-page__field--wide">
          <span>How can we help? <span class="contact-page__required" aria-hidden="true">*</span></span>
          <textarea v-model.trim="form.message" rows="6" minlength="10" maxlength="3000" required />
        </label>
      </div>
      <div v-if="successMessage" class="contact-page__success" role="status">
        <strong>Request sent</strong>
        <p>{{ successMessage }}</p>
      </div>
      <p v-if="errorMessage" class="contact-page__error" role="alert">{{ errorMessage }}</p>
      <div class="contact-page__submit">
        <button type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? 'Sending…' : 'Send support request →' }}
        </button>
        <p>We usually respond within 1 business day.</p>
      </div>
      <p class="contact-page__privacy">
        We only use the details you provide to handle and follow up on your support request.
      </p>
    </form>

    <section class="contact-page__faq" aria-labelledby="faq-heading">
      <h2 id="faq-heading">Frequently asked questions</h2>
      <details>
        <summary>What should I include in a customer support request?</summary>
        <p>Include your name, order number when relevant, phone number, and the email used at checkout.</p>
      </details>
      <details>
        <summary>What details do you need for an M-Pesa payment issue?</summary>
        <p>
          Send your order number and M-Pesa transaction reference if a payment failed, was
          deducted, or was duplicated so we can trace it.
        </p>
      </details>
      <details>
        <summary>What should I include for a return or refund?</summary>
        <p>
          Include your order number, payment reference, photos where needed, and a short
          description of the issue.
        </p>
      </details>
      <details>
        <summary>Where is Anai based?</summary>
        <p>Based in Nairobi, Kenya. Online orders are available nationwide.</p>
      </details>
    </section>
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
const referenceCategories = new Set(['order', 'payment', 'return'])
const showOrderReference = computed(() => referenceCategories.has(form.category))

watch(showOrderReference, (isVisible) => {
  if (!isVisible) form.orderReference = ''
})

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
  max-width: 104rem;
  margin-inline: auto;
  margin-bottom: var(--space-xl);
  text-align: center;
}

.contact-page__hero p {
  margin: 0;
  color: var(--colour-muted);
}

h1 {
  margin: 0;
  font-size: clamp(4.4rem, 6.6vw, 8.2rem);
  line-height: 0.96;
}

.contact-page__direct,
.contact-page__faq {
  width: min(100%, 104rem);
  margin-inline: auto;
}

.contact-page__direct {
  display: grid;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.contact-page__direct-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-block: 1px solid #d8cfc7;
}

.contact-page__direct article {
  display: grid;
  gap: var(--space-xs);
  padding: var(--space-md);
}

.contact-page__direct article + article {
  border-left: 1px solid #d8cfc7;
}

.contact-page__direct h3 {
  margin: 0;
  color: var(--colour-muted);
  font-size: 1.2rem;
  text-transform: uppercase;
}

.contact-page__direct a {
  width: fit-content;
  border-bottom: 1px solid currentColor;
}

.contact-page__direct p {
  color: var(--colour-black);
}

.contact-page__form {
  display: grid;
  gap: var(--space-md);
  width: min(100%, 104rem);
  margin-inline: auto;
  margin-bottom: var(--space-2xl);
  border: 1px solid #d8cfc7;
  padding: clamp(var(--space-md), 3vw, var(--space-xl));
  background: #faf8f6;
}

.contact-page__fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-md);
  align-items: start;
}

.contact-page__form label {
  display: grid;
  gap: var(--space-xs);
  color: var(--colour-muted);
  font-size: 1.2rem;
  text-transform: uppercase;
}

.contact-page__form small {
  color: var(--colour-muted);
  font-size: 1.1rem;
  line-height: 1.35;
  text-transform: none;
}

.contact-page__required {
  color: #b42318;
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
  min-height: 4.8rem;
  padding: 1.2rem;
  color: var(--colour-black);
  background: var(--colour-surface);
  font: inherit;
  font-size: 1.6rem;
  text-transform: none;
}

.contact-page__form input:focus-visible,
.contact-page__form select:focus-visible,
.contact-page__form textarea:focus-visible {
  border-color: var(--colour-black);
  outline: 1px solid var(--colour-black);
  outline-offset: 1px;
}

.contact-page__submit {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  align-items: center;
}

.contact-page__form button {
  min-height: 4.8rem;
  border: 1px solid var(--colour-black);
  padding: 1.4rem 2.2rem;
  color: var(--colour-white);
  background: var(--colour-black);
  cursor: pointer;
  font-size: 1.4rem;
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

.contact-page__success {
  display: grid;
  gap: var(--space-xs);
  border-left: 3px solid var(--colour-olive);
  padding: var(--space-sm) var(--space-md);
  background: var(--colour-white);
}

.contact-page__success p,
.contact-page__submit p,
.contact-page__privacy {
  margin: 0;
}

.contact-page__submit p,
.contact-page__privacy {
  color: var(--colour-muted);
}

.contact-page__privacy {
  font-size: 1.2rem;
}

.contact-page__error {
  color: var(--colour-plum);
}

h2,
p {
  margin: 0;
}

h2 {
  font-size: clamp(2rem, 2.8vw, 3.2rem);
  line-height: 1.1;
}

.contact-page__faq {
  display: grid;
}

.contact-page__faq > h2 {
  margin-bottom: var(--space-md);
}

.contact-page__faq details {
  border-top: 1px solid #d8cfc7;
}

.contact-page__faq details:last-child {
  border-bottom: 1px solid #d8cfc7;
}

.contact-page__faq summary {
  padding: var(--space-md) 3.2rem var(--space-md) 0;
  cursor: pointer;
  font-size: var(--copy-font-size);
  list-style-position: inside;
}

.contact-page__faq details p {
  max-width: 78rem;
  padding: 0 3.2rem var(--space-md) 1.8rem;
  color: var(--colour-muted);
  font-size: var(--copy-font-size);
  line-height: var(--copy-line-height);
}

@media (max-width: 760px) {
  .contact-page__fields,
  .contact-page__direct-options {
    grid-template-columns: 1fr;
  }

  .contact-page__field--wide {
    grid-column: auto;
  }

  .contact-page__direct article + article {
    border-top: 1px solid #d8cfc7;
    border-left: 0;
  }

  .contact-page__form input,
  .contact-page__form select {
    min-height: 4.8rem;
  }

  .contact-page__submit {
    align-items: stretch;
    flex-direction: column;
  }

  .contact-page__form button {
    width: 100%;
  }
}
</style>
