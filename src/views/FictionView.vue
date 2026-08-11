<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useLibraryStore } from '../stores/library.store'
import { useFavoritesStore } from '../stores/favorites.store'

const route = useRoute()
const library = useLibraryStore()
const favorites = useFavoritesStore()

const fictionId = computed(() => String(route.params.id))
const fiction = ref<Awaited<ReturnType<typeof library.getFictionById>>>(null)
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  loading.value = true
  error.value = null

  try {
    fiction.value = await library.getFictionById(fictionId.value)

    if (!fiction.value) {
      error.value = 'Fiction not found.'
      return
    }

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
          <span>{{ fiction.chapterCount }} chapters</span>
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
            v-if="fiction.chapterCount"
            class="button"
            :to="`/read/${fiction.id}/1`"
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

@media (max-width: 700px) {
  .fiction-detail {
    grid-template-columns: 1fr;
  }

  .fiction-detail__cover {
    width: min(18rem, 100%);
    margin-inline: auto;
  }
}
</style>
