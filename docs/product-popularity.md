# New Items ranking

The homepage orders its existing photographed products by GA4 product-page views
over the previous 30 complete days, using the property's timezone. Ties and
products without views retain catalogue order. Other collections are unaffected.
Views for public and legacy product slugs are combined. Query strings and
trailing slashes do not create separate product rankings.

## Source choice

Google Analytics is already integrated with the site's consent flow and client
navigation. The Data API exposes `screenPageViews` grouped by `pagePath`, so this
works with existing page views and does not require historical ecommerce events.
Only the configured production hostname and its www equivalent are included.
Visitors who decline analytics are not represented in this ranking.

Cloudflare's zone was confirmed to use the Free Website plan. Cloudflare edge
requests are a different measure from browser product-page views, and URL-level
HTTP analytics require a paid plan. Cloudflare Web Analytics supports browser
navigation, but its beacon is not allowed by this repository's current CSP and
the connected API credentials could not read its Web Analytics site endpoint
(`10405: Method not allowed for this authentication scheme`). No live Cloudflare
or Google product-view report was available during implementation.

References:

- [Google Data API dimensions and metrics](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema)
- [Google runReport](https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runReport)
- [Google reporting access setup](https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart)
- [Cloudflare Web Analytics FAQ](https://developers.cloudflare.com/web-analytics/faq/)

## Deployment configuration

1. Enable the Google Analytics Data API in the service account's Google Cloud project.
2. In GA4 property **540220862**, grant that service account **Viewer** access.
3. Configure these private variables in the server/Amplify environment:
   - `NUXT_GA4_PROPERTY_ID=540220862`
   - `NUXT_GA4_CLIENT_EMAIL`: service-account email.
   - `NUXT_GA4_PRIVATE_KEY`: its PEM private key, on one line with literal `\n`
     escapes. Do not commit credentials or prefix them with `NUXT_PUBLIC_`.
4. Deploy and request `/api/catalog/popularity`. `source: "google-analytics"`
   and a non-null `updatedAt` confirm report retrieval. An empty `viewsBySlug`
   with that source means no matching product views in the reporting window.
5. Compare the summed public/legacy URL views in GA4 for the same dates and hosts
   with the homepage order. Existing consent and the `/2wu4/` tracking gateway
   must be working for new visits to contribute.

The local property ID is configured; service-account credentials are still needed.

The server caches successful reports for one hour per running instance and
coalesces concurrent refreshes. Report/authentication requests share a three-second
timeout. On errors it retains the last successful result for at most 24 hours,
retrying after one minute. Without credentials or a usable cached report, the
homepage keeps catalogue order. The public endpoint exposes only aggregate counts,
source, and timestamp. Credentials and upstream error bodies stay on the server.
Server restarts discard the in-memory cache; each new instance fetches its report.
