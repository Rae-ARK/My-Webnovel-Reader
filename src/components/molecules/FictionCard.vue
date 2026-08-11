<script setup lang="ts">
import type { LibraryItem } from '../../services/library.service'

defineProps<{
  fiction: LibraryItem
}>()
</script>

<template>
  <article class="fiction-card">
    <RouterLink
      class="fiction-card__link"
      :to="`/fiction/${fiction.id}`"
      :aria-label="`View ${fiction.title}`"
    >
      <div class="fiction-card__cover" aria-hidden="true">
        <img
          v-if="fiction.cover"
          :src="fiction.cover"
          :alt="`${fiction.title} cover`"
          loading="lazy"
        />
        <span v-else>{{ fiction.title.charAt(0) }}</span>
      </div>

      <div class="fiction-card__body">
        <div class="fiction-card__meta">
          <span>{{ fiction.status }}</span>
          <span>{{ fiction.chapterCount }} chapters</span>
        </div>

        <h2>{{ fiction.title }}</h2>

        <p class="fiction-card__author">
          {{ fiction.author }}
        </p>

        <p class="fiction-card__synopsis">
          {{ fiction.synopsis }}
        </p>

        <div
          v-if="fiction.genres.length"
          class="fiction-card__tags"
          aria-label="Genres"
        >
          <span
            v-for="genre in fiction.genres.slice(0, 3)"
            :key="genre"
          >
            {{ genre }}
          </span>
        </div>
      </div>
    </RouterLink>
  </article>
</template>

<style scoped>
.fiction-card {
  height: 100%;
}

.fiction-card__link {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  color: inherit;
  text-decoration: none;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg, 1rem);
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease;
}

.fiction-card__link:hover {
  transform: translateY(-2px);
  border-color: var(--accent);
  box-shadow: var(--shadow-md, 0 8px 24px rgb(0 0 0 / 8%));
}

.fiction-card__cover {
  display: grid;
  aspect-ratio: 3 / 4;
  place-items: center;
  overflow: hidden;
  color: var(--text-on-accent);
  background: var(--accent);
  font-size: 2rem;
  font-weight: 700;
}

.fiction-card__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fiction-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
}

.fiction-card__meta {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  color: var(--text-subtle);
  font-size: 0.75rem;
  text-transform: capitalize;
}

.fiction-card h2 {
  margin: 0;
  color: var(--text);
  font-size: 1.1rem;
  line-height: 1.3;
}

.fiction-card__author {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.875rem;
}

.fiction-card__synopsis {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--text-muted);
  font-size: 0.875rem;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.fiction-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: auto;
  padding-top: 0.5rem;
}

.fiction-card__tags span {
  padding: 0.2rem 0.5rem;
  color: var(--text-muted);
  background: var(--bg-elevated);
  border-radius: 999px;
  font-size: 0.75rem;
}
</style>
