import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  addNotificationToState,
  clearNotificationState,
  dismissNotificationFromState,
  normalizeNotification,
} from '../app/composables/useNotifications.ts'

test('notifications can be added, dismissed, and cleared', () => {
  const added = addNotificationToState([], {
    type: 'success',
    title: 'Saved',
  }, () => 'notice-1')

  assert.equal(added.length, 1)
  assert.equal(added[0]?.id, 'notice-1')
  assert.deepEqual(dismissNotificationFromState(added, 'notice-1'), [])
  assert.deepEqual(clearNotificationState(), [])
})

test('notification defaults match the expected durations', () => {
  assert.equal(normalizeNotification({ type: 'success', title: 'Success' }, () => '1').duration, 5_000)
  assert.equal(normalizeNotification({ type: 'info', title: 'Info' }, () => '2').duration, 5_000)
  assert.equal(normalizeNotification({ type: 'warning', title: 'Warning' }, () => '3').duration, 7_000)
  assert.equal(normalizeNotification({ type: 'error', title: 'Error' }, () => '4').duration, null)
})

test('identical notifications are coalesced', () => {
  const first = addNotificationToState([], {
    type: 'warning',
    title: 'Quantity adjusted',
    message: 'Only 2 items are available.',
  }, () => 'first')
  const duplicate = addNotificationToState(first, {
    type: 'warning',
    title: 'Quantity adjusted',
    message: 'Only 2 items are available.',
  }, () => 'duplicate')

  assert.equal(duplicate.length, 1)
  assert.equal(duplicate[0]?.id, 'duplicate')
})

test('global notification state keeps no more than three notices', () => {
  let notifications = []
  for (let index = 1; index <= 4; index += 1) {
    notifications = addNotificationToState(notifications, {
      type: 'info',
      title: `Notice ${index}`,
    }, () => String(index))
  }

  assert.deepEqual(notifications.map(({ id }) => id), ['2', '3', '4'])
})
