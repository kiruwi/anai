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

// Execute the real composables with browser storage and Nuxt lifecycle boundaries supplied.
const loadComposable = async (path, name, bindings) => {
  const source = (await readFile(new URL(path, import.meta.url), 'utf8'))
    .replace(/^import[\s\S]*?from\s+['"][^'"]+['"]\s*;?/gm, '')
    .replaceAll('import.meta.client', 'true')
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
