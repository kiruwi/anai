<template>
  <section class="coming-soon">
    <picture class="coming-soon__media" aria-hidden="true">
      <source media="(max-width: 680px)" srcset="/images/hero/run-poster-mobile.webp" />
      <img src="/images/hero/run-poster.webp" alt="" />
    </picture>

    <div class="coming-soon__shade" aria-hidden="true" />

    <div class="coming-soon__content container">
      <img class="coming-soon__logo" src="/images/hero/anai.svg" alt="ANAI" />
      <div>
        <h1>ANAI is getting ready.</h1>
      </div>
      <p class="coming-soon__copy">
        Activewear and athleisure pieces are being finished for the first drop.
      </p>
      <a href="https://www.instagram.com/anaibymurda/" target="_blank" rel="noreferrer">
        @anaibymurda
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'ANAI | Coming Soon',
  description: 'ANAI activewear and athleisure is launching soon.',
})
</script>

<style scoped>
.coming-soon {
  position: relative;
  display: grid;
  min-height: 100svh;
  overflow: hidden;
  color: var(--colour-white);
  background: var(--colour-black);
}

.coming-soon__media,
.coming-soon__shade {
  position: absolute;
  inset: 0;
}

.coming-soon__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.coming-soon__shade {
  background:
    linear-gradient(90deg, rgba(0, 0, 0, 0.78), rgba(0, 0, 0, 0.22) 58%, rgba(0, 0, 0, 0.58)),
    linear-gradient(0deg, rgba(0, 0, 0, 0.42), rgba(0, 0, 0, 0.08));
}

.coming-soon__content {
  position: relative;
  z-index: 1;
  display: grid;
  align-content: space-between;
  gap: var(--space-xl);
  min-height: 100svh;
  padding-top: var(--space-xl);
  padding-bottom: var(--space-xl);
}

.coming-soon__logo {
  width: clamp(11rem, 12vw, 18rem);
  filter: invert(1);
}

p,
h1 {
  margin: 0;
}

.coming-soon__content > div {
  align-self: end;
  max-width: 78rem;
}

h1 {
  max-width: 11ch;
  font-family: var(--font-brand-display);
  font-size: clamp(5.8rem, 11vw, 13.6rem);
  font-weight: 400;
  letter-spacing: 0.055em;
  line-height: 0.9;
  text-align: left;
  text-transform: uppercase;
}

.coming-soon__copy {
  max-width: 48rem;
  align-self: end;
  font-size: clamp(1.6rem, 2vw, 2.2rem);
  line-height: 1.35;
}

a {
  width: fit-content;
  border-bottom: 1px solid currentColor;
  font-size: 1.4rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

@media (max-width: 680px) {
  .coming-soon__shade {
    background:
      linear-gradient(0deg, rgba(0, 0, 0, 0.82), rgba(0, 0, 0, 0.24) 55%, rgba(0, 0, 0, 0.68)),
      linear-gradient(90deg, rgba(0, 0, 0, 0.34), rgba(0, 0, 0, 0.14));
  }

  .coming-soon__content {
    gap: var(--space-lg);
    padding-top: var(--space-lg);
    padding-bottom: var(--space-lg);
  }

  h1 {
    font-size: clamp(5.2rem, 18vw, 8.4rem);
  }
}
</style>
