# ANAI Storefront Improvement Recommendations

Last reviewed: 25 August 2026

Companion document: [project-details.md](./project-details.md)

## Recommended order of work

The project has a strong checkout foundation. The next improvements should first reduce operational and data-consistency risk, then expand automated verification, and only then add unfinished customer features.

| Priority | Recommendation | Main outcome |
| --- | --- | --- |
| P0 | Establish one catalogue source of truth | Prevent product, price, colour, image, and route drift |
| P0 | Add real checkout/database/browser integration tests | Prove behavior rather than only source structure |
| P0 | Run all tests and migration checks in CI | Stop payment or schema regressions before deployment |
| P0 | Replace process-local rate limiting | Enforce throttles across serverless instances and restarts |
| P1 | Add observability, alerting, and retry operations | Detect and recover payment/email/inventory failures |
| P1 | Add setup documentation and validated environment templates | Make local setup and deployment reproducible and safer |
| P1 | Finish or explicitly remove incomplete customer features | Align visible scope with the brand promise |
| P1 | Strengthen security and abuse protection | Reduce form, callback, and browser-policy risk |
| P2 | Improve maintainability and code quality tooling | Make changes safer as the product grows |
| P2 | Measure and improve performance/accessibility | Protect conversion quality on real devices |

## P0 — Establish one catalogue source of truth

### Finding

Presentation data for 11 products is held in the 490-line `app/data/homeContent.ts`, while Supabase separately holds products, variants, SKUs, prices, active status, and stock. Catalogue synchronization and stocktake migrations repeat product facts. The Google Merchant feed joins both sources by internal slug, while some products also have a separate corrected public URL slug.

This hybrid design was pragmatic for launch, but it creates a high-impact drift risk: a product may be visible with one price, colour, image, route, or active state while checkout and the merchant feed use another.

### Recommendation

Move sellable product data to one managed source—preferably Supabase for the current architecture—and expose a typed catalogue query to the Nuxt server. Keep only truly editorial homepage arrangements in code, referencing product IDs/slugs.

Suggested sequence:

1. Add product description, public slug, media, display order, badge/new state, colour display value, and size-guide fields to the database or a connected CMS.
2. Generate TypeScript database types from Supabase and use them in server queries.
3. Add a server-side catalogue mapper shared by storefront pages, checkout validation, sitemap, and merchant feed.
4. Add uniqueness and foreign-key constraints for public slugs, SKUs, and media/variant relationships.
5. Build a small staff workflow for updating price, stock, active state, and photos without editing migrations.
6. Remove duplicated static stock and price fallbacks once the new path is proven.

### Completion criteria

- A price, availability, colour, or route change is entered once.
- Storefront, checkout, sitemap, and merchant feed use the same record.
- CI detects missing images, duplicate slugs/SKUs, and orphaned variants.
- A documented rollback procedure exists for catalogue changes.

## P0 — Add behavioral integration and end-to-end tests

### Finding

All 49 Node tests pass, but many tests read source or migration files and assert that particular strings or regular expressions are present. Those checks are useful architectural guardrails, yet they do not prove that Nuxt routes, PostgreSQL functions, Supabase permissions, M-Pesa callback processing, or browser checkout work together.

There is one valuable pgTAP file for late M-Pesa inventory reconciliation, but it is outside `npm test` and the GitHub workflow.

### Recommendation

Create a testing pyramid:

- Keep pure unit tests for inventory, notifications, status mapping, XML builders, and data normalization.
- Run Supabase locally in CI, apply migrations from a blank database, seed minimal variants, and execute pgTAP/database tests.
- Exercise checkout RPCs with competing reservations, repeated idempotency keys, expiration, callback replay, amount mismatch, late success, and insufficient stock.
- Mock Daraja and Brevo at their HTTP boundaries and verify timeouts, non-2xx responses, malformed JSON, and retries.
- Add Playwright journeys for browsing, colour/size selection, bag reconciliation, checkout recovery, consent, keyboard navigation, and verified success/failure pages.
- Add an Amplify preview smoke test against the deployed branch URL.

### Completion criteria

- A test creates an order through the HTTP endpoint and finalizes it through a simulated webhook.
- Inventory, payment, order, and email-claim records are asserted after the journey.
- Duplicate and out-of-order callbacks are demonstrated to be safe.
- Critical desktop and mobile browser journeys run before production deployment.

## P0 — Run the complete verification suite in CI

### Finding

`.github/workflows/ci.yml` runs type checking and a production build, but does not run `npm test`, `npm run check`, Supabase migrations, or the pgTAP test. Consequently, the repository's existing 49 tests can fail without blocking a pull request.

### Recommendation

Update CI to:

1. Run `npm ci` on the Node version used by production.
2. Run lint/format checks once introduced.
3. Run `npm run check` rather than type checking alone.
4. Start local Supabase, reset from migrations, and run database tests.
5. Run a production build with the same Nitro preset as Amplify.
6. Add dependency caching only where it does not bypass the lockfile.
7. Protect `main` so these checks are required.

Also investigate the current npm warning for the unsupported `min-release-age` npm configuration before the next npm major version.

### Completion criteria

- Every test in `tests/` and `supabase/tests/` runs on pull requests.
- A migration failure from an empty database blocks merging.
- The CI build uses the Amplify preset and a clean output directory.

## P0 — Replace process-local rate limiting

### Finding

`server/utils/requestRateLimit.ts` stores counters in a module-level `Map`. This works within one warm process, but AWS/serverless instances do not share memory and may restart at any time. Requests can therefore bypass limits by landing on different instances, and one forwarded IP may also represent many legitimate users.

Checkout has additional database-side attempt controls, but support and newsletter protection depends primarily on the process-local limiter.

### Recommendation

Use a shared, expiring counter in a managed key/value service, PostgreSQL, or an edge/WAF rate-limit rule. Use separate policies for checkout, payment-status polling, support, and newsletter endpoints. Add a bot challenge or honeypot for public forms and document trusted proxy/IP handling.

### Completion criteria

- Limits are consistent across concurrent instances and deployments.
- Load tests prove the configured window and `Retry-After` behavior.
- Legitimate shared-network traffic has an understood fallback/support path.

## P1 — Add observability, alerting, and retry operations

### Finding

Server and Edge Function failures are logged with `console.error`. The callback inbox and paid-order email claims provide good recovery primitives, but there is no repository evidence of centralized error tracking, service-level metrics, dashboards, alert rules, or a scheduled retry/dead-letter process. Support email delivery is idempotent at Brevo but has no database status table comparable to paid-order email notifications.

### Recommendation

- Add structured logs with a correlation ID spanning browser request, order, payment, callback, and email invocation.
- Integrate error tracking and performance tracing for Nuxt server routes and Edge Functions.
- Monitor checkout starts, STK acceptance, callback delay, paid/failed/cancelled totals, inventory conflicts, stale pending orders, unprocessed callbacks, and email failure rate.
- Add scheduled jobs or an operator command to retry unprocessed callback events and failed/stale email claims safely.
- Persist support-email delivery status and retry it independently of support-request creation.
- Add an operations runbook for paid orders with inventory shortfall, callbacks without matching payments, and emails failing after payment.

### Completion criteria

- A failed callback or paid-order email creates an alert with the relevant correlation/order identifier.
- Operators can safely inspect and retry failures without editing database rows manually.
- Dashboards expose checkout conversion and dependency health without logging customer secrets.

## P1 — Make setup and configuration reproducible

### Finding

The repository has no root `README` and no committed `.env.example`, although `.gitignore` explicitly allows one. Daraja setup is documented well, but Supabase local setup, migration deployment, Edge Function secrets, Brevo setup, Google tag gateway behavior, Amplify settings, testing, and release/rollback procedures are not consolidated.

`nuxt.config.ts` accepts several aliases for the same Supabase keys and includes unused blank `emailApiKey` and `adminOrderEmail` entries. Analytics loads from the custom `/2wu4/` path, but no rewrite or proxy for that path appears in this repository, so it relies on external hosting configuration that is not documented here.

### Recommendation

- Add a root `README.md` with architecture, prerequisites, commands, local Supabase steps, and links to operational docs.
- Commit a redacted `.env.example` listing every required public/private variable and whether it belongs to Amplify or Supabase Edge Function secrets.
- Validate environment variables at server startup with a typed schema and conditional rules for PayBill versus Buy Goods.
- Remove obsolete aliases and unused runtime configuration after confirming production names.
- Document the `/2wu4/` analytics proxy/rewrite or replace it with a repository-managed route.
- Add deployment, migration, secret rotation, smoke-test, and rollback checklists.

### Completion criteria

- A new contributor can run the application and local database from repository instructions alone.
- Missing or inconsistent production variables fail early with a clear message.
- No secret value appears in documentation, client bundles, or CI logs.

## P1 — Finish or explicitly remove incomplete customer features

### Finding

- `/account` permanently redirects to contact; authentication-backed account behavior is not implemented.
- Lookbook and Shop the Look are placeholder pages and deliberately noindexed.
- Catalogue and policy search UI is commented out.
- Checkout currently recognizes the full XS–XL label set but accepts only `M/10` as in stock.
- Some product/media states display “Coming soon,” and exact stock labels are intentionally hidden.

These choices are sensible for a controlled launch, but they should be visible in a product roadmap rather than remain indefinitely as comments and placeholder routes.

### Recommendation

Choose one explicit outcome for each feature:

- Implement account order history and saved details, or remove the account route/link until scheduled.
- Complete editorial content with real shoppable links, or return 404/remove routes from production.
- Restore search only when catalogue size and customer research justify it.
- Move sellable sizes to variant data so availability is not hard-coded in the server endpoint.
- Define a merchandising readiness checklist covering photography, description, size guide, active state, and feed eligibility.

### Completion criteria

- The public navigation contains no destination that redirects unexpectedly or presents placeholder content.
- Available sizes come entirely from live variants.
- Every visible product meets the agreed content-readiness checklist.

## P1 — Strengthen security and abuse protection

### Finding

The application already has strong server-side price/stock validation, restricted RPCs, RLS, callback token validation, email escaping, and security headers. Remaining opportunities include a CSP with `'unsafe-inline'` for scripts/styles, public form abuse controls, secret handling across Amplify build environment capture, and operational verification of Edge Function secret authentication.

### Recommendation

- Replace inline analytics initialization with a nonce- or hash-authorized script and remove `'unsafe-inline'` from `script-src`; reduce inline-style allowances where practical.
- Add automated dependency and secret scanning plus a regular key-rotation process.
- Review `amplify.yml` so only necessary variables are written to build-time files and confirm private runtime values never enter public artifacts or logs.
- Add CSRF/origin checks where cookie-authenticated endpoints are introduced; current anonymous JSON endpoints should still validate content type and request size.
- Add bot protection to newsletter/support and strict payload-size limits to all POST routes.
- Regularly test RLS and function grants against anon, authenticated, and service-role identities.
- Ensure retained callback/customer data has a documented access and deletion policy.

### Completion criteria

- Production CSP works without unsafe inline scripts.
- Security scans run in CI and secret rotation is documented.
- Permission tests demonstrate that public roles cannot call checkout/payment mutation functions or read private customer/order data.

## P2 — Improve maintainability and code quality tooling

### Finding

There is no configured linter or formatter. Several page/components are large, with extensive scoped CSS and interaction logic in the same file. Product and checkout rules such as size labels occur in more than one layer. The Git history contains many vague commit subjects such as “fix,” “update,” and “final,” which makes later decision reconstruction difficult.

### Recommendation

- Add ESLint for Nuxt/Vue/TypeScript and Prettier, with check and fix scripts.
- Extract checkout validation schemas and shared domain types instead of repeating request/response shapes in pages and routes.
- Split large product, checkout, header, cookie-banner, and notification components into focused UI and state units where the boundary is stable.
- Generate Supabase types rather than maintaining loose local record shapes.
- Introduce lightweight Architecture Decision Records for catalogue authority, checkout reservation, callback reconciliation, hosting, and analytics consent.
- Use descriptive commit subjects and a pull-request template covering migrations, environment variables, analytics/SEO, accessibility, and rollback.
- Remove obsolete commented implementations once the related decision is recorded in the backlog.

### Completion criteria

- `npm run lint`, `npm run format:check`, `npm run typecheck`, and tests pass in CI.
- Database/API types are generated or shared rather than re-declared ad hoc.
- Major architectural choices have a short ADR with context and trade-offs.

## P2 — Measure performance and accessibility

### Finding

The code already uses image dimensions, optimized formats, public-asset compression, lazy loading, dynamic GSAP import, reduced-motion handling, semantic headings, focus management for the mobile dialog, and several ARIA labels. However, there is no automated accessibility suite, real-user performance monitoring, bundle budget, or Lighthouse gate in the repository.

The generated client output includes a roughly 277 kB uncompressed shared JavaScript chunk and a roughly 70 kB secondary chunk in the reviewed local build. These figures require source-map/bundle analysis before attributing them to particular dependencies.

### Recommendation

- Add axe checks to Playwright and perform keyboard/screen-reader review of product selection, notification announcements, cart updates, cookie preferences, and checkout errors.
- Run Lighthouse on key mobile routes and establish budgets for LCP, INP, CLS, JavaScript, images, and the hero video.
- Add a bundle visualizer and verify that GSAP, WebSocket support, Supabase, and unused page code stay out of routes that do not require them.
- Evaluate responsive `NuxtImg` use on product-detail images that currently use plain `<img>` tags.
- Test the smooth-scroll and gallery wheel interception on touchpads, keyboards, zoomed layouts, and reduced-motion transitions.
- Add real-user Core Web Vitals after consent and use results to prioritize optimization.

### Completion criteria

- Critical routes meet agreed mobile performance budgets.
- Automated accessibility tests run in CI with no serious violations.
- All commerce actions are usable by keyboard and at 200% zoom.

## Suggested delivery plan

### Phase 1: operational safety

- Add README, `.env.example`, and deployment/runbook documentation.
- Make `npm run check` and Supabase migration/pgTAP tests required in CI.
- Introduce shared rate limiting, structured logging, alerts, and failure-retry tooling.
- Verify Amplify secret handling and the analytics gateway.

### Phase 2: data and test architecture

- Consolidate catalogue authority in Supabase or a CMS.
- Generate database types and centralize domain validation.
- Add HTTP/database integration tests and mocked Daraja/Brevo contracts.
- Add Playwright checkout and accessibility journeys.

### Phase 3: customer experience and scale

- Make size availability fully variant-driven.
- Decide account and editorial scope.
- Add search only when catalogue/customer evidence supports it.
- Establish performance budgets and conversion/checkout dashboards.

## Quick wins suitable for the next pull request

1. Change CI from `npm run typecheck` to `npm run check` and keep the production build step.
2. Add the existing pgTAP test to a Supabase CI job.
3. Add a redacted `.env.example` and root README.
4. Document the `/2wu4/` analytics gateway and Edge Function secret locations.
5. Add linting/format checks and resolve the npm `min-release-age` warning.
6. Create tracked issues for the account redirect, editorial placeholders, search comments, and hard-coded `M/10` rule.

These quick wins improve confidence and team clarity without changing checkout behavior or production data.
