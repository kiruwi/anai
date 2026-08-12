<template>
  <article
    ref="notificationElement"
    class="app-notification"
    :class="[
      `app-notification--${notification.type}`,
      { 'app-notification--inline': inline },
    ]"
    :role="notification.type === 'error' ? 'alert' : 'status'"
    :aria-live="notification.type === 'error' ? undefined : 'polite'"
    :tabindex="isTimed ? 0 : undefined"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @focusin="handleFocusIn"
    @focusout="handleFocusOut"
  >
    <span class="app-notification__icon" aria-hidden="true">
      <svg
        v-if="notification.type === 'success'"
        viewBox="0 0 24 24"
        focusable="false"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.6 2.6L16.5 9" />
      </svg>
      <svg
        v-else-if="notification.type === 'error'"
        viewBox="0 0 24 24"
        focusable="false"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="m9 9 6 6m0-6-6 6" />
      </svg>
      <svg
        v-else-if="notification.type === 'warning'"
        viewBox="0 0 24 24"
        focusable="false"
      >
        <path d="M12 3 2.8 20h18.4L12 3Z" />
        <path d="M12 9v4.5M12 17h.01" />
      </svg>
      <svg v-else viewBox="0 0 24 24" focusable="false">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6M12 7h.01" />
      </svg>
    </span>

    <div class="app-notification__content">
      <strong>{{ notification.title }}</strong>
      <p v-if="notification.message">{{ notification.message }}</p>
      <NuxtLink
        v-if="notification.action"
        class="app-notification__action"
        :to="notification.action.to"
        @click="emitDismiss"
      >
        {{ notification.action.label }}
        <span aria-hidden="true">→</span>
      </NuxtLink>
    </div>

    <button
      v-if="notification.dismissible"
      class="app-notification__dismiss"
      type="button"
      :aria-label="`Dismiss ${notification.title} notification`"
      @click="emitDismiss"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="m6 6 12 12m0-12L6 18" />
      </svg>
    </button>
  </article>
</template>

<script setup lang="ts">
import type { AppNotification } from '../../composables/useNotifications'

const props = withDefaults(defineProps<{
  notification: AppNotification
  inline?: boolean
  autoDismiss?: boolean
}>(), {
  inline: false,
  autoDismiss: true,
})

const emit = defineEmits<{
  dismiss: [id: string]
}>()

const notificationElement = ref<HTMLElement | null>(null)
const isTimed = computed(() =>
  !props.inline
  && props.autoDismiss
  && typeof props.notification.duration === 'number'
  && props.notification.duration > 0,
)
let timerId: ReturnType<typeof globalThis.setTimeout> | undefined
let remainingMilliseconds = 0
let timerStartedAt = 0
let isHovered = false
let hasFocus = false

const clearTimer = () => {
  if (timerId !== undefined) {
    globalThis.clearTimeout(timerId)
    timerId = undefined
  }
}

const emitDismiss = () => {
  clearTimer()
  emit('dismiss', props.notification.id)
}

const startTimer = () => {
  clearTimer()
  if (!isTimed.value || remainingMilliseconds <= 0 || isHovered || hasFocus) return

  timerStartedAt = Date.now()
  timerId = globalThis.setTimeout(emitDismiss, remainingMilliseconds)
}

const resetTimer = () => {
  clearTimer()
  remainingMilliseconds = isTimed.value ? (props.notification.duration as number) : 0
  startTimer()
}

const pauseTimer = () => {
  if (timerId === undefined) return
  remainingMilliseconds = Math.max(0, remainingMilliseconds - (Date.now() - timerStartedAt))
  clearTimer()
}

const resumeTimer = () => {
  if (!isTimed.value || timerId !== undefined || isHovered || hasFocus) return
  startTimer()
}

const handleMouseEnter = () => {
  isHovered = true
  pauseTimer()
}

const handleMouseLeave = () => {
  isHovered = false
  resumeTimer()
}

const handleFocusIn = () => {
  hasFocus = true
  pauseTimer()
}

const handleFocusOut = () => {
  nextTick(() => {
    hasFocus = Boolean(notificationElement.value?.contains(document.activeElement))
    if (!hasFocus) {
      resumeTimer()
    }
  })
}

watch(() => props.notification, resetTimer)
onMounted(resetTimer)
onBeforeUnmount(clearTimer)
</script>

<style scoped>
.app-notification {
  --notification-accent: var(--colour-olive);
  display: grid;
  grid-template-columns: 2.4rem minmax(0, 1fr) auto;
  gap: var(--space-sm);
  align-items: start;
  width: 100%;
  border: 1px solid var(--colour-border);
  border-left: 3px solid var(--notification-accent);
  border-radius: 0;
  padding: 1.4rem;
  color: var(--colour-black);
  background: var(--colour-surface);
  box-shadow: 0 1.2rem 3rem rgba(0, 0, 0, 0.12);
}

.app-notification--inline {
  box-shadow: none;
}

.app-notification--error {
  --notification-accent: var(--colour-plum);
}

.app-notification--warning {
  --notification-accent: #8a5a12;
}

.app-notification--info {
  --notification-accent: #36566e;
}

.app-notification__icon {
  display: grid;
  place-items: center;
  width: 2.4rem;
  height: 2.4rem;
  color: var(--notification-accent);
}

.app-notification__icon svg,
.app-notification__dismiss svg {
  display: block;
  width: 100%;
  height: 100%;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.app-notification__content {
  min-width: 0;
}

.app-notification__content strong {
  display: block;
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.3;
}

.app-notification__content p {
  margin: var(--space-xs) 0 0;
  color: var(--colour-muted);
  font-size: 1.4rem;
  overflow-wrap: anywhere;
}

.app-notification__action {
  display: inline-flex;
  gap: var(--space-xs);
  align-items: center;
  margin-top: var(--space-sm);
  border-bottom: 1px solid currentColor;
  color: var(--notification-accent);
  font-size: 1.3rem;
  font-weight: 600;
}

.app-notification__dismiss {
  display: grid;
  place-items: center;
  width: 3.2rem;
  height: 3.2rem;
  margin: -0.5rem -0.5rem 0 0;
  border: 0;
  border-radius: 0;
  padding: 0.7rem;
  color: var(--colour-muted);
  background: transparent;
  cursor: pointer;
}

.app-notification:focus-visible,
.app-notification__action:focus-visible,
.app-notification__dismiss:focus-visible {
  outline: 2px solid var(--colour-black);
  outline-offset: 2px;
}

@media (max-width: 480px) {
  .app-notification {
    padding: 1.2rem;
  }
}
</style>
