<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useReaderStore } from '../stores/reader.store'

const route = useRoute()
const router = useRouter()
const reader = useReaderStore()

const fictionId = computed(() => String(route.params.fictionId))
const chapterId = computed(() => String(route.params.chapterId))

const load = async () => {
  await reader.loadChapter(
    fictionId.value,
    chapterId.value,
  )
}

const goToChapter = (nextChapterId: string | null | undefined) => {
  if (!nextChapterId) {
    return
  }

  router.push(
    `/read/${fictionId.value}/${nextChapterId}`,
  )
}

onMounted(load)

onBeforeUnmount(() => {
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
      <p>Loading chapter...</p>
    </div>

    <div
      v-else-if="reader.error"
      class="reader-state"
      role="alert"
    >
      <h1>Chapter unavailable</h1>
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
    >
      <header class="reader__header">
        <RouterLink
          class="reader__back"
          :to="`/fiction/${fictionId}`"
        >
          ← Back to fiction
        </RouterLink>

        <p class="eyebrow">
          Chapter {{ reader.current.chapter.number }}
        </p>

        <h1>{{ reader.current.chapter.title }}</h1>
      </header>

      <div
        class="reader__content"
        v-html="reader.current.chapter.content"
      />

      <nav
        class="reader__navigation"
        aria-label="Chapter navigation"
      >
        <button
          type="button"
          class="secondary-button"
          :disabled="!reader.current.previous?.id"
          @click="
            goToChapter(reader.current.previous?.id)
          "
        >
          ← Previous
        </button>

        <button
          type="button"
          class="button"
          :disabled="!reader.current.next?.id"
          @click="
            goToChapter(reader.current.next?.id)
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
  width: min(100%, 48rem);
  margin-inline: auto;
}

.reader__header {
  margin-bottom: 3rem;
}

.reader__back {
  display: inline-block;
  margin-bottom: 2rem;
  color: var(--text-muted);
  text-decoration: none;
}

.reader__back:hover {
  color: var(--text);
}

.reader__header h1 {
  margin: 0;
  color: var(--text);
  font-size: clamp(2rem, 5vw, 3rem);
  line-height: 1.15;
}

.reader__content {
  color: var(--text);
  font-size: 1.08rem;
  line-height: 1.85;
}

.reader__content :deep(p) {
  margin: 0 0 1.5rem;
}

.reader__content :deep(h2),
.reader__content :deep(h3) {
  margin: 2.5rem 0 1rem;
  color: var(--text);
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
</style>
