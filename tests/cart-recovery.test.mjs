import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import * as Vue from 'vue'
import { computed, ref, watch, nextTick } from 'vue'
import { compile } from '@vue/compiler-dom'
import { renderToString } from 'vue/server-renderer'
import * as products from '../app/data/homeContent.ts'
import * as notices from '../shared/lib/cartNotifications.ts'
import * as ecommerce from '../shared/lib/ecommerceAnalytics.ts'

// Execute the real composables with browser storage and Nuxt lifecycle boundaries supplied.
const loadComposable = async (path, name, bindings) => {
  const source = (await readFile(new URL(path, import.meta.url), 'utf8'))
    .replace(/^import[\s\S]*?from\s+['"][^'"]+['"]\s*;?/gm, '')
    .replaceAll('import.meta.client', 'true')
    .replace(/^export default /m, 'const handler = ')
    .replaceAll('export ', '')
  return Function(...Object.keys(bindings), stripTypeScriptTypes(source) + `\nreturn ${name}`)(...Object.values(bindings))
}

test('pending checkout remains actionable with an empty bag and no contact fields', async () => {
  const source = await readFile(new URL('../app/pages/checkout/index.vue', import.meta.url), 'utf8')
  const template = source.slice(source.indexOf('<template>') + 10, source.indexOf('</template>'))
  const render = Function('Vue', compile(template, { mode: 'function', prefixIdentifiers: true }).code)(Vue)
  const app = Vue.createSSRApp({
    render,
    data: () => ({
      isCartLoaded: true, hasPendingCheckout: true, canResumeCheckout: false, lines: [],
      paymentNotice: null, pendingReference: 'ANAI-1234567890123-ABCDEF12', isPaymentLoading: false,
      checkPendingPayment: () => {},
    }),
    components: {
      NuxtLink: { render: () => Vue.h('a', 'Contact support') },
      AppNotification: { render: () => null },
    },
  })
  const html = await renderToString(app)
  assert.match(html, /Check payment status/)
  assert.match(html, /ANAI-1234567890123-ABCDEF12/)
  assert.doesNotMatch(html, /Your bag is empty|<form/)
})

test('refresh preserves a cart reserved by its pending order, then normal stock reconciliation resumes', async () => {
  const product = products.fallbackProducts[0]
  const colour = products.getProductDefaultColourName(product)
  const storage = new Map([
    ['anai-checkout-session', JSON.stringify({ idempotencyKey: 'test-session-key-1234', reference: 'ANAI-1234567890123-ABCDEF12' })],
    ['anai-cart', JSON.stringify([{ slug: product.slug, colour, size: product.sizeOptions?.[0]?.label, quantity: 1 }])],
  ])
  const state = new Map()
  const mounted = []
  const stock = ref(0)
  const bindings = {
    computed, watch, onMounted: (callback) => mounted.push(callback),
    useState: (key, init) => {
      if (!state.has(key)) state.set(key, ref(init()))
      return state.get(key)
    },
    window: { localStorage: { getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) } },
  }
  const useCheckoutSession = await loadComposable('../app/composables/useCheckoutSession.ts', 'useCheckoutSession', bindings)
  const useCart = await loadComposable('../app/composables/useCart.ts', 'useCart', {
    ...bindings, ...products, ...notices, useCheckoutSession,
    useCatalogProducts: () => ref([product]),
    useNotifications: () => ({ notify: () => {} }),
    useEcommerceAnalytics: () => ({ trackShoppingEvent: () => {} }),
    useInventory: () => ({ inventory: stock, getProductStock: () => stock.value }),
  })
  const cart = useCart()
  mounted.forEach((callback) => callback())
  assert.equal(cart.items.value.length, 1)
  assert.equal(cart.lines.value.length, 1)
  assert.equal(useCheckoutSession().pendingReference.value, 'ANAI-1234567890123-ABCDEF12')
  stock.value = 1
  await nextTick()
  stock.value = 0
  await nextTick()
  assert.equal(cart.items.value.length, 1, 'A refresh must not remove our reserved item')
  useCheckoutSession().clearCheckoutSession()
  stock.value = 1
  await nextTick()
  stock.value = 0
  await nextTick()
  assert.equal(cart.items.value.length, 0, 'Normal stock enforcement resumes after the payment session')
})

test('purchase tracking requires analytics consent and queues a transaction only once', async () => {
  const state = new Map()
  const storage = new Map()
  const sent = []
  const bindings = {
    ...ecommerce,
    useState: (key, init) => {
      if (!state.has(key)) state.set(key, ref(init()))
      return state.get(key)
    },
    useRuntimeConfig: () => ({ public: { googleTagId: 'G-TEST' } }),
    window: { gtag: (...args) => sent.push(args) },
    localStorage: { getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value) },
  }
  const useEcommerceAnalytics = await loadComposable('../app/composables/useEcommerceAnalytics.ts', 'useEcommerceAnalytics', bindings)
  const { analyticsReady, trackPurchase } = useEcommerceAnalytics()
  const items = [{ item_id: 'test-item', item_name: 'Test item', price: 2500, quantity: 2 }]
  const purchase = { transaction_id: 'ANAI-1234567890123-ABCDEF12', shipping: 300, items }

  trackPurchase(purchase)
  assert.equal(sent.length, 0)
  assert.equal(storage.size, 0)

  analyticsReady.value = true
  trackPurchase(purchase)
  trackPurchase(purchase)
  state.clear()
  const reloaded = useEcommerceAnalytics()
  reloaded.analyticsReady.value = true
  reloaded.trackPurchase(purchase)

  assert.deepEqual(sent, [['event', 'purchase', {
    send_to: 'G-TEST', currency: 'KES', value: 5000, items,
    transaction_id: purchase.transaction_id, shipping: 300,
  }]])
})

test('payment status returns analytics items only for a paid order with the matching checkout key', async () => {
  const reference = 'ANAI-1234567890123-ABCDEF12'
  const checkoutKey = 'test-session-key-1234'
  let status = 'pending'
  let analyticsQueries = 0
  const handler = await loadComposable('../server/api/checkout/payment-status.post.ts', 'handler', {
    ...ecommerce,
    defineEventHandler: (fn) => fn,
    readBody: async (body) => body,
    enforceRequestRateLimit: async () => {},
    getDatabase: () => async (strings, ...values) => {
      const query = strings.join('?')
      if (query.includes('join public.order_items')) {
        analyticsQueries++
        if (values[1] !== checkoutKey) return []
        return [{
          product_slug: 'test-item', product_name: 'Test item', color: 'Black', size: 'M',
          unit_price_kes: '2500', quantity: 2, delivery_fee_kes: '300',
        }]
      }
      if (query.includes('from public.orders')) return [{ id: 'order-id', order_number: reference, payment_status: status }]
      if (query.includes('from public.payments')) return []
      throw new Error(`Unexpected SQL: ${query}`)
    },
  })
  const body = { reference, idempotencyKey: checkoutKey, includePurchase: true }
  assert.equal((await handler(body)).purchase, undefined)
  assert.equal(analyticsQueries, 0)
  status = 'paid'
  assert.equal((await handler({ reference, includePurchase: true })).purchase, undefined)
  assert.equal((await handler({ ...body, includePurchase: false })).purchase, undefined)
  assert.equal(analyticsQueries, 0)
  assert.equal((await handler({ ...body, idempotencyKey: 'different-session-key' })).purchase, undefined)
  assert.deepEqual((await handler(body)).purchase, {
    transaction_id: reference, shipping: 300,
    items: [{ item_id: 'test-item', item_name: 'Test item', item_variant: 'Black / M', price: 2500, quantity: 2 }],
  })
})
