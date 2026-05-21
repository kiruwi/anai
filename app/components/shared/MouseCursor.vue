<template>
  <div ref="cursorElement" class="mouse-cursor" aria-hidden="true">
    <span>View more</span>
  </div>
</template>

<script setup lang="ts">
const cursorElement = ref<HTMLElement | null>(null)
const cardSelector = '.product-card, .image-tile, .shop-the-look__list article'
let rafId = 0
let targetX = 0
let targetY = 0
let currentX = 0
let currentY = 0

const setCardState = (target: EventTarget | null) => {
  const element = target instanceof Element ? target : null
  const isCard = Boolean(element?.closest(cardSelector))

  cursorElement.value?.classList.toggle('mouse-cursor--card', isCard)
}

const animateCursor = () => {
  currentX += (targetX - currentX) * 0.24
  currentY += (targetY - currentY) * 0.24
  cursorElement.value?.style.setProperty('--cursor-x', `${currentX}px`)
  cursorElement.value?.style.setProperty('--cursor-y', `${currentY}px`)
  rafId = requestAnimationFrame(animateCursor)
}

const onPointerMove = (event: PointerEvent) => {
  if (event.pointerType !== 'mouse') {
    return
  }

  targetX = event.clientX
  targetY = event.clientY

  if (!cursorElement.value?.classList.contains('mouse-cursor--visible')) {
    currentX = targetX
    currentY = targetY
    cursorElement.value?.style.setProperty('--cursor-x', `${currentX}px`)
    cursorElement.value?.style.setProperty('--cursor-y', `${currentY}px`)
    cursorElement.value?.classList.add('mouse-cursor--visible')
  }

  setCardState(event.target)
}

const onPointerLeave = () => {
  cursorElement.value?.classList.remove('mouse-cursor--visible', 'mouse-cursor--card')
}

onMounted(() => {
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!canHover || reduceMotion) {
    return
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true })
  document.documentElement.addEventListener('pointerleave', onPointerLeave)
  rafId = requestAnimationFrame(animateCursor)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  window.removeEventListener('pointermove', onPointerMove)
  document.documentElement.removeEventListener('pointerleave', onPointerLeave)
})
</script>

<style scoped>
.mouse-cursor {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  color: var(--colour-black);
  background: var(--colour-cream);
  opacity: 0;
  pointer-events: none;
  transform:
    translate3d(calc(var(--cursor-x, 0px) - 50%), calc(var(--cursor-y, 0px) - 50%), 0)
    scale(0.72);
  transition:
    width 520ms cubic-bezier(0.22, 1, 0.36, 1),
    height 520ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 180ms ease,
    transform 520ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform, width, height;
}

.mouse-cursor--visible {
  opacity: 1;
}

.mouse-cursor--card {
  width: 10.8rem;
  height: 10.8rem;
  transform:
    translate3d(calc(var(--cursor-x, 0px) - 50%), calc(var(--cursor-y, 0px) - 50%), 0)
    scale(1);
}

span {
  font-size: 1.1rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  line-height: 1;
  opacity: 0;
  text-transform: uppercase;
  transform: scale(0.82);
  transition:
    opacity 220ms ease,
    transform 360ms cubic-bezier(0.22, 1, 0.36, 1);
  white-space: nowrap;
}

.mouse-cursor--card span {
  opacity: 1;
  transform: scale(1);
}

@media (hover: none), (pointer: coarse), (prefers-reduced-motion: reduce) {
  .mouse-cursor {
    display: none;
  }
}
</style>
