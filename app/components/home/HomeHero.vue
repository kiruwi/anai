<template>
  <section
    class="home-hero"
    :class="{
      'home-hero--pending': isRisePending,
      'home-hero--docked': isLogoDocked,
    }"
  >
    <video
      v-if="shouldLoadVideo"
      class="home-hero__video"
      autoplay
      loop
      muted
      playsinline
      preload="none"
      poster="/images/hero/run-poster.webp"
      aria-hidden="true"
    >
      This decorative video shows ANAI movement styling on a running track.
      <source src="/images/hero/run.mp4" type="video/mp4">
    </video>
    <div
      v-if="showIntroLottie"
      ref="introOverlayElement"
      class="home-hero__preloader"
      aria-hidden="true"
    >
      <component
        ref="introPlayerElement"
        :is="'lottie-player'"
        class="home-hero__preloader-animation"
        src="/animations/check.json"
        background="#000000"
        speed="0.35"
        autoplay
      />
      <p class="home-hero__preloader-count">{{ introProgress }}%</p>
    </div>
    <h1>
      <span
        v-if="!hasPlayedIntro"
        class="home-hero__preload-guard"
        aria-hidden="true"
      />
      <NuxtLink
        class="home-hero__logo"
        :class="{
          'home-hero__logo--pending': isRisePending,
        }"
        to="/"
        aria-label="ANAI home"
      >
        <svg viewBox="0 0 340.64 92.85" role="img" aria-label="ANAI">
          <path :ref="(element) => setLetterRef(element, 0)" class="home-hero__letter" d="M51.85,90.77l.21-1.57h3.23c2.02,0,3.34-.63,3.96-1.88.63-1.25.45-2.89-.52-4.9-1.25-2.64-2.54-5.32-3.86-8.03-1.32-2.71-2.61-5.39-3.86-8.03h-30.15l-6.05,14.5c-1.04,2.5-1.13,4.52-.26,6.05.87,1.53,2.56,2.29,5.06,2.29h2.5v1.57H0v-1.57h1.25c2.02,0,3.88-.63,5.58-1.88,1.7-1.25,3.01-2.89,3.91-4.9,4.45-10.36,8.88-20.71,13.3-31.03,4.42-10.33,8.85-20.67,13.3-31.03h2.61l30.36,62.8c2.23,4.03,5.53,6.05,9.91,6.05v1.57h-28.37ZM49.76,63.75l-15.02-30.88-12.83,30.88h27.85Z" />
          <path :ref="(element) => setLetterRef(element, 1)" class="home-hero__letter" d="M106.28,23.48v-1.56h17.11l48.3,54.45V30.26c0-2.02-.61-3.65-1.83-4.9-1.22-1.25-2.83-1.88-4.85-1.88h-1.15v-1.56h18.78v1.56h-1.15c-2.02,0-3.63.63-4.85,1.88-1.22,1.25-1.83,2.89-1.83,4.9v62.59h-2.4c-9.25-10.43-18.45-20.81-27.59-31.14-9.15-10.33-18.34-20.71-27.59-31.14v51.85c0,2.02.61,3.65,1.83,4.9,1.22,1.25,2.83,1.88,4.85,1.88h1.15v1.57h-18.78v-1.57h1.15c2.02,0,3.63-.63,4.85-1.88,1.22-1.25,1.83-2.89,1.83-4.9V30.26c0-2.02-.61-3.65-1.83-4.9-1.22-1.25-2.83-1.88-4.85-1.88h-1.15Z" />
          <path :ref="(element) => setLetterRef(element, 2)" class="home-hero__letter" d="M260.13,90.77l.21-1.57h3.23c2.02,0,3.34-.63,3.96-1.88.63-1.25.45-2.89-.52-4.9-1.25-2.64-2.54-5.32-3.86-8.03-1.32-2.71-2.61-5.39-3.86-8.03h-30.15l-6.05,14.5c-1.04,2.5-1.13,4.52-.26,6.05.87,1.53,2.56,2.29,5.06,2.29h2.5v1.57h-22.12v-1.57h1.25c2.02,0,3.88-.63,5.58-1.88,1.7-1.25,3.01-2.89,3.91-4.9,4.45-10.36,8.88-20.71,13.3-31.03,4.42-10.33,8.85-20.67,13.3-31.03h2.61l30.36,62.8c2.22,4.03,5.53,6.05,9.91,6.05v1.57h-28.38ZM258.04,63.75l-15.02-30.88-12.83,30.88h27.85Z" />
          <path :ref="(element) => setLetterRef(element, 3)" class="home-hero__letter" d="M340.64,89.2v1.57h-26.08v-1.57h1.15c2.02,0,3.63-.63,4.85-1.88,1.22-1.25,1.83-2.89,1.83-4.9V30.26c0-2.02-.61-3.65-1.83-4.9-1.22-1.25-2.83-1.88-4.85-1.88h-1.15v-1.56h26.08v1.56h-1.15c-2.02,0-3.63.63-4.85,1.88-1.22,1.25-1.83,2.89-1.83,4.9v52.16c0,2.02.61,3.65,1.83,4.9,1.22,1.25,2.83,1.88,4.85,1.88h1.15Z" />
          <path
            ref="browElement"
            class="home-hero__brow"
            fill="currentColor"
            d="M182.45,2.06c.66.64-3.74,5.72-4.53,6.46-16.2,15.08-36.43-10.39-51.12,1.21-1.02.81-.86,2.2-1.98,2.18.41-4.05,5.76-9.27,9.32-10.76,12.12-5.07,27.54,8.51,41.34,4.94,3.3-.85,4.08-3.2,6.96-4.03Z"
          />
        </svg>
      </NuxtLink>
      <span ref="underlineElement" class="home-hero__underline" aria-hidden="true" />
    </h1>
    <div ref="columnsElement" class="home-hero__columns">
      <p>ANAI</p>
      <div class="home-hero__why">
        <h2>Why</h2>
        <p>
          <span>Anai / Enai is a Maa word meaning mine. My body,</span>
          <span>my rhythm, my softness, my becoming. A quiet ownership of self. </span>
        </p>
      </div>
      <p class="home-hero__meta">
        <span>SHIPPING &amp; RETURNS</span>
        <span>© 2026</span>
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'

type LottiePlayerElement = HTMLElement & {
  setSpeed?: (speed: number) => void
}

const hasPlayedIntro = useState('anai-logo-intro-played', () => false)
const isLogoDocked = useState('anai-logo-docked', () => false)
const isRisePending = ref(!hasPlayedIntro.value)
const showIntroLottie = ref(!hasPlayedIntro.value)
const introProgress = ref(0)
const shouldLoadVideo = ref(false)
const letterElements = ref<SVGPathElement[]>([])
const underlineElement = ref<HTMLSpanElement | null>(null)
const browElement = ref<SVGPathElement | null>(null)
const columnsElement = ref<HTMLDivElement | null>(null)
const introOverlayElement = ref<HTMLDivElement | null>(null)
const introPlayerElement = ref<LottiePlayerElement | null>(null)
let introAnimation: { kill: () => void } | undefined
let rafId = 0
let idleId: number | ReturnType<typeof globalThis.setTimeout> = 0
let preloaderRafId = 0
let isVideoQueued = false

const updateDockedLogo = () => {
  cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(() => {
    isLogoDocked.value = window.scrollY > 32
  })
}

watch(isLogoDocked, async (docked) => {
  const underline = underlineElement.value

  if (!underline) {
    return
  }

  const { gsap } = await import('gsap')

  gsap.to(underline, {
    scaleX: docked ? 0 : 1,
    transformOrigin: 'left center',
    duration: 0.42,
    ease: 'power2.out',
    overwrite: true,
  })
})

const setLetterRef = (
  element: Element | ComponentPublicInstance | null,
  index: number,
) => {
  if (element instanceof SVGPathElement) {
    letterElements.value[index] = element
  }
}

const loadHeroVideo = () => {
  shouldLoadVideo.value = true
  window.removeEventListener('pointerdown', loadHeroVideo)
  window.removeEventListener('keydown', loadHeroVideo)
}

const queueHeroVideo = () => {
  if (isVideoQueued) {
    return
  }

  isVideoQueued = true
  window.addEventListener('pointerdown', loadHeroVideo, { once: true, passive: true })
  window.addEventListener('keydown', loadHeroVideo, { once: true })

  if ('requestIdleCallback' in window) {
    idleId = window.requestIdleCallback(loadHeroVideo, { timeout: 5000 })
    return
  }

  idleId = globalThis.setTimeout(loadHeroVideo, 5000)
}

const setIntroPlayerSpeed = (speed: number) => {
  const player = introPlayerElement.value

  if (!player) {
    return
  }

  player.setAttribute('speed', speed.toFixed(2))
  player.setSpeed?.(speed)
}

const runIntroCounter = () => new Promise<void>((resolve) => {
  introProgress.value = 0
  setIntroPlayerSpeed(0.35)

  const duration = 1500
  const startedAt = performance.now()

  const updateProgress = (now: number) => {
    const elapsed = Math.min((now - startedAt) / duration, 1)
    const easedProgress = elapsed * elapsed * elapsed

    introProgress.value = Math.min(Math.round(easedProgress * 100), 100)
    setIntroPlayerSpeed(0.35 + easedProgress * 2.4)

    if (elapsed < 1) {
      preloaderRafId = requestAnimationFrame(updateProgress)
      return
    }

    introProgress.value = 100
    preloaderRafId = 0
    globalThis.setTimeout(resolve, 160)
  }

  preloaderRafId = requestAnimationFrame(updateProgress)
})

onMounted(async () => {
  isLogoDocked.value = window.scrollY > 32
  window.addEventListener('scroll', updateDockedLogo, { passive: true })
  queueHeroVideo()

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const isMobile = window.matchMedia('(max-width: 760px)').matches

  if (hasPlayedIntro.value || prefersReducedMotion) {
    isRisePending.value = false
    showIntroLottie.value = false
    return
  }

  const { gsap } = await import('gsap')

  if (isMobile) {
    await runIntroCounter()

    introAnimation = gsap.to(introOverlayElement.value, {
      opacity: 0,
      duration: 0.42,
      ease: 'power2.out',
      onComplete: () => {
        isRisePending.value = false
        showIntroLottie.value = false
        hasPlayedIntro.value = true
      },
    })
    return
  }

  const letters = letterElements.value.filter(Boolean)
  const randomLetters = gsap.utils.shuffle([...letters])
  const columnItems = columnsElement.value
    ? Array.from(columnsElement.value.children)
    : []

  gsap.set(letters, {
    opacity: 0,
    transformOrigin: '50% 50%',
    y: 38,
  })
  gsap.set(underlineElement.value, {
    scaleX: 0,
    transformOrigin: 'left center',
  })
  gsap.set(browElement.value, {
    opacity: 0,
  })
  gsap.set(columnItems, {
    opacity: 0,
    y: 28,
  })

  await runIntroCounter()

  isRisePending.value = false

  const timeline = gsap.timeline({
    onComplete: () => {
      showIntroLottie.value = false
      hasPlayedIntro.value = true
    },
  })

  timeline.to(introOverlayElement.value, {
    opacity: 0,
    duration: 0.52,
    ease: 'power2.out',
  }, 0)

  timeline.to(underlineElement.value, {
    scaleX: 1,
    duration: 0.86,
    ease: 'power2.out',
  }, 0.08)

  timeline.to(randomLetters, {
    opacity: 1,
    y: 0,
    clearProps: 'opacity,transform',
    duration: 0.56,
    ease: 'power3.out',
    stagger: 0.1,
  }, 0.08)

  timeline.to([...columnItems].reverse(), {
    opacity: 1,
    y: 0,
    clearProps: 'opacity,transform',
    duration: 0.52,
    ease: 'power3.out',
    stagger: 0.14,
  }, 0.64)

  timeline.to(browElement.value, {
    opacity: 1,
    clearProps: 'opacity',
    duration: 0.32,
    ease: 'power2.out',
  }, 1.23)

  introAnimation = timeline
})

onBeforeUnmount(() => {
  if (introAnimation) {
    introAnimation.kill()
  }

  if (preloaderRafId) {
    cancelAnimationFrame(preloaderRafId)
  }

  cancelAnimationFrame(rafId)
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(Number(idleId))
  } else {
    globalThis.clearTimeout(idleId)
  }
  window.removeEventListener('pointerdown', loadHeroVideo)
  window.removeEventListener('keydown', loadHeroVideo)
  window.removeEventListener('scroll', updateDockedLogo)
  isLogoDocked.value = false
  isRisePending.value = false
  showIntroLottie.value = false
})
</script>

<style scoped>
.home-hero {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  width: 100%;
  min-height: 100vh;
  padding: calc(7.2rem + var(--space-md)) var(--page-gutter) var(--space-md);
  color: var(--colour-white);
  background:
    image-set(
      url("/images/hero/run-poster.webp") type("image/webp") 1x
    );
  background-position: center;
  background-size: cover;
}

.home-hero::after {
  position: absolute;
  inset: 0;
  z-index: 1;
  content: "";
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.28), rgba(0, 0, 0, 0.46));
  pointer-events: none;
}

.home-hero__video {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.home-hero__preloader {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: grid;
  grid-template-rows: auto auto;
  gap: var(--space-md);
  place-items: center;
  align-content: center;
  background: var(--colour-black);
  color: var(--colour-white);
  pointer-events: none;
}

.home-hero__preloader-animation {
  width: clamp(8rem, 12vw, 14rem);
  height: clamp(8rem, 12vw, 14rem);
}

.home-hero__preloader-count {
  margin: 0;
  font-size: clamp(1.4rem, 1.6vw, 2rem);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.12em;
  line-height: 1;
}

.home-hero h1,
.home-hero__columns {
  position: relative;
  z-index: 2;
}

h1 {
  margin: 0;
}

.home-hero__underline {
  display: block;
  height: clamp(0.125rem, 0.375vw, 0.5rem);
  margin-top: calc(var(--space-sm) * 2);
  background: currentColor;
  transform-origin: left center;
  transition: transform 640ms ease;
}

.home-hero__preload-guard ~ .home-hero__underline {
  transform: scaleX(0);
}

.home-hero__logo {
  display: block;
  color: var(--colour-white);
  mix-blend-mode: difference;
  transform-origin: left top;
  transition:
    opacity 420ms ease,
    transform 720ms cubic-bezier(0.22, 1, 0.36, 1);
}

.home-hero__logo svg {
  display: block;
  width: 100%;
  height: auto;
  mix-blend-mode: difference;
}

.home-hero__letter {
  fill: currentColor;
  transform-box: fill-box;
}

.home-hero__logo--pending .home-hero__letter {
  opacity: 0;
  transform: translateY(38px);
}

.home-hero--pending .home-hero__columns > * {
  opacity: 0;
  transform: translateY(28px);
}

.home-hero__logo--pending .home-hero__brow {
  opacity: 0;
}

.home-hero__columns {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-lg);
  margin-top: var(--space-lg);
  font-size: 1.56rem;
  font-weight: 400;
  line-height: 1.35;
  transition:
    opacity 420ms ease,
    transform 520ms ease;
}

.home-hero--docked .home-hero__logo {
  opacity: 0;
  transform: translateY(calc(-1 * (7.2rem + var(--space-sm)))) scale(0.12);
}

.home-hero--docked .home-hero__underline {
  transform: scaleX(0);
}

.home-hero--docked .home-hero__columns {
  opacity: 0;
  pointer-events: none;
  transform: translateY(-1.2rem);
}

.home-hero__columns h2,
.home-hero__columns p {
  margin: 0;
}

.home-hero__columns > p,
.home-hero__columns h2 {
  font-weight: 600;
}

.home-hero__columns h2 {
  margin-bottom: var(--space-sm);
  font-size: inherit;
  line-height: inherit;
  text-transform: uppercase;
}

.home-hero__why {
  grid-column: span 2;
}

.home-hero__why p {
  font-weight: 400;
}

.home-hero__meta {
  display: flex;
  justify-content: space-between;
  gap: var(--space-md);
  font-weight: 600;
}

@media (max-width: 760px) {
  .home-hero {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    min-height: 100svh;
    padding-top: calc(6.4rem + var(--space-md));
    padding-bottom: clamp(var(--space-xl), 10vh, var(--space-2xl));
    background-image: url("/images/hero/run-poster-mobile.webp");
  }

  .home-hero h1 {
    width: 100%;
  }

  .home-hero__underline {
    height: clamp(0.25rem, 0.75vw, 1rem);
  }

  .home-hero__columns {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .home-hero__meta {
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .home-hero__meta span:last-child {
    justify-self: end;
  }

  .home-hero--docked .home-hero__logo {
    transform: translateY(calc(-1 * (6.4rem + var(--space-sm)))) scale(0.24);
  }
}
</style>
