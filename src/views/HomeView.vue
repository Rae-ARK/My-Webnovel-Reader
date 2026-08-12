<script setup lang="ts">
import { onMounted, ref } from 'vue'
import site from '../config/site'
import author from '../config/author'
import FictionCard from '../components/molecules/FictionCard.vue'
import ContinueReadingCard from '../components/molecules/ContinueReadingCard.vue'
import { useLibraryStore } from '../stores/library.store'

const library = useLibraryStore()

const continueReading = ref<
  Awaited<ReturnType<typeof library.loadContinueReading>>
>([])

onMounted(async () => {
  await library.load()
  continueReading.value = await library.loadContinueReading()
})
</script>

<template>
  <main>
    <section class="shell hero">
      <p class="eyebrow author-eyebrow">
        <img
          :src="author.avatarSquare"
          alt=""
          class="author-avatar"
          width="20"
          height="20"
        >
        {{ author.name }}
      </p>

      <h1>
        <img
          :src="site.site.icon"
          alt=""
          class="hero-icon"
          height="40"
        >
        {{ site.site.title }}
      </h1>

      <p>{{ site.site.description }}</p>

      <RouterLink
        class="button"
        to="/library"
      >
        Browse library
      </RouterLink>
    </section>

    <section
      v-if="continueReading.length"
      class="shell home-section"
      aria-labelledby="continue-heading"
    >
      <header class="section-header">
        <div>
          <p class="eyebrow">
            Your reading
          </p>
          <h2 id="continue-heading">
            Continue reading
          </h2>
        </div>
      </header>

      <div class="continue-list">
        <ContinueReadingCard
          v-for="item in continueReading"
          :key="`${item.fiction.id}-${item.chapterId}`"
          v-bind="item"
        />
      </div>
    </section>

    <section
      class="shell home-section"
      aria-labelledby="library-heading"
    >
      <header class="section-header">
        <div>
          <p class="eyebrow">
            Published collection
          </p>
          <h2 id="library-heading">
            Library
          </h2>
        </div>

        <RouterLink to="/library">
          View all
        </RouterLink>
      </header>

      <div
        v-if="library.loading"
        class="loading"
        aria-busy="true"
      >
        Loading library…
      </div>

      <div
        v-else-if="library.error"
        class="state-message"
        role="alert"
      >
        {{ library.error }}
      </div>

      <div
        v-else
        class="library-grid"
      >
        <FictionCard
          v-for="fiction in library.items.slice(0, 6)"
          :key="fiction.id"
          :fiction="fiction"
        />
      </div>
    </section>
  </main>
</template>

<style scoped>
.hero {
  padding-block: 3rem 2.5rem;
}

.hero h1 {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 0.65rem;
  max-width: 48rem;
  margin: 0;
  color: var(--text);
  font-size: clamp(1.5rem, 5vw, 2.75rem);
  line-height: 1;
  white-space: nowrap;
}

.hero-icon {
  flex-shrink: 0;
  display: block;
  width: auto;
  height: clamp(1.75rem, 5vw, 2.25rem);
  max-width: clamp(1.75rem, 5vw, 2.25rem);
  object-fit: contain;
  border-radius: var(--radius-md, 0.5rem);
}

.author-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0 0 0.5rem;
}

.author-avatar {
  display: block;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  object-fit: cover;
}

.hero > p:not(.eyebrow) {
  max-width: 42rem;
  margin: 0.6rem 0 1.1rem;
  color: var(--text-muted);
  font-size: 1rem;
  line-height: 1.6;
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.6rem 1rem;
  color: var(--text-on-accent);
  background: var(--accent);
  border-radius: var(--radius-md, 0.5rem);
  text-decoration: none;
}

.home-section {
  padding-block: 2rem 4rem;
}

.section-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.section-header h2 {
  margin: 0;
  color: var(--text);
  font-size: 1.75rem;
}

.section-header a {
  color: var(--accent);
}

.continue-list {
  container-type: inline-size;
  container-name: continue-list;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(22rem, 30rem));
  gap: 1rem;
}

.library-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 18rem));
  gap: 1.25rem;
}

.loading,
.state-message {
  padding: 2rem;
  color: var(--text-muted);
  text-align: center;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg, 1rem);
}
</style>
