<template>
  <section class="contact-page container">
    <header class="contact-page__hero">
      <h1>How can we help?</h1>
      <p>
        Contact us for orders, delivery, refunds, returns, payment issues, or general support.
      </p>
    </header>

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
  .contact-page__grid {
    grid-template-columns: 1fr;
  }
}
</style>
