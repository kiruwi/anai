const storageKey = 'anai-checkout-session'

export const useCheckoutSession = () => {
  const idempotencyKey = useState('anai-checkout-key', () => '')
  const pendingReference = useState('anai-checkout-reference', () => '')
  const hasPendingCheckout = computed(() => Boolean(idempotencyKey.value || pendingReference.value))
  const persistCheckoutSession = () => {
    if (import.meta.client) window.localStorage.setItem(storageKey, JSON.stringify({
      idempotencyKey: idempotencyKey.value, reference: pendingReference.value,
    }))
  }
  const clearCheckoutSession = () => {
    idempotencyKey.value = ''
    pendingReference.value = ''
    if (import.meta.client) window.localStorage.removeItem(storageKey)
  }
  const hydrateCheckoutSession = () => {
    if (!import.meta.client || hasPendingCheckout.value) return
    try {
      const session = JSON.parse(window.localStorage.getItem(storageKey) || '{}')
      if (typeof session?.idempotencyKey === 'string' && /^[A-Za-z0-9_-]{16,100}$/.test(session.idempotencyKey)) idempotencyKey.value = session.idempotencyKey
      if (typeof session?.reference === 'string' && /^ANAI-\d{10,}-[A-F0-9]{8}$/.test(session.reference)) pendingReference.value = session.reference
    } catch {
      clearCheckoutSession()
    }
  }
  return { idempotencyKey, pendingReference, hasPendingCheckout, persistCheckoutSession, clearCheckoutSession, hydrateCheckoutSession }
}
