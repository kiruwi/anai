<template>
  <section class="legal-reader container">
    <aside class="legal-reader__rail" aria-label="Legal documents" data-lenis-prevent>
      <label class="legal-reader__search">
        <input
          v-model.trim="searchQuery"
          type="search"
          aria-label="Search policies"
          placeholder="Search policies"
          autocomplete="off"
        />
      </label>

      <nav class="legal-reader__documents">
        <details
          v-for="document in filteredPolicies"
          :key="document.slug"
          :open="document.slug === policy.slug || Boolean(searchQuery)"
        >
          <summary>
            <span>{{ document.title }}</span>
          </summary>
          <div>
            <button
              v-for="(block, index) in getFilteredBlocks(document)"
              :key="`${document.slug}-${block.heading}`"
              type="button"
              :class="{
                'legal-reader__option--active':
                  document.slug === policy.slug && getBlockIndex(document, block) === activeBlockIndex,
              }"
              @click="selectBlock(document.slug, getBlockIndex(document, block))"
            >
              {{ block.heading }}
            </button>
          </div>
        </details>
      </nav>
    </aside>

    <article class="legal-reader__panel">
      <header>
        <h1>{{ activeBlock.heading }}</h1>
        <span>Last updated: {{ lastUpdated }}</span>
      </header>

      <div class="legal-reader__body">
        <p v-for="paragraph in activeBlock.paragraphs" :key="paragraph">
          {{ paragraph }}
        </p>
        <ul v-if="activeBlock.bullets?.length">
          <li v-for="bullet in activeBlock.bullets" :key="bullet">
            {{ bullet }}
          </li>
        </ul>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import {
  getLegalPolicy,
  lastUpdated,
  legalPolicies,
  type LegalContentBlock,
  type LegalPolicy,
} from '../../data/legalContent'

const route = useRoute()
const router = useRouter()

const routeSlug = computed(() => (typeof route.params.slug === 'string' ? route.params.slug : ''))
const policy = computed<LegalPolicy>(() => {
  const currentPolicy = getLegalPolicy(routeSlug.value)

  if (!currentPolicy) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Legal page not found',
    })
  }

  return currentPolicy
})

const searchQuery = ref('')
const activeBlockIndex = ref(0)

const getInitialBlockIndex = () => {
  const section = Number(route.query.section)

  if (Number.isInteger(section) && section > 0 && section <= policy.value.blocks.length) {
    return section - 1
  }

  return 0
}

activeBlockIndex.value = getInitialBlockIndex()

const normaliseSearchValue = (value: string) => value.toLowerCase().trim()

const blockMatchesSearch = (document: LegalPolicy, block: LegalContentBlock) => {
  const query = normaliseSearchValue(searchQuery.value)

  if (!query) {
    return true
  }

  return [
    document.title,
    document.subtitle,
    block.heading,
    ...(block.paragraphs ?? []),
    ...(block.bullets ?? []),
  ]
    .join(' ')
    .toLowerCase()
    .includes(query)
}

const getFilteredBlocks = (document: LegalPolicy) =>
  document.blocks.filter((block) => blockMatchesSearch(document, block))

const filteredPolicies = computed(() =>
  legalPolicies.filter((document) => getFilteredBlocks(document).length > 0),
)

const activeBlock = computed<LegalContentBlock>(() => {
  const fallbackBlock = policy.value.blocks[0]

  if (!fallbackBlock) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Legal page has no sections',
    })
  }

  return policy.value.blocks[activeBlockIndex.value] ?? fallbackBlock
})

const getBlockIndex = (document: LegalPolicy, block: LegalContentBlock) =>
  document.blocks.findIndex((item) => item.heading === block.heading)

const selectBlock = async (documentSlug: string, blockIndex: number) => {
  if (documentSlug === policy.value.slug) {
    activeBlockIndex.value = blockIndex
    await router.replace({
      path: `/legal/${documentSlug}`,
      query: blockIndex > 0 ? { section: String(blockIndex + 1) } : {},
    })
    return
  }

  await router.push({
    path: `/legal/${documentSlug}`,
    query: blockIndex > 0 ? { section: String(blockIndex + 1) } : {},
  })
}

watch(
  () => [route.params.slug, route.query.section],
  () => {
    activeBlockIndex.value = getInitialBlockIndex()
  },
)

useSeoMeta({
  title: () => policy.value.metaTitle,
  description: () => policy.value.metaDescription,
})
</script>

<style scoped>
.legal-reader {
  display: grid;
  grid-template-columns: minmax(24rem, 34rem) minmax(0, 1fr);
  gap: var(--space-xl);
  padding: 0 0 var(--space-2xl);
}

.legal-reader__rail {
  position: sticky;
  top: 7.2rem;
  display: grid;
  grid-template-rows: auto auto;
  align-content: start;
  align-self: start;
  height: calc(100dvh - 7.2rem);
  max-height: calc(100vh - 7.2rem);
  gap: var(--space-lg);
  overflow: auto;
  border-right: 1px solid var(--colour-border);
  padding-right: var(--space-lg);
}

.legal-reader__search {
  display: grid;
  gap: var(--space-xs);
}

.legal-reader__search input {
  width: 100%;
  border: 1px solid var(--colour-border);
  border-radius: 0;
  padding: 1rem;
  color: var(--colour-black);
  background: var(--colour-surface);
}

.legal-reader__documents {
  display: grid;
  gap: var(--space-sm);
}

details {
  border-top: 1px solid var(--colour-border);
  padding-top: var(--space-sm);
}

summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  cursor: pointer;
  font-size: 1.3rem;
  letter-spacing: 0.06em;
  list-style: none;
  text-transform: uppercase;
}

summary::-webkit-details-marker {
  display: none;
}

summary::after {
  content: '+';
  color: var(--colour-muted);
}

details[open] summary::after {
  content: '-';
}

details > div {
  display: grid;
  gap: var(--space-xs);
  padding-top: var(--space-sm);
}

button {
  border: 0;
  padding: 0.7rem 0;
  color: var(--colour-muted);
  background: transparent;
  cursor: pointer;
  font: inherit;
  line-height: 1.25;
  text-align: start;
}

button:hover,
.legal-reader__option--active {
  color: var(--colour-black);
}

.legal-reader__option--active {
  font-weight: 600;
}

.legal-reader__panel {
  min-width: 0;
}

.legal-reader__panel header {
  display: grid;
  gap: var(--space-sm);
  margin-bottom: var(--space-xl);
}

.legal-reader__panel header span,
.legal-reader__body p,
.legal-reader__body li {
  color: var(--colour-muted);
}

.legal-reader__panel header h1,
.legal-reader__body p,
.legal-reader__body ul {
  margin: 0;
}

.legal-reader__panel header span {
  font-size: 1.2rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: clamp(3.2rem, 4.5vw, 5.6rem);
  line-height: 1;
  text-align: start;
}

.legal-reader__body {
  display: grid;
  max-width: 78rem;
  gap: var(--space-md);
  border-top: 1px solid var(--colour-border);
  padding-top: var(--space-lg);
}

.legal-reader__body p,
.legal-reader__body li {
  font-size: var(--copy-font-size);
  line-height: var(--copy-line-height);
}

.legal-reader__body ul {
  display: grid;
  gap: var(--space-xs);
  padding-left: 1.8rem;
}

@media (max-width: 860px) {
  .legal-reader {
    grid-template-columns: 1fr;
    padding-top: 0;
  }

  .legal-reader__rail {
    position: static;
    height: auto;
    max-height: none;
    border-right: 0;
    border-bottom: 1px solid var(--colour-border);
    padding-right: 0;
    padding-bottom: var(--space-lg);
  }
}
</style>
