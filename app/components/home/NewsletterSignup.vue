<template>
  <section class="newsletter">
    <div class="newsletter__inner container">
      <div>
        <h2>Get first access to drops, restocks, and offers.</h2>
      </div>
      <form @submit.prevent="subscribe">
        <label for="newsletter-email">Email address</label>
        <div class="newsletter__fields">
          <input
            id="newsletter-email"
            v-model.trim="email"
            type="email"
            autocomplete="email"
            placeholder="you@example.com"
            required
          />
          <button type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Signing up…' : 'Sign up' }}
          </button>
        </div>
        <AppNotification
          v-if="notification"
          class="newsletter__notification"
          :notification="notification"
          inline
        />
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import AppNotification from '../shared/AppNotification.vue'

type NewsletterNotification = {
  id: string
  type: 'success' | 'error'
  title: string
  message: string
  dismissible: false
  duration: null
}

const email = ref('')
const isSubmitting = ref(false)
const notification = ref<NewsletterNotification | null>(null)

const subscribe = async () => {
  isSubmitting.value = true
  notification.value = null

  try {
    await $fetch('/api/newsletter/subscribe', { method: 'POST', body: { email: email.value } })
    email.value = ''
    notification.value = {
      id: 'newsletter-signup-success',
      type: 'success',
      title: 'You’re on the list',
      message: 'Watch your inbox for the next Anai drop.',
      dismissible: false,
      duration: null,
    }
  } catch {
    notification.value = {
      id: 'newsletter-signup-error',
      type: 'error',
      title: 'Signup unsuccessful',
      message: 'We couldn’t add your email right now. Please try again.',
      dismissible: false,
      duration: null,
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.newsletter {
  padding: var(--space-2xl) 0;
  color: var(--colour-olive);
  background: var(--colour-cream);
}

.newsletter__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(32rem, 48rem);
  gap: var(--space-xl);
  align-items: end;
}

p,
h2 {
  margin: 0;
}

p {
  font-size: var(--copy-font-size);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h2 {
  max-width: 74rem;
  margin-top: var(--space-sm);
  color: var(--colour-black);
  font-family: var(--font-brand-display);
  font-weight: 400;
  font-size: clamp(3.2rem, 5vw, 6.4rem);
  letter-spacing: 0.055em;
  line-height: 0.98;
}

label {
  display: block;
  margin-bottom: var(--space-sm);
  font-size: 1.3rem;
  text-transform: uppercase;
}

.newsletter__fields {
  display: flex;
  gap: var(--space-sm);
}

input {
  min-width: 0;
  flex: 1;
  border: 1px solid var(--colour-black);
  border-radius: var(--radius-sm);
  padding: 1.2rem;
  background: var(--colour-surface);
}

button {
  border: 1px solid var(--colour-black);
  border-radius: 0;
  padding: 1.2rem 1.6rem;
  color: var(--colour-white);
  background: var(--colour-black);
  cursor: pointer;
  text-transform: uppercase;
}

button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.newsletter__notification {
  margin-top: var(--space-sm);
}

@media (max-width: 760px) {
  .newsletter__inner {
    grid-template-columns: 1fr;
  }

  .newsletter__fields {
    flex-direction: column;
  }
}
</style>
