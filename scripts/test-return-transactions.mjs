import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'

const literal = value => "'" + String(value).replaceAll("'", "''") + "'"
const json = value => literal(JSON.stringify(value)) + '::jsonb'
const owner = 'returns-owner@example.test'
const minutesAgo = minutes => new Date(Date.now() - minutes * 60_000).toISOString()

export async function verifyReturns(query) {
  const product = randomUUID()
  const originalVariant = randomUUID()
  const sameVariant = randomUUID()
  const higherVariant = randomUUID()
  const lowerVariant = randomUUID()
  await query(`
    insert into public.products(id,name,slug,public_slug) values ('${product}','Returns fixture','returns-fixture','returns-fixture');
    insert into public.product_variants(id,product_id,sku,color,size,price_kes,stock_quantity) values
      ('${originalVariant}','${product}','RETURN-ORIGINAL','Black','M',1000,0),
      ('${sameVariant}','${product}','RETURN-SAME','Black','L',1000,4),
      ('${higherVariant}','${product}','RETURN-HIGHER','Navy','L',1400,4),
      ('${lowerVariant}','${product}','RETURN-LOWER','Brown','L',700,4)
  `)
  const stock = id => query(`select stock_quantity from public.product_variants where id='${id}'`)
  const createOrder = async (quantity = 1) => {
    const order = randomUUID()
    const item = randomUUID()
    await query(`
      insert into public.orders(id,order_number,status,payment_status,subtotal_kes,total_kes,customer_email,created_at)
      values('${order}','RETURN-${order}','fulfilled','paid',${quantity * 1000},${quantity * 1000},'buyer@example.test',now()-interval '1 day');
      insert into public.order_items(id,order_id,variant_id,product_name,sku,color,size,unit_price_kes,quantity,line_total_kes)
      values('${item}','${order}','${originalVariant}','Original','RETURN-ORIGINAL','Black','M',1000,${quantity},${quantity * 1000});
      insert into public.payments(order_id,provider,amount_kes,status,mpesa_receipt_number,mpesa_phone_number,paid_at)
      values('${order}','mpesa',${quantity * 1000},'paid','ORIGINAL-${order}','254700000001',now()-interval '1 day')
    `)
    return { order, item }
  }
  const request = ({ order, item }, kind, quantity, replacementId, key = randomUUID()) =>
    query(`select public.submit_return_request('${order}','${key}','${kind}',
      'not_as_described','Fixture request',${json([{ itemId: item, quantity, replacementId }])},'[]')`)
  const issue = async (id, action) => {
    const hash = randomUUID().replaceAll('-', '') + randomUUID().replaceAll('-', '')
    const version = await query(`select version from anai_private.return_requests where id='${id}'`)
    assert.equal(await query(`select public.issue_return_actions('${id}',${version},'${owner}',${json({ [action]: hash })})`), 't')
    return hash
  }
  const confirm = (hash, data = {}) => query(`select public.confirm_return_action('${hash}','${owner}',${json(data)})`)
  const perform = async (id, action, data) => confirm(await issue(id, action), data)
  const approval = amount => ({
    amount, deliveredAt: minutesAgo(90), policyVerified: true, note: 'Bring the item to the pickup counter.', deliveryMethod: 'town-pickup',
  })
  const receive = (id, item, resellable, damaged) => perform(id, 'receive', { inspection: { [item]: { resellable, damaged } } })
  const get = async (order, id) => {
    const detail = JSON.parse(await query(`select public.get_return_order('${order}')`))
    return detail.requests.find(row => row.id === id)
  }

  const refundOrder = await createOrder(3)
  const requestKey = randomUUID()
  const refund = await request(refundOrder, 'refund', 3, undefined, requestKey)
  assert.equal(await request(refundOrder, 'refund', 3, undefined, requestKey), refund)
  await assert.rejects(request(refundOrder, 'refund', 1), /RETURN_INVALID_QUANTITY/)
  const approve = await issue(refund, 'approve')
  const stateBefore = await query(`select used_at is null from anai_private.return_actions where token_hash='${approve}'`)
  assert.equal(stateBefore, 't')
  assert.equal(JSON.parse(await query(`select public.get_return_action('${approve}','${owner}')`)).action, 'approve')
  assert.equal(await query(`select used_at is null from anai_private.return_actions where token_hash='${approve}'`), 't')
  await confirm(approve, approval(3000))
  assert.equal(await stock(originalVariant), '0')
  await assert.rejects(confirm(approve, approval(3000)), /RETURN_LINK_INVALID/)
  await receive(refund, refundOrder.item, 2, 1)
  assert.equal(await stock(originalVariant), '2')
  await perform(refund, 'begin_refund', { amount: 3000 })
  await perform(refund, 'refund_unknown', {})
  await assert.rejects(perform(refund, 'begin_refund', { amount: 3000 }), /RETURN_STATE_CHANGED/)
  await perform(refund, 'record_refund', { amount: 3000, reference: 'REFUNDTEST01', paidAt: minutesAgo(1) })
  assert.equal((await get(refundOrder.order, refund)).refundState, 'confirmed')

  const declinedOrder = await createOrder()
  const declined = await request(declinedOrder, 'exchange', 1, sameVariant)
  await perform(declined, 'decline', { note: 'Fixture decline' })
  assert.equal(await stock(sameVariant), '4')
  assert.equal(await stock(originalVariant), '2')

  const offerOrder = await createOrder()
  const offered = await request(offerOrder, 'exchange', 1, sameVariant)
  await perform(offered, 'offer', { replacements: { [offerOrder.item]: lowerVariant } })
  let offer = await get(offerOrder.order, offered)
  assert.equal(offer.proposalPending, true)
  await assert.rejects(perform(offered, 'approve', approval(700)), /RETURN_STATE_CHANGED/)
  await assert.rejects(query(`select public.accept_return_alternative('${declinedOrder.order}','${offered}',${offer.version})`), /RETURN_STATE_CHANGED/)
  await query(`select public.accept_return_alternative('${offerOrder.order}','${offered}',${offer.version})`)
  await perform(offered, 'approve', approval(700))
  await receive(offered, offerOrder.item, 1, 0)
  await perform(offered, 'cancel', { note: 'Replacement cancelled before payment' })
  offer = await get(offerOrder.order, offered)
  assert.equal(offer.refundKes, 1000)
  assert.equal(offer.refundState, 'due')
  assert.equal(await stock(lowerVariant), '4')
  assert.equal(await stock(originalVariant), '3')

  const equalOrder = await createOrder()
  const equal = await request(equalOrder, 'exchange', 1, sameVariant)
  await perform(equal, 'approve', approval(1000))
  assert.equal(await stock(sameVariant), '3')
  await receive(equal, equalOrder.item, 1, 0)
  await perform(equal, 'fulfil', { note: 'Handed to buyer at pickup' })
  assert.ok((await get(equalOrder.order, equal)).fulfilledAt)
  assert.equal(await stock(sameVariant), '3')

  const higherOrder = await createOrder()
  const higher = await request(higherOrder, 'exchange', 1, higherVariant)
  await perform(higher, 'approve', approval(1400))
  await receive(higher, higherOrder.item, 1, 0)
  const started = JSON.parse(await query(`select public.start_exchange_topup('${higherOrder.order}','${higher}','254700000001')`))
  assert.equal(started.amountKes, 400)
  await assert.rejects(query(`select public.start_exchange_topup('${higherOrder.order}','${higher}','254700000001')`), /RETURN_STATE_CHANGED/)
  await query(`select public.set_mpesa_checkout_request('${started.orderId}','RETURN-STK-FIXTURE','merchant','{}')`)
  await query(`update public.orders set checkout_expires_at=now()-interval '1 minute' where id='${started.orderId}'`)
  await query(`select public.expire_checkout_reservations('${started.orderId}')`)
  assert.equal(await stock(higherVariant), '4')
  const finalize = "select recorded,paid,failed from public.finalize_exchange_topup('RETURN-STK-FIXTURE',0,400,'RETURNSTK001','254700000001','','{}')"
  assert.equal(await query(finalize), 't|t|f')
  assert.equal(await query(finalize), 't|t|f')
  assert.equal((await get(higherOrder.order, higher)).topupState, 'settled')
  assert.equal(await stock(higherVariant), '3')

  const offsiteOrder = await createOrder()
  const offsite = await request(offsiteOrder, 'exchange', 1, higherVariant)
  await perform(offsite, 'approve', approval(1400))
  await receive(offsite, offsiteOrder.item, 1, 0)
  await assert.rejects(perform(offsite, 'record_payment', { amount: 400, reference: 'REFUNDTEST01', paidAt: minutesAgo(1) }), /RETURN_DUPLICATE_RECEIPT/)
  await perform(offsite, 'record_payment', { amount: 400, reference: 'OFFSITE001', paidAt: minutesAgo(1) })
  assert.equal((await get(offsiteOrder.order, offsite)).topupState, 'settled')

  const unavailableOrder = await createOrder()
  const unavailable = await request(unavailableOrder, 'exchange', 1, higherVariant)
  await perform(unavailable, 'approve', approval(1400))
  await receive(unavailable, unavailableOrder.item, 1, 0)
  const unavailableTopup = JSON.parse(await query(`select public.start_exchange_topup('${unavailableOrder.order}','${unavailable}','254700000001')`))
  await query(`select public.set_mpesa_checkout_request('${unavailableTopup.orderId}','RETURN-STK-UNAVAILABLE','merchant','{}')`)
  await query(`update public.orders set checkout_expires_at=now()-interval '1 minute' where id='${unavailableTopup.orderId}'`)
  await query(`select public.expire_checkout_reservations('${unavailableTopup.orderId}')`)
  await query(`update public.product_variants set stock_quantity=0 where id='${higherVariant}'`)
  assert.equal(await query("select recorded,paid,failed from public.finalize_exchange_topup('RETURN-STK-UNAVAILABLE',0,400,'RETURNSTK002','254700000001','','{}')"), 't|t|f')
  assert.equal((await get(unavailableOrder.order, unavailable)).topupState, 'reconciliation')
  assert.equal(await query(`select status from public.payments where mpesa_receipt_number='RETURNSTK002'`), 'paid')
  await assert.rejects(perform(unavailable, 'fulfil', { note: 'Stock was unavailable' }), /RETURN_STATE_CHANGED/)

  const lowerOrder = await createOrder()
  const lower = await request(lowerOrder, 'exchange', 1, lowerVariant)
  await perform(lower, 'approve', approval(700))
  await receive(lower, lowerOrder.item, 1, 0)
  assert.equal((await get(lowerOrder.order, lower)).refundKes, 300)
  await perform(lower, 'begin_refund', { amount: 300 })
  await perform(lower, 'record_refund', { amount: 300, reference: 'REFUNDTEST02', paidAt: minutesAgo(1) })
  assert.equal((await get(lowerOrder.order, lower)).refundState, 'confirmed')
  await perform(lower, 'fulfil', { note: 'Collected at pickup' })
  assert.equal(await stock(lowerVariant), '3')

  assert.equal(await query(`select count(*) from anai_private.return_stock_movements where request_id='${refund}'`), '1')
  assert.equal(await query(`select count(*) from anai_private.return_mail m join anai_private.return_events e on e.id=m.event_id
    where e.request_id='${refund}' and e.event='record_refund'`), '2')
  assert.equal(await query("select has_schema_privilege('anai_app','anai_private','usage')"), 'f')
  console.log('Passed: return authorization, request replay, inspection stock, same-price and lower-price exchanges, late M-Pesa callbacks, off-site top-ups, refund reconciliation, and email outbox.')

  const reversalOrder = await createOrder(2)
  await query(`update public.payments set mpesa_receipt_number='AUTOREF001',mpesa_checkout_request_id='AUTO-STK-1'
    where order_id='${reversalOrder.order}'`)
  const reversal = await request(reversalOrder, 'refund', 2)
  await perform(reversal, 'approve', approval(2000))
  assert.equal(await query(`select public.can_reverse_return('${reversal}')`), 'f', 'Inspection is required')
  await receive(reversal, reversalOrder.item, 2, 0)
  assert.equal(await query(`select public.can_reverse_return('${reversal}')`), 't')
  const reversalLink = await issue(reversal, 'begin_refund')
  const begin = amount => query(`select public.begin_return_reversal('${reversalLink}','${owner}',${amount})`)
  await assert.rejects(begin(1000), /RETURN_INVALID_AMOUNT/)
  const submissions = await Promise.allSettled([begin(2000), begin(2000)])
  assert.equal(submissions.filter(result => result.status === 'fulfilled').length, 1)
  const attempt = JSON.parse(submissions.find(result => result.status === 'fulfilled').value)
  assert.equal(attempt.receipt, 'AUTOREF001')
  const update = (outcome, conversation = 'provider-1', amount = 2000) => query(`select public.update_return_reversal(
    '${attempt.id}','${outcome}','${conversation}','origin-1','AUTOREF001','AUTOCREDIT1',${amount})`)
  await update('accepted')
  assert.equal((await get(reversalOrder.order, reversal)).refundState, 'processing')
  await assert.rejects(perform(reversal, 'record_refund', { amount: 2000, reference: 'MANUALTRY1', paidAt: minutesAgo(1) }), /RETURN_REVERSAL_PENDING/)
  await assert.rejects(perform(reversal, 'refund_unknown', {}), /RETURN_REVERSAL_PENDING/)
  await update('confirmed', 'wrong-conversation')
  assert.equal((await get(reversalOrder.order, reversal)).refundState, 'processing')
  await update('confirmed', 'provider-1', 1000)
  assert.equal((await get(reversalOrder.order, reversal)).refundState, 'unknown')
  await update('confirmed')
  await update('confirmed')
  await update('unknown')
  assert.equal((await get(reversalOrder.order, reversal)).refundState, 'confirmed')
  assert.equal(await query(`select payment_status from public.orders where id='${reversalOrder.order}'`), 'refunded')
  assert.equal(await query(`select count(*) from anai_private.return_refunds where request_id='${reversal}' and reference='AUTOCREDIT1'`), '1')

  const overdueOrder = await createOrder()
  await query(`update public.payments set mpesa_receipt_number='AUTOREF003',mpesa_checkout_request_id='AUTO-STK-3'
    where order_id='${overdueOrder.order}'`)
  const overdue = await request(overdueOrder, 'refund', 1)
  await perform(overdue, 'approve', approval(1000))
  await receive(overdue, overdueOrder.item, 1, 0)
  const overdueLink = await issue(overdue, 'begin_refund')
  await query(`select public.begin_return_reversal('${overdueLink}','${owner}',1000)`)
  await query(`update anai_private.mpesa_reversals set created_at=now()-interval '16 minutes' where request_id='${overdue}'`)
  await query('select public.note_stale_return_reversals()')
  assert.equal((await get(overdueOrder.order, overdue)).refundState, 'unknown')
  await perform(overdue, 'refund_failed', { note: 'Provider confirmed no funds moved', policyVerified: true })
  assert.equal(await query(`select public.can_reverse_return('${overdue}')`), 'f', 'A reconciled attempt cannot send a second reversal')
  await perform(overdue, 'begin_refund', { amount: 1000 })
  assert.equal((await get(overdueOrder.order, overdue)).refundState, 'processing')

  const partialOrder = await createOrder(2)
  await query(`update public.payments set mpesa_receipt_number='AUTOREF002',mpesa_checkout_request_id='AUTO-STK-2'
    where order_id='${partialOrder.order}'`)
  const partial = await request(partialOrder, 'refund', 1)
  await perform(partial, 'approve', approval(1000))
  await receive(partial, partialOrder.item, 1, 0)
  const partialLink = await issue(partial, 'begin_refund')
  assert.equal(await query(`select public.can_reverse_return('${partial}')`), 'f')
  await assert.rejects(query(`select public.begin_return_reversal('${partialLink}','${owner}',1000)`), /RETURN_REVERSAL_INELIGIBLE/)
  await confirm(partialLink, { amount: 1000 })
  assert.equal((await get(partialOrder.order, partial)).refundState, 'processing')
  console.log('Passed: inspection gate, one reversal submission, blocked manual overlap, callback matching, late success, overdue reconciliation, and manual partial refunds.')
}
