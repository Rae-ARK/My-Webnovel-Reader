<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useLibraryStore } from '../stores/library.store'
import { useFavoritesStore } from '../stores/favorites.store'
import type { ContentEntry, FictionIndex } from '../models/content'

const route = useRoute()
const library = useLibraryStore()
const favorites = useFavoritesStore()

const fictionId = computed(() => String(route.params.id))
const fiction = ref<Awaited<ReturnType<typeof library.getFictionById>>>(null)
const indexes = ref<FictionIndex[]>([])
const firstEntryId = ref<string | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const indexTracks = ref<Record<string, HTMLElement | null>>({})

onMounted(async () => {
  loading.value = true
  error.value = null

  try {
    fiction.value = await library.getFictionById(fictionId.value)

    if (!fiction.value) {
      error.value = 'Fiction not found.'
      return
    }

    indexes.value = library.getIndexesForFiction(fictionId.value)
    firstEntryId.value = library.getFirstEntryId(fictionId.value)

    await favorites.load()
  } catch (cause) {
    error.value =
      cause instanceof Error
        ? cause.message
        : 'Failed to load fiction.'
  } finally {
    loading.value = false
  }
})

function entryLabel(
  entry: ContentEntry,
  label: string | null,
): string {
  if (label) {
    return label
  }

  if (entry.number !== null) {
    const typeLabel =
      entry.type.charAt(0).toUpperCase() + entry.type.slice(1)

    return `${typeLabel} ${entry.number}`
  }

  return entry.title
}

function scrollIndex(indexId: string, direction: 1 | -1) {
  const track = indexTracks.value[indexId]

  if (!track) {
    return
  }

  track.scrollBy({
    left: direction * track.clientWidth * 0.9,
    behavior: 'smooth',
  })
}
</script>

<template>
  <main class="shell fiction-page">
    <div
      v-if="loading"
      class="state-message"
      aria-busy="true"
    >
      <p>Loading fiction...</p>
    </div>

    <div
      v-else-if="error"
      class="state-message"
      role="alert"
    >
      <h1>Fiction unavailable</h1>
      <p>{{ error }}</p>
      <RouterLink
        class="button"
        to="/library"
      >
        Back to library
      </RouterLink>
    </div>

    <article
      v-else-if="fiction"
      class="fiction-detail"
    >
      <div
        class="fiction-detail__cover"
        aria-hidden="true"
      >
        <img
          v-if="fiction.cover"
          :src="fiction.cover"
          :alt="`${fiction.title} cover`"
        >
        <span v-else>{{ fiction.title.charAt(0) }}</span>
      </div>

      <div class="fiction-detail__content">
        <p class="eyebrow">
          Fiction
        </p>

        <h1>{{ fiction.title }}</h1>

        <p class="fiction-detail__author">
          by {{ fiction.author }}
        </p>

        <div class="fiction-detail__meta">
          <span>{{ fiction.status }}</span>
          <span>{{ fiction.entryCount }} entries</span>
        </div>

        <p class="fiction-detail__synopsis">
          {{ fiction.synopsis }}
        </p>

        <div class="fiction-detail__tags">
          <span
            v-for="genre in fiction.genres"
            :key="genre"
          >
            {{ genre }}
          </span>
        </div>

        <div class="fiction-detail__actions">
          <RouterLink
            v-if="firstEntryId"
            class="button"
            :to="`/read/${fiction.id}/${firstEntryId}`"
          >
            Start reading
          </RouterLink>

          <button
            type="button"
            class="secondary-button"
            :aria-pressed="favorites.isFavorite(fiction.id)"
            @click="favorites.toggle(fiction.id)"
          >
            {{
              favorites.isFavorite(fiction.id)
                ? 'Remove favorite'
                : 'Add favorite'
            }}
          </button>
        </div>
      </div>

      <section
        v-if="indexes.length"
        class="fiction-index"
        aria-labelledby="fiction-index-heading"
      >
        <h2
          id="fiction-index-heading"
          class="eyebrow"
        >
          Index
        </h2>

        <div
          v-for="index in indexes"
          :key="index.id"
          class="fiction-index__group"
        >
          <div class="fiction-index__group-header">
            <h3>{{ index.title }}</h3>

            <div
              v-if="index.entries.length > 1"
              class="fiction-index__nav"
            >
              <button
                type="button"
                class="fiction-index__nav-button"
                aria-label="Scroll index backward"
                @click="scrollIndex(index.id, -1)"
              >
                ‹
              </button>
              <button
                type="button"
                class="fiction-index__nav-button"
                aria-label="Scroll index forward"
                @click="scrollIndex(index.id, 1)"
              >
                ›
              </button>
            </div>
          </div>

          <ul
            :ref="(el) => (indexTracks[index.id] = el as HTMLElement | null)"
            class="fiction-index__track"
          >
            <li
              v-for="item in index.entries"
              :key="item.entry.id"
              class="fiction-index__item"
            >
              <RouterLink
                class="fiction-index__link"
                :to="`/read/${fiction.id}/${item.entry.id}`"
              >
                {{ entryLabel(item.entry, item.label) }}
              </RouterLink>
            </li>
          </ul>
        </div>
      </section>
    </article>
  </main>
</template>

<style scoped>
.fiction-page {
  padding-block: 3rem 5rem;
}

.fiction-detail {
  display: grid;
  grid-template-columns: minmax(12rem, 18rem) 1fr;
  gap: 2.5rem;
  align-items: start;
}

.fiction-detail__cover {
  display: grid;
  aspect-ratio: 3 / 4;
  place-items: center;
  overflow: hidden;
  color: var(--text-on-accent);
  background: var(--accent);
  border-radius: var(--radius-lg, 1rem);
  font-size: 3rem;
  font-weight: 700;
}

.fiction-detail__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fiction-detail__content h1 {
  margin: 0;
  color: var(--text);
  font-size: clamp(2rem, 5vw, 3.5rem);
  line-height: 1.1;
}

.fiction-detail__author {
  margin: 0.75rem 0 0;
  color: var(--text-muted);
}

.fiction-detail__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 1.25rem 0;
  color: var(--text-subtle);
  font-size: 0.85rem;
  text-transform: capitalize;
}

.fiction-detail__synopsis {
  max-width: 48rem;
  color: var(--text-muted);
  line-height: 1.7;
}

.fiction-detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.fiction-detail__tags span {
  padding: 0.3rem 0.65rem;
  color: var(--text-muted);
  background: var(--bg-elevated);
  border-radius: 999px;
  font-size: 0.8rem;
}

.fiction-detail__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 2rem;
}

.secondary-button {
  min-height: 2.5rem;
  padding: 0.5rem 1rem;
  color: var(--text);
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md, 0.5rem);
  cursor: pointer;
}

.state-message {
  padding: 2rem;
  text-align: center;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg, 1rem);
}

.state-message h1 {
  color: var(--text);
}

.state-message p {
  color: var(--text-muted);
}

.fiction-index {
  grid-column: 1 / -1;
  margin-top: 3rem;
}

.fiction-index > .eyebrow {
  margin-bottom: 1rem;
}

.fiction-index__group {
  margin-bottom: 2rem;
}

.fiction-index__group-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.fiction-index__group-header h3 {
  margin: 0;
  color: var(--text);
  font-size: 1.1rem;
}

.fiction-index__nav {
  display: flex;
  gap: 0.4rem;
}

.fiction-index__nav-button {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  color: var(--text);
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 999px;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
}

.fiction-index__track {
  display: flex;
  gap: 0.75rem;
  margin: 0;
  padding: 0.25rem 0.1rem 0.75rem;
  list-style: none;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  scrollbar-width: thin;
}

.fiction-index__item {
  flex: 0 0 auto;
  scroll-snap-align: start;
}

.fiction-index__link {
  display: block;
  padding: 0.6rem 1rem;
  color: var(--text);
  white-space: nowrap;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md, 0.5rem);
  text-decoration: none;
}

.fiction-index__link:hover,
.fiction-index__link:focus-visible {
  border-color: var(--accent);
}

@media (max-width: 700px) {
  .fiction-detail {
    grid-template-columns: 1fr;
  }

  .fiction-detail__cover {
    width: min(18rem, 100%);
    margin-inline: auto;
  }

  .fiction-index__nav {
    display: none;
  }
}
</style>
