<template>
  <footer class="site-footer">
    <div class="site-footer__inner container">
      <div>
        <NuxtLink class="site-footer__brand" to="/">ANAI</NuxtLink>
        <p>Athleisure pieces for training, errands, and everyday comfort.</p>
      </div>
      <nav aria-label="Footer navigation">
        <section>
          <h2>Shop</h2>
          <ul>
            <li><NuxtLink to="/">All products</NuxtLink></li>
            <li><NuxtLink to="/new-in">New in</NuxtLink></li>
            <li><NuxtLink to="/sets">Sets</NuxtLink></li>
            <li><NuxtLink to="/tops">Tops</NuxtLink></li>
            <li><NuxtLink to="/outerwear">Outerwear</NuxtLink></li>
            <li><NuxtLink to="/accessories">Accessories</NuxtLink></li>
          </ul>
        </section>
        <section>
          <h2>Explore</h2>
          <ul>
            <li><NuxtLink to="/lookbook">Lookbook</NuxtLink></li>
            <li><NuxtLink to="/shop-the-look">Shop the look</NuxtLink></li>
            <li><NuxtLink to="/about">About</NuxtLink></li>
            <li><NuxtLink to="/wishlist">Wishlist</NuxtLink></li>
          </ul>
        </section>
        <section>
          <h2>Support</h2>
          <ul>
            <li><NuxtLink to="/delivery-returns">Delivery & returns</NuxtLink></li>
            <li><NuxtLink to="/size-guide">Size guide</NuxtLink></li>
            <li><NuxtLink to="/contact">Contact</NuxtLink></li>
            <li><NuxtLink to="/account">Account</NuxtLink></li>
          </ul>
        </section>
      </nav>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  color: var(--colour-clay);
  background: var(--colour-plum);
}

.site-footer__inner {
  display: grid;
  grid-template-columns: minmax(24rem, 1fr) minmax(0, 2fr);
  gap: var(--space-xl);
  padding: var(--space-2xl) 0;
}

.site-footer__brand {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.site-footer p {
  max-width: 34rem;
  margin: var(--space-sm) 0 0;
  color: var(--colour-clay);
}

nav {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-xl);
}

nav section {
  min-width: 0;
}

h2 {
  margin: 0 0 var(--space-md);
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
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
}

nav a {
  color: var(--colour-clay);
}

nav a:hover {
  color: var(--colour-cream);
}

@media (max-width: 760px) {
  .site-footer__inner,
  nav {
    grid-template-columns: 1fr;
  }

  nav {
    gap: var(--space-lg);
  }
}
</style>
