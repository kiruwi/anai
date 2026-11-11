import { getDatabase } from '../db'
import { createGuestOrderToken, createOwnerReturnToken, privateReturnLink, returnConfig, tokenHash } from '../returnAccess'
import { sendBrevoEmail } from './brevo'
import { formatReturnKes, returnActionLabels, returnStatus, type ReturnAction, type ReturnRequest } from '../../../shared/types/returns'

type ReturnMail = {
  mail_id: string
  claim: string
  audience: 'owner' | 'buyer'
  event_name: string
  order_id: string
  buyer_email: string
  details: ReturnRequest | null
}

const html = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')

export function availableReturnActions(request: ReturnRequest): ReturnAction[] {
  if (request.decision === 'requested') {
    const decision: ReturnAction[] = request.proposalPending ? ['decline'] : ['approve', 'decline']
    if (request.kind === 'exchange') decision.push('offer')
    return decision
  }
  if (request.decision !== 'approved' && request.decision !== 'cancelled') return []
  const actions: ReturnAction[] = []
  if (!request.receivedAt && request.decision === 'approved') {
    actions.push('receive')
  }
  if (request.receivedAt && request.refundState === 'due') actions.push('begin_refund')
  if (request.refundState === 'processing') actions.push('record_refund', 'refund_unknown', 'refund_failed')
  if (request.refundState === 'unknown') actions.push('record_refund', 'refund_failed')
  if (request.decision === 'cancelled') return actions
  if ((!request.receivedAt || request.kind === 'exchange') && !request.fulfilledAt &&
    ['not_due', 'due'].includes(request.topupState) && ['not_due', 'due'].includes(request.refundState)) actions.push('cancel')
  if (request.receivedAt && request.topupState === 'due') actions.push('record_payment')
  if (request.replacementReference && !request.stockHeld && !request.fulfilledAt &&
    ['due', 'not_due', 'settled', 'reconciliation'].includes(request.topupState)) actions.push('renew_stock')
  if (request.replacementReference && request.stockHeld && request.receivedAt && !request.fulfilledAt
    && ['not_due', 'settled'].includes(request.topupState)) actions.push('fulfil')
  return actions
}

const messages: Record<string, string> = {
  requested: 'AÑAI received the request and will review it.',
  approve: 'The request is approved. Please follow the return instructions in your secure order page.',
  decline: 'The request was declined. See the decision in your secure order page.',
  offer: 'AÑAI proposed replacement variants. Review the estimated balance and accept the offer from your secure order page.',
  alternative_accepted: 'The replacement offer was accepted and is awaiting approval.',
  receive: 'The returned items were received and inspected.',
  cancel: 'The request was cancelled. See the reason in your secure order page.',
  begin_refund: 'The refund is processing.',
  refund_unknown: 'The refund is being reconciled. Its outcome has yet to be confirmed.',
  refund_failed: 'AÑAI verified that the previous refund attempt did not send funds. The refund is still due.',
  record_refund: 'The refund is confirmed.',
  payment_processing: 'The exchange payment is processing.',
  payment_settled: 'The exchange payment was confirmed.',
  payment_reconciliation: 'A payment or stock discrepancy needs reconciliation. Check the current status before attempting payment again.',
  payment_failed: 'M-Pesa reported that the payment failed. Check your order for the current balance.',
  reservation_expired: 'The replacement reservation expired. AÑAI will need to confirm availability again.',
  renew_stock: 'The replacement stock reservation was updated.',
  fulfil: 'AÑAI recorded the replacement dispatch or pickup.',
}

async function sendOneReturnMail(row: ReturnMail, owner: string, secret: string) {
  const config = useRuntimeConfig()
  const sql = getDatabase()
  const details = row.details
  const isOwner = row.audience === 'owner'
  const to = isOwner ? owner : row.buyer_email
  if (!to || !config.brevoApiKey || !config.brevoSenderEmail) throw new Error('Return email configuration is incomplete')

  const title = details ? (details.kind === 'refund' ? 'Refund request' : 'Exchange request') + ' · ' + details.reference : 'View your AÑAI order'
  const approvalSuperseded = row.event_name === 'approve' && details?.decision !== 'approved'
  const refundUpdateSuperseded = (row.event_name === 'begin_refund' && details?.refundState !== 'processing')
    || (row.event_name === 'refund_unknown' && details?.refundState !== 'unknown')
  const message = (!approvalSuperseded && !refundUpdateSuperseded && messages[row.event_name])
    || (details ? 'Review the latest status of this request.' : 'Use the secure link below to view your order.')
  const paragraphs = [message]
  const links: Array<{ label: string; href: string }> = []
  if (isOwner && details) {
    paragraphs.push('Request ' + details.id, 'Status: ' + returnStatus(details))
    if (row.event_name === 'requested') {
      paragraphs.push(...details.lines.map(line => [
        line.quantity + ' × ' + line.name, line.colour, line.size, line.replacement ? 'Replacement: ' + line.replacement : null,
      ].filter(Boolean).join(' · ')))
      const reasons = { preference: 'Preference', wrong: 'Wrong item or size', damaged: 'Damaged or defective', not_as_described: 'Does not match the order' }
      paragraphs.push('Reason: ' + reasons[details.reasonCode])
      if (details.refundKes) paragraphs.push('Estimated refund: ' + formatReturnKes(details.refundKes))
      if (details.topupKes) paragraphs.push('Estimated balance: ' + formatReturnKes(details.topupKes))
    }
    const actions = availableReturnActions(details)
    const hashes: Partial<Record<ReturnAction, string>> = {}
    for (const action of actions) {
      const token = createOwnerReturnToken(row.mail_id, details.id, details.version, action, owner, secret)
      hashes[action] = tokenHash(token)
      links.push({ label: returnActionLabels[action], href: privateReturnLink('manage-return', token) })
    }
    if (actions.length) {
      const [issued] = await sql`
        select public.issue_return_actions(${details.id}::uuid,${details.version}::integer,${owner},${JSON.stringify(hashes)}::jsonb) as valid
      ` as unknown as Array<{ valid: boolean }>
      if (!issued?.valid) throw new Error('Return changed before notification')
    }
    links.push({ label: 'Request fresh action links', href: privateReturnLink('manage-return') })
  } else {
    if (details) {
      paragraphs.push('Current status: ' + returnStatus(details))
      if (row.event_name === 'approve' && !approvalSuperseded && details.instructions) paragraphs.push(details.instructions)
      if (['decline', 'cancel', 'fulfil'].includes(row.event_name) && details.note) paragraphs.push(details.note)
    }
    const label = details?.receivedAt && details.topupState === 'due' && details.stockHeld ? 'Pay exchange balance' : 'View order'
    links.push({ label, href: privateReturnLink('order', createGuestOrderToken(row.order_id, secret)) })
  }
  const { response, result } = await sendBrevoEmail({
    apiKey: String(config.brevoApiKey),
    payload: {
      sender: { name: 'AÑAI', email: String(config.brevoSenderEmail) },
      to: [{ email: to }], subject: title,
      textContent: [...paragraphs, '', ...links.map(link => link.label + ': ' + link.href)].join('\n'),
      htmlContent: '<html><body><h1>' + html(title) + '</h1>' + paragraphs.map(p => '<p>' + html(p) + '</p>').join('')
        + links.map(link => '<p><a href="' + html(link.href) + '">' + html(link.label) + '</a></p>').join('') + '</body></html>',
      headers: { 'Idempotency-Key': row.mail_id },
      tags: ['order-returns'],
    },
  })
  if (result.code !== 'duplicate_parameter' && (!response.ok || !result.messageId && !result.messageIds?.length)) {
    throw new Error('Return email delivery failed')
  }
}

export async function deliverReturnMail(requestId: string | null = null) {
  const config = returnConfig()
  if (!config.enabled) return { attempted: 0, failed: 0 }
  const sql = getDatabase()
  const rows = await sql`select * from public.claim_return_mail(${requestId}::uuid)` as unknown as ReturnMail[]
  const results = await Promise.allSettled(rows.map(async (row) => {
    let sent = false
    try {
      await sendOneReturnMail(row, config.owner, config.secret)
      sent = true
    } finally {
      await sql`select public.finish_return_mail(${row.mail_id}::uuid,${row.claim}::uuid,${sent})`
    }
  }))
  return { attempted: rows.length, failed: results.filter(result => result.status === 'rejected').length }
}

export async function recoverReturnWork() {
  if (!returnConfig().enabled) return { attempted: 0, failed: 0 }
  const sql = getDatabase()
  await sql`select public.process_return_link_requests(), public.note_return_expiries()`
  // Keep reconciling outstanding reversals if new submissions are switched off.
  if (String(useRuntimeConfig().mpesaReversalCallbackSecret || '').trim().length >= 32) {
    await sql`select public.note_stale_return_reversals()`
  }
  return deliverReturnMail()
}
