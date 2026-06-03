<template>
  <section class="cart-page container">
    <div class="cart-page__header">
      <p>Cart</p>
      <h1>Your bag</h1>
    </div>

    <div v-if="lines.length" class="cart-page__layout">
      <div class="cart-page__items">
        <article v-for="line in lines" :key="line.slug" class="cart-line">
          <NuxtLink class="cart-line__image" :to="`/product/${line.product.slug}`">
            <img
              :src="line.product.imageUrl"
              :alt="line.product.name"
              width="120"
              height="150"
              loading="lazy"
              decoding="async"
            />
          </NuxtLink>

          <div class="cart-line__details">
            <NuxtLink :to="`/product/${line.product.slug}`">
              <h2>{{ line.product.name }}</h2>
            </NuxtLink>
            <p>{{ line.product.category }}</p>
            <div v-if="line.product.sizeOptions?.length" class="cart-line__sizes">
              <p>Size</p>
              <div>
                <button
                  v-for="sizeOption in line.product.sizeOptions"
                  :key="sizeOption.label"
                  class="cart-line__size"
                  :class="{ 'cart-line__size--selected': line.size === sizeOption.label }"
                  type="button"
                  :aria-label="`Choose ${sizeOption.label} for ${line.product.name}`"
                  :aria-pressed="line.size === sizeOption.label"
                  :title="getSizeTitle(sizeOption)"
                  @click="updateSize(line.slug, sizeOption.label)"
                >
                  {{ sizeOption.label }}
                </button>
              </div>
            </div>
            <strong>KES {{ line.product.priceKes.toLocaleString() }}</strong>
          </div>

          <div class="cart-line__actions">
            <div class="cart-line__quantity" :aria-label="`${line.product.name} quantity`">
              <button
                type="button"
                :aria-label="`Decrease ${line.product.name} quantity`"
                @click="updateQuantity(line.slug, line.quantity - 1)"
              >
                -
              </button>
              <span>{{ line.quantity }}</span>
              <button
                type="button"
                :aria-label="`Increase ${line.product.name} quantity`"
                @click="updateQuantity(line.slug, line.quantity + 1)"
              >
                +
              </button>
            </div>
            <button class="cart-line__remove" type="button" @click="removeFromCart(line.slug)">
              Remove
            </button>
          </div>

          <strong class="cart-line__total">KES {{ line.lineTotalKes.toLocaleString() }}</strong>
        </article>
      </div>

      <aside class="cart-summary" aria-label="Order summary">
        <h2>Summary</h2>
        <dl>
          <div>
            <dt>Subtotal</dt>
            <dd>KES {{ subtotalKes.toLocaleString() }}</dd>
          </div>
          <div>
            <dt>Delivery</dt>
            <dd>Calculated at checkout</dd>
          </div>
        </dl>
        <NuxtLink v-if="canCheckout" class="cart-summary__checkout" to="/checkout">
          Checkout
        </NuxtLink>
        <button v-else class="cart-summary__checkout" type="button" disabled>
          Select sizes
        </button>
      </aside>
    </div>

    <div v-else class="cart-page__empty">
      <p>Your bag is empty.</p>
      <NuxtLink to="/shop">Continue shopping</NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ProductSizeOption } from '../../data/homeContent'

const { lines, subtotalKes, updateQuantity, updateSize, removeFromCart } = useCart()

const canCheckout = computed(() =>
  lines.value.every((line) => !line.product.sizeOptions?.length || Boolean(line.size)),
)

const getSizeTitle = (sizeOption: ProductSizeOption) => {
  const measurements = [
    sizeOption.coatLengthCm ? `coat ${sizeOption.coatLengthCm}cm` : undefined,
    sizeOption.shoulderCm ? `shoulder ${sizeOption.shoulderCm}cm` : undefined,
    sizeOption.sleeveLengthCm ? `sleeve ${sizeOption.sleeveLengthCm}cm` : undefined,
    sizeOption.bustCm ? `bust ${sizeOption.bustCm}cm` : undefined,
    sizeOption.bottomCm ? `bottom ${sizeOption.bottomCm}cm` : undefined,
  ].filter(Boolean)

  return measurements.length
    ? `${sizeOption.label}: ${measurements.join(', ')}`
    : sizeOption.label
}
</script>

<style scoped>
.cart-page {
  padding: var(--space-2xl) 0;
}

.cart-page__header {
  display: grid;
  gap: var(--space-sm);
  margin-bottom: var(--space-xl);
}

.cart-page__header p,
.cart-page__empty p {
  margin: 0;
  color: var(--colour-muted);
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: clamp(5.2rem, 8vw, 10rem);
  line-height: 0.92;
  text-align: start;
}

.cart-page__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(28rem, 36rem);
  gap: var(--space-xl);
  align-items: start;
}

.cart-page__items {
  display: grid;
  gap: var(--space-md);
}

.cart-line {
  display: grid;
  grid-template-columns: 12rem minmax(0, 1fr) auto auto;
  gap: var(--space-md);
  align-items: center;
  border-top: 1px solid var(--colour-border);
  padding-top: var(--space-md);
}

.cart-line__image {
  display: block;
  aspect-ratio: 4 / 5;
  overflow: hidden;
}

.cart-line__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cart-line__details {
  min-width: 0;
}

.cart-line__details h2,
.cart-summary h2 {
  margin: 0;
  font-size: 1.8rem;
}

.cart-line__details p {
  margin: var(--space-xs) 0;
  color: var(--colour-muted);
  font-size: 1.2rem;
  text-transform: uppercase;
}

.cart-line__sizes {
  display: grid;
  gap: var(--space-xs);
  margin: var(--space-sm) 0;
}

.cart-line__sizes p {
  margin: 0;
}

.cart-line__sizes > div {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.cart-line__size {
  min-width: 4.8rem;
  border: 1px solid var(--colour-border);
  padding: var(--space-xs) var(--space-sm);
  color: var(--colour-black);
  background: var(--colour-surface);
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
}

.cart-line__size--selected {
  border-color: var(--colour-black);
  color: var(--colour-white);
  background: var(--colour-black);
}

.cart-line__details strong,
.cart-line__total {
  font-weight: 600;
}

.cart-line__actions {
  display: grid;
  justify-items: end;
  gap: var(--space-sm);
}

.cart-line__quantity {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--colour-border);
}

.cart-line__quantity button,
.cart-line__quantity span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 3.6rem;
  height: 3.6rem;
}

.cart-line__quantity button {
  border: 0;
  background: transparent;
  cursor: pointer;
}

.cart-line__remove {
  border: 0;
  padding: 0;
  color: var(--colour-muted);
  background: transparent;
  cursor: pointer;
  font-size: 1.2rem;
  text-transform: uppercase;
}

.cart-summary {
  position: sticky;
  top: 9.6rem;
  display: grid;
  gap: var(--space-md);
  border: 1px solid var(--colour-border);
  padding: var(--space-md);
}

.cart-summary dl {
  display: grid;
  gap: var(--space-sm);
  margin: 0;
}

.cart-summary div {
  display: flex;
  justify-content: space-between;
  gap: var(--space-md);
}

.cart-summary dt {
  color: var(--colour-muted);
}

.cart-summary dd {
  margin: 0;
  text-align: end;
}

.cart-summary__checkout,
.cart-page__empty a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--colour-black);
  padding: 1.2rem 1.6rem;
  text-transform: uppercase;
}

.cart-summary__checkout {
  color: var(--colour-white);
  background: var(--colour-black);
}

.cart-summary__checkout:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.cart-page__empty {
  display: grid;
  justify-items: start;
  gap: var(--space-md);
}

@media (max-width: 840px) {
  .cart-page__layout {
    grid-template-columns: 1fr;
  }

  .cart-line {
    grid-template-columns: 9.6rem minmax(0, 1fr);
  }

  .cart-line__actions {
    grid-column: 2;
    justify-items: start;
  }

  .cart-line__total {
    grid-column: 2;
  }

  .cart-summary {
    position: static;
  }
}
</style>
