# ANAI Athleisure Website Plan 03: Sitemap, Routes, Components, and Code Structure

## Goal

Build the ANAI ecommerce website with clear routes, simple names, small files, and readable code. Keep each page, section, and component easy to find.

## Naming rules

Use these rules across the project:

- Use PascalCase for Vue components.
- Use kebab-case for route folders.
- Use camelCase for functions and variables.
- Use clear names instead of short names.
- Use small components instead of long page files.
- Keep page-specific CSS beside the page or inside the Vue file.
- Use scoped styles for small and medium components.
- Use one component for one job.

Good names:

```txt
ProductCard.vue
ProductImageGallery.vue
CartSummary.vue
CheckoutPaymentForm.vue
ShopByActivity.vue
```

Bad names:

```txt
Card.vue
Data.vue
Thing.vue
Comp1.vue
MainSection.vue
```

## Sitemap

```txt
/
  Home

/shop
  All products

/new-in
  New arrivals

/sets
  Activewear sets

/tops
  Tops

/outerwear
  Jackets and layering

/accessories
  Yoga mats, bands, socks, hats

/collections
  All collections

/collections/studio-essentials
  Yoga mats, slider magic, resistance bands

/collections/training-essentials
  Ankle weights, bands, training pieces

/collections/short-sets
  Nuru short set, Jua short set

/collections/statement-sets
  Sahara set, Nia set, Lela set

/collections/court-edit
  Terra set, socks, hats

/collections/layering-edit
  Jacket, Mvua flannel

/activity/yoga-pilates
  Yoga and Pilates products

/activity/training
  Training products

/activity/tennis-padel
  Court products

/activity/everyday
  Everyday athleisure

/activity/lounge-travel
  Lounge and travel pieces

/product/[slug]
  Product detail page

/lookbook
  Editorial lookbook

/shop-the-look
  Outfit bundles

/size-guide
  Size guide

/about
  Brand story

/contact
  Contact page

/delivery-returns
  Delivery and returns

/cart
  Cart page

/checkout
  Checkout page

/checkout/success
  Payment success page

/checkout/failed
  Payment failed page

/account
  Customer account home

/account/orders
  Customer orders

/account/wishlist
  Wishlist

/admin
  Admin dashboard

/admin/products
  Product management

/admin/orders
  Order management

/admin/inventory
  Inventory management
```

## Main navigation

Desktop header:

```txt
New In
Sets
Tops
Outerwear
Accessories
Lookbook
```

Utility links:

```txt
Search
Account
Wishlist
Cart
```

Footer navigation:

```txt
Shop
Help
About ANAI
Social
Payments
```

## Recommended project structure

Use Nuxt 4 with the `app` directory.

```txt
anai-store/
  app/
    app.vue

    assets/
      css/
        base.css
        tokens.css

    components/
      layout/
        AnnouncementBar.vue
        SiteHeader.vue
        SiteFooter.vue
        MobileMenu.vue

      product/
        ProductCard.vue
        ProductGrid.vue
        ProductCarousel.vue
        ProductImageGallery.vue
        ProductInfoPanel.vue
        ProductVariantSelector.vue
        ProductPrice.vue

      cart/
        CartDrawer.vue
        CartItem.vue
        CartSummary.vue

      checkout/
        CheckoutContactForm.vue
        CheckoutDeliveryForm.vue
        CheckoutPaymentForm.vue
        CheckoutOrderSummary.vue

      home/
        HomeHero.vue
        NewReleases.vue
        EditorialBanner.vue
        ShopByCategory.vue
        ShopByActivity.vue
        ShopByColour.vue
        ShopTheLook.vue
        BestSellers.vue
        BrandPromiseStrip.vue
        NewsletterSignup.vue

      shared/
        AppButton.vue
        AppBadge.vue
        AppIcon.vue
        EmptyState.vue
        LoadingState.vue
        SectionHeader.vue

    composables/
      useCart.ts
      useProducts.ts
      useCheckout.ts
      usePayment.ts
      useWishlist.ts

    data/
      productSeed.ts
      navigation.ts

    pages/
      index.vue

      shop/
        index.vue
        shop.css

      new-in/
        index.vue
        new-in.css

      sets/
        index.vue
        sets.css

      tops/
        index.vue
        tops.css

      outerwear/
        index.vue
        outerwear.css

      accessories/
        index.vue
        accessories.css

      collections/
        index.vue
        [slug].vue
        collections.css

      activity/
        [slug].vue
        activity.css

      product/
        [slug].vue
        product.css

      lookbook/
        index.vue
        lookbook.css

      shop-the-look/
        index.vue
        shop-the-look.css

      size-guide/
        index.vue
        size-guide.css

      about/
        index.vue
        about.css

      contact/
        index.vue
        contact.css

      delivery-returns/
        index.vue
        delivery-returns.css

      cart/
        index.vue
        cart.css

      checkout/
        index.vue
        success.vue
        failed.vue
        checkout.css

      account/
        index.vue
        orders.vue
        wishlist.vue
        account.css

      admin/
        index.vue
        products.vue
        orders.vue
        inventory.vue
        admin.css

    server/
      api/
        checkout/
          create-payment.post.ts
          verify-payment.post.ts
        webhooks/
          paystack.post.ts
        orders/
          create.post.ts
          list.get.ts
        products/
          list.get.ts
          by-slug.get.ts

  public/
    images/
      hero/
      products/
      categories/
      lookbook/

  supabase/
    migrations/
    seed.sql

  .env.example
  nuxt.config.ts
  package.json
  README.md
```

## CSS approach

Use this order:

1. Global tokens in `assets/css/tokens.css`
2. Base styles in `assets/css/base.css`
3. Component styles inside each `.vue` file using `<style scoped>`
4. Page-specific CSS beside the page only when the page gets large

### tokens.css

```css
:root {
  --colour-plum: #461828;
  --colour-clay: #C66747;
  --colour-cream: #D7C1A9;
  --colour-olive: #6C5140;
  --colour-black: #000000;
  --colour-white: #FFFFFF;

  --space-xs: 0.4rem;
  --space-sm: 0.8rem;
  --space-md: 1.6rem;
  --space-lg: 2.4rem;
  --space-xl: 4rem;

  --radius-sm: 0.4rem;
  --radius-md: 0.8rem;

  --container-width: 128rem;
}
```

### base.css

```css
html {
  font-size: 62.5%;
}

body {
  margin: 0;
  font-family: Inter, Arial, sans-serif;
  font-size: 1.6rem;
  color: var(--colour-black);
  background: var(--colour-white);
}

img {
  display: block;
  max-width: 100%;
}

button,
input,
select,
textarea {
  font: inherit;
}
```

## Page build plan

### Home page

File:

```txt
app/pages/index.vue
```

Use these components:

```txt
HomeHero
NewReleases
EditorialBanner
ShopByCategory
ShopByActivity
ShopByColour
ShopTheLook
BestSellers
BrandPromiseStrip
NewsletterSignup
```

Keep the page file short:

```vue
<template>
  <HomeHero />
  <NewReleases />
  <EditorialBanner />
  <ShopByCategory />
  <ShopByActivity />
  <ShopByColour />
  <ShopTheLook />
  <BestSellers />
  <BrandPromiseStrip />
  <NewsletterSignup />
</template>
```

### Category pages

Files:

```txt
app/pages/sets/index.vue
app/pages/tops/index.vue
app/pages/outerwear/index.vue
app/pages/accessories/index.vue
```

Each category page should use:

```txt
CategoryHero
ProductFilterBar
ProductGrid
```

Create `CategoryHero.vue` under:

```txt
app/components/category/CategoryHero.vue
```

### Product page

File:

```txt
app/pages/product/[slug].vue
```

Use:

```txt
ProductImageGallery
ProductInfoPanel
ProductVariantSelector
ProductDetailsTabs
ProductCarousel
```

Page layout:

```txt
Left: image gallery
Right: product info and add to cart
Below: tabs
Below: related products
```

### Cart page

File:

```txt
app/pages/cart/index.vue
```

Use:

```txt
CartItem
CartSummary
AppButton
```

### Checkout page

File:

```txt
app/pages/checkout/index.vue
```

Use:

```txt
CheckoutContactForm
CheckoutDeliveryForm
CheckoutPaymentForm
CheckoutOrderSummary
```

## Product data model for frontend

Use this product shape.

```ts
export type Product = {
  id: string
  name: string
  slug: string
  description: string
  category: ProductCategory
  collection: string
  activity: string[]
  images: ProductImage[]
  variants: ProductVariant[]
  isNew: boolean
  isFeatured: boolean
}

export type ProductVariant = {
  id: string
  sku: string
  colour: string
  size: string
  priceKes: number
  compareAtPriceKes?: number
  stockQuantity: number
}

export type ProductImage = {
  url: string
  alt: string
  sortOrder: number
}

export type ProductCategory =
  | 'sets'
  | 'tops'
  | 'outerwear'
  | 'accessories'
```

## Product seed file

Create:

```txt
app/data/productSeed.ts
```

Seed products:

```ts
export const productSeed = [
  {
    name: 'ANAI Yoga Mat',
    slug: 'anai-yoga-mat',
    category: 'accessories',
    collection: 'Studio Essentials',
    activity: ['Yoga / Pilates'],
    catalogueNo: null
  },
  {
    name: 'Circle Ankle Weights',
    slug: 'circle-ankle-weights',
    category: 'accessories',
    collection: 'Training Essentials',
    activity: ['Training'],
    catalogueNo: null
  },
  {
    name: 'Resistance Bands',
    slug: 'resistance-bands',
    category: 'accessories',
    collection: 'Training Essentials',
    activity: ['Training'],
    catalogueNo: null
  },
  {
    name: 'Slider Magic',
    slug: 'slider-magic',
    category: 'accessories',
    collection: 'Studio Essentials',
    activity: ['Core / Pilates'],
    catalogueNo: null
  },
  {
    name: 'ANAI Training Jacket',
    slug: 'anai-training-jacket',
    category: 'outerwear',
    collection: 'Everyday Active',
    activity: ['Training', 'Travel'],
    catalogueNo: 'DWJS124106'
  },
  {
    name: 'Swirl Neck Long Sleeve Top',
    slug: 'swirl-neck-long-sleeve-top',
    category: 'tops',
    collection: 'Core Tops',
    activity: ['Everyday', 'Training'],
    catalogueNo: 'DCX8933'
  },
  {
    name: 'Round Neck Long Sleeve Top',
    slug: 'round-neck-long-sleeve-top',
    category: 'tops',
    collection: 'Core Tops',
    activity: ['Everyday', 'Training'],
    catalogueNo: 'DCX8743-8'
  },
  {
    name: 'Nuru Short Set',
    slug: 'nuru-short-set',
    category: 'sets',
    collection: 'Short Sets',
    activity: ['Training', 'Lounge'],
    catalogueNo: 'TZ3129-1-5'
  },
  {
    name: 'Mini T-Shirt',
    slug: 'mini-t-shirt',
    category: 'tops',
    collection: 'Core Tops',
    activity: ['Everyday'],
    catalogueNo: 'DDX87099'
  },
  {
    name: 'Sahara Corsage Set',
    slug: 'sahara-corsage-set',
    category: 'sets',
    collection: 'Statement Sets',
    activity: ['Studio', 'Lounge'],
    catalogueNo: 'TZ9224'
  },
  {
    name: 'Terra Court Set',
    slug: 'terra-court-set',
    category: 'sets',
    collection: 'Court Edit',
    activity: ['Tennis / Padel'],
    catalogueNo: 'TZ9305'
  },
  {
    name: 'Mia Cropped Tee',
    slug: 'mia-cropped-tee',
    category: 'tops',
    collection: 'Core Tops',
    activity: ['Everyday', 'Studio'],
    catalogueNo: 'TW410'
  },
  {
    name: 'Nia Set',
    slug: 'nia-set',
    category: 'sets',
    collection: 'Statement Sets',
    activity: ['Training', 'Studio'],
    catalogueNo: 'TZ4509-6'
  },
  {
    name: 'Jua Short Set',
    slug: 'jua-short-set',
    category: 'sets',
    collection: 'Short Sets',
    activity: ['Training', 'Warm weather'],
    catalogueNo: 'TZ4507-3'
  },
  {
    name: 'Lela Set',
    slug: 'lela-set',
    category: 'sets',
    collection: 'Statement Sets',
    activity: ['Studio', 'Everyday'],
    catalogueNo: 'TMO260-9'
  },
  {
    name: 'Mvua Flannel',
    slug: 'mvua-flannel',
    category: 'outerwear',
    collection: 'Layering Edit',
    activity: ['Lounge', 'Travel'],
    catalogueNo: 'EWT93314'
  },
  {
    name: 'ANAI Crew Socks',
    slug: 'anai-crew-socks',
    category: 'accessories',
    collection: 'Finishing Pieces',
    activity: ['Everyday', 'Training'],
    catalogueNo: null
  },
  {
    name: 'ANAI Cap',
    slug: 'anai-cap',
    category: 'accessories',
    collection: 'Finishing Pieces',
    activity: ['Outdoor', 'Everyday'],
    catalogueNo: null
  }
]
```

## Component chunking rule

No component should do too many jobs.

Keep components below 150 lines where possible.

Split when:
- A template becomes hard to scan
- One component handles layout, data, and UI logic together
- A page has more than three major sections
- A form has more than one step

## Checkout API endpoints

### create-payment.post.ts

Job:
- Validate cart
- Create pending order
- Start Paystack transaction
- Return authorization URL

### verify-payment.post.ts

Job:
- Verify Paystack reference
- Update order payment status
- Return order status

### paystack.post.ts

Job:
- Receive webhook
- Confirm signature
- Store raw payload
- Mark payment as paid when valid
- Reduce stock

## Admin area

Admin pages:

```txt
/admin
/admin/products
/admin/orders
/admin/inventory
```

Admin features:
- Add product
- Edit product
- Upload product images
- Update price
- Update stock
- View orders
- Change order status
- Export order list

## Order statuses

Use these statuses:

```txt
pending
paid
processing
ready_for_delivery
delivered
cancelled
refunded
```

## Payment statuses

Use:

```txt
unpaid
pending
paid
failed
refunded
```

## Delivery fields

Use Kenya-friendly delivery fields:

```txt
Full name
Phone number
Email address
County
Town / area
Specific address
Delivery notes
```

## Cart rules

- Cart should persist for guest users.
- Cart should sync after login.
- Cart prices should update from database.
- Out-of-stock items should show a clear warning.
- Checkout should block unavailable variants.

## Final build order for Codex

Use this order:

1. Set up Nuxt 4, TypeScript, and base CSS tokens.
2. Create layout components.
3. Add product seed data.
4. Build product card, grid, and carousel.
5. Build homepage sections.
6. Build category pages.
7. Build product detail page.
8. Build cart.
9. Build checkout UI.
10. Add Supabase database layer.
11. Add Paystack payment flow.
12. Add webhook verification.
13. Add admin pages.
14. Add SEO metadata.
15. Test mobile layout.
