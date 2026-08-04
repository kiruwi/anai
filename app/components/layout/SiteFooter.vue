<template>
  <footer class="site-footer">
    <div class="site-footer__inner container">
      <div class="site-footer__intro">
        <NuxtLink class="site-footer__brand" to="/" aria-label="ANAI home">
          <svg viewBox="0 0 340.64 92.85" role="img" aria-label="ANAI">
            <path d="M51.85,90.77l.21-1.57h3.23c2.02,0,3.34-.63,3.96-1.88.63-1.25.45-2.89-.52-4.9-1.25-2.64-2.54-5.32-3.86-8.03-1.32-2.71-2.61-5.39-3.86-8.03h-30.15l-6.05,14.5c-1.04,2.5-1.13,4.52-.26,6.05.87,1.53,2.56,2.29,5.06,2.29h2.5v1.57H0v-1.57h1.25c2.02,0,3.88-.63,5.58-1.88,1.7-1.25,3.01-2.89,3.91-4.9,4.45-10.36,8.88-20.71,13.3-31.03,4.42-10.33,8.85-20.67,13.3-31.03h2.61l30.36,62.8c2.23,4.03,5.53,6.05,9.91,6.05v1.57h-28.37ZM49.76,63.75l-15.02-30.88-12.83,30.88h27.85Z" />
            <path d="M106.28,23.48v-1.56h17.11l48.3,54.45V30.26c0-2.02-.61-3.65-1.83-4.9-1.22-1.25-2.83-1.88-4.85-1.88h-1.15v-1.56h18.78v1.56h-1.15c-2.02,0-3.63.63-4.85,1.88-1.22,1.25-1.83,2.89-1.83,4.9v62.59h-2.4c-9.25-10.43-18.45-20.81-27.59-31.14-9.15-10.33-18.34-20.71-27.59-31.14v51.85c0,2.02.61,3.65,1.83,4.9,1.22,1.25,2.83,1.88,4.85,1.88h1.15v1.57h-18.78v-1.57h1.15c2.02,0,3.63-.63,4.85-1.88,1.22-1.25,1.83-2.89,1.83-4.9V30.26c0-2.02-.61-3.65-1.83-4.9-1.22-1.25-2.83-1.88-4.85-1.88h-1.15Z" />
            <path d="M260.13,90.77l.21-1.57h3.23c2.02,0,3.34-.63,3.96-1.88.63-1.25.45-2.89-.52-4.9-1.25-2.64-2.54-5.32-3.86-8.03-1.32-2.71-2.61-5.39-3.86-8.03h-30.15l-6.05,14.5c-1.04,2.5-1.13,4.52-.26,6.05.87,1.53,2.56,2.29,5.06,2.29h2.5v1.57h-22.12v-1.57h1.25c2.02,0,3.88-.63,5.58-1.88,1.7-1.25,3.01-2.89,3.91-4.9,4.45-10.36,8.88-20.71,13.3-31.03,4.42-10.33,8.85-20.67,13.3-31.03h2.61l30.36,62.8c2.22,4.03,5.53,6.05,9.91,6.05v1.57h-28.38ZM258.04,63.75l-15.02-30.88-12.83,30.88h27.85Z" />
            <path d="M340.64,89.2v1.57h-26.08v-1.57h1.15c2.02,0,3.63-.63,4.85-1.88,1.22-1.25,1.83-2.89,1.83-4.9V30.26c0-2.02-.61-3.65-1.83-4.9-1.22-1.25-2.83-1.88-4.85-1.88h-1.15v-1.56h26.08v1.56h-1.15c-2.02,0-3.63.63-4.85,1.88-1.22,1.25-1.83,2.89-1.83,4.9v52.16c0,2.02.61,3.65,1.83,4.9,1.22,1.25,2.83,1.88,4.85,1.88h1.15Z" />
            <path d="M182.45,2.06c.66.64-3.74,5.72-4.53,6.46-16.2,15.08-36.43-10.39-51.12,1.21-1.02.81-.86,2.2-1.98,2.18.41-4.05,5.76-9.27,9.32-10.76,12.12-5.07,27.54,8.51,41.34,4.94,3.3-.85,4.08-3.2,6.96-4.03Z" />
          </svg>
        </NuxtLink>
        <p>Athleisure pieces for training, errands, and everyday comfort.</p>
        <a
          class="site-footer__instagram"
          href="https://www.instagram.com/anai.nairobi_/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Follow ANAI on Instagram at @anai.nairobi_"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4.25" />
            <circle class="site-footer__instagram-dot" cx="17.4" cy="6.6" r="1" />
          </svg>
        </a>
      </div>
      <nav aria-label="Footer navigation">
        <section>
          <h2>Shop</h2>
          <ul>
            <li><NuxtLink to="/shop">All products</NuxtLink></li>
            <li><NuxtLink to="/shop/new-in">New in</NuxtLink></li>
            <li><NuxtLink to="/shop/sets">Sets</NuxtLink></li>
            <li><NuxtLink to="/shop/tops">Tops</NuxtLink></li>
            <li><NuxtLink to="/shop/bottoms">Bottoms</NuxtLink></li>
            <li><NuxtLink to="/shop/outerwear">Outerwear</NuxtLink></li>
          </ul>
        </section>
        <section>
          <h2>Explore</h2>
          <ul>
            <!-- TODO: Restore these links when the editorial pages are complete.
            <li><NuxtLink to="/lookbook">Lookbook</NuxtLink></li>
            <li><NuxtLink to="/shop-the-look">Shop the look</NuxtLink></li>
            -->
            <li><NuxtLink to="/about">About</NuxtLink></li>
            <li><NuxtLink to="/wishlist">Wishlist</NuxtLink></li>
          </ul>
        </section>
        <section>
          <h2>Support</h2>
          <ul>
            <li><NuxtLink to="/size-guide">Size guide</NuxtLink></li>
            <li><NuxtLink to="/contact">Contact</NuxtLink></li>
            <li><NuxtLink to="/legal/delivery-policy">Shipping and returns</NuxtLink></li>
            <li><button class="site-footer__cookie-settings" type="button" @click="openCookieSettings">Cookie settings</button></li>
            <li><NuxtLink to="/legal">Policies</NuxtLink></li>
          </ul>
        </section>
        <section class="site-footer__contact">
          <h2>Contact</h2>
          <ul>
            <li><a href="mailto:info@anaibymurda.com">info@anaibymurda.com</a></li>
            <li><a href="mailto:sales@anaibymurda.com">sales@anaibymurda.com</a></li>
            <li><a href="mailto:support@anaibymurda.com">support@anaibymurda.com</a></li>
          </ul>
        </section>
      </nav>
      <p class="site-footer__copyright">&copy; 2026 Anai. All rights reserved.</p>
    </div>
  </footer>
</template>

<script setup lang="ts">
const cookieSettingsRequested = useState('anai-cookie-settings-requested', () => false)

const openCookieSettings = () => {
  cookieSettingsRequested.value = true
  window.dispatchEvent(new CustomEvent('anai:open-cookie-settings'))
}
</script>

<style scoped>
.site-footer {
  --site-footer-accent: #d6c1a9;

  color: var(--colour-white);
  background: var(--colour-black);
}

.site-footer__inner {
  display: grid;
  grid-template-columns: minmax(24rem, 1fr) minmax(0, 3fr);
  gap: var(--space-xl);
  padding: var(--space-2xl) 0;
}

.site-footer__brand {
  display: block;
  width: clamp(14rem, 15vw, 20rem);
  color: var(--site-footer-accent);
}

.site-footer__brand svg {
  display: block;
  width: 100%;
  height: auto;
  fill: currentColor;
}

.site-footer p {
  max-width: 34rem;
  margin: var(--space-sm) 0 0;
  color: var(--colour-white);
  font-size: var(--copy-font-size);
  line-height: var(--copy-line-height);
}

.site-footer__instagram {
  display: inline-flex;
  width: 2.8rem;
  height: 2.8rem;
  margin-top: var(--space-md);
  color: var(--colour-white);
  transition: color 180ms ease, transform 180ms ease;
}

.site-footer__instagram:hover {
  color: rgba(255, 255, 255, 0.68);
  transform: translateY(-0.2rem);
}

.site-footer__instagram:focus-visible {
  outline: 0.2rem solid currentColor;
  outline-offset: 0.4rem;
}

.site-footer__instagram svg {
  width: 100%;
  height: 100%;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.6;
}

.site-footer__instagram-dot {
  fill: currentColor;
  stroke: none;
}

nav {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: clamp(var(--space-md), 2.5vw, var(--space-xl));
}

nav section {
  min-width: 0;
}

h2 {
  margin: 0 0 var(--space-md);
  color: var(--site-footer-accent);
  font-size: clamp(1.6rem, 1.15vw, 1.9rem);
  font-weight: 400;
  letter-spacing: 0.08em;
}

ul {
  display: grid;
  gap: var(--space-sm);
  margin: 0;
  padding: 0;
  list-style: none;
}

li {
  margin: 0;
  font-size: clamp(1.6rem, 1.1vw, 1.8rem);
}

nav a {
  color: var(--colour-white);
  overflow-wrap: anywhere;
}

.site-footer__contact a {
  white-space: nowrap;
}

.site-footer__cookie-settings {
  border: 0;
  padding: 0;
  color: var(--colour-white);
  background: transparent;
  cursor: pointer;
  font: inherit;
  text-align: left;
}

nav a:hover,
.site-footer__cookie-settings:hover {
  color: rgba(255, 255, 255, 0.68);
}

.site-footer__copyright {
  grid-column: 1 / -1;
  max-width: none;
  margin: 0;
  color: rgba(255, 255, 255, 0.68);
  font-size: var(--copy-font-size);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

@media (max-width: 980px) {
  .site-footer__inner {
    grid-template-columns: 1fr;
  }

  .site-footer__copyright {
    text-align: center;
  }
}

@media (max-width: 760px) {
  .site-footer__intro {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .site-footer__contact a {
    font-size: clamp(1.1rem, 3.35vw, 1.35rem);
    letter-spacing: -0.01em;
    white-space: nowrap;
  }

  nav {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-lg);
  }
}
</style>
