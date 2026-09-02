# Neon runtime migration and operations

The storefront uses Neon Postgres through a private, server-only connection. Browser code never receives database credentials and does not connect to Neon directly. Historical SQL remains under `supabase/migrations/`, but Supabase Auth, Storage, Realtime, Edge Functions, and the imported Supabase-managed schemas are not active application services.

## Runtime architecture

- Nitro server routes call `server/utils/db.ts`.
- The database utility reads the private Nuxt `databaseUrl` runtime value and reuses the Neon HTTP query client.
- Runtime SQL uses `@neondatabase/serverless` tagged templates so request values are sent as parameters.
- Normal application traffic uses a pooled Neon URL.
- Migrations, dumps, and administrative verification use the direct/unpooled URL.
- Paid-order and support email jobs run inside the Nuxt server and call Brevo directly. Their templates, timeout behavior, and paid-order idempotency ledger are preserved.

## Environment variables

Set these private variables in local and deployment environments:

```dotenv
NUXT_DATABASE_URL=postgresql://anai_app:password@pooled-host/neondb?sslmode=require
NUXT_BREVO_API_KEY=replace-me
NUXT_BREVO_SENDER_EMAIL=orders@example.com
NUXT_SALES_NOTIFICATION_EMAIL=sales@example.com
NUXT_SUPPORT_NOTIFICATION_EMAIL=support@example.com
```

Use `DATABASE_URL_UNPOOLED` only for migrations and administration. Never use `NUXT_PUBLIC_` for database or Brevo credentials. The checked-in `.env.example` contains placeholders only.
The application deliberately does not fall back to `DATABASE_URL`, so a Neon CLI link cannot silently point local application traffic at production.

## Development branch workflow

Authenticate and link the Neon CLI, then create a child branch from production:

```bash
npx neon@latest auth
npx neon@latest link --project-id <project-id> -y
npx neon@latest branches create --project-id <project-id> --name <development-branch> --parent <production-branch-id> --no-secrets
```

Run schema or access-control changes against the named child branch with an unpooled owner connection. Do not point application smoke tests at production. The migration test branch created for this work is `codex-app-migration-test` (`br-square-base-ae28g3zb`).

## Verification

Application checks:

```bash
npm run typecheck
npm test
npm run check
npm run build
```

Read-only database integrity checks require both values so the script cannot accidentally target another endpoint:

```bash
NEON_TEST_DATABASE_URL='<test-branch-url>' \
NEON_TEST_ENDPOINT='<test-branch-endpoint-host>' \
npm run test:db
```

Apply and verify access control only on a disposable branch:

```bash
npx neon@latest psql <test-branch> --project-id <project-id> --role-name neondb_owner -- -v ON_ERROR_STOP=1 -f database/neon/20260902_access_control.sql
npx neon@latest psql <test-branch> --project-id <project-id> --role-name neondb_owner -- -f database/neon/verify_access_control.sql
npx neon@latest psql <test-branch> --project-id <project-id> --role-name neondb_owner -- -f database/neon/verify_integrity.sql
```

The access verification transaction assumes `anai_app`, tests permitted operations, proves ungranted reads/deletes fail, exercises function permissions with no-op identifiers, and rolls back all writes. The integrity verification runs read-only and checks schema counts, row counts and checksums, foreign keys, sensitive function configuration, owner execution, the absence of `supabase_vault` dependencies, and the sequence state.

## Production cutover — approval required

Do not execute these steps without an approved maintenance window and reviewed SQL.

1. Temporarily stop checkout, newsletter, and support writes.
2. Recompare all 14 application-table row counts and content checksums between Supabase and Neon.
3. Identify rows created or changed in Supabase after the original import.
4. Apply an FK-safe, auditable incremental sync without truncating Neon.
5. Recheck `checkout_attempts_id_seq` against the synchronized data.
6. Review and apply `database/neon/20260902_access_control.sql` to Neon production.
7. Create production credentials for the least-privilege `anai_app` role through a secure Neon workflow; never commit or print the password.
8. Set the pooled application URL as `NUXT_DATABASE_URL` on AWS Amplify.
9. Set all private `NUXT_BREVO_*` and notification-recipient variables.
10. Deploy the migration branch.
11. Smoke-test catalogue, inventory, Google Merchant feed, newsletter, support, checkout with controlled Daraja behavior, callback processing, payment polling, and mocked/controlled email delivery.
12. Monitor database, callback, checkout, and email errors.
13. Keep Supabase and the rollback branch intact until removal is separately approved.

## Rollback

1. Stop new writes and assess whether any checkout/payment changes reached Neon.
2. Restore the previous deployment configuration and Supabase-backed application release.
3. Reconcile any Neon-only orders, payments, callbacks, support requests, or newsletter rows back to the system of record before reopening writes.
4. Do not delete or reset Neon branches during incident response.
5. Preserve `backup-before-access-repair-2026-09-02` (`br-wild-moon-ae3hhzqs`) and the Supabase project until explicit removal approval.

The copied `auth`, `storage`, `realtime`, `supabase_migrations`, and `vault` schemas are inert import artifacts. They are not Neon Auth, Object Storage, or Realtime services and must not be used or deleted as part of runtime cutover.
