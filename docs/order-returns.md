# Returns and exchanges

The storefront uses the existing Neon orders, M-Pesa callback inbox, checkout inventory and Brevo delivery. Customers open **View order** from a paid-order email. Customers with an expired link or an older confirmation can request a fresh link at `/order`. Vivian receives request-specific action links. Link previews leave the request unchanged.

## Enable on a test environment first

1. Apply `database/neon/20261111_returns.sql` with the direct owner connection after the checkout recovery migration. The app role reaches the private tables through scoped functions.
2. Set `NUXT_RETURNS_OWNER_EMAIL` to Vivian’s business mailbox and `NUXT_RETURNS_LINK_SECRET` to a new randomly generated secret of at least 32 characters. Keep the secret on the server. Changing it invalidates existing links.
3. Verify the canonical `NUXT_PUBLIC_SITE_URL`, the existing Brevo sender and key, and the scheduled checkout recovery endpoint. The recovery job handles fresh links, expired reservations and queued emails. Configure transactional link tracking so the provider does not rewrite the secure links.
4. Test with synthetic orders and the M-Pesa sandbox before enabling the workflow with production credentials. Verify the hosted checkout callback can reach the site and confirm a top-up against the linked replacement order.

## Owner workflow

Verify the actual date and time of delivery or pickup before approving. The request window is seven days for preference returns and 48 hours for damaged, incorrect or non-matching items. Confirm the policy exclusions, then enter the return instructions. Inventory for the exact replacement variants is held for 48 hours. If a hold expires, confirm stock again before requesting a top-up or dispatching. Returned stock is credited when Vivian confirms the inspected quantities.

The customer can pay the verified difference by M-Pesa after receipt. For a separately verified off-site payment, use **Record payment** and enter the actual amount, date and unique receipt. A discrepancy stays open for reconciliation. Record dispatch or pickup when the required return and settlement conditions are met.

For a manual refund, confirm the amount and masked original payer with **Begin manual refund**. Use the business payment account to make the refund. Record the verified reference, date and amount using **Record refund**. Use the reconciliation action if the outcome is uncertain. Only confirm a failed refund when the business payment record establishes that funds were not sent. Automated Daraja refund payouts require a separate provider verification and rollout.

The previous exchange requires its original order, exact returned and replacement SKUs, confirmed payment reference and amount, and physical stock check before recording any missing movements.
