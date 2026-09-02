Complete the AÑAI migration from Supabase to Neon. Treat this as an implementation task, not merely a review or plan. Implement everything that can safely be completed in the repository and on a disposable Neon test branch. Stop and ask me before any production database write, deployment, environment-variable change, branch deletion, or destructive action.

## Confirmed infrastructure state

* Repository: `kiruwi/anai`
* Default Git branch: `main`
* Supabase project: `osmfaoxiptwolpanxyok`
* Neon project: `cool-dream-76245588`
* Neon database: `neondb`
* Neon production/default branch: `br-old-wave-aegyvv0j`
* Neon rollback branch: `br-wild-moon-ae3hhzqs`
* Rollback branch name: `backup-before-access-repair-2026-09-02`

The Neon import has already been verified. Do not restart the import.

The following match Supabase exactly:

* 14 application tables
* 161 application rows, including row-content checksums
* 141 columns
* 55 constraints
* 42 indexes
* 6 application functions
* 9 triggers
* `checkout_attempts_id_seq`, including its current value

Application tables:

* `public.categories`
* `public.collections`
* `public.products`
* `public.product_variants`
* `public.product_images`
* `public.customers`
* `public.orders`
* `public.order_items`
* `public.payments`
* `public.checkout_attempts`
* `public.mpesa_callback_events`
* `public.newsletter_subscribers`
* `public.support_requests`
* `public.order_email_notifications`

The missing `supabase_vault` extension is unused. Do not try to install it on Neon.

The imported `auth`, `storage`, `realtime`, `supabase_migrations`, and `vault` schemas are currently inert. Do not use, alter, or delete them in this task.

All 14 application tables currently have RLS enabled but no policies, so non-owner roles are blocked. Sensitive checkout/payment functions have already had `PUBLIC EXECUTE` revoked. Preserve that restriction.

## Architecture decision

Use a direct, server-only Neon PostgreSQL connection.

Do not enable or use:

* Neon Data API
* Neon Auth or Better Auth
* Client-side database access
* Browser-visible database credentials
* Supabase Auth, Storage, Realtime, or Edge Functions

The current Nuxt application performs all database operations from server routes using a Supabase secret/admin client. Replace that architecture with `@neondatabase/serverless` and parameterized PostgreSQL queries.

Use a pooled Neon connection string for the deployed server runtime and an unpooled connection only for migrations or administrative work, following current official Neon documentation.

Never put the database URL in `runtimeConfig.public`, a `NUXT_PUBLIC_*` variable, client code, logs, tests, or committed files.

## Safety and workflow

1. Read any `AGENTS.md` instructions first.
2. Inspect `git status` and preserve unrelated user changes.
3. Work on a new Git branch named `chore/migrate-supabase-to-neon`.
4. Do not force-push, merge, deploy, or modify the live application.
5. Create a new Neon child branch from `br-old-wave-aegyvv0j` named `codex-app-migration-test`.
6. Perform all database migration development and testing on that child branch.
7. Do not modify the production Neon branch without showing me the complete SQL and receiving approval.
8. Do not delete Supabase or either existing Neon branch.
9. Do not expose or commit credentials.
10. Do not send real emails, initiate real M-Pesa transactions, or invoke production callbacks while testing.

## Repository audit

Start by running searches equivalent to:

```bash
rg -n "supabase|SUPABASE|@supabase|functions\.invoke|getSupabaseAdmin" .
```

Inspect every match. Known runtime files include:

* `server/utils/supabaseAdmin.ts`
* `server/utils/catalog.ts`
* `server/utils/recordMpesaPayment.ts`
* `server/api/catalog/inventory.get.ts`
* `server/api/newsletter/subscribe.post.ts`
* `server/api/support/request.post.ts`
* `server/api/checkout/create-payment.post.ts`
* `server/api/checkout/payment-status.post.ts`
* `server/routes/google-merchant.xml.ts`
* `nuxt.config.ts`

Also inspect:

* `supabase/functions/notify-paid-order/`
* `supabase/functions/notify-support-request/`
* `supabase/migrations/`
* `tests/`
* `.github/workflows/ci.yml`
* `docs/project-details.md`
* `docs/mpesa-daraja-setup.md`
* `package.json`
* `package-lock.json`

Preserve existing endpoint contracts, response shapes, validation, rate limiting, idempotency, inventory locking, payment reconciliation, and error messages unless a change is necessary for correctness.

## Replace the Supabase runtime dependency

1. Install the latest stable compatible version of `@neondatabase/serverless` using npm and pin the exact version.
2. Update `package-lock.json`.
3. Create a private server database utility, preferably `server/utils/db.ts`.
4. The utility must:

   * Read a private `databaseUrl` value from Nuxt runtime configuration.
   * Throw a controlled server error when it is missing.
   * Reuse the Neon client safely.
   * Use parameterized tagged-template SQL only.
   * Never concatenate request input into SQL.
   * Never be imported by client-side code.
5. Replace every `.from()`, `.select()`, `.insert()`, `.update()`, `.upsert()`, and `.rpc()` call with parameterized SQL.
6. Preserve numeric, bigint, timestamp, JSONB, nullable-value, and array behavior.
7. Preserve all existing TypeScript response types and API response structures.
8. Use `INSERT ... ON CONFLICT` for existing upsert behavior.
9. Preserve ordering, filters, joins, single-row behavior, and not-found handling.
10. Call imported PostgreSQL functions using parameterized `SELECT` statements with explicit casts where necessary:

    * `create_checkout_order`
    * `set_mpesa_checkout_request`
    * `finalize_mpesa_payment`
    * `fail_checkout_order`
    * `release_checkout_inventory`

The checkout and payment functions already contain the important database transactions. Do not split their atomic operations into multiple application queries.

After all runtime use is removed:

* Remove `@supabase/supabase-js`.
* Remove `ws` and `@types/ws` if nothing else uses them.
* Remove `server/utils/supabaseAdmin.ts`.
* Remove Supabase public and secret runtime configuration.
* Remove Supabase hosts from the browser CSP after confirming no browser request still requires them.
* Do not add the Neon PostgreSQL hostname to the browser CSP because the connection is server-only.
* Keep `supabase/migrations/` as historical schema records for now. Do not delete them.

## Nuxt private environment configuration

Update `nuxt.config.ts` to use private runtime settings such as:

* `databaseUrl`
* `brevoApiKey`
* `brevoSenderEmail`
* `salesNotificationEmail`
* `supportNotificationEmail`

Support secure server-side environment variables:

* `NUXT_DATABASE_URL`
* `NUXT_BREVO_API_KEY`
* `NUXT_BREVO_SENDER_EMAIL`
* `NUXT_SALES_NOTIFICATION_EMAIL`
* `NUXT_SUPPORT_NOTIFICATION_EMAIL`

Existing unprefixed Brevo names may remain as temporary private fallbacks if needed, but none may appear under `runtimeConfig.public`.

Do not commit actual values. Add or update a safe `.env.example` containing placeholders only.

## Replace the two Supabase Edge Functions

Replace:

* `notify-paid-order`
* `notify-support-request`

with private Nuxt server utilities called directly by the existing server-side checkout, payment, and support code.

Reuse the existing email-building logic instead of rewriting the templates unnecessarily.

Suggested destinations:

* `server/utils/email/notifyPaidOrder.ts`
* `server/utils/email/notifySupportRequest.ts`
* Move the existing email builders to an appropriate shared/server directory.

For paid-order notifications, preserve:

* The `order_email_notifications` idempotency record.
* Unique-conflict handling.
* The processing/sent/failed states.
* Stale-claim recovery.
* Attempt counting.
* Optimistic concurrency using `updated_at`.
* Brevo idempotency headers.
* Customer and sales email versions.
* Failure recording and the 1,000-character error limit.
* The 15-second timeout.
* Duplicate Brevo-response handling.

For support notifications, preserve:

* UUID validation.
* Support-request lookup.
* Brevo idempotency key.
* Reply-to behavior.
* HTML and plain-text email content.
* The 15-second timeout.
* Existing public API error behavior.

During automated tests, mock Brevo and assert request payloads. Never send actual email.

## Neon role, privileges, and RLS

Do not connect the production application as `neondb_owner`.

On the disposable Neon test branch:

1. Create a least-privilege role named `anai_app`.
2. Initially create it without committed credentials.
3. It must not have:

   * Superuser
   * `CREATEDB`
   * `CREATEROLE`
   * `BYPASSRLS`
4. Grant only:

   * Database connection.
   * `USAGE` on `public`.
   * Required table operations discovered from the code audit.
   * Required sequence usage.
   * Execute access to the five application checkout/payment functions.
5. Do not grant table deletion unless the code audit proves it is required.
6. Keep `PUBLIC EXECUTE` revoked from:

   * `create_checkout_order`
   * `set_mpesa_checkout_request`
   * `finalize_mpesa_payment`
   * `fail_checkout_order`
   * `release_checkout_inventory`
   * `set_updated_at`
   * `show_db_tree`
7. Keep sensitive functions owned by `neondb_owner`.
8. Verify every `SECURITY DEFINER` function has a safe fixed `search_path`, preferably `public, pg_temp`.
9. Grant function execution only to `anai_app`.

Create idempotent RLS policies for `anai_app` based on actual runtime requirements:

* `SELECT` policies only for tables the backend reads.
* `INSERT` policies only for tables the backend inserts into.
* `UPDATE` policies only for tables the backend updates.
* Both `USING` and `WITH CHECK` for update policies.
* No delete policy unless required.
* Use explicit `TO anai_app`.
* The role represents the trusted Nuxt server, so role-scoped policies may use `true` where the server legitimately needs all rows for that operation.
* Do not create fake Supabase `anon`, `authenticated`, or `service_role` roles.
* Do not blindly copy the missing Supabase RLS policies because the new architecture has no direct browser database access or customer authentication.

Store the proposed database changes in an idempotent SQL file under a new directory such as:

```text
database/neon/20260902_access_control.sql
```

Do not put passwords in that file.

Test the policies using `SET ROLE anai_app` on the disposable Neon branch. Verify permitted operations succeed and ungranted operations fail.

If Neon role credentials cannot be created safely without displaying or committing a password, stop and ask me to create the production login role in the Neon Console. Do not silently use `neondb_owner` in production.

## Tests and verification

Update existing tests instead of simply deleting Supabase-related assertions.

Add tests for:

* Catalog query output.
* Inventory lookup.
* Newsletter upsert.
* Support-request creation.
* Checkout order creation.
* M-Pesa checkout-request assignment.
* Successful and failed M-Pesa finalization.
* Payment-status polling.
* Paid-order email idempotency.
* Stale email-claim recovery.
* Support email payload.
* Database configuration errors.
* SQL parameterization and injection resistance.
* RLS and function privilege restrictions.

Run at minimum:

```bash
npm run typecheck
npm test
npm run check
npm run build
```

Update `test:db` and CI so the active test workflow no longer requires Supabase. Database integration tests must point only to the disposable Neon branch.

Run smoke tests against the test branch for:

* Product catalogue
* Product variants and inventory
* Google Merchant feed
* Newsletter signup
* Support request
* Checkout creation using mocked Daraja
* Payment-status polling
* Mocked M-Pesa callback
* Mocked Brevo notifications

Verify no real payment or email request was made.

## Database integrity verification

After changes on the disposable branch, verify:

* All 14 application tables still exist.
* Their row counts and content checksums have not changed unexpectedly.
* Columns, constraints, indexes, triggers, functions, and sequence values remain intact.
* All foreign keys validate.
* `anai_app` can perform only required operations.
* `PUBLIC` cannot execute sensitive functions.
* The owner can still execute the functions.
* No application object depends on `supabase_vault`.
* No application runtime code depends on the imported Supabase-managed schemas.

Do not modify production data to make a test pass.

## Documentation

Update repository documentation to explain:

* Neon is now the PostgreSQL provider.
* The application uses a private server-only database connection.
* Required environment-variable names.
* The pooled runtime versus unpooled migration connection.
* The two email jobs now run inside the Nuxt server.
* How to create a Neon development branch.
* How to run tests safely.
* The production cutover and rollback procedure.
* That the copied Supabase-managed schemas are not active Neon services.

Do not include credentials, connection strings, or private project keys.

## Production cutover preparation

Prepare, but do not execute, the production cutover.

The cutover plan must include:

1. Temporarily stop writes or enter a maintenance window.
2. Recompare Supabase and Neon row counts and content checksums.
3. Identify any rows created or changed in Supabase since the import.
4. Prepare an FK-safe, auditable incremental synchronization without truncating Neon.
5. Recheck `checkout_attempts_id_seq`.
6. Apply the reviewed access-control migration to Neon production only after approval.
7. Create the production `anai_app` login safely.
8. Add the pooled Neon URL to the deployment platform as `NUXT_DATABASE_URL`.
9. Add private Brevo variables.
10. Deploy.
11. Smoke-test catalogue, checkout, callbacks, emails, support, and newsletter.
12. Monitor errors.
13. Keep Supabase and the Neon rollback branch untouched until I explicitly approve removal.

Do not change deployment environment variables or deploy during this task.

## Completion criteria

Do not claim completion unless:

* The repository contains no active Supabase runtime dependency.
* All database operations use parameterized Neon SQL.
* Both Edge Functions have safe Nuxt server replacements.
* Existing functionality and response contracts are preserved.
* Tests, type checking, and production build pass.
* The disposable Neon branch passes database and RLS verification.
* No secret was committed or printed.
* Production Neon, Supabase, and deployment settings remain unchanged unless I separately approve them.

At the end, provide:

1. A concise summary of completed changes.
2. All changed files.
3. Dependency changes.
4. Test commands and results.
5. Disposable Neon branch details.
6. The exact proposed production SQL.
7. Required environment-variable names.
8. Manual production cutover steps.
9. Rollback instructions.
10. Any blockers requiring my decision.
