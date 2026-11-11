export type ReturnKind = 'refund' | 'exchange'
export type ReturnReason = 'preference' | 'wrong' | 'damaged' | 'not_as_described'
export type ReturnAction = 'approve' | 'decline' | 'offer' | 'receive' | 'cancel' | 'begin_refund' | 'refund_unknown'
  | 'refund_failed' | 'record_refund' | 'record_payment' | 'renew_stock' | 'fulfil'

export const returnActionLabels: Record<ReturnAction, string> = {
  approve: 'Approve',
  decline: 'Decline',
  offer: 'Offer replacement variants',
  receive: 'Confirm return received',
  cancel: 'Cancel request',
  begin_refund: 'Begin manual refund',
  refund_unknown: 'Mark refund for reconciliation',
  refund_failed: 'Confirm refund failed',
  record_refund: 'Record refund',
  record_payment: 'Record payment',
  renew_stock: 'Reserve replacement stock again',
  fulfil: 'Record dispatch or pickup',
}

export type ReturnLine = {
  itemId: string
  name: string
  sku: string | null
  size: string | null
  colour: string | null
  quantity: number
  creditKes: number
  replacement: string | null
  replacementId: string | null
  replacementPriceKes: number | null
  resellable: number | null
  damaged: number | null
}

export type ReturnRequest = {
  id: string
  reference: string
  kind: ReturnKind
  reasonCode: ReturnReason
  reason: string
  decision: 'requested' | 'approved' | 'declined' | 'cancelled'
  note: string | null
  instructions: string | null
  createdAt: string
  receivedAt: string | null
  fulfilledAt: string | null
  creditKes: number
  replacementTotalKes: number
  refundKes: number
  topupKes: number
  refundState: 'not_due' | 'due' | 'processing' | 'confirmed' | 'unknown'
  topupState: 'not_due' | 'due' | 'processing' | 'settled' | 'reconciliation'
  replacementReference: string | null
  reservationEnds: string | null
  stockHeld: boolean
  proposalPending: boolean
  version: number
  lines: ReturnLine[]
}

export type OwnerReturn = ReturnRequest & {
  action: ReturnAction
  deliveredAt: string | null
  orderedAt: string
  deliveryFeeKes: number
  payerLastFour: string | null
  photos: Array<{ id: string; mime: string }>
}

export type ReturnOrder = {
  reference: string
  totalKes: number
  items: Array<{
    id: string; name: string; size: string | null; colour: string | null
    quantity: number; available: number; totalKes: number
  }>
  requests: ReturnRequest[]
}

export type ReplacementVariant = {
  id: string; name: string; colour: string | null; size: string | null; priceKes: number; available: number
}

export function returnStatus(request: ReturnRequest) {
  if (request.decision === 'requested') return request.proposalPending ? 'Alternative awaiting your confirmation' : 'Awaiting review'
  if (request.decision === 'declined') return 'Declined'
  if (request.decision === 'cancelled' && request.refundState === 'not_due') return 'Cancelled'
  if (request.topupState === 'reconciliation' || request.refundState === 'unknown') return 'Payment needs reconciliation'
  if ((request.kind === 'refund' || request.decision === 'cancelled') && request.refundState === 'confirmed') return 'Refund confirmed'
  if (!request.receivedAt) return 'Awaiting return'
  if (request.refundState === 'processing') return 'Refund processing'
  if (request.refundState === 'due') return 'Refund awaiting payment'
  if (request.kind === 'refund') return 'Return complete'
  if (request.topupState === 'processing') return 'Payment processing'
  if (request.kind === 'exchange' && !request.stockHeld && !request.fulfilledAt) return 'Replacement stock needs confirmation'
  if (request.topupState === 'due') return 'Awaiting payment'
  if (request.fulfilledAt) return 'Exchange complete'
  return 'Ready for dispatch or pickup'
}

export const formatReturnKes = (value: number) => 'KES ' + value.toLocaleString('en-KE')
