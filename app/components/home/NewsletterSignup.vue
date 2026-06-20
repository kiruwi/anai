<template>
  <section class="newsletter">
    <div class="newsletter__inner container">
      <div>
        <h2>Get first access to drops, restocks, and offers.</h2>
      </div>
      <form>
        <label for="newsletter-email">Email address</label>
        <div>
          <input id="newsletter-email" type="email" placeholder="you@example.com" />
          <button type="submit">Sign up</button>
        </div>
      </form>
    </div>
  </section>
</template>

<style scoped>
.newsletter {
  padding: var(--space-2xl) 0;
  color: var(--colour-olive);
  background: var(--colour-cream);
}

.newsletter__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(32rem, 48rem);
  gap: var(--space-xl);
  align-items: end;
}

p,
h2 {
  margin: 0;
}

p {
  font-size: var(--copy-font-size);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h2 {
  max-width: 74rem;
  margin-top: var(--space-sm);
  font-family: var(--font-brand-display);
  font-weight: 400;
  font-size: clamp(3.2rem, 5vw, 6.4rem);
  letter-spacing: 0.055em;
  line-height: 0.98;
  text-transform: uppercase;
}

label {
  display: block;
  margin-bottom: var(--space-sm);
  font-size: 1.3rem;
  text-transform: uppercase;
}

form div {
  display: flex;
  gap: var(--space-sm);
}

input {
  min-width: 0;
  flex: 1;
  border: 1px solid var(--colour-black);
  border-radius: var(--radius-sm);
  padding: 1.2rem;
  background: var(--colour-surface);
}

button {
  border: 1px solid var(--colour-black);
  border-radius: var(--radius-sm);
  padding: 1.2rem 1.6rem;
  color: var(--colour-white);
  background: var(--colour-black);
  cursor: pointer;
  text-transform: uppercase;
}

@media (max-width: 760px) {
  .newsletter__inner {
    grid-template-columns: 1fr;
  }

  form div {
    flex-direction: column;
  }
}
</style>
