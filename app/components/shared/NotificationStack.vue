<template>
  <TransitionGroup
    name="notification-list"
    tag="div"
    class="notification-stack"
    aria-label="Store notifications"
  >
    <AppNotification
      v-for="notification in notifications"
      :key="notification.id"
      :notification="notification"
      @dismiss="dismissNotification"
    />
  </TransitionGroup>
</template>

<script setup lang="ts">
import AppNotification from './AppNotification.vue'

const { notifications, dismissNotification } = useNotifications()
</script>

<style scoped>
.notification-stack {
  position: fixed;
  top: calc(7.2rem + var(--space-sm));
  right: var(--page-gutter);
  z-index: 70;
  display: grid;
  gap: var(--space-sm);
  width: min(40rem, calc(100vw - (var(--page-gutter) * 2)));
  pointer-events: none;
}

.notification-stack :deep(.app-notification) {
  pointer-events: auto;
}

.notification-list-enter-active,
.notification-list-leave-active,
.notification-list-move {
  transition: opacity 180ms ease, transform 220ms ease;
}

.notification-list-enter-from,
.notification-list-leave-to {
  opacity: 0;
  transform: translateY(-0.8rem);
}

.notification-list-leave-active {
  position: absolute;
  width: 100%;
}

@media (max-width: 760px) {
  .notification-stack {
    top: calc(6.4rem + var(--space-sm));
    right: var(--page-gutter);
    left: var(--page-gutter);
    width: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .notification-list-enter-active,
  .notification-list-leave-active,
  .notification-list-move {
    transition-duration: 1ms;
  }
}
</style>
