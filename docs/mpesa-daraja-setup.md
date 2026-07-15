# M-Pesa Daraja setup

The checkout sends an STK Push from the server and accepts payment only after Safaricom calls:

`https://your-domain.com/api/webhooks/mpesa`

The application adds a private `token` query parameter to that URL automatically. Do not add the token yourself to `NUXT_MPESA_CALLBACK_URL`.

## Sandbox

1. Go to the [Safaricom Daraja Developer Portal](https://developer.safaricom.co.ke/) and create an account or sign in.
2. Open **My Apps** (or the dashboard's app library), create a new sandbox app, and add the **Lipa na M-Pesa Online / STK Push** product.
3. Open that app and copy its sandbox **Consumer Key** and **Consumer Secret**.
4. In the Lipa na M-Pesa Online sandbox documentation/app details, use the sandbox shortcode and passkey provided for STK Push. Confirm the transaction type is `CustomerPayBillOnline` for a PayBill flow.
5. Deploy a staging copy of the site to a public HTTPS URL. Safaricom cannot deliver an STK callback to `localhost`.
6. Copy `.env.example` to your local `.env` and fill in the M-Pesa variables. Set:

   ```dotenv
   NUXT_MPESA_ENVIRONMENT=sandbox
   NUXT_MPESA_CALLBACK_URL=https://your-staging-domain.com/api/webhooks/mpesa
NUXT_MPESA_TRANSACTION_TYPE=CustomerPayBillOnline
NUXT_MPESA_TRANSACTION_DESCRIPTION=ANAI payment
   ```

7. Generate a callback token, for example with `openssl rand -hex 32`, and use it as `NUXT_MPESA_CALLBACK_TOKEN`.
8. Add the same values to the encrypted environment variables of the staging host, redeploy, and place a sandbox STK test using the Daraja test phone/details shown in your portal.
9. Confirm all three results: the phone receives the prompt, `payments` is marked `paid`, and the related `orders` row becomes `confirmed`.

## Production

1. In the same Daraja app, use **Go Live** and select the Lipa na M-Pesa Online product. Complete the organisation/individual and business verification details requested by Safaricom.
2. Use the production credentials issued during Go Live: production Consumer Key, Consumer Secret, business shortcode, and Lipa na M-Pesa Online passkey.
3. For a PayBill use `CustomerPayBillOnline`; for a Buy Goods Till use `CustomerBuyGoodsOnline`. The shortcode, passkey, and transaction type must all belong to the same collection setup.
4. Set production environment variables on the production host:

   ```dotenv
   NUXT_MPESA_ENVIRONMENT=production
   NUXT_MPESA_SHORTCODE=your_live_shortcode
   NUXT_MPESA_CALLBACK_URL=https://your-live-domain.com/api/webhooks/mpesa
   ```

5. Keep the Consumer Secret, passkey, Supabase secret key, and callback token private. Never use `NUXT_PUBLIC_` for any of them.
6. Redeploy, make one low-value real payment, and verify the callback/payment/order status before announcing the new payment method.

The `ProductionCertificate.cer` and `SandboxCertificate.cer` files are not required for this STK Push checkout. They are used by other Daraja products such as B2C/B2B security-credential flows.
