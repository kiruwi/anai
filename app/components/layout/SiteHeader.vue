<template>
  <header
    ref="headerElement"
    class="site-header"
    :class="{
      'site-header--pending': isIntroPending,
      'site-header--over-hero': props.overHero,
    }"
  >
    <nav class="site-header__inner container" aria-label="Main navigation">
      <NuxtLink
        class="site-header__logo"
        :class="{ 'site-header__logo--visible': isLogoVisible }"
        to="/"
        aria-label="ANAI home"
      >
        <svg viewBox="0 0 340.64 92.85" role="img" aria-label="ANAI">
          <path d="M51.85,90.77l.21-1.57h3.23c2.02,0,3.34-.63,3.96-1.88.63-1.25.45-2.89-.52-4.9-1.25-2.64-2.54-5.32-3.86-8.03-1.32-2.71-2.61-5.39-3.86-8.03h-30.15l-6.05,14.5c-1.04,2.5-1.13,4.52-.26,6.05.87,1.53,2.56,2.29,5.06,2.29h2.5v1.57H0v-1.57h1.25c2.02,0,3.88-.63,5.58-1.88,1.7-1.25,3.01-2.89,3.91-4.9,4.45-10.36,8.88-20.71,13.3-31.03,4.42-10.33,8.85-20.67,13.3-31.03h2.61l30.36,62.8c2.23,4.03,5.53,6.05,9.91,6.05v1.57h-28.37ZM49.76,63.75l-15.02-30.88-12.83,30.88h27.85Z" />
          <path d="M106.28,23.48v-1.56h17.11l48.3,54.45V30.26c0-2.02-.61-3.65-1.83-4.9-1.22-1.25-2.83-1.88-4.85-1.88h-1.15v-1.56h18.78v1.56h-1.15c-2.02,0-3.63.63-4.85,1.88-1.22,1.25-1.83,2.89-1.83,4.9v62.59h-2.4c-9.25-10.43-18.45-20.81-27.59-31.14-9.15-10.33-18.34-20.71-27.59-31.14v51.85c0,2.02.61,3.65,1.83,4.9,1.22,1.25,2.83,1.88,4.85,1.88h1.15v1.57h-18.78v-1.57h1.15c2.02,0,3.63-.63,4.85-1.88,1.22-1.25,1.83-2.89,1.83-4.9V30.26c0-2.02-.61-3.65-1.83-4.9-1.22-1.25-2.83-1.88-4.85-1.88h-1.15Z" />
          <path d="M260.13,90.77l.21-1.57h3.23c2.02,0,3.34-.63,3.96-1.88.63-1.25.45-2.89-.52-4.9-1.25-2.64-2.54-5.32-3.86-8.03-1.32-2.71-2.61-5.39-3.86-8.03h-30.15l-6.05,14.5c-1.04,2.5-1.13,4.52-.26,6.05.87,1.53,2.56,2.29,5.06,2.29h2.5v1.57h-22.12v-1.57h1.25c2.02,0,3.88-.63,5.58-1.88,1.7-1.25,3.01-2.89,3.91-4.9,4.45-10.36,8.88-20.71,13.3-31.03,4.42-10.33,8.85-20.67,13.3-31.03h2.61l30.36,62.8c2.22,4.03,5.53,6.05,9.91,6.05v1.57h-28.38ZM258.04,63.75l-15.02-30.88-12.83,30.88h27.85Z" />
          <path d="M340.64,89.2v1.57h-26.08v-1.57h1.15c2.02,0,3.63-.63,4.85-1.88,1.22-1.25,1.83-2.89,1.83-4.9V30.26c0-2.02-.61-3.65-1.83-4.9-1.22-1.25-2.83-1.88-4.85-1.88h-1.15v-1.56h26.08v1.56h-1.15c-2.02,0-3.63.63-4.85,1.88-1.22,1.25-1.83,2.89-1.83,4.9v52.16c0,2.02.61,3.65,1.83,4.9,1.22,1.25,2.83,1.88,4.85,1.88h1.15Z" />
          <path d="M182.45,2.06c.66.64-3.74,5.72-4.53,6.46-16.2,15.08-36.43-10.39-51.12,1.21-1.02.81-.86,2.2-1.98,2.18.41-4.05,5.76-9.27,9.32-10.76,12.12-5.07,27.54,8.51,41.34,4.94,3.3-.85,4.08-3.2,6.96-4.03Z" />
        </svg>
      </NuxtLink>
      <div class="site-header__links">
        <NuxtLink
          class="site-header__action"
          to="/shop"
          aria-label="Shop all products"
        >
          <span class="site-header__action-label">Shop</span>
          <svg class="site-header__action-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.4 3.5 16 2a4 4 0 0 1-8 0L3.6 3.5a2 2 0 0 0-1.3 2.2l.6 3.5a2 2 0 0 0 2 1.6l1.1-.1V22h12V10.7l1.1.1a2 2 0 0 0 2-1.6l.6-3.5a2 2 0 0 0-1.3-2.2Z" />
          </svg>
        </NuxtLink>
        <NuxtLink
          class="site-header__action"
          to="/contact"
          aria-label="Contact support"
        >
          <span class="site-header__action-label">Contact</span>
          <svg class="site-header__action-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7.1 3h3l1.3 4.2-2.1 1.3a14 14 0 0 0 6.2 6.2l1.3-2.1 4.2 1.3v3c0 2.3-1.9 4.1-4.2 4A17.8 17.8 0 0 1 3.1 7.2C3 4.9 4.8 3 7.1 3Z" />
          </svg>
        </NuxtLink>
        <NuxtLink
          class="site-header__action"
          to="/wishlist"
          :aria-label="`Wishlist with ${wishlistCount} items`"
        >
          <span class="site-header__action-label">Wishlist(<span>{{ wishlistCount }}</span>)</span>
          <span class="site-header__icon-wrap">
            <svg class="site-header__action-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.5a5.5 5.5 0 0 0 0-7.8Z" />
            </svg>
            <span v-if="wishlistCount" class="site-header__count">{{ wishlistCount }}</span>
          </span>
        </NuxtLink>
        <NuxtLink
          class="site-header__action"
          to="/cart"
          :aria-label="`Bag with ${itemCount} items`"
        >
          <span class="site-header__action-label">Bag(<span>{{ itemCount }}</span>)</span>
          <span class="site-header__icon-wrap">
            <svg class="site-header__action-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 8h14l-1 13H6L5 8ZM9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
            <span v-if="itemCount" class="site-header__count">{{ itemCount }}</span>
          </span>
        </NuxtLink>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  overHero?: boolean
}>(), {
  overHero: false,
})
const hasPlayedIntro = useState('site-header-intro-played', () => false)
const isLogoDocked = useState('anai-logo-docked', () => false)
const { itemCount } = useCart()
const { itemCount: wishlistCount } = useWishlist()
const isLogoVisible = computed(() => !props.overHero || isLogoDocked.value)
const isIntroPending = ref(!hasPlayedIntro.value)
const headerElement = ref<HTMLElement | null>(null)
let introAnimation: { kill: () => void } | undefined

onMounted(async () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (hasPlayedIntro.value || prefersReducedMotion) {
    isIntroPending.value = false
    return
  }

  const { gsap } = await import('gsap')

  gsap.set(headerElement.value, {
    opacity: 0,
    y: -28,
  })

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
  isIntroPending.value = false
})
</script>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 10;
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

.site-header__links {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: clamp(0.8rem, 2vw, calc(var(--space-md) * 2));
}

.site-header__inner a {
  color: var(--colour-white);
  font-size: clamp(1.2rem, 2vw, 2.8rem);
  letter-spacing: 0.04em;
  line-height: 1;
  text-transform: uppercase;
  white-space: nowrap;
}

.site-header__action-icon,
.site-header__icon-wrap {
  display: none;
}

.site-header__logo {
  display: block;
  width: clamp(9.6rem, 11vw, 15rem);
  opacity: 0;
  pointer-events: none;
  transform: translateY(1.2rem) scale(0.92);
  transition:
    opacity 420ms ease,
    transform 620ms cubic-bezier(0.22, 1, 0.36, 1);
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

@media (max-width: 920px) {
  .site-header__inner {
    min-height: 6.4rem;
  }
}

@media (max-width: 520px) {
  .site-header__logo {
    width: clamp(9.8rem, 30vw, 11.2rem);
  }

  .site-header__inner {
    gap: var(--space-sm);
  }

  .site-header__links {
    gap: 0.2rem;
  }

  .site-header__action {
    position: relative;
    display: grid;
    place-items: center;
    width: 4rem;
    height: 4.4rem;
  }

  .site-header__action-label {
    display: none;
  }

  .site-header__action-icon {
    display: block;
    width: 2.1rem;
    height: 2.1rem;
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
    top: -0.8rem;
    right: -0.9rem;
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
}
</style>
