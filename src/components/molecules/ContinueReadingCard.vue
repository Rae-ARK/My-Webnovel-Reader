<script setup lang="ts">
import type { FictionSummary } from '../../models/content'

defineProps<{
  fiction: FictionSummary
  chapterId: string
  position: number
  updatedAt: number
}>()
</script>

<template>
  <article class="continue-card">
    <div class="continue-card__cover" aria-hidden="true">
      <img
        v-if="fiction.cover"
        :src="fiction.cover"
        :alt="`${fiction.title} cover`"
        loading="lazy"
      />
      <span v-else>{{ fiction.title.charAt(0) }}</span>
    </div>

    <div class="continue-card__content">
      <p class="eyebrow">Continue reading</p>

      <h2>{{ fiction.title }}</h2>

      <p class="continue-card__author">
        {{ fiction.author }}
      </p>

      <p class="continue-card__position">
        Saved reading position: {{ Math.round(position) }}
      </p>

      <RouterLink
        class="button"
        :to="`/read/${fiction.id}/${chapterId}`"
      >
        Continue
      </RouterLink>
    </div>
  </article>
</template>

<style scoped>
.continue-card {
  display: grid;
  grid-template-columns: 7rem 1fr;
  overflow: hidden;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg, 1rem);
}

.continue-card__cover {
  display: grid;
  min-height: 10rem;
  place-items: center;
  overflow: hidden;
  color: var(--text-on-accent);
  background: var(--accent);
  font-size: 2rem;
  font-weight: 700;
}

.continue-card__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.continue-card__content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
  padding: 1rem;
}

.continue-card__content h2 {
  margin: 0;
  color: var(--text);
  font-size: 1.2rem;
}

.continue-card__author {
  margin: 0;
  color: var(--text-muted);
}

.continue-card__position {
  margin: 0 0 0.5rem;
  color: var(--text-subtle);
  font-size: 0.8rem;
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.5rem;
  padding: 0.5rem 0.9rem;
  color: var(--text-on-accent);
  background: var(--accent);
  border-radius: var(--radius-md, 0.5rem);
  text-decoration: none;
}

@media (max-width: 32rem) {
  .continue-card {
    grid-template-columns: 5rem 1fr;
  }

  .continue-card__cover {
    min-height: 8rem;
  }
}
</style>
