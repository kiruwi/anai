<template>
  <div class="order-returns">
    <h1>View order</h1>
    <p v-if="loading" role="status">Loading your order…</p>
    <p v-if="error" class="order-returns__error" role="alert">{{ error }}</p>
    <p v-if="message" class="order-returns__status" role="status">{{ message }}</p>

    <template v-if="order">
      <p>{{ order.reference }} · {{ formatReturnKes(order.totalKes) }}</p>
      <ul class="order-returns__list">
        <li v-for="item in order.items" :key="item.id">
          {{ item.quantity }} × {{ item.name }} {{ [item.colour, item.size].filter(Boolean).join(' · ') }} · {{ formatReturnKes(item.totalKes) }}
        </li>
      </ul>

      <section v-for="request in order.requests" :key="request.id" class="order-returns__panel">
        <h2>{{ request.kind === 'refund' ? 'Refund request' : 'Exchange request' }}</h2>
        <p class="order-returns__status">{{ returnStatus(request) }}</p>
        <ul class="order-returns__list">
          <li v-for="line in request.lines" :key="line.itemId">
            {{ line.quantity }} × {{ line.name }}
            <template v-if="line.replacement"> → {{ line.replacement }}</template>
          </li>
        </ul>
        <p v-if="request.instructions && request.decision === 'approved' && !request.receivedAt">
          <strong>Return instructions</strong><br>{{ request.instructions }}
        </p>
        <p v-if="request.note">{{ request.note }}</p>
        <p v-if="request.replacementReference">Replacement order {{ request.replacementReference }}</p>
        <p v-if="request.refundKes">Refund {{ formatReturnKes(request.refundKes) }}</p>
        <p v-if="request.topupKes">Exchange balance {{ formatReturnKes(request.topupKes) }}</p>
        <button v-if="request.proposalPending && request.decision === 'requested'" type="button"
          class="order-returns__button" :disabled="busy" @click="acceptOffer(request.id, request.version)">
          Accept these replacement variants
        </button>
        <p v-if="request.reservationEnds && request.stockHeld">
          Stock reserved until {{ displayDate(request.reservationEnds) }} EAT
        </p>
        <form v-if="request.receivedAt && request.topupState === 'due' && request.stockHeld && request.decision === 'approved'"
          class="order-returns__form" @submit.prevent="startTopup(request.id)">
          <label>M-Pesa phone number
            <input v-model="phones[request.id]" type="tel" autocomplete="tel" required maxlength="25">
          </label>
          <button class="order-returns__button" :disabled="busy" type="submit">
            Pay {{ formatReturnKes(request.topupKes) }} with M-Pesa
          </button>
        </form>
        <button v-if="request.topupState === 'processing'" type="button"
          class="order-returns__button order-returns__secondary" :disabled="busy" @click="refreshOrder">
          Refresh payment status
        </button>
      </section>

      <section v-if="order.items.some(item => item.available > 0)" class="order-returns__panel">
        <h2>Request a refund or exchange</h2>
        <p>Check the <NuxtLink to="/legal/refund-policy">refund and return policy</NuxtLink>. AÑAI will verify when your order was delivered.</p>
        <form class="order-returns__form" @submit.prevent="submitRequest">
          <label>Request type
            <select v-model="kind" @change="loadVariants">
              <option value="refund">Refund</option>
              <option value="exchange">Exchange</option>
            </select>
          </label>
          <label>Reason
            <select v-model="reasonCode" required>
              <option value="" disabled>Select a reason</option>
              <option v-if="kind === 'refund'" value="preference">Change of mind or preference</option>
              <option value="wrong">Wrong item or size received</option>
              <option value="damaged">Damaged or defective</option>
              <option value="not_as_described">Does not match the order</option>
            </select>
          </label>
          <label>Tell us what happened
            <textarea v-model="reason" maxlength="1200" rows="3" required></textarea>
          </label>
          <fieldset v-for="item in order.items.filter(row => row.available > 0)" :key="item.id">
            <legend>{{ item.name }} {{ [item.colour, item.size].filter(Boolean).join(' · ') }}</legend>
            <label>Quantity to return
              <input v-model.number="quantities[item.id]" type="number" min="0" :max="item.available" step="1" placeholder="0">
            </label>
            <label v-if="kind === 'exchange' && Number(quantities[item.id]) > 0">Replacement size and colour
              <select v-model="replacements[item.id]" required>
                <option value="">Select a replacement</option>
                <option v-for="variant in variants.filter(row => row.available >= Number(quantities[item.id]))" :key="variant.id" :value="variant.id">
                  {{ [variant.name, variant.colour, variant.size].filter(Boolean).join(' · ') }} — {{ formatReturnKes(variant.priceKes) }}
                </option>
              </select>
            </label>
          </fieldset>
          <label>Photos {{ reasonCode === 'damaged' || reasonCode === 'wrong' ? '(include item and packaging)' : '(optional)' }}
            <input ref="photoInput" type="file" accept="image/jpeg,image/png,image/webp" multiple
              :required="reasonCode === 'damaged' || reasonCode === 'wrong'">
          </label>
          <p>Up to 3 photos, 1 MB each.</p>
          <p v-if="estimateQuantity">
            Estimated {{ estimateDifference > 0 ? 'balance' : 'refund' }} {{ formatReturnKes(Math.abs(estimateDifference)) }}.
            AÑAI confirms the exact amount and any delivery charges before approval.
          </p>
          <button class="order-returns__button" :disabled="busy || !estimateQuantity" type="submit">Submit request</button>
        </form>
      </section>
    </template>

    <section v-else-if="!loading" class="order-returns__panel">
      <h2>Request a fresh order link</h2>
      <form class="order-returns__form" @submit.prevent="requestLink">
        <label>Order reference<input v-model="reference" required maxlength="80"></label>
        <label>Order email<input v-model="email" type="email" required maxlength="254" autocomplete="email"></label>
        <button class="order-returns__button" :disabled="busy" type="submit">Email order link</button>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { formatReturnKes, returnStatus, type ReplacementVariant, type ReturnKind, type ReturnOrder, type ReturnReason } from '#shared/types/returns'
import { returnFormError, usePrivateOrderLink } from '../composables/usePrivateOrderLink'

useHead({ title: 'View order', meta: [{ name: 'referrer', content: 'no-referrer' }] })
const { token, readLink } = usePrivateOrderLink()
const order = ref<ReturnOrder>()
const loading = ref(true)
const busy = ref(false)
const error = ref('')
const message = ref('')
const reference = ref('')
const email = ref('')
const kind = ref<ReturnKind>('refund')
const reasonCode = ref<ReturnReason | ''>('')
const reason = ref('')
const quantities = ref<Record<string, number | string>>({})
const replacements = ref<Record<string, string>>({})
const phones = ref<Record<string, string>>({})
const variants = ref<ReplacementVariant[]>([])
const photoInput = ref<HTMLInputElement>()
let requestKey = ''

const displayDate = (value: string) => new Intl.DateTimeFormat('en-KE', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Nairobi',
}).format(new Date(value))

const estimateQuantity = computed(() => Object.values(quantities.value).reduce<number>((total, value) => total + (Number(value) || 0), 0))
const estimateDifference = computed(() => (order.value?.items || []).reduce((total, item) => {
  const quantity = Number(quantities.value[item.id]) || 0
  const replacement = kind.value === 'exchange' && variants.value.find(variant => variant.id === replacements.value[item.id])
  return total + (replacement ? replacement.priceKes * quantity : 0) - Math.floor(item.totalKes * quantity / item.quantity)
}, 0))

async function refreshOrder() {
  if (!token.value) return
  try {
    const response = await $fetch<{ order: ReturnOrder }>('/api/returns/customer', {
      method: 'POST', body: { operation: 'view', token: token.value },
    })
    order.value = response.order
  } catch (cause) {
    error.value = returnFormError(cause)
  }
}

async function run(work: () => Promise<void>) {
  busy.value = true
  error.value = ''
  message.value = ''
  try { await work() } catch (cause) { error.value = returnFormError(cause) }
  finally { busy.value = false }
}

async function loadVariants() {
  if (kind.value !== 'exchange') return
  if (reasonCode.value === 'preference') reasonCode.value = ''
  await run(async () => {
    const response = await $fetch<{ variants: ReplacementVariant[] }>('/api/returns/customer', {
      method: 'POST', body: { operation: 'variants', token: token.value },
    })
    variants.value = response.variants
  })
}

async function requestLink() {
  await run(async () => {
    const response = await $fetch<{ message: string }>('/api/returns/customer', {
      method: 'POST', body: { operation: 'link', reference: reference.value, email: email.value },
    })
    message.value = response.message
  })
}

function encodePhoto(photo: File) {
  return new Promise<{ data: string }>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject({ statusMessage: 'A selected photo could not be read.' })
    reader.onload = () => resolve({ data: String(reader.result).split(',')[1] || '' })
    reader.readAsDataURL(photo)
  })
}

async function submitRequest() {
  await run(async () => {
    const selectedPhotos = Array.from(photoInput.value?.files || [])
    if (selectedPhotos.length > 3 || selectedPhotos.some(photo => photo.size > 1_048_576)) {
      throw { statusMessage: 'Choose up to three photos, 1 MB each.' }
    }
    requestKey ||= crypto.randomUUID()
    const lines = order.value?.items.flatMap(item => Number(quantities.value[item.id]) > 0 ? [{
      itemId: item.id, quantity: Number(quantities.value[item.id]), replacementId: replacements.value[item.id],
    }] : []) || []
    await $fetch('/api/returns/customer', { method: 'POST', body: {
      operation: 'request', token: token.value, key: requestKey, kind: kind.value,
      reasonCode: reasonCode.value, reason: reason.value, lines, photos: await Promise.all(selectedPhotos.map(encodePhoto)),
    } })
    requestKey = ''
    quantities.value = {}
    replacements.value = {}
    reason.value = ''
    reasonCode.value = ''
    if (photoInput.value) photoInput.value.value = ''
    message.value = 'Your request was recorded.'
    await refreshOrder()
  })
}

async function startTopup(requestId: string) {
  await run(async () => {
    try {
      const response = await $fetch<{ message: string }>('/api/returns/customer', {
        method: 'POST', body: { operation: 'topup', token: token.value, requestId, phone: phones.value[requestId] },
      })
      message.value = response.message || 'Check your phone for the M-Pesa prompt.'
    } finally {
      await refreshOrder()
    }
  })
}

async function acceptOffer(requestId: string, version: number) {
  await run(async () => {
    const response = await $fetch<{ message: string }>('/api/returns/customer', {
      method: 'POST', body: { operation: 'accept', token: token.value, requestId, version },
    })
    message.value = response.message
    await refreshOrder()
  })
}

onMounted(async () => {
  readLink()
  await refreshOrder()
  loading.value = false
})
</script>

<style src="../assets/css/order-returns.css"></style>
