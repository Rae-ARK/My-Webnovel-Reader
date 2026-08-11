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

      <nav
        class="reader__navigation"
        aria-label="Entry navigation"
      >
        <button
          type="button"
          class="secondary-button"
          :disabled="!reader.current.previous?.id"
          @click="
            goToEntry(reader.current.previous?.id)
          "
        >
          ← Previous
        </button>

        <button
          type="button"
          class="button"
          :disabled="!reader.current.next?.id"
          @click="
            goToEntry(reader.current.next?.id)
          "
        >
          Next →
        </button>
      </nav>
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

.reader__navigation {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border);
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

  .reader__navigation {
    flex-direction: column;
  }

  .reader__navigation > * {
    width: 100%;
  }
}
</style>
