import { getDatabase } from './db.ts'
import { recordStoredMpesaCallback } from './recordMpesaPayment.ts'
import { notifyPaidOrder } from './email/notifyPaidOrder.ts'
import { notifySupportRequest } from './email/notifySupportRequest.ts'
import { recoverReturnWork } from './email/notifyReturns.ts'
import { invalidateCatalogueCache } from './catalog.ts'

/** A bounded batch; individual failures stay durable and do not block other work. */
export const runRecoveryBatch = async () => {
  const sql = getDatabase()
  const leases = await sql`select public.claim_recovery_job() as token` as unknown as Array<{ token: string | null }>
  const token = leases[0]?.token
  if (!token) return { processing: true }
  try {
    const [expiry] = await sql`select public.expire_checkout_reservations(null::uuid) as expired` as unknown as Array<{ expired: number }>
    if (expiry?.expired) invalidateCatalogueCache()
    const [callbacks, orders, support] = await Promise.all([
      sql`
        with candidates as (
          select events.checkout_request_id from public.mpesa_callback_events as events
          where events.processed_at is null and events.retry_attempts < 10
            and (events.last_retry_at is null or events.last_retry_at < now() - interval '5 minutes')
            and (events.order_id is not null or exists (
              select 1 from public.payments where mpesa_checkout_request_id = events.checkout_request_id
            ))
          order by events.last_retry_at nulls first, events.received_at
          limit 3 for update skip locked
        )
        update public.mpesa_callback_events as events
        set retry_attempts = retry_attempts + 1, last_retry_at = now()
        from candidates where candidates.checkout_request_id = events.checkout_request_id
        returning events.checkout_request_id
      ` as unknown as Promise<Array<{ checkout_request_id: string }>>,
      sql`
        select payments.mpesa_checkout_request_id from public.payments
        join public.orders as paid_order on paid_order.id = payments.order_id
        left join public.order_email_notifications as notifications on notifications.order_id = payments.order_id
        where payments.status = 'paid' and lower(payments.provider) = 'mpesa'
          and paid_order.order_number not like 'ANAI-X-%'
          and payments.mpesa_checkout_request_id is not null
          and (notifications.order_id is null or (
            notifications.status <> 'sent' and notifications.attempts < 10
            and notifications.updated_at < now() - interval '5 minutes'
          ))
        order by notifications.updated_at nulls first, payments.created_at limit 3
      ` as unknown as Promise<Array<{ mpesa_checkout_request_id: string }>>,
      sql`
        select id from public.support_requests where email_pending and email_attempts < 10
          and (email_claimed_at is null or email_claimed_at < now() - interval '5 minutes')
        order by email_claimed_at nulls first, created_at limit 3
      ` as unknown as Promise<Array<{ id: string }>>,
    ])
    const results = await Promise.allSettled([
      ...callbacks.map((event) => recordStoredMpesaCallback(event.checkout_request_id)),
      ...orders.map((payment) => notifyPaidOrder(payment.mpesa_checkout_request_id)),
      ...support.map((request) => notifySupportRequest(request.id)),
    ])
    const failed = results.filter((result) => result.status === 'rejected')
    for (const result of failed) console.error('[ANAI] Recovery attempt failed:', result.reason)
    const returns = await recoverReturnWork().catch(() => ({ attempted: 0, failed: 1 }))
    return { attempted: results.length + returns.attempted, failed: failed.length + returns.failed }
  } finally {
    await sql`select public.finish_recovery_job(${token}::uuid)`
  }
}
