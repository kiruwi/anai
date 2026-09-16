# Checkout recovery rollout

## Scheduler connection

Cloudflare Bot Fight Mode on the Free plan challenges this automated request and does not support endpoint-specific skip rules. Keep the public site's protection enabled and route only the recovery job to the existing AWS origin. Set the repository variable `RECOVERY_CONNECT_TO` to `anaibymurda.com:443:d20r53srukqy2v.cloudfront.net:443`, keeping `RECOVERY_URL` as `https://anaibymurda.com/api/internal/recover`.

The workflow passes this optional mapping to curl's `--connect-to`: only the network destination changes. The original HTTP Host, TLS SNI, certificate validation, and bearer-token authentication remain in effect. Do not use `--insecure`. Update the mapping if the AWS distribution changes. Clearing `RECOVERY_CONNECT_TO` restores the normal Cloudflare route; with Bot Fight Mode enabled, that route will challenge the job again.

Validate with a manual workflow run and confirm the recovery endpoint returns JSON successfully. A request through the origin without a token must return `401 Unauthorized`. References: [Cloudflare Bot Fight Mode limitations](https://developers.cloudflare.com/bots/get-started/bot-fight-mode/#limitations), [curl connection routing](https://curl.se/docs/manpage.html#--connect-to).

## Application rollout

Apply `database/neon/20260905_checkout_recovery.sql` with the direct owner connection after the existing access-control migration, before deploying this application version. The migration is transactional and can be rerun. It adds private rate-limit counters, callback-to-order correlation, support-email retry claims, and revised checkout functions. Historical support requests are not automatically emailed again.

Set `NUXT_RECOVERY_TOKEN` to at least 32 random characters on the application. Set the repository secret `RECOVERY_TOKEN` to the same value and the repository variable `RECOVERY_URL` to `https://anaibymurda.com/api/internal/recover`. The recovery workflow runs every five minutes and can also be dispatched manually. GitHub schedules can run late; use an external scheduler with the same authenticated POST if a strict cadence is required. The endpoint takes a database lease to prevent overlapping workers.

Configure `NUXT_TRUSTED_CLIENT_IP_HEADER` only after confirming the ingress overwrites that header with a single validated client IP. No forwarded header is trusted by default. Without a reliable client IP, requests share a bucket; do not deploy without checking this on the actual ingress. Counters persist across instances and restarts. Storage failures reject requests rather than silently disabling limits.

The worker releases expired stock reservations, replays linked callback inbox entries, and retries paid-order/support email delivery in bounded batches. Expiry never means the payment failed: the order remains pending until an authenticated provider callback establishes its outcome. New M-Pesa callbacks include an order ID in the callback URL, so even a lost initiation response can be reconciled. Earlier callbacks without an order ID can only be replayed if their checkout request ID was already saved. Unmatched historical callbacks and payments with no callback require operator reconciliation against the provider's records; never infer a match from amount or phone alone.

Callback and email retries wait five minutes between attempts and stop after ten attempts. Monitor failed workflow runs and inspect exhausted claims. Delivery is at least once: Brevo deduplication has a limited retention window, so a provider success followed by a database failure can still produce a duplicate email after that window. The API exposes counts only; inspect server logs for individual failures.

Read-only operational queries:

```sql
-- Orders needing provider reconciliation after reservation expiry.
select id, order_number, created_at from public.orders
where payment_status = 'pending' and inventory_released_at is not null;

-- Callbacks awaiting a match or processing.
select checkout_request_id, order_id, created_at
from public.mpesa_callback_events where processed_at is null;

-- Notifications needing operator attention after automatic retries.
select order_id, attempts, last_error from public.order_email_notifications
where status <> 'sent' and attempts >= 10;
select id, request_number, email_attempts, email_last_error from public.support_requests
where email_pending and email_attempts >= 10;
```

Run `npm run check` and `npm run test:checkout-db`. The latter requires an empty, disposable PostgreSQL 16 database named `neondb` on localhost, supplied through `CHECKOUT_TEST_DATABASE_URL`; it rejects remote hosts and nonempty databases. CI provisions this service automatically and tests the actual migration, concurrent purchases, duplicate checkout keys, callback replay, stock expiry, rate limits, and email retry claims. Apply the migration to the approved Neon test branch before running `npm run test:db` there.

Rollback: pause the scheduler and revert application changes only after assessing pending payments. Leave the additive columns/tables intact. Do not restore the old expiry functions while unresolved payments exist: the old functions treat elapsed time as a definitive payment failure.

References: [PostgreSQL atomic upserts](https://www.postgresql.org/docs/16/sql-insert.html), [Brevo email idempotency](https://developers.brevo.com/docs/heterogenous-versions-batch-emails).
