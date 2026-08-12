<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useLibraryStore } from '../stores/library.store'
import { useFavoritesStore } from '../stores/favorites.store'
import { useReaderStore } from '../stores/reader.store'
import type { ContentEntry, FictionIndex } from '../models/content'
import author from '../config/author'

const route = useRoute()
const library = useLibraryStore()
const favorites = useFavoritesStore()
const readerStore = useReaderStore()

const fictionId = computed(() => String(route.params.id))
const fiction = ref<Awaited<ReturnType<typeof library.getFictionById>>>(null)
const indexes = ref<FictionIndex[]>([])
const firstEntryId = ref<string | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// Table-of-contents state. The index is presented Royal-Road-style:
// a tab strip ("All Chapters" plus one tab per Index/arc/volume), a
// search box and an entries-per-page control, a table of entries for
// the active tab, and pagination — instead of the previous horizontal
// scrolling card track.
const selectedTabId = ref('all')
const searchQuery = ref('')
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const
const pageSize = ref<number>(PAGE_SIZE_OPTIONS[0])
const currentPage = ref(1)

const SYNOPSIS_COLLAPSE_THRESHOLD = 360
const synopsisExpanded = ref(false)
const synopsisIsLong = computed(
  () => (fiction.value?.synopsis.length ?? 0) > SYNOPSIS_COLLAPSE_THRESHOLD,
)

// Optional decorative background from author.config.reader.json (see
// Stage 7 of docs/fiction-page-redesign-plan.md). Probed with a plain
// Image() load rather than trusted outright, so an unset field or a
// path that doesn't actually resolve just falls back to the flat
// theme background this page already had, instead of a broken image.
const backgroundImageSrc = author.backgroundImage ?? null
const backgroundReady = ref(false)

const pageStyle = computed(() =>
  backgroundReady.value && backgroundImageSrc
    ? { '--fiction-page-bg': `url('${backgroundImageSrc}')` }
    : undefined,
)

const continueEntryTitle = computed(() =>
  readerStore.progress
    ? readerStore.getEntryTitle(readerStore.progress.chapterId)
    : null,
)

const primaryActionEntryId = computed(
  () => readerStore.progress?.chapterId ?? firstEntryId.value,
)

const primaryActionLabel = computed(() =>
  readerStore.progress ? 'Continue Reading' : 'Start Reading',
)

interface IndexTab {
  id: string
  title: string
  items: FictionIndex['entries']
}

// "All Chapters" flattens every index's entries into one ordered,
// deduplicated list (an entry can legitimately appear in more than
// one index/arc grouping upstream).
const flatEntries = computed<FictionIndex['entries']>(() => {
  const seen = new Set<string>()
  const merged: FictionIndex['entries'] = []

  for (const index of indexes.value) {
    for (const item of index.entries) {
      if (!seen.has(item.entry.id)) {
        seen.add(item.entry.id)
        merged.push(item)
      }
    }
  }

  return merged
})

const tabs = computed<IndexTab[]>(() => [
  { id: 'all', title: 'All Chapters', items: flatEntries.value },
  ...indexes.value.map((index) => ({
    id: index.id,
    title: index.title,
    items: index.entries,
  })),
])

const activeTab = computed<IndexTab | undefined>(() =>
  tabs.value.find((tab) => tab.id === selectedTabId.value) ?? tabs.value[0],
)

const filteredItems = computed<FictionIndex['entries']>(() => {
  const items = activeTab.value?.items ?? []
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) {
    return items
  }

  return items.filter((item) =>
    entryLabel(item.entry, item.label).toLowerCase().includes(query),
  )
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredItems.value.length / pageSize.value)),
)

const pagedItems = computed<FictionIndex['entries']>(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredItems.value.slice(start, start + pageSize.value)
})

// Windowed page-number buttons so a 33-chapter, 10-per-page fiction
// doesn't render dozens of buttons once a fiction grows much larger.
const pageNumbers = computed<number[]>(() => {
  const maxButtons = 7

  if (totalPages.value <= maxButtons) {
    return Array.from({ length: totalPages.value }, (_, i) => i + 1)
  }

  const half = Math.floor(maxButtons / 2)
  let start = Math.max(1, currentPage.value - half)
  const end = Math.min(totalPages.value, start + maxButtons - 1)
  start = Math.max(1, end - maxButtons + 1)

  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

watch([selectedTabId, searchQuery, pageSize], () => {
  currentPage.value = 1
})

function selectTab(tabId: string) {
  selectedTabId.value = tabId
}

function goToPage(page: number) {
  currentPage.value = Math.min(totalPages.value, Math.max(1, page))
}

// `releasedAt` isn't populated by any current import path (see the
// comment on ContentEntry in src/models/content.ts) — this renders an
// em dash until a real timestamp is available instead of guessing.
function formatRelativeDate(timestamp: number | null | undefined): string {
  if (!timestamp) {
    return '—'
  }

  const diffMs = Date.now() - timestamp
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffDays <= 0) {
    return 'today'
  }

  if (diffDays === 1) {
    return '1 day ago'
  }

  if (diffDays < 30) {
    return `${diffDays} days ago`
  }

  const diffMonths = Math.floor(diffDays / 30)

  if (diffMonths < 12) {
    return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`
  }

  const diffYears = Math.floor(diffMonths / 12)

  return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`
}

onMounted(async () => {
  loading.value = true
  error.value = null

  if (backgroundImageSrc) {
    const probe = new Image()
    probe.onload = () => {
      backgroundReady.value = true
    }
    probe.onerror = () => {
      backgroundReady.value = false
    }
    probe.src = backgroundImageSrc
  }

  try {
    fiction.value = await library.getFictionById(fictionId.value)

    if (!fiction.value) {
      error.value = 'Fiction not found.'
      return
    }

    indexes.value = library.getIndexesForFiction(fictionId.value)
    firstEntryId.value = library.getFirstEntryId(fictionId.value)

    await Promise.all([
      favorites.load(),
      readerStore.loadProgress(fictionId.value),
    ])
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

function formatSavedDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <main
    class="fiction-page"
    :class="{ 'fiction-page--illustrated': backgroundReady }"
    :style="pageStyle"
  >
    <div class="shell">
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
        class="fiction-layout"
      >
        <section
          class="fiction-hero"
          aria-labelledby="fiction-title"
        >
          <div
            class="fiction-hero__cover"
            aria-hidden="true"
          >
            <img
              v-if="fiction.cover"
              :src="fiction.cover"
              :alt="`${fiction.title} cover`"
            >
            <span v-else>{{ fiction.title.charAt(0) }}</span>
          </div>

          <div class="fiction-hero__content">
            <p class="eyebrow">
              Fiction
            </p>

            <h1 id="fiction-title">
              {{ fiction.title }}
            </h1>

            <p class="fiction-hero__author">
              by {{ fiction.author }}
            </p>

            <div class="fiction-hero__chips">
              <span
                class="chip chip--status"
                :data-status="fiction.status"
              >
                {{ fiction.status }}
              </span>
              <span
                v-for="genre in fiction.genres"
                :key="`genre-${genre}`"
                class="chip"
              >
                {{ genre }}
              </span>
              <span
                v-for="tag in fiction.tags"
                :key="`tag-${tag}`"
                class="chip chip--tag"
              >
                #{{ tag }}
              </span>
            </div>

            <div
              class="fiction-hero__synopsis"
              :class="{ 'is-collapsed': synopsisIsLong && !synopsisExpanded }"
            >
              <p>{{ fiction.synopsis }}</p>
            </div>

            <button
              v-if="synopsisIsLong"
              type="button"
              class="fiction-hero__synopsis-toggle"
              @click="synopsisExpanded = !synopsisExpanded"
            >
              {{ synopsisExpanded ? 'Show less' : 'Show more' }}
            </button>

            <div class="fiction-hero__actions">
              <RouterLink
                v-if="primaryActionEntryId"
                class="fiction-hero__cta"
                :to="`/read/${fiction.id}/${primaryActionEntryId}`"
              >
                {{ primaryActionLabel }}
              </RouterLink>
              <span
                v-else
                class="fiction-hero__cta-empty"
              >
                No readable entries yet.
              </span>
            </div>
          </div>
        </section>

        <div class="fiction-columns">
          <div class="fiction-columns__main">
            <section
              v-if="indexes.length"
              class="fiction-index"
              aria-labelledby="fiction-index-heading"
            >
              <div class="fiction-index__header">
                <h2
                  id="fiction-index-heading"
                  class="eyebrow"
                >
                  Table of Contents
                </h2>
                <span class="fiction-index__count">
                  {{ flatEntries.length }} {{ flatEntries.length === 1 ? 'Chapter' : 'Chapters' }}
                </span>
              </div>

              <div
                class="fiction-index__tabs"
                role="tablist"
                aria-label="Chapter groups"
              >
                <button
                  v-for="tab in tabs"
                  :key="tab.id"
                  type="button"
                  role="tab"
                  class="fiction-index__tab"
                  :class="{ 'is-active': activeTab?.id === tab.id }"
                  :aria-selected="activeTab?.id === tab.id"
                  @click="selectTab(tab.id)"
                >
                  <span
                    class="fiction-index__tab-cover"
                    aria-hidden="true"
                  >
                    <img
                      v-if="fiction.cover"
                      :src="fiction.cover"
                      alt=""
                    >
                    <span v-else>{{ tab.title.charAt(0) }}</span>
                  </span>
                  <span class="fiction-index__tab-label">
                    {{ tab.title }}
                  </span>
                </button>
              </div>

              <div class="fiction-index__controls">
                <label class="fiction-index__page-size">
                  <select v-model.number="pageSize">
                    <option
                      v-for="size in PAGE_SIZE_OPTIONS"
                      :key="size"
                      :value="size"
                    >
                      {{ size }}
                    </option>
                  </select>
                  entries per page
                </label>

                <input
                  v-model="searchQuery"
                  type="search"
                  class="fiction-index__search"
                  placeholder="Search..."
                  aria-label="Search chapters in this tab"
                >
              </div>

              <table class="fiction-index__table">
                <thead>
                  <tr>
                    <th scope="col">
                      Chapter Name
                    </th>
                    <th
                      scope="col"
                      class="fiction-index__table-date"
                    >
                      Release Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!pagedItems.length">
                    <td
                      colspan="2"
                      class="fiction-index__table-empty"
                    >
                      {{ searchQuery ? 'No chapters match your search.' : 'Nothing here yet.' }}
                    </td>
                  </tr>
                  <tr
                    v-for="item in pagedItems"
                    :key="item.entry.id"
                  >
                    <td>
                      <RouterLink :to="`/read/${fiction.id}/${item.entry.id}`">
                        {{ entryLabel(item.entry, item.label) }}
                      </RouterLink>
                    </td>
                    <td class="fiction-index__table-date">
                      {{ formatRelativeDate(item.entry.releasedAt) }}
                    </td>
                  </tr>
                </tbody>
              </table>

              <nav
                v-if="totalPages > 1"
                class="fiction-index__pagination"
                aria-label="Chapter list pages"
              >
                <button
                  type="button"
                  class="fiction-index__page-button"
                  :disabled="currentPage === 1"
                  aria-label="Previous page"
                  @click="goToPage(currentPage - 1)"
                >
                  ‹
                </button>

                <button
                  v-for="page in pageNumbers"
                  :key="page"
                  type="button"
                  class="fiction-index__page-button"
                  :class="{ 'is-active': page === currentPage }"
                  :aria-current="page === currentPage ? 'page' : undefined"
                  @click="goToPage(page)"
                >
                  {{ page }}
                </button>

                <button
                  type="button"
                  class="fiction-index__page-button"
                  :disabled="currentPage === totalPages"
                  aria-label="Next page"
                  @click="goToPage(currentPage + 1)"
                >
                  ›
                </button>
              </nav>
            </section>
          </div>

          <aside class="fiction-columns__sidebar">
            <section
              class="quick-actions glass-surface"
              aria-labelledby="quick-actions-heading"
            >
              <h2
                id="quick-actions-heading"
                class="eyebrow"
              >
                Quick actions
              </h2>

              <button
                type="button"
                class="quick-actions__favorite"
                :class="{ 'is-active': favorites.isFavorite(fiction.id) }"
                :aria-pressed="favorites.isFavorite(fiction.id)"
                @click="favorites.toggle(fiction.id)"
              >
                <span aria-hidden="true">{{ favorites.isFavorite(fiction.id) ? '★' : '☆' }}</span>
                {{ favorites.isFavorite(fiction.id) ? 'In your favorites' : 'Add to favorites' }}
              </button>

              <div
                v-if="readerStore.progress"
                class="quick-actions__progress"
              >
                <p class="quick-actions__progress-label">
                  Continue reading
                </p>
                <p class="quick-actions__progress-entry">
                  {{ continueEntryTitle ?? 'Your last position' }}
                </p>
                <p class="quick-actions__progress-date">
                  Saved {{ formatSavedDate(readerStore.progress.updatedAt) }}
                </p>
                <RouterLink
                  class="quick-actions__progress-button"
                  :to="`/read/${fiction.id}/${readerStore.progress.chapterId}`"
                >
                  Continue
                </RouterLink>
              </div>
            </section>

            <section
              class="author-card"
              aria-labelledby="author-card-heading"
            >
              <h2
                id="author-card-heading"
                class="eyebrow"
              >
                Author
              </h2>

              <div class="author-card__identity">
                <img
                  :src="author.avatarSquare"
                  alt=""
                  class="author-card__avatar"
                  width="56"
                  height="56"
                >
                <p class="author-card__name">
                  {{ author.name }}
                </p>
              </div>

              <p class="author-card__bio">
                {{ author.bio }}
              </p>

              <ul
                v-if="author.social.length"
                class="author-card__social"
              >
                <li
                  v-for="entry in author.social"
                  :key="entry.platform"
                >
                  <a
                    :href="entry.url"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {{ entry.platform }}
                  </a>
                </li>
              </ul>
            </section>
          </aside>
        </div>
      </article>
    </div>
  </main>
</template>

<style scoped>
.fiction-page {
  container-type: inline-size;
  container-name: fiction-page;
  padding-block: 3rem 5rem;
}

/*
 * Optional author background (author.backgroundImage). Faded into the
 * flat theme background at the top/bottom edges via the gradient
 * layer so it never fights with the header/footer, and never applied
 * at all unless the image actually probed successfully — see the
 * backgroundReady logic above.
 */
.fiction-page--illustrated {
  background-image:
    linear-gradient(
      to bottom,
      var(--bg) 0%,
      rgb(0 0 0 / 0%) 14%,
      rgb(0 0 0 / 0%) 82%,
      var(--bg) 100%
    ),
    var(--fiction-page-bg);
  background-repeat: no-repeat;
  background-position: top center;
  background-size: cover;
}

.fiction-hero {
  display: grid;
  grid-template-columns: minmax(11rem, 16rem) 1fr;
  gap: 2rem;
  padding: 2rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg, 1rem);
  box-shadow: var(--shadow-sm);
}

.fiction-hero__cover {
  display: grid;
  aspect-ratio: 2 / 3;
  place-items: center;
  overflow: hidden;
  color: var(--text-on-accent);
  background: var(--accent);
  border-radius: var(--radius-md, 0.5rem);
  font-size: 3rem;
  font-weight: 700;
}

.fiction-hero__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fiction-hero__content h1 {
  margin: 0;
  color: var(--text);
  font-size: clamp(2rem, 4.5vw, 3rem);
  line-height: 1.1;
}

.fiction-hero__author {
  margin: 0.6rem 0 0;
  color: var(--text-muted);
}

.fiction-hero__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1.1rem 0;
}

.chip {
  padding: 0.3rem 0.7rem;
  color: var(--text-muted);
  background: var(--bg-surface);
  border-radius: 999px;
  font-size: 0.78rem;
  text-transform: capitalize;
}

.chip--status {
  color: var(--text-on-accent);
  background: var(--accent);
  font-weight: 600;
}

.chip--status[data-status='completed'] {
  background: var(--success);
}

.chip--status[data-status='hiatus'] {
  background: var(--text-subtle);
}

.chip--tag {
  text-transform: none;
}

.fiction-hero__synopsis {
  max-width: 48rem;
  color: var(--text-muted);
}

.fiction-hero__synopsis p {
  margin: 0;
  line-height: 1.7;
}

.fiction-hero__synopsis.is-collapsed p {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
}

.fiction-hero__synopsis-toggle {
  padding: 0;
  margin: 0.5rem 0 0;
  color: var(--accent);
  background: none;
  border: none;
  cursor: pointer;
  font: inherit;
  font-weight: 600;
}

.fiction-hero__actions {
  margin-top: 1.75rem;
}

.fiction-hero__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 3rem;
  padding: 0.85rem 1.75rem;
  color: var(--text-on-accent);
  background: var(--accent);
  border-radius: var(--radius-md, 0.5rem);
  font-size: 1rem;
  font-weight: 700;
  text-decoration: none;
}

.fiction-hero__cta:hover {
  background: var(--accent-hover);
}

.fiction-hero__cta-empty {
  color: var(--text-subtle);
  font-size: 0.9rem;
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

.fiction-columns {
  display: grid;
  grid-template-columns: 1fr minmax(16rem, 20rem);
  gap: 2.5rem;
  align-items: start;
  margin-top: 2.5rem;
}

.fiction-index__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.fiction-index__header > .eyebrow {
  margin: 0;
}

.fiction-index__count {
  padding: 0.2rem 0.6rem;
  color: var(--text-subtle);
  background: var(--bg-elevated);
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.fiction-index__tabs {
  display: flex;
  gap: 0.75rem;
  margin: 0 0 1.25rem;
  padding: 0.25rem 0.1rem 0.75rem;
  overflow-x: auto;
  scrollbar-width: thin;
}

.fiction-index__tab {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  width: 6.5rem;
  padding: 0.5rem;
  color: var(--text);
  background: transparent;
  border: 2px solid transparent;
  border-radius: var(--radius-md, 0.5rem);
  cursor: pointer;
  font: inherit;
  text-align: center;
}

.fiction-index__tab.is-active {
  border-color: var(--accent);
  background: var(--bg-surface);
}

.fiction-index__tab:hover:not(.is-active) {
  background: var(--bg-elevated);
}

.fiction-index__tab-cover {
  display: grid;
  place-items: center;
  width: 4.5rem;
  aspect-ratio: 2 / 3;
  overflow: hidden;
  color: var(--text-on-accent);
  background: linear-gradient(160deg, var(--bg-surface), var(--bg-elevated));
  border: 1px solid var(--border);
  border-radius: var(--radius-sm, 0.375rem);
  font-weight: 700;
}

.fiction-index__tab-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fiction-index__tab-label {
  display: -webkit-box;
  overflow: hidden;
  font-size: 0.75rem;
  line-height: 1.25;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.fiction-index__controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.fiction-index__page-size {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.fiction-index__page-size select {
  padding: 0.4rem 0.6rem;
  color: var(--text);
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm, 0.375rem);
  font: inherit;
}

.fiction-index__search {
  flex: 1 1 12rem;
  max-width: 16rem;
  padding: 0.5rem 0.75rem;
  color: var(--text);
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm, 0.375rem);
  font: inherit;
}

.fiction-index__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.fiction-index__table th {
  padding: 0.6rem 0.5rem;
  color: var(--text);
  text-align: left;
  border-bottom: 2px solid var(--border);
}

.fiction-index__table td {
  padding: 0.65rem 0.5rem;
  border-bottom: 1px solid var(--border);
}

.fiction-index__table tbody tr:hover {
  background: var(--bg-surface);
}

.fiction-index__table a {
  color: var(--text);
  text-decoration: none;
}

.fiction-index__table a:hover {
  color: var(--accent);
}

.fiction-index__table-date {
  width: 9rem;
  color: var(--text-subtle);
  text-align: right;
  white-space: nowrap;
}

.fiction-index__table-empty {
  padding: 1.5rem 0.5rem;
  color: var(--text-subtle);
  text-align: center;
}

.fiction-index__pagination {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.4rem;
  margin-top: 1.25rem;
}

.fiction-index__page-button {
  display: grid;
  place-items: center;
  min-width: 2.25rem;
  height: 2.25rem;
  padding: 0 0.5rem;
  color: var(--text);
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm, 0.375rem);
  cursor: pointer;
  font: inherit;
}

.fiction-index__page-button:hover:not(:disabled) {
  background: var(--bg-elevated);
}

.fiction-index__page-button.is-active {
  color: var(--text-on-accent);
  background: var(--accent);
  border-color: var(--accent);
}

.fiction-index__page-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.fiction-columns__sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: sticky;
  top: 1.5rem;
}

/*
 * Sidebar quick-actions card is the one piece of new Stage 7 surface
 * that's in-scope for the frosted-glass treatment (see Stage 6 /
 * docs/fiction-page-redesign-plan.md's chrome scope note). Structure
 * only here — .glass-surface owns the color.
 */
.quick-actions {
  padding: 1.5rem;
  border-width: 1px;
  border-style: solid;
  border-radius: var(--radius-lg, 1rem);
}

.quick-actions__favorite {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 0.5rem;
  min-height: 2.75rem;
  padding: 0.6rem 0.9rem;
  margin-top: 1rem;
  color: var(--text);
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md, 0.5rem);
  cursor: pointer;
  font: inherit;
  font-weight: 600;
}

.quick-actions__favorite.is-active {
  color: var(--accent);
  border-color: var(--accent);
}

.quick-actions__progress {
  padding-top: 1.25rem;
  margin-top: 1.25rem;
  border-top: 1px solid var(--border);
}

.quick-actions__progress-label {
  margin: 0;
  color: var(--text-subtle);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.quick-actions__progress-entry {
  margin: 0.35rem 0 0;
  color: var(--text);
  font-weight: 600;
}

.quick-actions__progress-date {
  margin: 0.2rem 0 0.9rem;
  color: var(--text-subtle);
  font-size: 0.8rem;
}

.quick-actions__progress-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.5rem;
  padding: 0.5rem 0.9rem;
  width: 100%;
  color: var(--text-on-accent);
  background: var(--accent);
  border-radius: var(--radius-md, 0.5rem);
  text-decoration: none;
}

.quick-actions__progress-button:hover {
  background: var(--accent-hover);
}

.author-card {
  padding: 1.5rem;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg, 1rem);
}

.author-card__identity {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.author-card__avatar {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  object-fit: cover;
}

.author-card__name {
  margin: 0;
  color: var(--text);
  font-weight: 700;
}

.author-card__bio {
  margin: 1rem 0 0;
  color: var(--text-muted);
  font-size: 0.9rem;
  line-height: 1.6;
}

.author-card__social {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1rem 0 0;
  padding: 0;
  list-style: none;
}

.author-card__social a {
  padding: 0.3rem 0.7rem;
  color: var(--text-muted);
  background: var(--bg-elevated);
  border-radius: 999px;
  font-size: 0.78rem;
  text-decoration: none;
  text-transform: capitalize;
}

.author-card__social a:hover {
  color: var(--accent);
}

@container fiction-page (max-width: 700px) {
  .fiction-hero {
    grid-template-columns: 1fr;
  }

  .fiction-hero__cover {
    width: min(16rem, 100%);
    margin-inline: auto;
  }

  .fiction-columns {
    grid-template-columns: 1fr;
  }

  .fiction-columns__sidebar {
    position: static;
  }
}
</style>
