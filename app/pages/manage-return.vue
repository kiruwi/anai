<template>
  <div class="order-returns">
    <h1>Manage return</h1>
    <p v-if="loading" role="status">Loading the request…</p>
    <p v-if="error" class="order-returns__error" role="alert">{{ error }}</p>
    <p v-if="message" class="order-returns__status" role="status">{{ message }}</p>

    <section v-if="request" class="order-returns__panel">
      <h2>{{ returnActionLabels[request.action] }}</h2>
      <p>{{ request.reference }} · {{ request.kind }} · {{ returnStatus(request) }}</p>
      <p>Request {{ request.id }}</p>
      <p><strong>Customer’s reason</strong> {{ request.reason }}</p>
      <p v-if="request.deliveredAt">Verified delivery {{ formatDate(request.deliveredAt) }} EAT</p>
      <p v-if="request.payerLastFour">Original M-Pesa payer ending in <strong>{{ request.payerLastFour }}</strong></p>
      <ul class="order-returns__list">
        <li v-for="line in request.lines" :key="line.itemId">
          {{ line.quantity }} × {{ [line.name, line.colour, line.size, line.sku].filter(Boolean).join(' · ') }}
          <template v-if="line.replacement"> → {{ line.replacement }}</template>
          · {{ formatReturnKes(line.creditKes) }} credit
          <template v-if="line.resellable !== null"> · {{ line.resellable }} resellable, {{ line.damaged }} damaged</template>
        </li>
      </ul>
      <div v-if="request.photos.length">
        <h2>Evidence photos</h2>
        <div v-for="(photo, index) in request.photos" :key="photo.id">
          <img v-if="photos[photo.id]" :src="photos[photo.id]" :alt="'Customer evidence photo ' + (index + 1)" class="order-returns__photo">
          <button v-else type="button" class="order-returns__button order-returns__secondary" :disabled="busy"
            @click="loadPhoto(photo.id)">View photo {{ index + 1 }}</button>
        </div>
      </div>
      <form class="order-returns__form" @submit.prevent="confirmAction">
        <template v-if="request.action === 'offer'">
          <label v-for="line in request.lines" :key="line.itemId">Replacement for {{ line.quantity }} × {{ line.name }}
            <select v-model="replacements[line.itemId]" required>
              <option value="">Select a replacement</option>
              <option v-for="variant in variants.filter(row => row.available >= line.quantity)" :key="variant.id" :value="variant.id">
                {{ [variant.name, variant.colour, variant.size].filter(Boolean).join(' · ') }} — {{ formatReturnKes(variant.priceKes) }}
              </option>
            </select>
          </label>
          <p>The customer will see the proposed replacements and the estimated price difference before accepting.</p>
        </template>
        <template v-if="request.action === 'approve'">
          <label>Verified delivery date and time (EAT)
            <input v-model="deliveredAt" type="datetime-local" required>
          </label>
          <label>
            <input v-model="policyVerified" type="checkbox" required>
            I verified delivery and the policy conditions, including any sale or product exclusions.
          </label>
          <label>Return instructions for the buyer
            <textarea v-model="note" required rows="3" maxlength="1200"></textarea>
          </label>
          <label v-if="request.kind === 'exchange'">Replacement delivery
            <select v-model="deliveryMethod">
              <option value="town-pickup">Town pickup — free</option>
              <option value="nairobi-delivery">Original Nairobi address — KES 300</option>
            </select>
          </label>
          <label v-if="request.reasonCode !== 'preference' && request.deliveryFeeKes > 0">
            <input v-model="refundDelivery" type="checkbox">
            Credit the original delivery charge under the policy ({{ formatReturnKes(request.deliveryFeeKes) }})
          </label>
          <dl>
            <dt>Credit from original purchase</dt><dd>{{ formatReturnKes(approvalCredit) }}</dd>
            <template v-if="request.kind === 'exchange'">
              <dt>Replacement including delivery</dt><dd>{{ formatReturnKes(approvalTotal) }}</dd>
            </template>
            <dt>{{ approvalTotal > approvalCredit ? 'Balance to collect' : 'Refund due after receipt' }}</dt>
            <dd>{{ formatReturnKes(Math.abs(approvalTotal - approvalCredit)) }}</dd>
          </dl>
        </template>
        <template v-if="request.action === 'receive'">
          <fieldset v-for="line in request.lines" :key="line.itemId">
            <legend>{{ line.name }} · {{ line.sku || line.size }} · {{ line.quantity }} received</legend>
            <label>Resellable
              <input v-model.number="inspection[line.itemId]!.resellable" type="number" min="0" :max="line.quantity" step="1" required>
            </label>
            <label>Damaged or non-resellable
              <input v-model.number="inspection[line.itemId]!.damaged" type="number" min="0" :max="line.quantity" step="1" required>
            </label>
          </fieldset>
        </template>
        <label v-if="request.action === 'decline' || request.action === 'cancel' || request.action === 'fulfil'">
          {{ request.action === 'fulfil' ? 'Dispatch or pickup details' : 'Reason for the buyer' }}
          <textarea v-model="note" required rows="3" maxlength="1200"></textarea>
        </label>
        <template v-if="request.action === 'begin_refund'">
          <p v-if="request.automaticRefund">This submits {{ formatReturnKes(request.refundKes) }} to M-Pesa for refund to the original payer.</p>
          <p v-else>Confirm {{ formatReturnKes(request.refundKes) }} to the verified original payer. Then send the refund from the business M-Pesa account and record the receipt here.</p>
        </template>
        <template v-if="request.action === 'record_refund' || request.action === 'record_payment'">
          <p>Verify the amount and reference against the business M-Pesa record first.</p>
          <p v-if="request.action === 'record_payment'">Outstanding balance {{ formatReturnKes(request.topupKes) }}. A different verified amount will be saved for reconciliation.</p>
          <label>Amount (KES)<input v-model.number="amount" type="number" min="1" step="1" required></label>
          <label>M-Pesa reference<input v-model="paymentReference" maxlength="60" required></label>
          <label>Verified payment date and time (EAT)<input v-model="paidAt" type="datetime-local" required></label>
        </template>
        <p v-if="request.action === 'refund_unknown'">This keeps the refund open for reconciliation and prevents another refund from being started.</p>
        <template v-if="request.action === 'refund_failed'">
          <label>Evidence that the previous attempt failed
            <textarea v-model="note" required rows="3" maxlength="1200"></textarea>
          </label>
          <label><input v-model="policyVerified" type="checkbox" required>
            I verified against the business payment record that no funds were sent.
          </label>
        </template>
        <p v-if="request.action === 'renew_stock'">This checks and reserves the exact replacement variants again.</p>
        <label><input v-model="confirmed" type="checkbox" required> Confirm this action for {{ request.reference }}</label>
        <button type="submit" class="order-returns__button" :disabled="busy">
          {{ request.action === 'begin_refund'
            ? (request.automaticRefund ? 'Send M-Pesa refund' : 'Begin manual refund')
            : 'Confirm ' + returnActionLabels[request.action].toLowerCase() }}
        </button>
      </form>
    </section>
    <section v-else-if="!loading" class="order-returns__panel">
      <h2>Request fresh action links</h2>
      <form class="order-returns__form" @submit.prevent="requestLinks">
        <label>Request ID<input v-model="reference" maxlength="80" required></label>
        <label>Owner email<input v-model="email" type="email" maxlength="254" required></label>
        <button type="submit" class="order-returns__button" :disabled="busy">Email fresh links</button>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { formatReturnKes, returnActionLabels, returnStatus, type OwnerReturn, type ReplacementVariant } from '#shared/types/returns'
import { returnFormError, usePrivateOrderLink } from '../composables/usePrivateOrderLink'

useHead({ title: 'Manage return', meta: [{ name: 'referrer', content: 'no-referrer' }] })
const { token, readLink } = usePrivateOrderLink()
const request = ref<OwnerReturn>()
const busy = ref(false)
const loading = ref(true)
const error = ref('')
const message = ref('')
const reference = ref('')
const email = ref('')
const note = ref('')
const deliveredAt = ref('')
const deliveryMethod = ref('town-pickup')
const refundDelivery = ref(false)
const policyVerified = ref(false)
const confirmed = ref(false)
const amount = ref(0)
const paymentReference = ref('')
const paidAt = ref('')
const inspection = ref<Record<string, { resellable: number | string; damaged: number | string }>>({})
const photos = ref<Record<string, string>>({})
const variants = ref<ReplacementVariant[]>([])
const replacements = ref<Record<string, string>>({})
const approvalCredit = computed(() => (request.value?.creditKes || 0) + (refundDelivery.value ? (request.value?.deliveryFeeKes || 0) : 0))
const approvalTotal = computed(() => request.value?.kind === 'exchange'
  ? request.value.lines.reduce((sum, line) => sum + (line.replacementPriceKes || 0) * line.quantity, 0)
    + (deliveryMethod.value === 'nairobi-delivery' ? 300 : 0)
  : 0)
const asEAT = (value: string) => value ? new Date(value + ':00+03:00').toISOString() : undefined
const formatDate = (value: string) => new Intl.DateTimeFormat('en-KE', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Nairobi',
}).format(new Date(value))

async function run(work: () => Promise<void>) {
  busy.value = true
  error.value = ''
  message.value = ''
  try { await work() } catch (cause) { error.value = returnFormError(cause) }
  finally { busy.value = false }
}

async function loadPhoto(photoId: string) {
  await run(async () => {
    const result = await $fetch<{ photo: { mime: string; data: string } }>('/api/returns/owner', {
      method: 'POST', body: { operation: 'photo', token: token.value, photoId },
    })
    photos.value[photoId] = 'data:' + result.photo.mime + ';base64,' + result.photo.data
  })
}

async function requestLinks() {
  await run(async () => {
    const result = await $fetch<{ message: string }>('/api/returns/owner', {
      method: 'POST', body: { operation: 'link', reference: reference.value, email: email.value },
    })
    message.value = result.message
  })
}

async function confirmAction() {
  if (!request.value) return
  const action = request.value.action
  await run(async () => {
    const result = await $fetch<{ message: string }>('/api/returns/owner', {
      method: 'POST', body: {
        operation: 'confirm', token: token.value, confirmed: confirmed.value,
        data: {
          note: note.value, deliveredAt: asEAT(deliveredAt.value), deliveryMethod: deliveryMethod.value,
          refundDelivery: refundDelivery.value, policyVerified: policyVerified.value, inspection: inspection.value,
          amount: action === 'approve' ? (request.value?.kind === 'exchange' ? approvalTotal.value : approvalCredit.value) : amount.value,
          automaticRefund: action === 'begin_refund' && request.value?.automaticRefund === true,
          reference: paymentReference.value, paidAt: asEAT(paidAt.value), replacements: replacements.value,
        },
      },
    })
    message.value = result.message
    request.value = undefined
    photos.value = {}
    token.value = ''
  })
}

onMounted(async () => {
  readLink()
  if (token.value) await run(async () => {
    const result = await $fetch<{ request: OwnerReturn; variants: ReplacementVariant[] }>('/api/returns/owner', {
      method: 'POST', body: { operation: 'view', token: token.value },
    })
    request.value = result.request
    variants.value = result.variants
    replacements.value = Object.fromEntries(result.request.lines.map(line => [line.itemId, line.replacementId || '']))
    reference.value = result.request.id
    amount.value = result.request.action === 'record_payment' ? result.request.topupKes : result.request.refundKes
    inspection.value = Object.fromEntries(result.request.lines.map(line => [line.itemId, { resellable: '', damaged: '' }]))
  })
  loading.value = false
})
</script>

<style src="../assets/css/order-returns.css"></style>
