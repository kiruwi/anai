<template>
  <section class="contact-page container">
    <div class="contact-page__layout">
      <div class="contact-page__form-column">
        <header class="contact-page__intro">
          <h1>Let’s talk</h1>
          <p>Contact us for orders, delivery, refunds, returns, payment issues, or general support.</p>
        </header>

        <form class="contact-page__form" @submit.prevent="submitRequest">
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
              {{ isSubmitting ? 'Sending…' : 'Send support request' }}
            </button>
            <p>We usually respond within 1 business day.</p>
          </div>
          <p class="contact-page__privacy">
            We only use the details you provide to handle and follow up on your support request.
          </p>
        </form>
      </div>

      <aside class="contact-page__aside" aria-label="Contact details">
        <img
          class="contact-page__image"
          src="/images/categories/women-square-v2.webp"
          alt="ANAI model wearing an olive zip-up top"
          width="1254"
          height="1254"
        />
        <div class="contact-page__quick-contact">
          <article>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 5h18v14H3z" />
              <path d="m3 6 9 7 9-7" />
            </svg>
            <div>
              <h2>Email</h2>
              <a href="mailto:support@anaibymurda.com">support@anaibymurda.com</a>
            </div>
          </article>
          <article>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 4h3l1.4 4-2.2 1.4a13.5 13.5 0 0 0 5.4 5.4l1.4-2.2 4 1.4v3a3 3 0 0 1-3.2 3A14 14 0 0 1 4 7.2 3 3 0 0 1 7 4Z" />
            </svg>
            <div>
              <h2>Phone</h2>
              <a href="tel:+254758807077">+254 758 807 077</a>
            </div>
          </article>
          <article>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            <div>
              <h2>Response time</h2>
              <p>We usually respond within 1 business day.</p>
            </div>
          </article>
          <article>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            <div>
              <h2>Based in</h2>
              <p>Nairobi, Kenya. Online orders are available nationwide.</p>
            </div>
          </article>
        </div>
      </aside>
    </div>

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
  padding: clamp(var(--space-xl), 7vw, 9.6rem) 0 var(--space-2xl);
}

.contact-page__layout {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(32rem, 0.92fr);
  gap: clamp(var(--space-xl), 6vw, 8rem);
  align-items: start;
  width: min(100%, 112rem);
  margin-inline: auto;
}

.contact-page__form-column,
.contact-page__form {
  display: grid;
}

.contact-page__intro {
  display: grid;
  gap: var(--space-sm);
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid var(--colour-border);
}

h1 {
  margin: 0;
  font-family: var(--font-brand-display);
  font-size: clamp(4.6rem, 5.5vw, 7.2rem);
  font-weight: 400;
  letter-spacing: 0.025em;
  line-height: 0.95;
  text-transform: none;
}

.contact-page__intro p {
  max-width: 52rem;
  margin: 0;
  color: var(--colour-muted);
}

.contact-page__form {
  gap: var(--space-md);
  padding-top: var(--space-lg);
}

.contact-page__fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-md);
  align-items: start;
}

.contact-page__form label {
  display: grid;
  gap: 0.6rem;
  color: var(--colour-black);
  font-size: 1.3rem;
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
  background: #fff;
  font: inherit;
  font-size: var(--copy-font-size);
  text-transform: none;
}

.contact-page__form textarea {
  min-height: 14rem;
  resize: vertical;
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

p {
  margin: 0;
}

.contact-page__aside {
  display: grid;
  gap: var(--space-lg);
}

.contact-page__image {
  width: 100%;
  height: auto;
  aspect-ratio: 4 / 3;
  border-radius: 0;
  object-fit: cover;
  object-position: center 25%;
}

.contact-page__quick-contact {
  display: grid;
  border-top: 1px solid var(--colour-border);
}

.contact-page__quick-contact article {
  display: grid;
  grid-template-columns: 4rem minmax(0, 1fr);
  gap: var(--space-md);
  align-items: start;
  padding: var(--space-md) 0;
  border-bottom: 1px solid var(--colour-border);
}

.contact-page__quick-contact svg {
  width: 4rem;
  height: 4rem;
  border: 1px solid var(--colour-border);
  padding: 0.9rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.4;
}

.contact-page__quick-contact h2 {
  margin: 0 0 var(--space-xs);
  font-size: 1.6rem;
  font-weight: 400;
  letter-spacing: 0.02em;
}

.contact-page__quick-contact a,
.contact-page__quick-contact p {
  color: var(--colour-muted);
  overflow-wrap: anywhere;
}

.contact-page__quick-contact a {
  border-bottom: 1px solid transparent;
}

.contact-page__quick-contact a:hover {
  border-bottom-color: currentColor;
}

.contact-page__faq {
  display: grid;
  width: min(100%, 112rem);
  margin: var(--space-2xl) auto 0;
  padding-top: var(--space-xl);
  border-top: 1px solid var(--colour-border);
}

.contact-page__faq > h2 {
  margin-bottom: var(--space-md);
  font-size: clamp(2.4rem, 3vw, 3.6rem);
  font-weight: 400;
  line-height: 1.1;
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
  .contact-page {
    padding-top: var(--space-xl);
  }

  .contact-page__layout,
  .contact-page__fields {
    grid-template-columns: 1fr;
  }

  .contact-page__layout {
    gap: var(--space-xl);
  }

  .contact-page__field--wide {
    grid-column: auto;
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

  .contact-page__aside {
    gap: var(--space-md);
  }

  .contact-page__image {
    aspect-ratio: 5 / 4;
  }
}
</style>
