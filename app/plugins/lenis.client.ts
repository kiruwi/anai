export default defineNuxtPlugin((nuxtApp) => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const isCoarsePointer = window.matchMedia('(pointer: coarse)')

  if (prefersReducedMotion.matches || isCoarsePointer.matches) {
    return
  }

  let lenis: {
    raf: (time: number) => void
    resize: () => void
    destroy: () => void
  } | undefined
  let rafId = 0
  let idleId: number | ReturnType<typeof globalThis.setTimeout> = 0

  const raf = (time: number) => {
    lenis?.raf(time)
    rafId = requestAnimationFrame(raf)
  }

  const destroyLenis = () => {
    lenis?.destroy()
    lenis = undefined
    cancelAnimationFrame(rafId)
  }

  const startLenis = async () => {
    if (lenis || prefersReducedMotion.matches || isCoarsePointer.matches) {
      return
    }

    const { default: Lenis } = await import('lenis')

    lenis = new Lenis({
      autoRaf: false,
      lerp: 0.08,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.2,
    })

    rafId = requestAnimationFrame(raf)
  }

  if ('requestIdleCallback' in window) {
    idleId = window.requestIdleCallback(startLenis, { timeout: 2500 })
  } else {
    idleId = globalThis.setTimeout(startLenis, 2500)
  }

  nuxtApp.hook('page:finish', () => {
    lenis?.resize()
  })

  prefersReducedMotion.addEventListener('change', (event) => {
    if (event.matches) {
      destroyLenis()
    }
  })

  window.addEventListener('beforeunload', destroyLenis)
})
