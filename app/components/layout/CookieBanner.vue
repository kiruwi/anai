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

type InitializedAnalyticsWindow = AnalyticsWindow & {
  dataLayer: unknown[]
  gtag: (...args: unknown[]) => void
}

const cookieConsentKey = 'anai-cookie-consent'
const config = useRuntimeConfig()
const analyticsId =
  typeof config.public.googleTagId === 'string' ? config.public.googleTagId.trim() : ''
const router = useRouter()
const isVisible = ref(false)

const getAnalyticsWindow = (): InitializedAnalyticsWindow => {
  const analyticsWindow = window as AnalyticsWindow

  analyticsWindow.dataLayer = analyticsWindow.dataLayer || []
  analyticsWindow.gtag = analyticsWindow.gtag || ((...args: unknown[]) => {
    analyticsWindow.dataLayer?.push(args)
  })

  return analyticsWindow as InitializedAnalyticsWindow
}

const updateAnalyticsConsent = (choice: 'accepted' | 'rejected') => {
  if (!analyticsId) {
    return
  }

  const analyticsWindow = getAnalyticsWindow()
  const consentValue = choice === 'accepted' ? 'granted' : 'denied'

  analyticsWindow.gtag?.('consent', 'update', {
    ad_storage: consentValue,
    ad_user_data: consentValue,
    ad_personalization: consentValue,
    analytics_storage: consentValue,
  })
}

const getPageViewPayload = () => ({
  page_title: document.title,
  page_location: window.location.href,
  page_path: `${window.location.pathname}${window.location.search}`,
})

const sendPageView = () => {
  if (!analyticsId || localStorage.getItem(cookieConsentKey) !== 'accepted') {
    return
  }

  getAnalyticsWindow().gtag('event', 'page_view', getPageViewPayload())
}

const loadAnalytics = () => {
  if (!analyticsId) {
    return
  }

  const analyticsWindow = getAnalyticsWindow()

  if (document.querySelector(`script[src*="${analyticsId}"]`)) {
    return
  }

  analyticsWindow.gtag?.('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
  })
  analyticsWindow.gtag('js', new Date())
  analyticsWindow.gtag('config', analyticsId, {
    send_page_view: false,
  })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsId}`
  document.head.appendChild(script)
}

const setCookieChoice = (choice: 'accepted' | 'rejected') => {
  localStorage.setItem(cookieConsentKey, choice)
  isVisible.value = false
  updateAnalyticsConsent(choice)

  if (choice === 'accepted') {
    sendPageView()
  }
}

const acceptCookies = () => {
  setCookieChoice('accepted')
}

const rejectCookies = () => {
  setCookieChoice('rejected')
}

onMounted(() => {
  loadAnalytics()

  const storedChoice = localStorage.getItem(cookieConsentKey)

  if (storedChoice === 'accepted') {
    updateAnalyticsConsent('accepted')
    sendPageView()
    return
  }

  if (storedChoice === 'rejected') {
    updateAnalyticsConsent('rejected')
    return
  }

  isVisible.value = storedChoice !== 'rejected'
})

router.afterEach(() => {
  requestAnimationFrame(sendPageView)
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
