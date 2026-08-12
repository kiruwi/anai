export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export type NotificationAction = {
  label: string
  to: string
}

export type AppNotification = {
  id: string
  type: NotificationType
  title: string
  message?: string
  action?: NotificationAction
  dismissible?: boolean
  duration?: number | null
}

export type NotificationInput = Omit<AppNotification, 'id'> & {
  id?: string
}

export const MAX_GLOBAL_NOTIFICATIONS = 3

export const DEFAULT_NOTIFICATION_DURATIONS: Record<NotificationType, number | null> = {
  success: 5_000,
  error: null,
  warning: 7_000,
  info: 5_000,
}

const createNotificationId = () =>
  globalThis.crypto?.randomUUID?.()
  ?? `notification-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

const getNotificationFingerprint = (notification: NotificationInput | AppNotification) =>
  JSON.stringify([
    notification.type,
    notification.title,
    notification.message ?? '',
    notification.action?.label ?? '',
    notification.action?.to ?? '',
  ])

export const normalizeNotification = (
  notification: NotificationInput,
  generateId: () => string = createNotificationId,
): AppNotification => ({
  ...notification,
  id: notification.id ?? generateId(),
  dismissible: notification.dismissible ?? true,
  duration: notification.duration === undefined
    ? DEFAULT_NOTIFICATION_DURATIONS[notification.type]
    : notification.duration,
})

export const addNotificationToState = (
  notifications: AppNotification[],
  input: NotificationInput,
  generateId?: () => string,
) => {
  const notification = normalizeNotification(input, generateId)
  const fingerprint = getNotificationFingerprint(notification)
  const withoutDuplicate = notifications.filter(
    (candidate) =>
      candidate.id !== notification.id
      && getNotificationFingerprint(candidate) !== fingerprint,
  )

  return [...withoutDuplicate, notification].slice(-MAX_GLOBAL_NOTIFICATIONS)
}

export const dismissNotificationFromState = (
  notifications: AppNotification[],
  id: string,
) => notifications.filter((notification) => notification.id !== id)

export const clearNotificationState = (): AppNotification[] => []

export const useNotifications = () => {
  const notifications = useState<AppNotification[]>('anai-global-notifications', () => [])

  const notify = (notification: NotificationInput) => {
    notifications.value = addNotificationToState(notifications.value, notification)
    return notifications.value.at(-1)
  }

  const dismissNotification = (id: string) => {
    notifications.value = dismissNotificationFromState(notifications.value, id)
  }

  const clearNotifications = () => {
    notifications.value = clearNotificationState()
  }

  return {
    notifications,
    notify,
    dismissNotification,
    clearNotifications,
  }
}
