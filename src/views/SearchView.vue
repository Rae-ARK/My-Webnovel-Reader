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
  <section class="search-view">
    <header>
      <h1>Search</h1>
      <p>Find a fiction, chapter, or piece of content.</p>
    </header>

    <form @submit.prevent="search">
      <label for="search-query">Search novels</label>

      <div>
        <input
          id="search-query"
          v-model="query"
          type="search"
          placeholder="Search novels..."
          autocomplete="off"
        >

        <button type="submit">
          Search
        </button>
      </div>
    </form>

    <p
      v-if="hasSearched"
      aria-live="polite"
    >
      {{ resultCountLabel }}
    </p>

    <section v-if="hasSearched && results.length > 0">
      <ul>
        <li
          v-for="result in results"
          :key="result.entryId"
        >
          <button
            type="button"
            @click="openResult(result.fictionId, result.entryId)"
          >
            <strong>{{ result.fictionTitle }}</strong>
            <span>{{ entryLabel(result) }}</span>
            <span>{{ result.snippet }}</span>
          </button>
        </li>
      </ul>
    </section>

    <p v-else-if="hasSearched">
      No results found.
    </p>
  </section>
</template>
