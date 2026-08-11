<script setup lang="ts">
import { onMounted } from 'vue'
import site from './config/site'
import { useThemeStore } from './stores/theme'

const themeStore = useThemeStore()

onMounted(() => {
  themeStore.initialize()
})
</script>

<template>
  <header class="site-header">
    <RouterLink to="/" class="brand">{{ site.site.title }}</RouterLink>

    <nav aria-label="Main navigation">
      <RouterLink to="/library">Library</RouterLink>
    </nav>
  </header>

  <main>
    <RouterView />
  </main>
</template>
