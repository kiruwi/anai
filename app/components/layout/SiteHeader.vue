<template>
  <header
    ref="headerElement"
    class="site-header"
    :class="{
      'site-header--over-hero': props.overHero,
      'site-header--pending': isIntroPending,
    }"
  >
    <nav class="site-header__inner container" aria-label="Main navigation">
      <NuxtLink
        class="site-header__logo"
        :class="{ 'site-header__logo--visible': isLogoVisible }"
        to="/"
        aria-label="AÑAI home"
      >
        <svg viewBox="0 0 340.64 92.85" role="img" aria-label="AÑAI">
          <path d="M51.85,90.77l.21-1.57h3.23c2.02,0,3.34-.63,3.96-1.88.63-1.25.45-2.89-.52-4.9-1.25-2.64-2.54-5.32-3.86-8.03-1.32-2.71-2.61-5.39-3.86-8.03h-30.15l-6.05,14.5c-1.04,2.5-1.13,4.52-.26,6.05.87,1.53,2.56,2.29,5.06,2.29h2.5v1.57H0v-1.57h1.25c2.02,0,3.88-.63,5.58-1.88,1.7-1.25,3.01-2.89,3.91-4.9,4.45-10.36,8.88-20.71,13.3-31.03,4.42-10.33,8.85-20.67,13.3-31.03h2.61l30.36,62.8c2.23,4.03,5.53,6.05,9.91,6.05v1.57h-28.37ZM49.76,63.75l-15.02-30.88-12.83,30.88h27.85Z" />
          <path d="M106.28,23.48v-1.56h17.11l48.3,54.45V30.26c0-2.02-.61-3.65-1.83-4.9-1.22-1.25-2.83-1.88-4.85-1.88h-1.15v-1.56h18.78v1.56h-1.15c-2.02,0-3.63.63-4.85,1.88-1.22,1.25-1.83,2.89-1.83,4.9v62.59h-2.4c-9.25-10.43-18.45-20.81-27.59-31.14-9.15-10.33-18.34-20.71-27.59-31.14v51.85c0,2.02.61,3.65,1.83,4.9,1.22,1.25,2.83,1.88,4.85,1.88h1.15v1.57h-18.78v-1.57h1.15c2.02,0,3.63-.63,4.85-1.88,1.22-1.25,1.83-2.89,1.83-4.9V30.26c0-2.02-.61-3.65-1.83-4.9-1.22-1.25-2.83-1.88-4.85-1.88h-1.15Z" />
          <path d="M260.13,90.77l.21-1.57h3.23c2.02,0,3.34-.63,3.96-1.88.63-1.25.45-2.89-.52-4.9-1.25-2.64-2.54-5.32-3.86-8.03-1.32-2.71-2.61-5.39-3.86-8.03h-30.15l-6.05,14.5c-1.04,2.5-1.13,4.52-.26,6.05.87,1.53,2.56,2.29,5.06,2.29h2.5v1.57h-22.12v-1.57h1.25c2.02,0,3.88-.63,5.58-1.88,1.7-1.25,3.01-2.89,3.91-4.9,4.45-10.36,8.88-20.71,13.3-31.03,4.42-10.33,8.85-20.67,13.3-31.03h2.61l30.36,62.8c2.22,4.03,5.53,6.05,9.91,6.05v1.57h-28.38ZM258.04,63.75l-15.02-30.88-12.83,30.88h27.85Z" />
          <path d="M340.64,89.2v1.57h-26.08v-1.57h1.15c2.02,0,3.63-.63,4.85-1.88,1.22-1.25,1.83-2.89,1.83-4.9V30.26c0-2.02-.61-3.65-1.83-4.9-1.22-1.25-2.83-1.88-4.85-1.88h-1.15v-1.56h26.08v1.56h-1.15c-2.02,0-3.63.63-4.85,1.88-1.22,1.25-1.83,2.89-1.83,4.9v52.16c0,2.02.61,3.65,1.83,4.9,1.22,1.25,2.83,1.88,4.85,1.88h1.15Z" />
          <path d="M182.45,2.06c.66.64-3.74,5.72-4.53,6.46-16.2,15.08-36.43-10.39-51.12,1.21-1.02.81-.86,2.2-1.98,2.18.41-4.05,5.76-9.27,9.32-10.76,12.12-5.07,27.54,8.51,41.34,4.94,3.3-.85,4.08-3.2,6.96-4.03Z" />
        </svg>
      </NuxtLink>

      <div class="site-header__desktop-links">
        <NuxtLink to="/shop/new-in">New in</NuxtLink>
        <NuxtLink to="/shop/women">Women</NuxtLink>
        <div
          ref="shopDropdownElement"
          class="site-header__shop-dropdown"
          @mouseenter="isShopDropdownOpen = true"
          @mouseleave="isShopDropdownOpen = false"
        >
          <button
            type="button"
            aria-haspopup="menu"
            :aria-expanded="isShopDropdownOpen"
            aria-controls="desktop-shop-menu"
            @click="isShopDropdownOpen = !isShopDropdownOpen"
          >
            <span>Shop</span>
            <svg class="site-header__shop-chevron" viewBox="0 0 12 8" aria-hidden="true">
              <path d="m1 1 5 5 5-5" />
            </svg>
          </button>
          <div
            v-show="isShopDropdownOpen"
            id="desktop-shop-menu"
            class="site-header__dropdown-menu"
            role="menu"
          >
            <NuxtLink
              v-for="link in desktopShopLinks"
              :key="link.to"
              :to="link.to"
              role="menuitem"
              @click="isShopDropdownOpen = false"
            >
              {{ link.label }}
            </NuxtLink>
          </div>
        </div>
        <NuxtLink to="/about">About</NuxtLink>
        <!-- TODO: Restore site search when the catalogue is large enough to require it.
        <NuxtLink to="/shop#catalog-search">Search</NuxtLink>
        -->
        <NuxtLink to="/wishlist">Wishlist ({{ wishlistCount }})</NuxtLink>
        <NuxtLink to="/cart">Bag ({{ itemCount }})</NuxtLink>
      </div>
    </nav>
  </header>

  <nav
    class="site-header__mobile-nav"
    :class="{ 'site-header__mobile-nav--visible': !props.overHero || hasMobileNavRevealed }"
    aria-label="Quick navigation"
  >
    <button
      ref="mobileShopTriggerElement"
      class="site-header__mobile-action"
      type="button"
      aria-label="Open Shop menu"
      aria-haspopup="dialog"
      :aria-expanded="isMobileShopOpen"
      aria-controls="mobile-shop-menu"
      @click="openMobileShopMenu"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.4 3.5 16 2a4 4 0 0 1-8 0L3.6 3.5a2 2 0 0 0-1.3 2.2l.6 3.5a2 2 0 0 0 2 1.6l1.1-.1V22h12V10.7l1.1.1a2 2 0 0 0 2-1.6l.6-3.5a2 2 0 0 0-1.3-2.2Z" />
      </svg>
      <span>Shop</span>
    </button>
    <NuxtLink class="site-header__mobile-action" to="/contact" aria-label="Contact support">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7.1 3h3l1.3 4.2-2.1 1.3a14 14 0 0 0 6.2 6.2l1.3-2.1 4.2 1.3v3c0 2.3-1.9 4.1-4.2 4A17.8 17.8 0 0 1 3.1 7.2C3 4.9 4.8 3 7.1 3Z" />
      </svg>
      <span>Contact</span>
    </NuxtLink>
    <NuxtLink class="site-header__mobile-action" to="/wishlist" :aria-label="`Wishlist with ${wishlistCount} items`">
      <span class="site-header__icon-wrap">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.5a5.5 5.5 0 0 0 0-7.8Z" />
        </svg>
        <span v-if="wishlistCount" class="site-header__count">{{ wishlistCount }}</span>
      </span>
      <span>Wishlist</span>
    </NuxtLink>
    <NuxtLink class="site-header__mobile-action" to="/cart" :aria-label="`Bag with ${itemCount} items`">
      <span class="site-header__icon-wrap">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 8h14l-1 13H6L5 8ZM9 8V6a3 3 0 0 1 6 0v2" />
        </svg>
        <span v-if="itemCount" class="site-header__count">{{ itemCount }}</span>
      </span>
      <span>Bag</span>
    </NuxtLink>
  </nav>

  <Transition name="mobile-shop-sheet">
    <div
      v-if="isMobileShopOpen"
      class="mobile-shop"
      @keydown="handleMobileShopKeydown"
    >
      <button
        class="mobile-shop__backdrop"
        type="button"
        aria-label="Close Shop menu"
        tabindex="-1"
        @click="closeMobileShopMenu()"
      />
      <section
        id="mobile-shop-menu"
        ref="mobileShopDialogElement"
        class="mobile-shop__sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-shop-title"
      >
        <header>
          <h2 id="mobile-shop-title">Shop</h2>
          <button type="button" aria-label="Close Shop menu" @click="closeMobileShopMenu()">
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <nav aria-label="Shop collections">
          <NuxtLink
            v-for="(link, index) in mobileShopLinks"
            :key="link.to"
            :ref="index === 0 ? setFirstMobileShopLink : undefined"
            :to="link.to"
            @click="closeMobileShopMenu(false)"
          >
            {{ link.label }}
            <span aria-hidden="true">→</span>
          </NuxtLink>
        </nav>
      </section>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import { products } from '../../data/homeContent'

const props = withDefaults(defineProps<{
  overHero?: boolean
}>(), {
  overHero: false,
})

const hasPlayedIntro = useState('site-header-intro-played', () => false)
const isLogoDocked = useState('anai-logo-docked', () => false)
const hasMobileNavRevealed = ref(!props.overHero)
const isShopDropdownOpen = ref(false)
const isMobileShopOpen = ref(false)
const { itemCount } = useCart()
const { itemCount: wishlistCount } = useWishlist()
const isLogoVisible = computed(() => !props.overHero || isLogoDocked.value)
const isIntroPending = ref(!hasPlayedIntro.value)
const headerElement = ref<HTMLElement | null>(null)
const shopDropdownElement = ref<HTMLElement | null>(null)
const mobileShopTriggerElement = ref<HTMLButtonElement | null>(null)
const mobileShopDialogElement = ref<HTMLElement | null>(null)
const firstMobileShopLinkElement = ref<HTMLElement | null>(null)
let introAnimation: { kill: () => void } | undefined

const hasAccessories = products.some((product) => product.category.toLowerCase() === 'accessories')
const baseShopLinks = [
  { label: 'All products', to: '/shop' },
  { label: 'Sets', to: '/shop/sets' },
  { label: 'Tops', to: '/shop/tops' },
  { label: 'Bottoms', to: '/shop/bottoms' },
  { label: 'Outerwear', to: '/shop/outerwear' },
]
const desktopShopLinks = computed(() => [
  ...baseShopLinks,
  ...(hasAccessories ? [{ label: 'Accessories', to: '/shop/accessories' }] : []),
])
const mobileShopLinks = computed(() => [
  { label: 'All products', to: '/shop' },
  { label: 'New in', to: '/shop/new-in' },
  { label: 'Women', to: '/shop/women' },
  ...baseShopLinks.slice(1),
  ...(hasAccessories ? [{ label: 'Accessories', to: '/shop/accessories' }] : []),
])

const updateHeaderState = () => {
  if (window.scrollY > 0) {
    hasMobileNavRevealed.value = true
  }
}

const setFirstMobileShopLink = (element: Element | ComponentPublicInstance | null) => {
  firstMobileShopLinkElement.value = element instanceof HTMLElement ? element : null
}

const openMobileShopMenu = async () => {
  isMobileShopOpen.value = true
  document.documentElement.classList.add('anai-shop-menu-open')
  await nextTick()
  firstMobileShopLinkElement.value?.focus()
}

const closeMobileShopMenu = (restoreFocus = true) => {
  if (!isMobileShopOpen.value) return

  isMobileShopOpen.value = false
  document.documentElement.classList.remove('anai-shop-menu-open')

  if (restoreFocus) {
    nextTick(() => mobileShopTriggerElement.value?.focus())
  }
}

const handleMobileShopKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    closeMobileShopMenu()
    return
  }

  if (event.key !== 'Tab') return

  const focusableElements = Array.from(
    mobileShopDialogElement.value?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [],
  )
  const firstElement = focusableElements[0]
  const lastElement = focusableElements.at(-1)

  if (!firstElement || !lastElement) return

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault()
    lastElement.focus()
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault()
    firstElement.focus()
  }
}

const handleDocumentPointerDown = (event: PointerEvent) => {
  if (
    isShopDropdownOpen.value &&
    event.target instanceof Node &&
    !shopDropdownElement.value?.contains(event.target)
  ) {
    isShopDropdownOpen.value = false
  }
}

const handleDocumentKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isShopDropdownOpen.value) {
    isShopDropdownOpen.value = false
  }
}

watch(isLogoDocked, (isDocked) => {
  if (isDocked) hasMobileNavRevealed.value = true
}, { immediate: true })

const route = useRoute()
watch(() => route.fullPath, () => closeMobileShopMenu(false))

onMounted(async () => {
  updateHeaderState()
  window.addEventListener('scroll', updateHeaderState, { passive: true })
  document.addEventListener('pointerdown', handleDocumentPointerDown)
  document.addEventListener('keydown', handleDocumentKeydown)

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (hasPlayedIntro.value || prefersReducedMotion) {
    isIntroPending.value = false
    return
  }

  const { gsap } = await import('gsap')
  gsap.set(headerElement.value, { opacity: 0, y: -28 })
  isIntroPending.value = false
  introAnimation = gsap.to(headerElement.value, {
    opacity: 1,
    y: 0,
    duration: 0.5,
    ease: 'power3.out',
    clearProps: 'opacity,transform',
    onComplete: () => {
      hasPlayedIntro.value = true
    },
  })
})

onBeforeUnmount(() => {
  introAnimation?.kill()
  window.removeEventListener('scroll', updateHeaderState)
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
  document.removeEventListener('keydown', handleDocumentKeydown)
  document.documentElement.classList.remove('anai-shop-menu-open')
  isIntroPending.value = false
})
</script>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 40;
  color: var(--colour-white);
  mix-blend-mode: difference;
}

.site-header--over-hero {
  position: fixed;
  right: 0;
  left: 0;
}

.site-header--pending {
  opacity: 0;
  transform: translateY(-28px);
}

.site-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  min-height: 7.2rem;
}

.site-header__logo {
  display: block;
  width: clamp(9.6rem, 11vw, 15rem);
  flex: 0 0 auto;
  color: var(--colour-white);
  opacity: 0;
  pointer-events: none;
  transform: translateY(1.2rem) scale(0.92);
  transition: opacity 420ms ease, transform 620ms cubic-bezier(0.22, 1, 0.36, 1);
}

.site-header__logo--visible {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0) scale(1);
}

.site-header__logo svg {
  display: block;
  width: 100%;
  height: auto;
  fill: currentColor;
}

.site-header__desktop-links {
  display: flex;
  gap: clamp(1.2rem, 1.8vw, 2.8rem);
  align-items: center;
  margin-left: auto;
  font-size: clamp(1.65rem, 1.65vw, 2.25rem);
  letter-spacing: 0.055em;
  white-space: nowrap;
}

.site-header__desktop-links a,
.site-header__shop-dropdown > button {
  border: 0;
  padding: 0.8rem 0;
  color: inherit;
  background: transparent;
  cursor: pointer;
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
}

.site-header__shop-dropdown > button {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  line-height: 1;
}

.site-header__desktop-links > a:hover,
.site-header__desktop-links > a.router-link-active,
.site-header__shop-dropdown > button:hover {
  color: #d6c1a9;
}

.site-header__shop-dropdown {
  position: relative;
  display: flex;
  align-self: stretch;
  align-items: center;
}

.site-header__shop-chevron {
  display: block;
  width: 1rem;
  height: 0.7rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.5;
  transition: transform 180ms ease;
}

.site-header__shop-dropdown > button[aria-expanded="true"] .site-header__shop-chevron {
  transform: rotate(180deg);
}

.site-header__dropdown-menu {
  position: absolute;
  top: 100%;
  left: 50%;
  z-index: 1;
  display: grid;
  min-width: 19rem;
  padding: 0.8rem;
  color: var(--colour-white);
  background: rgba(0, 0, 0, 0.96);
  font-size: clamp(1.1rem, 1.1vw, 1.5rem);
  box-shadow: 0 1.6rem 3.6rem rgba(0, 0, 0, 0.24);
  transform: translateX(-50%);
}

.site-header__dropdown-menu a {
  padding: 1rem 1.2rem;
}

.site-header__dropdown-menu a:hover,
.site-header__dropdown-menu a.router-link-active {
  color: var(--colour-black);
  background: #d6c1a9;
}

.site-header__mobile-nav,
.mobile-shop {
  display: none;
}

@media (max-width: 980px) {
  .site-header__desktop-links {
    gap: 1.2rem;
    font-size: 1.5rem;
  }
}

@media (max-width: 760px) {
  .site-header {
    pointer-events: none;
  }

  .site-header__inner {
    justify-content: center;
    min-height: 6.4rem;
  }

  .site-header__logo {
    width: clamp(9.8rem, 30vw, 11.2rem);
  }

  .site-header__desktop-links {
    display: none;
  }

  .site-header__mobile-nav {
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 60;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    min-height: calc(7rem + env(safe-area-inset-bottom));
    padding: 0.55rem max(0.8rem, env(safe-area-inset-right)) calc(0.55rem + env(safe-area-inset-bottom)) max(0.8rem, env(safe-area-inset-left));
    border-top: 1px solid rgba(255, 255, 255, 0.16);
    color: var(--colour-white);
    background: rgba(0, 0, 0, 0.96);
    box-shadow: 0 -0.8rem 2.4rem rgba(0, 0, 0, 0.16);
    opacity: 0;
    pointer-events: none;
    transform: translateY(calc(100% + env(safe-area-inset-bottom)));
    transition: opacity 240ms ease, transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  .site-header__mobile-nav--visible {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }

  .site-header__mobile-action {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    align-items: center;
    justify-content: center;
    min-width: 0;
    height: 5.9rem;
    border: 0;
    padding: 0.35rem;
    color: rgba(255, 255, 255, 0.7);
    background: transparent;
    cursor: pointer;
    font: inherit;
    font-size: 1.05rem;
    letter-spacing: 0.03em;
    transition: color 180ms ease;
  }

  .site-header__mobile-action.router-link-active,
  .site-header__mobile-action[aria-expanded="true"] {
    color: #d6c1a9;
  }

  .site-header__mobile-action svg {
    display: block;
    width: 2.25rem;
    height: 2.25rem;
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.5;
  }

  .site-header__icon-wrap {
    position: relative;
    display: block;
  }

  .site-header__count {
    position: absolute;
    top: -0.7rem;
    right: -1rem;
    display: grid;
    place-items: center;
    min-width: 1.6rem;
    height: 1.6rem;
    border-radius: 50%;
    padding: 0 0.35rem;
    color: var(--colour-black);
    background: var(--colour-white);
    font-size: 0.9rem;
    letter-spacing: 0;
    line-height: 1;
  }

  .mobile-shop {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: block;
  }

  .mobile-shop__backdrop {
    position: absolute;
    inset: 0;
    width: 100%;
    border: 0;
    background: rgba(0, 0, 0, 0.58);
    cursor: pointer;
  }

  .mobile-shop__sheet {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    max-height: min(78vh, 64rem);
    overflow-y: auto;
    padding: var(--space-lg) var(--page-gutter) calc(var(--space-lg) + env(safe-area-inset-bottom));
    color: var(--colour-black);
    background: var(--colour-white);
    box-shadow: 0 -1.6rem 4rem rgba(0, 0, 0, 0.24);
  }

  .mobile-shop__sheet header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-lg);
  }

  .mobile-shop__sheet h2 {
    margin: 0;
    font-family: var(--font-brand-display);
    font-size: 4rem;
    font-weight: 400;
    letter-spacing: 0.055em;
  }

  .mobile-shop__sheet header button {
    display: grid;
    width: 4.4rem;
    height: 4.4rem;
    border: 1px solid currentColor;
    border-radius: 50%;
    place-items: center;
    color: inherit;
    background: transparent;
    cursor: pointer;
    font-size: 2.8rem;
    line-height: 1;
  }

  .mobile-shop__sheet nav {
    display: grid;
  }

  .mobile-shop__sheet nav a {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid var(--colour-border);
    padding: 1.35rem 0;
    font-size: 1.8rem;
  }

  .mobile-shop__sheet nav a:last-child {
    border-bottom: 1px solid var(--colour-border);
  }

  .mobile-shop-sheet-enter-active,
  .mobile-shop-sheet-leave-active {
    transition: opacity 240ms ease;
  }

  .mobile-shop-sheet-enter-active .mobile-shop__sheet,
  .mobile-shop-sheet-leave-active .mobile-shop__sheet {
    transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  .mobile-shop-sheet-enter-from,
  .mobile-shop-sheet-leave-to {
    opacity: 0;
  }

  .mobile-shop-sheet-enter-from .mobile-shop__sheet,
  .mobile-shop-sheet-leave-to .mobile-shop__sheet {
    transform: translateY(100%);
  }

  :global(html.anai-shop-menu-open),
  :global(html.anai-shop-menu-open body) {
    overflow: hidden;
  }

  :global(.site-footer) {
    padding-bottom: calc(7rem + env(safe-area-inset-bottom));
  }
}

@media (prefers-reduced-motion: reduce) {
  .site-header,
  .site-header__inner,
  .site-header__logo,
  .site-header__mobile-nav,
  .mobile-shop-sheet-enter-active,
  .mobile-shop-sheet-leave-active,
  .mobile-shop-sheet-enter-active .mobile-shop__sheet,
  .mobile-shop-sheet-leave-active .mobile-shop__sheet {
    transition-duration: 1ms;
  }
}
</style>
