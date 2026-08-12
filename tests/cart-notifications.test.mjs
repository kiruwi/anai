import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  clampCartQuantity,
  createQuantityAdjustedNotification,
} from '../shared/lib/cartNotifications.ts'

test('cart quantity clamping reports the final available quantity', () => {
  assert.deepEqual(clampCartQuantity(5, 2), {
    quantity: 2,
    wasAdjusted: true,
  })

  assert.deepEqual(createQuantityAdjustedNotification('Essential Hoodie', 2), {
    type: 'warning',
    title: 'Quantity adjusted',
    message: 'Only 2 items are available for Essential Hoodie. Your bag quantity is now 2.',
  })
})

test('cart quantity clamping leaves available requests unchanged', () => {
  assert.deepEqual(clampCartQuantity(2, 5), {
    quantity: 2,
    wasAdjusted: false,
  })
})
