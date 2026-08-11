<script setup lang="ts">
import { onMounted } from 'vue'
import site from './config/site'
import { useThemeStore } from './stores/theme.store'

const themeStore = useThemeStore()

onMounted(() => {
  themeStore.initialize()
})
</script>

<template>
  <header class="site-header">
    <RouterLink
      to="/"
      class="brand"
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

  <main>
    <RouterView />
  </main>
</template>
