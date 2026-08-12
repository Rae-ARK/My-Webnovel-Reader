<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { appContainer } from '../container'

const route = useRoute()
const router = useRouter()

const query = ref(
  typeof route.query.q === 'string' ? route.query.q : '',
)

const results = ref(
  query.value.trim()
    ? appContainer.searchService.search(query.value)
    : [],
)

const hasSearched = ref(Boolean(query.value.trim()))

const resultCountLabel = computed(() => {
  if (!hasSearched.value) return ''
  return `${results.value.length} result${results.value.length === 1 ? '' : 's'}`
})

function search() {
  const normalized = query.value.trim().replace(/\s+/g, ' ')
  query.value = normalized

  if (!normalized) {
    results.value = []
    hasSearched.value = false
    router.replace({ path: '/search' })
    return
  }

  results.value = appContainer.searchService.search(normalized)
  hasSearched.value = true

  router.replace({
    path: '/search',
    query: { q: normalized },
  })
}

function openResult(
  fictionId: string,
  entryId: string,
) {
  router.push(`/read/${fictionId}/${entryId}`)
}

function entryLabel(result: {
  entryType: string
  entryNumber: number | null
  entryTitle: string
}) {
  const type =
    result.entryType.charAt(0).toUpperCase() +
    result.entryType.slice(1)

  const prefix =
    result.entryNumber !== null
      ? `${type} ${result.entryNumber}`
      : type

  return `${prefix}: ${result.entryTitle}`
}
</script>

<template>
  <main class="shell search-page">
    <header class="page-header">
      <p class="eyebrow">
        Search
      </p>
      <h1>Search</h1>
      <p class="page-description">
        Find a fiction, chapter, or piece of content.
      </p>
    </header>

    <form
      class="search-form"
      @submit.prevent="search"
    >
      <label for="search-query">Search novels</label>

      <div class="search-form__row">
        <input
          id="search-query"
          v-model="query"
          type="search"
          placeholder="Search novels..."
          autocomplete="off"
        >

        <button
          class="button"
          type="submit"
        >
          Search
        </button>
      </div>
    </form>

    <p
      v-if="hasSearched"
      class="result-count"
      aria-live="polite"
    >
      {{ resultCountLabel }}
    </p>

    <section
      v-if="hasSearched && results.length > 0"
      class="results-list"
      aria-label="Search results"
    >
      <button
        v-for="result in results"
        :key="result.entryId"
        type="button"
        class="result-card"
        @click="openResult(result.fictionId, result.entryId)"
      >
        <strong class="result-card__title">{{ result.fictionTitle }}</strong>
        <span class="result-card__entry">{{ entryLabel(result) }}</span>
        <span class="result-card__snippet">{{ result.snippet }}</span>
      </button>
    </section>

    <div
      v-else-if="hasSearched"
      class="state-message"
    >
      <h2>No results found</h2>
      <p>Try a different word or phrase.</p>
    </div>
  </main>
</template>

<style scoped>
.search-page {
  padding-block: 3rem 5rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  margin: 0;
  color: var(--text);
  font-size: clamp(2rem, 5vw, 3rem);
}

.page-description {
  max-width: 42rem;
  margin: 0.75rem 0 0;
  color: var(--text-muted);
}

.search-form {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg, 1rem);
}

.search-form > label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 600;
}

.search-form__row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.search-form__row input {
  flex: 1 1 16rem;
  min-height: 2.75rem;
  padding: 0.5rem 0.85rem;
  color: var(--text);
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-md, 0.5rem);
}

.search-form__row input:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.5rem 1.25rem;
  color: var(--text-on-accent);
  background: var(--accent);
  border: none;
  border-radius: var(--radius-md, 0.5rem);
  cursor: pointer;
}

.button:hover {
  background: var(--accent-hover);
}

.result-count {
  margin: 0 0 1rem;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.results-list {
  display: grid;
  gap: 0.75rem;
}

.result-card {
  display: grid;
  gap: 0.3rem;
  padding: 1rem 1.1rem;
  color: inherit;
  text-align: left;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg, 1rem);
  cursor: pointer;
}

.result-card:hover,
.result-card:focus-visible {
  border-color: var(--accent);
}

.result-card__title {
  color: var(--text);
  font-size: 1.05rem;
}

.result-card__entry {
  color: var(--accent);
  font-size: 0.85rem;
  font-weight: 600;
}

.result-card__snippet {
  overflow: hidden;
  color: var(--text-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.state-message {
  padding: 2rem;
  color: var(--text-muted);
  text-align: center;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg, 1rem);
}

.state-message h2 {
  margin: 0 0 0.35rem;
  color: var(--text);
}

.state-message p {
  margin: 0;
}
</style>
