import Lenis from 'lenis'

export default defineNuxtPlugin((nuxtApp) => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

  if (prefersReducedMotion.matches) {
    return
  }

  const lenis = new Lenis({
    autoRaf: false,
    lerp: 0.08,
    wheelMultiplier: 0.9,
    touchMultiplier: 1.2,
  })

  let rafId = 0

  const raf = (time: number) => {
    lenis.raf(time)
    rafId = requestAnimationFrame(raf)
  }

  rafId = requestAnimationFrame(raf)

  const destroyLenis = () => {
    lenis.destroy()
    cancelAnimationFrame(rafId)
  }

  nuxtApp.hook('page:finish', () => {
    lenis.resize()
  })

  prefersReducedMotion.addEventListener('change', (event) => {
    if (event.matches) {
      destroyLenis()
    }
  })

  window.addEventListener('beforeunload', destroyLenis)
})
