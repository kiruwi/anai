# Returns and exchanges

The storefront uses the existing Neon orders, M-Pesa callback inbox, checkout inventory and Brevo delivery. Customers open **View order** from a paid-order email. Customers with an expired link or an older confirmation can request a fresh link at `/order`. Vivian receives request-specific action links. Link previews leave the request unchanged.

## Enable on a test environment first

1. Apply `database/neon/20261111_returns.sql` with the direct owner connection after the checkout recovery migration. The app role reaches the private tables through scoped functions.
2. Set `NUXT_RETURNS_LINK_SECRET` to a new randomly generated secret of at least 32 characters. Keep the secret on the server. Changing it invalidates existing links. Return notifications use the same mailbox as paid-order notifications. Set `NUXT_RETURNS_OWNER_EMAIL` only if they should go to a different mailbox.
3. Verify the canonical `NUXT_PUBLIC_SITE_URL`, the existing Brevo sender and key, and the scheduled checkout recovery endpoint. The recovery job handles fresh links, expired reservations and queued emails. Configure transactional link tracking so the provider does not rewrite the secure links.
4. Test with synthetic orders and the M-Pesa sandbox before enabling the workflow with production credentials. Verify the hosted checkout callback can reach the site and confirm a top-up against the linked replacement order.

## Owner workflow

Verify the actual date and time of delivery or pickup before approving. The request window is seven days for preference returns and 48 hours for damaged, incorrect or non-matching items. Confirm the policy exclusions, then enter the return instructions. Inventory for the exact replacement variants is held for 48 hours. If a hold expires, confirm stock again before requesting a top-up or dispatching. Returned stock is credited when Vivian confirms the inspected quantities.

The customer can pay the verified difference by M-Pesa after receipt. For a separately verified off-site payment, use **Record payment** and enter the actual amount, date and unique receipt. A discrepancy stays open for reconciliation. Record dispatch or pickup when the required return and settlement conditions are met.

For a manual refund, open **Review refund** and confirm the amount and masked original payer. Use the business payment account to send the refund, then enter the verified receipt, date and amount with **Record refund**. Use reconciliation when the outcome is uncertain. Confirm a failed refund only after the business payment record establishes that no funds were sent.

## Daraja Reversal

When enabled, **Send M-Pesa refund** is available after inspection for a full refund of a single verified STK Push payment with no previous refund. It submits the original M-Pesa receipt to Daraja, which returns funds to the original payer. Partial refunds and ineligible orders use the manual workflow. Acknowledgement leaves the refund processing. A matching successful result records the reversal receipt and notifies both parties. If the result is uncertain or overdue, check the original payment in M-Pesa before recording a manual outcome. AÑAI submits at most one automatic reversal per payment.

1. Verify that the Daraja Reversal product and the **Org Reversals Initiator API** role are active for the collection shortcode. Confirm that Safaricom permits this use for approved merchandise returns and verify any approval or time limits. Use the [Daraja Reversals documentation](https://developer.safaricom.co.ke/dashboard/apis?api=Reversal).
2. Apply `database/neon/20261112_mpesa_reversals.sql` after `20261111_returns.sql` with the direct owner connection. Test on an isolated environment using the Daraja sandbox and the corresponding sandbox operator credentials. Verify both callback URLs reach `/api/webhooks/mpesa-reversal` and run a successful reversal, duplicate delivery, and timeout scenario.
3. Set the server-only `NUXT_MPESA_REVERSAL_INITIATOR`, `NUXT_MPESA_REVERSAL_CREDENTIAL` (encrypted operator password for the correct Daraja environment), `NUXT_MPESA_REVERSAL_SHORTCODE` (original collection shortcode), and `NUXT_MPESA_REVERSAL_CALLBACK_SECRET` (at least 32 random characters). The integration reuses the configured Daraja environment and application OAuth credentials. Keep the callback secret stable until every outstanding reversal is resolved.
4. Set `NUXT_MPESA_REVERSAL_ENABLED=true` only after confirming the provider requirements. Verify a controlled eligible payment with the store operator. To pause submissions, turn off this flag and keep the callback secret in place so pending reversals can settle.

The previous exchange requires its original order, exact returned and replacement SKUs, confirmed payment reference and amount, and physical stock check before recording any missing movements.
