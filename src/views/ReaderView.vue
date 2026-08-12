<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from '../components/ui/Button.vue'
import IconButton from '../components/ui/IconButton.vue'
import Slider from '../components/ui/Slider.vue'
import { useReaderStore } from '../stores/reader.store'
import { useSettingsStore } from '../stores/settings.store'
import { useThemeStore, type Theme } from '../stores/theme.store'
import type { Bookmark } from '../models/user-state'
import author from '../config/author'

const route = useRoute()
const router = useRouter()

const reader = useReaderStore()
const settings = useSettingsStore()
const themeStore = useThemeStore()

const fictionId = computed(() => String(route.params.fictionId))
const chapterId = computed(() => String(route.params.chapterId))

const showControls = ref(false)
const bookmarks = ref<Bookmark[]>([])
const bookmarksLoading = ref(false)
const bookmarkError = ref<string | null>(null)
const settingsLoaded = ref(false)

const fontSize = ref(18)
const lineHeight = ref(1.7)
const readingWidth = ref(48)

const fontSizeOptions = {
  min: 14,
  max: 26,
  step: 1,
}

const lineHeightOptions = {
  min: 1.4,
  max: 2.2,
  step: 0.1,
}

const readingWidthOptions = {
  min: 36,
  max: 64,
  step: 2,
}

const themeOptions: Theme[] = ['light', 'cream', 'dark']

const entryEyebrow = computed(() => {
  const entry = reader.current?.entry

  if (!entry) {
    return ''
  }

  const label =
    entry.type.charAt(0).toUpperCase() + entry.type.slice(1)

  return entry.number !== null
    ? `${label} ${entry.number}`
    : label
})

const formatNoteDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const bookmarkLabel = (bookmark: Bookmark) => {
  if (bookmark.chapterId === chapterId.value) {
    return entryEyebrow.value
  }

  return reader.getEntryTitle(bookmark.chapterId) ?? 'Bookmark'
}

let scrollListenerAttached = false

const getReadingPosition = (): number => {
  const documentElement = document.documentElement

  const scrollableHeight =
    documentElement.scrollHeight - window.innerHeight

  if (scrollableHeight <= 0) {
    return 0
  }

  return Math.min(
    1,
    Math.max(0, window.scrollY / scrollableHeight),
  )
}

const saveCurrentPosition = () => {
  if (!reader.current) {
    return
  }

  reader.saveProgressDebounced({
    fictionId: fictionId.value,
    chapterId: reader.current.entry.id,
    position: getReadingPosition(),
    updatedAt: Date.now(),
  })
}

const flushCurrentPosition = async () => {
  if (!reader.current) {
    return
  }

  await reader.saveProgress({
    fictionId: fictionId.value,
    chapterId: reader.current.entry.id,
    position: getReadingPosition(),
    updatedAt: Date.now(),
  })
}

const restoreReadingPosition = async () => {
  await nextTick()

  const position = reader.progress?.position ?? 0

  if (position <= 0) {
    window.scrollTo({
      top: 0,
      behavior: 'auto',
    })

    return
  }

  const documentElement = document.documentElement
  const scrollableHeight =
    documentElement.scrollHeight - window.innerHeight

  if (scrollableHeight <= 0) {
    return
  }

  window.scrollTo({
    top: scrollableHeight * position,
    behavior: 'auto',
  })
}

const recordCurrentHistory = async () => {
  if (!reader.current) {
    return
  }

  await reader.recordHistory(
    fictionId.value,
    reader.current.entry.id,
  )
}

const loadSettings = async () => {
  const storedFontSize =
    await settings.get<number>('reader.fontSize')

  const storedLineHeight =
    await settings.get<number>('reader.lineHeight')

  const storedReadingWidth =
    await settings.get<number>('reader.width')

  fontSize.value = storedFontSize ?? 18
  lineHeight.value = storedLineHeight ?? 1.7
  readingWidth.value = storedReadingWidth ?? 48

  settingsLoaded.value = true
}

const saveReaderSetting = async (
  key: string,
  value: number,
) => {
  await settings.save(key, value)
}

const loadBookmarks = async () => {
  bookmarksLoading.value = true
  bookmarkError.value = null

  try {
    bookmarks.value =
      await reader.listBookmarksForFiction(
        fictionId.value,
      )
  } catch (cause) {
    bookmarkError.value =
      cause instanceof Error
        ? cause.message
        : 'Failed to load bookmarks.'
  } finally {
    bookmarksLoading.value = false
  }
}

const addBookmark = async () => {
  if (!reader.current) {
    return
  }

  bookmarkError.value = null

  try {
    await reader.addBookmark({
      fictionId: fictionId.value,
      chapterId: reader.current.entry.id,
      position: getReadingPosition(),
    })

    await loadBookmarks()
  } catch (cause) {
    bookmarkError.value =
      cause instanceof Error
        ? cause.message
        : 'Failed to add bookmark.'
  }
}

const removeBookmark = async (bookmarkId: string) => {
  bookmarkError.value = null

  try {
    await reader.removeBookmark(bookmarkId)
    await loadBookmarks()
  } catch (cause) {
    bookmarkError.value =
      cause instanceof Error
        ? cause.message
        : 'Failed to remove bookmark.'
  }
}

const goToBookmark = async (bookmark: Bookmark) => {
  if (bookmark.chapterId !== chapterId.value) {
    await router.push(
      `/read/${fictionId.value}/${bookmark.chapterId}`,
    )

    return
  }

  await nextTick()

  const documentElement = document.documentElement
  const scrollableHeight =
    documentElement.scrollHeight - window.innerHeight

  window.scrollTo({
    top: Math.max(0, scrollableHeight * bookmark.position),
    behavior: 'smooth',
  })
}

const load = async () => {
  await loadSettings()

  const entry = await reader.loadEntry(
    fictionId.value,
    chapterId.value,
  )

  if (!entry) {
    return
  }

  await loadBookmarks()
  await recordCurrentHistory()
  await restoreReadingPosition()
}

const goToEntry = async (
  nextEntryId: string | null | undefined,
) => {
  if (!nextEntryId) {
    return
  }

  await flushCurrentPosition()

  await router.push(
    `/read/${fictionId.value}/${nextEntryId}`,
  )

  await load()
}

const handleScroll = () => {
  saveCurrentPosition()
}

const handleFontSizeChange = async (value: number) => {
  fontSize.value = value

  if (settingsLoaded.value) {
    await saveReaderSetting(
      'reader.fontSize',
      value,
    )
  }
}

const handleLineHeightChange = async (value: number) => {
  lineHeight.value = value

  if (settingsLoaded.value) {
    await saveReaderSetting(
      'reader.lineHeight',
      value,
    )
  }
}

const handleReadingWidthChange = async (value: number) => {
  readingWidth.value = value

  if (settingsLoaded.value) {
    await saveReaderSetting(
      'reader.width',
      value,
    )
  }
}

onMounted(async () => {
  window.addEventListener('scroll', handleScroll, {
    passive: true,
  })

  scrollListenerAttached = true

  await load()
})

onBeforeUnmount(() => {
  if (scrollListenerAttached) {
    window.removeEventListener('scroll', handleScroll)
    scrollListenerAttached = false
  }

  void flushCurrentPosition()

  reader.dispose()
})
</script>

<template>
  <main class="reader-page">
    <div
      v-if="reader.loading"
      class="reader-state"
      aria-busy="true"
    >
      <p>Loading...</p>
    </div>

    <div
      v-else-if="reader.error"
      class="reader-state"
      role="alert"
    >
      <h1>Content unavailable</h1>
      <p>{{ reader.error }}</p>

      <RouterLink
        class="button"
        :to="`/fiction/${fictionId}`"
      >
        Back to fiction
      </RouterLink>
    </div>

    <article
      v-else-if="reader.current"
      class="reader"
      :style="{
        '--reader-font-size': `${fontSize}px`,
        '--reader-line-height': lineHeight,
        '--reader-width': `${readingWidth}rem`,
      }"
    >
      <header class="reader__header">
        <div class="reader__toolbar">
          <RouterLink
            class="reader__back"
            :to="`/fiction/${fictionId}`"
          >
            ← Back to fiction
          </RouterLink>

          <div class="reader__actions">
            <IconButton
              label="Toggle reader settings"
              :aria-expanded="showControls"
              @click="showControls = !showControls"
            >
              Aa
            </IconButton>

            <Button
              variant="secondary"
              @click="addBookmark"
            >
              Bookmark
            </Button>
          </div>
        </div>

        <section
          v-if="showControls"
          class="reader-controls"
          aria-label="Reader settings"
        >
          <div class="reader-controls__header">
            <h2>Reader settings</h2>

            <Button
              variant="ghost"
              @click="showControls = false"
            >
              Close
            </Button>
          </div>

          <Slider
            :model-value="fontSize"
            label="Font size"
            :min="fontSizeOptions.min"
            :max="fontSizeOptions.max"
            :step="fontSizeOptions.step"
            @update:model-value="handleFontSizeChange"
          />

          <Slider
            :model-value="lineHeight"
            label="Line height"
            :min="lineHeightOptions.min"
            :max="lineHeightOptions.max"
            :step="lineHeightOptions.step"
            @update:model-value="handleLineHeightChange"
          />

          <Slider
            :model-value="readingWidth"
            label="Reading width"
            :min="readingWidthOptions.min"
            :max="readingWidthOptions.max"
            :step="readingWidthOptions.step"
            @update:model-value="handleReadingWidthChange"
          />

          <div class="reader-controls__themes">
            <span class="reader-controls__label">
              Theme
            </span>

            <div class="reader-controls__theme-buttons">
              <Button
                v-for="theme in themeOptions"
                :key="theme"
                :variant="
                  themeStore.theme === theme
                    ? 'primary'
                    : 'secondary'
                "
                @click="themeStore.setTheme(theme)"
              >
                {{ theme }}
              </Button>
            </div>
          </div>
        </section>

        <p class="eyebrow">
          {{ entryEyebrow }}
        </p>

        <h1>{{ reader.current.entry.title }}</h1>
      </header>

      <section
        v-if="bookmarks.length > 0 || bookmarksLoading"
        class="reader-bookmarks"
        aria-label="Bookmarks"
      >
        <div class="reader-bookmarks__header">
          <h2>Bookmarks</h2>
          <span>{{ bookmarks.length }}</span>
        </div>

        <p
          v-if="bookmarksLoading"
          class="reader-bookmarks__state"
        >
          Loading bookmarks...
        </p>

        <ul
          v-else
          class="reader-bookmarks__list"
        >
          <li
            v-for="bookmark in bookmarks"
            :key="bookmark.id"
          >
            <button
              type="button"
              class="reader-bookmark"
              @click="goToBookmark(bookmark)"
            >
              <span>
                {{ bookmarkLabel(bookmark) }}
              </span>

              <small>
                {{ Math.round(bookmark.position * 100) }}%
              </small>
            </button>

            <IconButton
              label="Remove bookmark"
              @click="removeBookmark(bookmark.id)"
            >
              ×
            </IconButton>
          </li>
        </ul>

        <p
          v-if="bookmarkError"
          class="reader-bookmarks__error"
          role="alert"
        >
          {{ bookmarkError }}
        </p>
      </section>

      <div
        class="reader__content"
        v-html="reader.current.entry.content"
      />

      <div class="reader__below">
        <nav
          class="chapter-nav"
          aria-label="Chapter navigation"
        >
          <div class="chapter-nav__row">
            <button
              type="button"
              class="chapter-nav__button chapter-nav__button--previous"
              :disabled="!reader.current.previous?.id"
              @click="goToEntry(reader.current.previous?.id)"
            >
              « Previous Chapter
            </button>

            <RouterLink
              class="chapter-nav__button chapter-nav__button--index"
              :to="`/fiction/${fictionId}`"
            >
              Fiction Index
            </RouterLink>

            <button
              type="button"
              class="chapter-nav__button chapter-nav__button--next"
              :disabled="!reader.current.next?.id"
              @click="goToEntry(reader.current.next?.id)"
            >
              Next Chapter »
            </button>
          </div>

          <button
            type="button"
            class="chapter-nav__rss"
            disabled
            title="RSS feed support is planned but not wired up yet."
          >
            RSS
          </button>
        </nav>

        <!--
          Author's note. Always rendered — even with nothing written
          yet — so the author sees exactly where a note will land once
          they add one. Content comes from public/content/author-notes.json,
          which scripts/set-chapter-note.py writes; see
          src/repositories/AuthorNotesRepository.ts for why this lives
          outside library.sqlite. `reader.authorNote` is null until a
          note exists for this chapter id.
        -->
        <section
          class="author-note"
          aria-labelledby="author-note-heading"
        >
          <h2
            id="author-note-heading"
            class="author-note__heading"
          >
            <img
              :src="author.avatarSquare"
              alt=""
              class="author-note__avatar"
              width="28"
              height="28"
            >
            A note from {{ author.name }}
          </h2>

          <div
            v-if="reader.authorNote"
            class="author-note__body"
          >
            <p
              v-for="(paragraph, index) in reader.authorNote.note.split(/\n{2,}/)"
              :key="index"
            >
              {{ paragraph }}
            </p>

            <p
              v-if="reader.authorNote.updatedAt"
              class="author-note__timestamp"
            >
              — {{ formatNoteDate(reader.authorNote.updatedAt) }}
            </p>
          </div>

          <p
            v-else
            class="author-note__empty"
          >
            Nothing here yet. Add one with
            <code>python3 scripts/set-chapter-note.py --chapter {{ chapterId }} --note "..."</code>.
          </p>
        </section>

        <!--
          About the author. Currently sourced from
          author.config.reader.json via src/config/author.ts (name,
          avatar, bio, social) — the only author data that actually
          exists today. Follow/stats/achievements are left out on
          purpose: there's no account system to follow anything with,
          and there's no data source for stats yet. Both become
          possible once Stage 9 of
          docs/fiction-page-redesign-plan.md (the About Author page)
          lands with a real profile data model; this card can switch
          to reading that dynamically at that point instead of the
          static config it reads today.
        -->
        <section
          class="about-author"
          aria-labelledby="about-author-heading"
        >
          <h2
            id="about-author-heading"
            class="about-author__heading"
          >
            About the author
          </h2>

          <div class="about-author__body">
            <img
              :src="author.avatarSquare"
              alt=""
              class="about-author__avatar"
              width="72"
              height="72"
            >

            <div class="about-author__details">
              <div class="about-author__identity">
                <p class="about-author__name">
                  {{ author.name }}
                </p>

                <button
                  type="button"
                  class="about-author__follow"
                  disabled
                  title="There's no account system on this site — nothing to follow yet."
                >
                  Follow Author
                </button>
              </div>

              <p
                v-if="author.joined"
                class="about-author__joined"
              >
                Joined {{ formatNoteDate(new Date(author.joined).getTime()) }}
              </p>

              <p class="about-author__bio">
                {{ author.bio }}
              </p>

              <ul
                v-if="author.social.length"
                class="about-author__social"
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
            </div>
          </div>
        </section>
      </div>
    </article>
  </main>
</template>

<style scoped>
.reader-page {
  min-height: 100vh;
  padding: 2rem 1rem 5rem;
}

.reader {
  width: min(100%, var(--reader-width));
  margin-inline: auto;
}

.reader__header {
  margin-bottom: 3rem;
}

.reader__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
}

.reader__back {
  color: var(--text-muted);
  text-decoration: none;
}

.reader__back:hover {
  color: var(--text);
}

.reader__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.reader-controls {
  display: grid;
  gap: 1.25rem;
  margin-bottom: 2.5rem;
  padding: 1.25rem;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg, 1rem);
}

.reader-controls__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.reader-controls__header h2 {
  margin: 0;
  color: var(--text);
  font-size: 1rem;
}

.reader-controls__themes {
  display: grid;
  gap: 0.625rem;
}

.reader-controls__label {
  color: var(--text);
  font-size: 0.875rem;
  font-weight: 600;
}

.reader-controls__theme-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.reader__header h1 {
  margin: 0;
  color: var(--text);
  font-size: clamp(2rem, 5vw, 3rem);
  line-height: 1.15;
}

.reader__content {
  color: var(--text);
  font-size: var(--reader-font-size);
  line-height: var(--reader-line-height);
}

.reader__content :deep(p) {
  margin: 0 0 1.5rem;
}

.reader__content :deep(h2),
.reader__content :deep(h3) {
  margin: 2.5rem 0 1rem;
  color: var(--text);
}

.reader-bookmarks {
  margin-bottom: 2rem;
  padding: 1rem;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg, 1rem);
}

.reader-bookmarks__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.reader-bookmarks__header h2 {
  margin: 0;
  color: var(--text);
  font-size: 1rem;
}

.reader-bookmarks__header span {
  color: var(--text-muted);
  font-size: 0.875rem;
}

.reader-bookmarks__list {
  display: grid;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.reader-bookmarks__list li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.reader-bookmark {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  min-height: 2.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.reader-bookmark:hover {
  background: var(--bg-surface);
}

.reader-bookmark small {
  color: var(--text-muted);
}

.reader-bookmarks__state,
.reader-bookmarks__error {
  margin: 0;
  color: var(--text-muted);
}

.reader-bookmarks__error {
  margin-top: 0.75rem;
  color: var(--danger);
}

.reader__below {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border);
}

.chapter-nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.chapter-nav__row {
  display: flex;
  flex: 1;
  min-width: 0;
  gap: 0.5rem;
}

.chapter-nav__button {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.6rem 1rem;
  color: var(--text-on-accent);
  background: var(--accent);
  border: none;
  border-radius: var(--radius-md, 0.5rem);
  font: inherit;
  font-weight: 600;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
}

.chapter-nav__button:hover:not(:disabled) {
  background: var(--accent-hover);
}

.chapter-nav__button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.chapter-nav__button--index {
  background: var(--bg-elevated);
  color: var(--text);
  border: 1px solid var(--border);
}

.chapter-nav__button--index:hover {
  background: var(--bg-surface);
}

.chapter-nav__rss {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.6rem 1.1rem;
  color: var(--text-on-accent);
  background: #e8912b;
  border: none;
  border-radius: var(--radius-md, 0.5rem);
  font: inherit;
  font-weight: 700;
  cursor: not-allowed;
  opacity: 0.6;
}

.author-note {
  padding: 1.25rem 1.5rem;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg, 1rem);
}

.author-note__heading {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0 0 0.85rem;
  color: var(--text);
  font-size: 1rem;
}

.author-note__avatar {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  object-fit: cover;
}

.author-note__body p {
  margin: 0 0 1rem;
  color: var(--text-muted);
  line-height: 1.6;
}

.author-note__body p:last-child {
  margin-bottom: 0;
}

.author-note__timestamp {
  color: var(--text-subtle) !important;
  font-size: 0.8rem;
}

.author-note__empty {
  margin: 0;
  color: var(--text-subtle);
  font-size: 0.9rem;
  line-height: 1.6;
}

.author-note__empty code {
  padding: 0.1rem 0.35rem;
  background: var(--bg-elevated);
  border-radius: var(--radius-sm, 0.25rem);
  font-size: 0.8rem;
  word-break: break-all;
}

.about-author {
  padding: 1.5rem;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg, 1rem);
}

.about-author__heading {
  margin: 0 0 1rem;
  color: var(--text);
  font-size: 1rem;
}

.about-author__body {
  display: flex;
  gap: 1.25rem;
}

.about-author__avatar {
  flex-shrink: 0;
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 50%;
  object-fit: cover;
}

.about-author__details {
  flex: 1;
  min-width: 0;
}

.about-author__identity {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.about-author__name {
  margin: 0;
  color: var(--text);
  font-size: 1.1rem;
  font-weight: 700;
}

.about-author__follow {
  padding: 0.4rem 0.85rem;
  color: var(--text-on-accent);
  background: var(--accent);
  border: none;
  border-radius: var(--radius-md, 0.5rem);
  font: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  opacity: 0.6;
  cursor: not-allowed;
}

.about-author__joined {
  margin: 0.35rem 0 0;
  color: var(--text-subtle);
  font-size: 0.8rem;
}

.about-author__bio {
  margin: 0.75rem 0 0;
  color: var(--text-muted);
  font-size: 0.9rem;
  line-height: 1.6;
}

.about-author__social {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1rem 0 0;
  padding: 0;
  list-style: none;
}

.about-author__social a {
  padding: 0.3rem 0.7rem;
  color: var(--text-muted);
  background: var(--bg-elevated);
  border-radius: 999px;
  font-size: 0.78rem;
  text-decoration: none;
  text-transform: capitalize;
}

.about-author__social a:hover {
  color: var(--accent);
}

.reader-state {
  width: min(100%, 40rem);
  margin: 5rem auto;
  padding: 2rem;
  text-align: center;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg, 1rem);
}

.reader-state h1 {
  margin-top: 0;
  color: var(--text);
}

.reader-state p {
  color: var(--text-muted);
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

.secondary-button:disabled,
.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .reader-page {
    padding-inline: 0.75rem;
  }

  .reader__toolbar {
    align-items: flex-start;
  }

  .reader__actions {
    flex-shrink: 0;
  }

  .reader__actions :deep(.ui-button) {
    display: none;
  }

  .chapter-nav {
    flex-direction: column;
    align-items: stretch;
  }

  .chapter-nav__row {
    flex-direction: column;
  }

  .chapter-nav__rss {
    width: 100%;
  }

  .about-author__body {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
