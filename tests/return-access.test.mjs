import assert from 'node:assert/strict'
import test from 'node:test'
import { randomUUID } from 'node:crypto'
import { createGuestOrderToken, createOwnerReturnToken, tokenHash, verifyGuestOrderToken } from '../server/utils/returnAccess.ts'

const secret = 'synthetic-secret-for-return-token-tests-only'
const now = Date.parse('2026-11-11T09:00:00+03:00')

test('guest links are limited to the signed order and expiry', () => {
  const order = randomUUID()
  const token = createGuestOrderToken(order, secret, now)
  assert.equal(verifyGuestOrderToken(token, secret, now), order)
  assert.equal(verifyGuestOrderToken(token.replace(order, randomUUID()), secret, now), null)
  assert.equal(verifyGuestOrderToken(token, secret + '-rotated', now), null)
  assert.equal(verifyGuestOrderToken(token, secret, now + 14 * 86_400_000), null)
})

test('owner links are scoped to the mail, request, version, action and configured owner', () => {
  const mail = randomUUID()
  const request = randomUUID()
  const email = 'owner@example.test'
  const token = createOwnerReturnToken(mail, request, 1, 'approve', email, secret)
  assert.match(tokenHash(token), /^[0-9a-f]{64}$/)
  assert.notEqual(token, createOwnerReturnToken(mail, request, 1, 'decline', email, secret))
  assert.notEqual(token, createOwnerReturnToken(mail, request, 2, 'approve', email, secret))
  assert.notEqual(token, createOwnerReturnToken(mail, request, 1, 'approve', 'different@example.test', secret))
  assert.equal(verifyGuestOrderToken(token, secret, now), null)
})
