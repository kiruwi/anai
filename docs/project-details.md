# ANAI Storefront Project Details

Last reviewed: 25 August 2026

Repository branch reviewed: `feature/app-improvements`

Review basis: current source code, configuration, database migrations, tests, and Git history

## Executive summary

ANAI is a server-rendered ecommerce storefront for a Kenyan activewear and athleisure brand. It presents a curated product catalogue, maintains a browser-based bag and wishlist, reads current stock from Supabase, accepts M-Pesa STK Push payments through Safaricom Daraja, sends transactional email through Brevo, and publishes search-engine and Google Merchant feeds.

The project was developed incrementally. It started as a design-led Nuxt storefront, was adapted for AWS Amplify, and then gained product-launch content, inventory-backed checkout, M-Pesa resilience, customer-support email, database security and performance improvements, SEO/merchant features, and a shared notification system. The reviewed history contains 87 commits from the initial storefront on 19 May 2026 through the current branch head on 12 August 2026.

The most important architectural characteristic is its hybrid catalogue model:

- Product presentation data—names, descriptions, categories, images, colour swatches, and route aliases—lives in `app/data/homeContent.ts`.
- Commercial and operational data—variants, SKUs, prices used at checkout, and stock—lives in Supabase/PostgreSQL.
- The server joins these sources by the internal product slug. Public URL aliases are kept separate so routes can be corrected without changing inventory identifiers.

This gives the small catalogue fast, version-controlled merchandising while keeping payment totals and stock enforcement on trusted server and database paths.

## Product scope

The implemented customer journey includes:

1. Browse the homepage, collection pages, and 11 configured products.
2. View product photos, colours, price, description, and live availability.
3. Save products to a wishlist or add colour-and-size-specific lines to the bag.
4. Choose Nairobi delivery or town pickup.
5. Start an M-Pesa STK Push from the server.
6. Poll for the verified payment result and show a success page that rechecks the server rather than trusting URL parameters.
7. Send paid-order emails to the customer and sales team.
8. Submit newsletter signups and customer-support requests.

The account route currently redirects to contact. Lookbook and Shop the Look routes are intentionally unfinished, marked `noindex`, and removed from primary navigation. Search controls are also intentionally disabled until the catalogue is large enough to justify them.

## Technology stack

| Area | Technology | Role in the project |
| --- | --- | --- |
| Application framework | Nuxt 4, Nitro, Vue 3 | File-based pages, SSR, server APIs, middleware, XML/text routes, and production output |
| Language | TypeScript | Application, server, shared logic, configuration, and Edge Function source |
| Styling | Plain CSS, scoped Vue styles, CSS custom properties | Brand system and responsive component styling without a UI framework |
| Animation | GSAP and Lenis | Product/gallery motion and smooth scrolling; reduced-motion preferences are respected |
| Images and media | `@nuxt/image`, WebP/AVIF settings, static public assets | Responsive product/tile optimization, brand images, and the homepage hero video |
| Database and backend service | Supabase, PostgreSQL, Row Level Security | Catalogue variants, inventory, customers, orders, payments, newsletter, support, and notification state |
| Server SDK | `@supabase/supabase-js` | Private server access using the Supabase secret key |
| Payments | Safaricom Daraja, Lipa na M-Pesa Online/STK Push | Kenyan mobile-money checkout and asynchronous payment callbacks |
| Email | Supabase Edge Functions, Brevo transactional email API | Support notifications and idempotent paid-order customer/sales emails |
| Analytics | Google tag with Consent Mode | Analytics is denied by default and loaded only after explicit consent |
| Search and commerce discovery | Dynamic sitemap, robots route, canonical middleware, Google Merchant XML | Canonical indexing, duplicate-host handling, and variant-aware merchant listings |
| Hosting and CI | AWS Amplify, GitHub Actions, Node.js 22 | SSR deployment, branch previews, type checking, and production builds |
| Testing | Node.js built-in test runner and pgTAP SQL | Shared-logic tests, implementation guardrails, and late-callback inventory behavior |
| Package management | npm and `package-lock.json` | Reproducible dependency installation |

The application is private and marked `UNLICENSED` in `package.json`.

## Architecture

```text
Browser / search crawler
        |
        v
Nuxt application on AWS Amplify
  |-- Vue pages and components
  |-- localStorage bag, wishlist, checkout recovery, and consent
  |-- Nitro APIs, middleware, sitemap, robots, and merchant feed
        |
        +------------------------+
        |                        |
        v                        v
Supabase / PostgreSQL       Safaricom Daraja
  |-- products/variants       |-- OAuth token
  |-- inventory               |-- STK Push
  |-- customers/orders        `-- signed callback URL
  |-- payments                      |
  |-- callback inbox <--------------+
  |-- support/newsletter
  `-- transactional RPCs
        |
        v
Supabase Edge Functions
        |
        v
Brevo email API
```

### Repository layout

| Path | Responsibility |
| --- | --- |
| `app/pages` | Storefront, collection, product, cart, checkout, legal, contact, and placeholder editorial routes |
| `app/components` | Home, layout, product, shop, and shared UI components |
| `app/composables` | Bag, wishlist, live inventory, and global notifications |
| `app/data` | Version-controlled catalogue presentation and legal/home content |
| `app/assets/css` | Global base rules and design tokens |
| `server/api` | Checkout, payment status, M-Pesa webhook, inventory, support, and newsletter endpoints |
| `server/routes` | Sitemap, robots, and Google Merchant XML |
| `server/utils` | Supabase admin client, M-Pesa client, callback recording, rate limiting, and feed creation |
| `shared` | Framework-independent inventory, payment-status, notification, navigation, and hostname logic |
| `supabase/migrations` | Versioned schema, checkout RPCs, security, performance, catalogue synchronization, and stocktake data |
| `supabase/functions` | Brevo support and paid-order email workers |
| `tests` | Node tests for business rules and source-level regression requirements |
| `docs` | Operational documentation, currently including Daraja setup and this review |

## How the project was developed

The following phases are derived from commit history and the code added in each period.

### 1. Design-led storefront foundation

The initial May implementation established the Nuxt/Vue structure, product and collection pages, responsive layout, brand fonts and imagery, cart and wishlist composables, and the first AWS Amplify deployment configuration. Subsequent commits refined hero typography, mobile layout, loading behavior, navigation, and interaction details.

The visual system was kept code-native: shared CSS variables define colour, typography, spacing, radii, and container widths, while each Vue component owns scoped presentation rules. This makes the brand styling explicit without introducing a component library or utility-CSS dependency.

### 2. Deployment, performance, and consent refinement

Amplify artifact configuration was iterated early, followed by performance fixes and a consent flow for Google Analytics. The current implementation denies all optional Google consent categories in the document head, stores the visitor's selection, and loads analytics only after permission.

Images were moved to optimized formats and explicit dimensions. `@nuxt/image` is configured for AVIF/WebP and reusable product/tile presets. Product asset URLs include a revision query when photography changes, preventing browsers and CDNs from serving an earlier photo under the same human-readable filename.

### 3. Product launch and M-Pesa commerce

The July product-launch work expanded product detail behavior, colour-specific media, bag identity, checkout, M-Pesa assets, and payment fields. Checkout was then hardened around server and database authority:

- The browser sends product identifiers, selected colour/size, quantity, customer data, delivery method, and a UUID idempotency key.
- The server normalizes and validates the request, retrieves active variants from Supabase, and ignores client-side pricing.
- The `create_checkout_order` PostgreSQL function calculates totals, reserves inventory with guarded updates, creates the order/payment records, and makes repeat requests safe.
- The server initiates the STK Push and associates Safaricom request identifiers with the pending payment.
- Safaricom calls a token-protected webhook. The raw event is first persisted in `mpesa_callback_events`, then an atomic database function finalizes payment and order state.
- Late successful callbacks can re-reserve stock. If payment is real but inventory is no longer available, the payment remains recorded as paid and the order is left in an operational-attention state instead of hiding the received money or creating negative stock.
- The checkout browser polls payment status and can recover a dropped create-payment response using its persisted idempotency key.

The Daraja client supports sandbox and production base URLs, caches access tokens before expiry, validates Kenyan phone numbers, times out external calls, and handles both PayBill and Buy Goods Till destinations.

### 4. Customer support and transactional communication

Support and newsletter endpoints validate and normalize user data, apply request throttling, and write through the private Supabase server client. Support submissions are saved before email is attempted, so an email-provider failure does not lose the request.

Supabase Edge Functions use Brevo for email delivery. Customer-controlled values are escaped in HTML and plain-text fallbacks are produced. Paid-order delivery has a database-backed claim record, stale-claim recovery, Brevo idempotency keys, and sent/failed status tracking to reduce duplicate emails when callbacks or invocations repeat.

### 5. Database hardening and cleanup

The schema began with categories, collections, products, variants, images, customer records, addresses, carts, orders, order items, and payments. Later migrations:

- added M-Pesa request, result, receipt, and callback fields;
- introduced checkout attempts, callback inbox events, newsletter subscribers, and support requests;
- moved inventory reservation and payment finalization into restricted PostgreSQL functions;
- added late-payment inventory reconciliation;
- synchronized catalogue variants and stocktake quantities;
- removed unused database cart and address tables because the live experience uses browser storage and order delivery fields;
- added paid-order email state;
- pinned trigger function search paths, tightened service-role privileges, optimized RLS evaluation, and added foreign-key indexes.

This migration history shows a deliberate move from a broad generic ecommerce schema toward the smaller set of tables actually used by the storefront.

### 6. SEO, merchant discovery, and customer feedback

The project added canonical URLs, clean collection paths, legacy product redirects, per-page metadata, dynamic sitemap and robots responses, and a Google Merchant XML feed. The feed combines version-controlled presentation content with live variant price and stock and does not invent missing identifiers such as GTINs.

All non-canonical public hosts redirect permanently to `https://anaibymurda.com`. Amplify preview domains are the exception: they remain viewable for review but receive `noindex, nofollow` headers.

The latest application work introduced a shared notification stack. Bag reconciliation, inventory outages, checkout state, newsletter submission, support, wishlist, and quick-add behavior now use consistent, deduplicated notices rather than exposing raw technical errors.

## Key decisions and trade-offs

The rationale below is inferred from implementation and history where it is not explicitly recorded in a decision document.

### Use Nuxt as both storefront and application server

One framework serves the Vue UI, API endpoints, middleware, SSR metadata, and XML/text routes. This reduces deployment and repository complexity for a small team. It also means operational API traffic and page rendering scale together on Amplify.

### Keep merchandising in code but make stock and checkout authoritative in Supabase

The small catalogue can be reviewed and deployed with the site, and photo paths remain easy to control. Supabase remains authoritative wherever correctness affects money or fulfilment. The trade-off is that matching catalogue data exists in two systems and depends on stable slugs and synchronization migrations.

### Keep the bag and wishlist anonymous in browser storage

No sign-in is required before checkout, and browsing remains fast and simple. Persisted values are normalized against the current catalogue and live stock on hydration. The trade-off is that these lists do not synchronize across devices and disappear when browser storage is cleared.

### Reserve inventory atomically before contacting M-Pesa

Database-side reservation prevents two checkouts from selling the same units and prevents the browser from choosing a price. Expiration and late-callback logic are consequently more involved, but payment and stock outcomes are auditable.

### Make checkout and notifications idempotent

Payment requests, callbacks, and email providers can all retry or time out after completing work. Browser idempotency keys, unique database records, a callback inbox, transactional RPCs, and email claims make those repeated operations safe.

### Fail closed when live inventory is available but incomplete

If Supabase successfully returns inventory and a product or colour is absent, it is treated as unavailable. Static stock is used only when live inventory cannot be loaded. This favors avoiding overselling over maximizing availability during inconsistent catalogue data.

### Use progressive enhancement for premium motion

Smooth scrolling and GSAP animations enhance capable browsers, are client-only or dynamically imported, and are skipped for reduced-motion users. Core navigation and commerce do not depend on animation completion.

### Keep unfinished content out of search results

Editorial placeholders remain available for internal development but are noindexed, absent from the sitemap, and hidden from navigation. This avoids publishing thin pages while preserving their implementation starting point.

## Security and reliability measures already present

- Private Supabase credentials and M-Pesa secrets remain in server runtime configuration.
- M-Pesa callbacks require an unguessable token automatically appended to the registered callback URL.
- External M-Pesa and Brevo calls have timeouts.
- Checkout price, availability, and totals are resolved on the server/database rather than trusted from the browser.
- Inventory reservation and payment finalization use restricted, atomic database functions.
- RLS is enabled, public grants are limited, service-role privileges were tightened, and trigger search paths were hardened.
- Callback payloads are retained in an inbox before processing.
- Checkout and paid-order email operations are idempotent.
- Customer HTML is escaped in transactional emails.
- Security headers include CSP, clickjacking protection, MIME sniffing protection, and a strict referrer policy.
- Analytics consent defaults to denied.
- Payment success is verified through the API; the success URL is explicitly not treated as proof of payment.
- Friendly customer notices replace raw integration and database errors.

## Development and deployment workflow

### Local commands

```bash
npm ci
npm run dev
npm run typecheck
npm test
npm run check
npm run build
```

Supabase migrations and Edge Functions live alongside the application. `docs/mpesa-daraja-setup.md` documents sandbox and production Daraja configuration, including the distinction between PayBill and Buy Goods Till values.

### Continuous integration

GitHub Actions runs on pull requests and pushes to `main`, using Node.js 22. The current workflow installs with `npm ci`, runs the TypeScript check, and builds the application. Concurrent runs for the same ref are cancelled when superseded.

### AWS Amplify

Amplify installs locked dependencies, writes host-provided `NUXT_` variables to the build environment, builds with the `aws_amplify` Nitro preset, and deploys `.amplify-hosting`. Branch previews are supported and protected from indexing.

### Required service configuration

The application expects configuration for:

- public Supabase URL and publishable key;
- private Supabase secret/service-role key;
- M-Pesa environment, consumer credentials, shortcode, optional Till number, passkey, callback URL/token, transaction type, and description;
- public site URL and optional Google tag ID;
- Brevo API key, sender email, and support/sales notification recipients in Supabase Edge Function secrets.

Secret values were not copied into this document.

## Current verification status

On 25 August 2026:

- `npm run check` completed successfully.
- TypeScript validation passed.
- All 49 Node tests passed.
- A production build completed client and server bundling, then local final-output cleanup failed with a Windows `EPERM` unlink error on a pre-existing `.output/server/node_modules/css-tree` path. This was an environment/filesystem cleanup failure after compilation, not a reported TypeScript or bundling error.

The 49 tests cover cart clamping, live-inventory behavior, checkout recovery and error messaging, M-Pesa cancellation and Buy Goods configuration, payment finalization requirements, migration security/performance rules, merchant XML, navigation/canonical/sitemap behavior, branding, email escaping/idempotency, and global notifications. A pgTAP test also exists for late M-Pesa callbacks and inventory reconciliation, but it is not invoked by the npm test command.

## Important limitations of this review

This document records what can be established from the repository. It does not confirm production environment variables, external Amplify rewrites, live Supabase configuration, Daraja/Brevo dashboard settings, real transaction behavior, analytics reporting, or production monitoring. Those items require access to the deployed services and should be verified through an operational checklist.
