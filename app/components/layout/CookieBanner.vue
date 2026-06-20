<template>
  <aside v-if="isVisible" class="cookie-banner" aria-label="Cookie notice">
    <p>
      Anai uses cookies to improve your shopping experience, analyse site traffic, and support
      checkout. By using this site, you agree to our
      <NuxtLink to="/legal/cookie-policy">Cookie Policy</NuxtLink>.
    </p>
    <div class="cookie-banner__actions">
      <button type="button" @click="acceptCookies">Accept</button>
      <NuxtLink to="/legal/cookie-policy">Manage cookies</NuxtLink>
      <button type="button" @click="rejectCookies">Reject non-essential cookies</button>
    </div>
  </aside>
</template>

<script setup lang="ts">
type AnalyticsWindow = Window & {
  dataLayer?: unknown[]
  gtag?: (...args: unknown[]) => void
}

const cookieConsentKey = 'anai-cookie-consent'
const analyticsId = 'G-WW5TYKEGPK'
const isVisible = ref(false)

const loadAnalytics = () => {
  const analyticsWindow = window as AnalyticsWindow

  if (document.querySelector(`script[src*="${analyticsId}"]`)) {
    return
  }

  analyticsWindow.dataLayer = analyticsWindow.dataLayer || []
  analyticsWindow.gtag = (...args: unknown[]) => {
    analyticsWindow.dataLayer?.push(args)
  }
  analyticsWindow.gtag('js', new Date())
  analyticsWindow.gtag('config', analyticsId)

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsId}`
  document.head.appendChild(script)
}

const setCookieChoice = (choice: 'accepted' | 'rejected') => {
  localStorage.setItem(cookieConsentKey, choice)
  isVisible.value = false

  if (choice === 'accepted') {
    loadAnalytics()
  }
}

const acceptCookies = () => {
  setCookieChoice('accepted')
}

const rejectCookies = () => {
  setCookieChoice('rejected')
}

onMounted(() => {
  const storedChoice = localStorage.getItem(cookieConsentKey)

  if (storedChoice === 'accepted') {
    loadAnalytics()
    return
  }

  isVisible.value = storedChoice !== 'rejected'
})
</script>

<style scoped>
.cookie-banner {
  position: fixed;
  right: var(--page-gutter);
  bottom: var(--page-gutter);
  z-index: 40;
  display: grid;
  width: min(48rem, calc(100vw - (var(--page-gutter) * 2)));
  gap: var(--space-md);
  border: 1px solid rgba(255, 255, 255, 0.18);
  padding: var(--space-md);
  color: var(--colour-white);
  background: var(--colour-black);
  box-shadow: 0 2.4rem 6rem rgba(0, 0, 0, 0.22);
}

p {
  margin: 0;
  color: rgba(255, 255, 255, 0.78);
  font-size: var(--copy-font-size);
  line-height: var(--copy-line-height);
}

a {
  border-bottom: 1px solid currentColor;
  color: var(--colour-white);
}

.cookie-banner__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  align-items: center;
}

button,
.cookie-banner__actions a {
  border: 1px solid rgba(255, 255, 255, 0.42);
  padding: 0.8rem 1rem;
  color: var(--colour-white);
  background: transparent;
  cursor: pointer;
  font-size: 1.2rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

button:first-child {
  color: var(--colour-black);
  background: var(--colour-white);
}

@media (max-width: 680px) {
  .cookie-banner {
    right: var(--page-gutter);
    bottom: var(--page-gutter);
  }
}
</style>
