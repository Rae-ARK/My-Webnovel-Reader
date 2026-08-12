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
    <div
      class="continue-card__cover"
      aria-hidden="true"
    >
      <img
        v-if="fiction.cover"
        :src="fiction.cover"
        :alt="`${fiction.title} cover`"
        loading="lazy"
      >
      <span v-else>{{ fiction.title.charAt(0) }}</span>
    </div>

    <div class="continue-card__content">
      <p class="eyebrow">
        Continue reading
      </p>

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
/* ContinueReadingCard.vue — <style scoped> block changes

   Problem: the cover box has a fixed `aspect-ratio: 2/3` and the
   card's grid uses `align-items: start`, so the cover's height is
   derived only from its own (7rem) width — it doesn't grow to match
   however tall the text column ends up being, leaving a gap at the
   bottom of the card.

   Fix: drop the aspect-ratio and let the cover stretch to the full
   row height (grid rows stretch by default — just remove the
   `align-items: start` override that was opting out of it), so the
   image always touches both the top and bottom of the card. The
   column width goes from 7rem -> 9rem (and 5rem -> 6.5rem at the
   narrow container-query breakpoint) so the now-taller box doesn't
   end up looking too narrow/cropped once it's stretched. */

.continue-card {
  display: grid;
  grid-template-columns: 9rem minmax(0, 1fr);
  /* was: align-items: start; — removing it lets both grid columns
     stretch to the row's full height (the grid default), which is
     what makes the cover reach the bottom of the card. */
  overflow: hidden;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg, 1rem);
}

.continue-card__cover {
  display: block;
  /* was: aspect-ratio: 2 / 3; — removed so height comes from the
     stretched grid row instead of being derived from the width. */
  height: 100%;
  place-items: center;
  overflow: hidden;
  color: var(--text-on-accent);
  background: var(--accent);
  font-size: 2rem;
  font-weight: 700;
}

/* .continue-card__cover img is unchanged — width/height: 100% +
   object-fit: cover already fills whatever box it's given. */
.continue-card__cover img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.continue-card__content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;   /* add this line */
  gap: 0.4rem;
  padding: 1rem;
}

@container continue-list (max-width: 32rem) {
  .continue-card {
    grid-template-columns: 6.5rem 1fr;
  }
}
</style>
