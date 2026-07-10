<template>
  <section class="cart-page container">
    <div class="cart-page__header">
      <h1>Your bag</h1>
    </div>

    <div v-if="lines.length" class="cart-page__layout">
      <div class="cart-page__items">
        <article v-for="line in lines" :key="line.key" class="cart-line">
          <NuxtLink class="cart-line__image" :to="`/product/${line.product.slug}`">
            <img
              v-if="line.product.imageUrl"
              :src="line.product.imageUrl"
              :alt="line.product.name"
              width="120"
              height="150"
              loading="lazy"
              decoding="async"
            />
            <span v-else>Coming soon</span>
          </NuxtLink>

          <div class="cart-line__details">
            <NuxtLink :to="`/product/${line.product.slug}`">
              <h2>{{ line.product.name }}</h2>
            </NuxtLink>
            <p>{{ line.product.category }}</p>
            <div v-if="line.product.colours.length" class="cart-line__colours">
              <p>Colour</p>
              <div>
                <button
                  v-for="colour in line.product.colours"
                  :key="getProductColourName(colour)"
                  class="cart-line__colour"
                  :class="{
                    'cart-line__colour--selected': line.colour === getProductColourName(colour),
                  }"
                  type="button"
                  :aria-label="`Choose ${getProductColourName(colour)} for ${line.product.name}`"
                  :aria-pressed="line.colour === getProductColourName(colour)"
                  :title="getProductColourName(colour)"
                  :style="{ background: getProductColourValue(colour) }"
                  @click="updateColour(line.key, getProductColourName(colour))"
                />
              </div>
            </div>
            <div v-if="line.product.sizeOptions?.length" class="cart-line__sizes">
              <p>Size</p>
              <div>
                <button
                  v-for="sizeOption in line.product.sizeOptions"
                  :key="sizeOption.label"
                  class="cart-line__size"
                  :class="{
                    'cart-line__size--selected': line.size === sizeOption.label,
                    'cart-line__size--unavailable': !isSizeOptionInStock(sizeOption),
                  }"
                  type="button"
                  :aria-label="`Choose ${sizeOption.label} for ${line.product.name}`"
                  :aria-pressed="line.size === sizeOption.label"
                  :aria-disabled="!isSizeOptionInStock(sizeOption)"
                  :title="getSizeTitle(sizeOption)"
                  @click="updateSize(line.key, sizeOption.label)"
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
                @click="updateQuantity(line.key, line.quantity - 1)"
              >
                -
              </button>
              <span>{{ line.quantity }}</span>
              <button
                type="button"
                :aria-label="`Increase ${line.product.name} quantity`"
                :disabled="line.quantity >= line.product.stockQuantity"
                @click="updateQuantity(line.key, line.quantity + 1)"
              >
                +
              </button>
            </div>
            <button class="cart-line__remove" type="button" @click="removeFromCart(line.key)">
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
          {{ checkoutBlockedLabel }}
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
import {
  getProductColourName,
  getProductColourValue,
  isSizeLabelInStock,
  isSizeOptionInStock,
  type ProductSizeOption,
} from '../../data/homeContent'

const {
  lines,
  subtotalKes,
  updateQuantity,
  updateSize,
  updateColour,
  removeFromCart,
} = useCart()

const hasMissingSizes = computed(() =>
  lines.value.some((line) => line.product.sizeOptions?.length && !line.size),
)
const hasUnavailableSizes = computed(() =>
  lines.value.some((line) => line.size && !isSizeLabelInStock(line.size)),
)
const canCheckout = computed(() => !hasMissingSizes.value && !hasUnavailableSizes.value)
const checkoutBlockedLabel = computed(() =>
  hasUnavailableSizes.value ? 'Not in stock' : 'Select sizes',
)

const getSizeTitle = (sizeOption: ProductSizeOption) => {
  const measurements = [
    sizeOption.coatLengthCm ? `coat ${sizeOption.coatLengthCm}cm` : undefined,
    sizeOption.shoulderCm ? `shoulder ${sizeOption.shoulderCm}cm` : undefined,
    sizeOption.sleeveLengthCm ? `sleeve ${sizeOption.sleeveLengthCm}cm` : undefined,
    sizeOption.bustCm ? `bust ${sizeOption.bustCm}cm` : undefined,
    sizeOption.bottomCm ? `bottom ${sizeOption.bottomCm}cm` : undefined,
  ].filter(Boolean)

  const sizeDetails = measurements.length
    ? `${sizeOption.label}: ${measurements.join(', ')}`
    : sizeOption.label

  return isSizeOptionInStock(sizeOption)
    ? sizeDetails
    : `${sizeDetails} - not in stock`
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

.cart-line__image img,
.cart-line__image span {
  display: block;
  width: 100%;
  height: 100%;
}

.cart-line__image img {
  object-fit: cover;
}

.cart-line__image span {
  display: grid;
  place-items: center;
  background: var(--colour-border);
  color: var(--colour-muted);
  font-size: 1rem;
  letter-spacing: 0.08em;
  text-align: center;
  text-transform: uppercase;
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
  font-size: var(--copy-font-size);
  text-transform: uppercase;
}

.cart-line__colours,
.cart-line__sizes {
  display: grid;
  gap: var(--space-xs);
  margin: var(--space-sm) 0;
}

.cart-line__colours p,
.cart-line__sizes p {
  margin: 0;
}

.cart-line__colours > div,
.cart-line__sizes > div {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.cart-line__colour {
  width: 2.8rem;
  height: 2.8rem;
  border: 1px solid var(--colour-border);
  border-radius: 50%;
  padding: 0;
  cursor: pointer;
}

.cart-line__colour--selected {
  outline: 1px solid var(--colour-black);
  outline-offset: 0.2rem;
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

.cart-line__size--unavailable {
  border-color: var(--colour-border);
  color: var(--colour-muted);
  background: #f2eeee;
  opacity: 0.56;
}

.cart-line__size--unavailable.cart-line__size--selected {
  border-color: var(--colour-muted);
  color: var(--colour-muted);
  background: #f2eeee;
  outline: 1px solid var(--colour-muted);
  outline-offset: 0.2rem;
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

.cart-line__quantity button:disabled {
  color: var(--colour-muted);
  cursor: not-allowed;
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
