<script setup lang="ts">
import site from '../../config/site'
</script>

<template>
  <header class="site-header">
    <RouterLink
      to="/"
      class="brand"
    >
      <img
        :src="site.site.icon"
        alt=""
        class="brand-icon"
        height="24"
      >
      {{ site.site.title }}
    </RouterLink>

    <nav aria-label="Main navigation">
      <RouterLink to="/library">
        Library
      </RouterLink>
      <RouterLink to="/search">
        Search
      </RouterLink>
    </nav>
  </header>
</template>

<style scoped>
.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem max(1rem, calc((100vw - 1100px) / 2));
  border-bottom: 1px solid var(--border);
  background: var(--bg-elevated);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
}

.brand-icon {
  display: block;
  width: auto;
  height: 24px;
  max-width: 24px;
  object-fit: contain;
  border-radius: var(--radius-sm, 0.25rem);
}

nav {
  display: flex;
  gap: 1rem;
}
</style>
