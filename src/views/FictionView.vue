<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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

const indexTracks = ref<Record<string, HTMLElement | null>>({})

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

function entryGlyph(entry: ContentEntry, label: string | null): string {
  return entryLabel(entry, label).charAt(0).toUpperCase()
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
                      class="fiction-index__card"
                      :to="`/read/${fiction.id}/${item.entry.id}`"
                    >
                      <span
                        class="fiction-index__card-glyph"
                        aria-hidden="true"
                      >
                        {{ entryGlyph(item.entry, item.label) }}
                      </span>
                      <span class="fiction-index__card-label">
                        {{ entryLabel(item.entry, item.label) }}
                      </span>
                    </RouterLink>
                  </li>
                </ul>
              </div>
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
  display: none;
  gap: 0.4rem;
}

@media (hover: hover) and (pointer: fine) {
  .fiction-index__nav {
    display: flex;
  }
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

.fiction-index__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  width: 8rem;
  aspect-ratio: 2 / 3;
  padding: 0.85rem;
  color: var(--text);
  text-align: center;
  text-decoration: none;
  background: linear-gradient(160deg, var(--bg-surface), var(--bg-elevated));
  border: 1px solid var(--border);
  border-radius: var(--radius-md, 0.5rem);
}

.fiction-index__card:hover,
.fiction-index__card:focus-visible {
  border-color: var(--accent);
}

.fiction-index__card-glyph {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  color: var(--text-on-accent);
  background: var(--accent);
  border-radius: 50%;
  font-size: 1.1rem;
  font-weight: 700;
}

.fiction-index__card-label {
  display: -webkit-box;
  overflow: hidden;
  font-size: 0.8rem;
  line-height: 1.3;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
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
