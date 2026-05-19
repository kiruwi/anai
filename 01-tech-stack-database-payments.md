# ANAI Athleisure Website Plan 01: Tech Stack, Database, Payments

## Goal

Build ANAI as a Vue-based ecommerce website for athleisure products in Kenya. The site should load fast, support product browsing, cart, checkout, M-Pesa payment, card payment, order tracking, inventory control, and simple admin management.

## Recommended stack

| Layer | Recommended technology | Why |
|---|---|---|
| Frontend framework | Nuxt 4 with Vue 3 | Vue-based, file routing, server rendering, good SEO for product pages, smaller page chunks |
| Language | TypeScript | Cleaner product, cart, order, and payment types |
| Styling | Vue single-file component scoped CSS | Keeps layout and CSS near the page/component |
| UI approach | Custom components, no heavy UI kit | Gives the brand a premium look and avoids generic ecommerce UI |
| Database | Supabase Postgres | Product tables, customer profiles, carts, orders, inventory, admin workflows |
| Auth | Supabase Auth | Customer accounts, password reset, admin roles |
| Image storage | Supabase Storage | Product images, lookbook images, category images |
| Payments | Paystack Kenya first, Daraja direct later if needed | Faster setup for M-Pesa and cards; direct Daraja can be added for full M-Pesa control |
| Hosting | Vercel | Strong Nuxt support, preview deployments, simple environment variables |
| Email | Resend or Brevo | Order confirmation, admin alerts, shipping updates |
| Analytics | Plausible, Google Analytics 4, or PostHog | Traffic, conversion, product clicks, checkout drop-off |
| Error tracking | Sentry | Catch checkout, payment, and API errors |

## Why Nuxt

Use Nuxt instead of plain Vue because this is an ecommerce site. Product pages need SEO, fast first load, and clean routing. Nuxt supports server-side rendering and file-based routing, which suits product, category, and editorial pages.

Sources:
- Nuxt introduction: https://nuxt.com/docs/4.x/getting-started/introduction
- Nuxt rendering: https://nuxt.com/docs/4.x/guide/concepts/rendering
- Vue SSR guide: https://vuejs.org/guide/scaling-up/ssr.html

## App architecture

Use this setup:

```txt
Nuxt 4 app
  |
  |-- Public pages
  |     Home
  |     Category pages
  |     Product pages
  |     Lookbook pages
  |     Cart
  |     Checkout
  |
  |-- Supabase
  |     Products
  |     Variants
  |     Inventory
  |     Customers
  |     Orders
  |     Order items
  |     Payments
  |
  |-- Payment gateway
  |     Paystack checkout
  |     Payment callback
  |     Webhook verification
  |
  |-- Admin area
        Product management
        Order management
        Inventory updates
```

## Payment recommendation for Kenya

### Primary option: Paystack Kenya

Use Paystack first because it can support ecommerce checkout with M-Pesa and card payments in one flow. This avoids building everything from the raw M-Pesa API on day one.

Good for:
- M-Pesa checkout
- Card payments
- Apple Pay where available
- Dashboard reconciliation
- Faster MVP launch

Sources:
- Paystack M-Pesa support: https://support.paystack.com/en/articles/2128322
- Paystack M-Pesa Till support: https://support.paystack.com/en/articles/3340930
- Paystack Kenya transfers: https://paystack.com/blog/product/transfers-in-ke

### Secondary option: Safaricom Daraja

Use Daraja if ANAI wants direct control over M-Pesa STK Push. This gives more control, but takes more backend work.

Use Daraja for:
- Direct STK Push
- M-Pesa-first checkout
- Custom reconciliation
- Lower dependency on a checkout aggregator

Source:
- Safaricom Daraja developer portal: https://developer.safaricom.co.ke/

### Backup option: Pesapal

Use Pesapal as a backup gateway or a second provider if Paystack onboarding, settlement, or payment methods do not fit the business need.

Source:
- Pesapal Kenya: https://www.pesapal.com/

## Payment flow

```txt
Customer adds item to cart
Customer opens checkout
Customer enters delivery details
System creates pending order in database
System creates Paystack payment session
Customer pays via M-Pesa or card
Paystack redirects customer back to /checkout/success
Webhook confirms payment server-side
System marks order as paid
System reduces inventory
System sends order emails
Admin receives order notification
```

## Database tables

### products

```sql
id uuid primary key
name text not null
slug text unique not null
description text
category_id uuid references categories(id)
collection_id uuid references collections(id)
activity text
is_featured boolean default false
is_new boolean default false
is_active boolean default true
created_at timestamptz default now()
updated_at timestamptz default now()
```

### product_variants

```sql
id uuid primary key
product_id uuid references products(id)
sku text unique
color text
size text
price_kes integer not null
compare_at_price_kes integer
stock_quantity integer default 0
is_active boolean default true
```

### product_images

```sql
id uuid primary key
product_id uuid references products(id)
variant_id uuid references product_variants(id)
image_url text not null
alt_text text
sort_order integer default 0
```

### categories

```sql
id uuid primary key
name text not null
slug text unique not null
description text
sort_order integer default 0
```

### collections

```sql
id uuid primary key
name text not null
slug text unique not null
description text
hero_image_url text
sort_order integer default 0
```

### customers

```sql
id uuid primary key
auth_user_id uuid
full_name text
email text
phone text
created_at timestamptz default now()
```

### addresses

```sql
id uuid primary key
customer_id uuid references customers(id)
full_name text
phone text
county text
town text
address_line text
delivery_notes text
is_default boolean default false
```

### carts

```sql
id uuid primary key
customer_id uuid references customers(id)
session_id text
status text default 'active'
created_at timestamptz default now()
updated_at timestamptz default now()
```

### cart_items

```sql
id uuid primary key
cart_id uuid references carts(id)
variant_id uuid references product_variants(id)
quantity integer not null
```

### orders

```sql
id uuid primary key
order_number text unique not null
customer_id uuid references customers(id)
status text default 'pending'
payment_status text default 'unpaid'
subtotal_kes integer not null
delivery_fee_kes integer default 0
total_kes integer not null
delivery_county text
delivery_town text
delivery_address text
customer_phone text
customer_email text
created_at timestamptz default now()
updated_at timestamptz default now()
```

### order_items

```sql
id uuid primary key
order_id uuid references orders(id)
variant_id uuid references product_variants(id)
product_name text
sku text
color text
size text
unit_price_kes integer
quantity integer
line_total_kes integer
```

### payments

```sql
id uuid primary key
order_id uuid references orders(id)
provider text not null
provider_reference text
amount_kes integer not null
status text default 'pending'
paid_at timestamptz
raw_payload jsonb
created_at timestamptz default now()
```

## Product seed data

Use the product sheet as initial seed data.

| Catalogue No. | Product name | Category | Collection | Activity |
|---|---|---|---|---|
|  | Yoga mats | Accessories | Studio Essentials | Yoga / Pilates |
|  | Circle ankle weights | Accessories | Training Essentials | Training |
|  | Resistance bands | Accessories | Training Essentials | Training |
|  | Slider magic | Accessories | Studio Essentials | Core / Pilates |
| DWJS124106 | Jacket | Outerwear | Everyday Active | Training / Travel |
| DCX8933 | Long sleeve, swirl neck | Tops | Core Tops | Everyday / Training |
| DCX8743-8 | Long sleeve, round neck | Tops | Core Tops | Everyday / Training |
| TZ3129-1 &5 | Nuru short set | Sets | Short Sets | Training / Lounge |
| DDX87099 | Mini t-shirt | Tops | Core Tops | Everyday |
| TZ9224 | Sahara set, corsage style set | Sets | Statement Sets | Studio / Lounge |
| TZ9305 | Terra set, Padel/tennis bubble set | Sets | Court Edit | Padel / Tennis |
| TW410 | Mia cropped tees | Tops | Core Tops | Everyday / Studio |
| TZ4509-6 | Nia set | Sets | Statement Sets | Training / Studio |
| TZ4507-3 | Jua short set | Sets | Short Sets | Training / Warm weather |
| TMO260-9 | Lela set | Sets | Statement Sets | Studio / Everyday |
| EWT93314 | Mvua flannel | Outerwear | Layering Edit | Lounge / Travel |
|  | Socks | Accessories | Finishing Pieces | Everyday / Training |
|  | Hats | Accessories | Finishing Pieces | Outdoor / Everyday |

## Backend rules

- Never trust cart prices from the browser.
- Read price from `product_variants` during checkout.
- Create the order before payment starts.
- Only mark an order as paid after webhook verification.
- Reduce stock only after confirmed payment.
- Log every payment callback in `payments.raw_payload`.
- Use database row-level security.
- Keep admin routes behind role checks.

## Environment variables

```env
NUXT_PUBLIC_SITE_URL=
NUXT_PUBLIC_SUPABASE_URL=
NUXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

PAYSTACK_PUBLIC_KEY=
PAYSTACK_SECRET_KEY=
PAYSTACK_WEBHOOK_SECRET=

EMAIL_API_KEY=
ADMIN_ORDER_EMAIL=
```

## MVP scope

Build these first:

1. Home page
2. Category pages
3. Product detail page
4. Cart
5. Checkout
6. Paystack payment
7. Order confirmation page
8. Admin product list
9. Admin order list

Build later:

1. Customer accounts
2. Wishlist
3. Reviews
4. Discount codes
5. Gift cards
6. Loyalty points
7. Direct Daraja STK Push
8. SMS order updates
