<template>
  <aside v-if="isVisible" class="cookie-banner" aria-label="Cookie preferences">
    <template v-if="isPreferencesOpen">
      <div class="cookie-banner__heading">
        <h2>Cookie preferences</h2>
        <p>
          Choose whether Anai may use analytics. Required shopping storage stays on so your bag,
          wishlist, checkout, and consent choices work.
        </p>
      </div>

      <fieldset class="cookie-banner__categories">
        <legend class="sr-only">Storage categories</legend>
        <label class="cookie-banner__category cookie-banner__category--required">
          <span>
            <strong>Required shopping storage</strong>
            <small>Keeps the bag, wishlist, checkout session, and your cookie choice working.</small>
          </span>
          <input type="checkbox" checked disabled />
        </label>

        <label class="cookie-banner__category">
          <span>
            <strong>Analytics</strong>
            <small>Allows Google Analytics to measure visits and page use so we can improve the site.</small>
          </span>
          <input v-model="draftAnalytics" type="checkbox" />
        </label>
      </fieldset>

      <p class="cookie-banner__policy">
        Anai does not currently use advertising cookies. Read the
        <NuxtLink to="/legal/cookie-policy">Cookie Policy</NuxtLink>.
      </p>

      <div class="cookie-banner__actions">
        <button class="cookie-banner__primary" type="button" @click="savePreferences">
          Save choices
        </button>
        <button type="button" @click="acceptAll">Accept all</button>
        <button type="button" @click="rejectNonEssential">Reject analytics</button>
      </div>
    </template>

    <template v-else>
      <p>
        Anai uses required shopping storage and, with your permission, analytics to improve the
        site. Read our <NuxtLink to="/legal/cookie-policy">Cookie Policy</NuxtLink>.
      </p>
      <div class="cookie-banner__actions">
        <button class="cookie-banner__primary" type="button" @click="acceptAll">Accept all</button>
        <button type="button" @click="openPreferences">Manage cookies</button>
        <button type="button" @click="rejectNonEssential">Reject analytics</button>
      </div>
    </template>
  </aside>
</template>

<script setup lang="ts">
type AnalyticsWindow = Window & {
  dataLayer?: unknown[]
  gtag?: (...args: unknown[]) => void
  anaiGoogleTagConfigured?: boolean
}

type InitializedAnalyticsWindow = AnalyticsWindow & {
  dataLayer: unknown[]
  gtag: (...args: unknown[]) => void
}

type CookiePreferences = {
  version: 1
  analytics: boolean
}

const cookieConsentKey = 'anai-cookie-consent'
const config = useRuntimeConfig()
const analyticsId =
  typeof config.public.googleTagId === 'string' ? config.public.googleTagId.trim() : ''
const router = useRouter()
const isVisible = ref(false)
const isPreferencesOpen = ref(false)
const draftAnalytics = ref(false)
const savedPreferences = ref<CookiePreferences | null>(null)
const cookieSettingsRequested = useState('anai-cookie-settings-requested', () => false)

const getAnalyticsWindow = (): InitializedAnalyticsWindow => {
  const analyticsWindow = window as AnalyticsWindow

  analyticsWindow.dataLayer = analyticsWindow.dataLayer || []
  analyticsWindow.gtag = analyticsWindow.gtag || ((...args: unknown[]) => {
    analyticsWindow.dataLayer?.push(args)
  })

  return analyticsWindow as InitializedAnalyticsWindow
}

const updateAnalyticsConsent = (isAllowed: boolean) => {
  const analyticsWindow = getAnalyticsWindow()
  analyticsWindow.gtag('consent', 'update', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: isAllowed ? 'granted' : 'denied',
  })
}

const getPageViewPayload = () => ({
  page_title: document.title,
  page_location: window.location.href,
  page_path: `${window.location.pathname}${window.location.search}`,
})

const hasAnalyticsConsent = () => savedPreferences.value?.analytics === true

const sendPageView = () => {
  if (!analyticsId || !hasAnalyticsConsent()) return
  getAnalyticsWindow().gtag('config', analyticsId, getPageViewPayload())
}

const loadAnalytics = () => {
  if (!analyticsId || !hasAnalyticsConsent()) return

  const analyticsWindow = getAnalyticsWindow()
  if (!analyticsWindow.anaiGoogleTagConfigured) {
    analyticsWindow.gtag('js', new Date())
    analyticsWindow.gtag('config', analyticsId, { send_page_view: false })
    analyticsWindow.anaiGoogleTagConfigured = true
  }

  if (document.querySelector(`script[src*="${analyticsId}"]`)) return

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsId}`
  document.head.appendChild(script)
}

const parseStoredPreferences = (): CookiePreferences | null => {
  const storedValue = localStorage.getItem(cookieConsentKey)
  if (storedValue === 'accepted') return { version: 1, analytics: true }
  if (storedValue === 'rejected') return { version: 1, analytics: false }
  if (!storedValue) return null

  try {
    const parsed = JSON.parse(storedValue) as Partial<CookiePreferences>
    return parsed.version === 1 && typeof parsed.analytics === 'boolean'
      ? { version: 1, analytics: parsed.analytics }
      : null
  } catch {
    return null
  }
}

const setCookiePreferences = (analytics: boolean) => {
  const preferences: CookiePreferences = { version: 1, analytics }
  savedPreferences.value = preferences
  draftAnalytics.value = analytics
  localStorage.setItem(cookieConsentKey, JSON.stringify(preferences))
  updateAnalyticsConsent(analytics)

  if (analytics) {
    loadAnalytics()
    sendPageView()
  }

  isVisible.value = false
  isPreferencesOpen.value = false
}

const acceptAll = () => setCookiePreferences(true)
const rejectNonEssential = () => setCookiePreferences(false)
const savePreferences = () => setCookiePreferences(draftAnalytics.value)

const openPreferences = () => {
  draftAnalytics.value = savedPreferences.value?.analytics ?? false
  isPreferencesOpen.value = true
  isVisible.value = true
}

watch(cookieSettingsRequested, (isRequested) => {
  if (!isRequested) return
  openPreferences()
  cookieSettingsRequested.value = false
})

onMounted(() => {
  savedPreferences.value = parseStoredPreferences()

  if (savedPreferences.value) {
    draftAnalytics.value = savedPreferences.value.analytics
    updateAnalyticsConsent(savedPreferences.value.analytics)
    if (savedPreferences.value.analytics) {
      loadAnalytics()
      sendPageView()
    }
  } else {
    isVisible.value = true
  }

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
  width: min(54rem, calc(100vw - (var(--page-gutter) * 2)));
  max-height: calc(100vh - (var(--page-gutter) * 2));
  gap: var(--space-md);
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.18);
  padding: var(--space-md);
  color: var(--colour-white);
  background: var(--colour-black);
  box-shadow: 0 2.4rem 6rem rgba(0, 0, 0, 0.22);
}

.cookie-banner__heading {
  display: grid;
  gap: var(--space-xs);
}

h2,
p {
  margin: 0;
}

h2 {
  font-size: 2rem;
  font-weight: 500;
  text-transform: uppercase;
}

p {
  color: rgba(255, 255, 255, 0.78);
  font-size: var(--copy-font-size);
  line-height: var(--copy-line-height);
}

a {
  border-bottom: 1px solid currentColor;
  color: var(--colour-white);
}

.cookie-banner__categories {
  display: grid;
  gap: var(--space-sm);
  margin: 0;
  border: 0;
  padding: 0;
}

.cookie-banner__category {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-md);
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.24);
  padding: var(--space-sm);
  cursor: pointer;
}

.cookie-banner__category--required {
  cursor: default;
}

.cookie-banner__category span {
  display: grid;
  gap: 0.4rem;
}

.cookie-banner__category strong {
  font-size: 1.3rem;
  font-weight: 500;
  text-transform: uppercase;
}

.cookie-banner__category small {
  color: rgba(255, 255, 255, 0.68);
  font-size: 1.2rem;
  line-height: 1.4;
}

.cookie-banner__category input {
  width: 2rem;
  height: 2rem;
  accent-color: var(--colour-white);
}

.cookie-banner__policy {
  font-size: 1.2rem;
}

.cookie-banner__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  align-items: center;
}

button {
  border: 1px solid rgba(255, 255, 255, 0.42);
  padding: 0.8rem 1rem;
  color: var(--colour-white);
  background: transparent;
  cursor: pointer;
  font-size: 1.2rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.cookie-banner__primary {
  color: var(--colour-black);
  background: var(--colour-white);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

@media (max-width: 680px) {
  .cookie-banner {
    right: var(--page-gutter);
    bottom: var(--page-gutter);
  }

  .cookie-banner__actions {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
