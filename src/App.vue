<script setup lang="ts">
import site from './config/site'
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
