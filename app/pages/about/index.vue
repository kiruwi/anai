<template>
  <section class="about-page container">
    <div class="about-page__content">
      <header class="about-page__hero">
        <h1>About ANAI</h1>
        <p>
          ANAI comes from the idea of making pieces that become staples. They are made to
          serve you while you work out, but also to become yours in the ordinary parts of
          the day.
        </p>
        <NuxtLink class="about-page__cta" to="/shop">Shop the collection</NuxtLink>
      </header>

      <div class="about-page__story">
        <article>
          <h2>Mine, in Maa</h2>
          <p>
            The name is rooted in the Maa word for mine. It carries the spirit of the
            shuka: worn throughout the day, tied at the waist, used to cover from cold and
            wind, or held close as something practical and personal.
          </p>
        </article>

        <article>
          <h2>Made to stay with you</h2>
          <p>
            A shuka can hold small essentials, cover the body from wind, and become a
            blanket when rest is needed. In that form, ANAI is not just gym wear. It is a
            staple in the wardrobe.
          </p>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.about-page {
  padding: var(--space-2xl) 0;
}

.about-page__content {
  display: grid;
  gap: var(--space-2xl);
  width: 100%;
}

.about-page__hero {
  display: grid;
  gap: var(--space-md);
  justify-items: center;
  text-align: center;
}

h1 {
  margin: 0;
  font-size: clamp(4rem, 5vw, 6.4rem);
  line-height: 0.95;
}

p {
  margin: 0;
  color: #4f4843;
  font-size: var(--copy-font-size);
  line-height: var(--copy-line-height);
}

.about-page__hero p {
  max-width: 74rem;
}

.about-page__cta {
  display: inline-flex;
  margin-top: var(--space-sm);
  padding: 1.2rem 1.8rem;
  color: var(--colour-white);
  background: var(--colour-black);
  font-size: 1.3rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.about-page__story {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-lg);
}

article {
  display: grid;
  align-content: start;
  gap: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1px solid var(--colour-border);
}

h2 {
  margin: 0;
  font-size: clamp(2.4rem, 3vw, 4rem);
  line-height: 1;
}

@media (max-width: 760px) {
  .about-page__story {
    grid-template-columns: 1fr;
  }
}
</style>
