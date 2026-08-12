<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import FictionCard from '../components/molecules/FictionCard.vue'
import { useLibraryStore } from '../stores/library.store'
import type { LibraryFilters } from '../services/library.service'

const library = useLibraryStore()

const selectedGenre = ref('')
const selectedStatus = ref<LibraryFilters['status'] | ''>('')

const loadLibrary = () => {
  library.load({
    genre: selectedGenre.value || undefined,
    status: selectedStatus.value || undefined,
  })
}

onMounted(loadLibrary)

watch([selectedGenre, selectedStatus], loadLibrary)
</script>

<template>
  <main class="shell library-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">
          Library
        </p>
        <h1>Browse fiction</h1>
        <p class="page-description">
          Explore the published collection and find something to read.
        </p>
      </div>
    </header>

    <section
      class="library-filters"
      aria-label="Library filters"
    >
      <label>
        <span>Genre</span>
        <select v-model="selectedGenre">
          <option value="">All genres</option>
          <option
            v-for="genre in ['Fantasy', 'Romance', 'Mystery', 'Adventure']"
            :key="genre"
            :value="genre"
          >
            {{ genre }}
          </option>
        </select>
      </label>

      <label>
        <span>Status</span>
        <select v-model="selectedStatus">
          <option value="">All statuses</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="hiatus">Hiatus</option>
        </select>
      </label>
    </section>

    <div
      v-if="library.loading"
      class="library-grid"
      aria-label="Loading library"
      aria-busy="true"
    >
      <div
        v-for="index in 3"
        :key="index"
        class="loading-card"
      />
    </div>

    <div
      v-else-if="library.error"
      class="state-message"
      role="alert"
    >
      <h2>Unable to load the library</h2>
      <p>{{ library.error }}</p>
      <button
        type="button"
        @click="loadLibrary"
      >
        Try again
      </button>
    </div>

    <div
      v-else-if="!library.hasItems"
      class="state-message"
    >
      <h2>No fiction found</h2>
      <p>Try changing the filters.</p>
    </div>

    <section
      v-else
      class="library-grid"
      aria-label="Fiction collection"
    >
      <FictionCard
        v-for="fiction in library.items"
        :key="fiction.id"
        :fiction="fiction"
      />
    </section>
  </main>
</template>

<style scoped>
.library-page {
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

.library-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg, 1rem);
}

.library-filters label {
  display: grid;
  gap: 0.35rem;
  min-width: 10rem;
}

.library-filters span {
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 600;
}

.library-filters select {
  min-height: 2.5rem;
  padding: 0.45rem 0.7rem;
  color: var(--text);
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-md, 0.5rem);
}

.library-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: 1.25rem;
}

.loading-card {
  min-height: 26rem;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg, 1rem);
  animation: pulse 1.4s ease-in-out infinite alternate;
}

.state-message {
  padding: 2rem;
  text-align: center;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg, 1rem);
}

.state-message h2 {
  margin: 0 0 0.5rem;
  color: var(--text);
}

.state-message p {
  color: var(--text-muted);
}

.state-message button {
  min-height: 2.5rem;
  padding: 0.5rem 1rem;
  color: var(--text-on-accent);
  background: var(--accent);
  border: 0;
  border-radius: var(--radius-md, 0.5rem);
  cursor: pointer;
}

@keyframes pulse {
  from {
    opacity: 0.55;
  }

  to {
    opacity: 0.9;
  }
}
</style>
