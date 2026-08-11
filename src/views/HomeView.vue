<script setup lang="ts">
import site from '../config/site'
</script>

<template>
  <section class="shell hero">
    <p class="eyebrow">{{ site.site.author }}</p>
    <h1>{{ site.site.title }}</h1>
    <p>{{ site.site.description }}</p>
    <RouterLink class="button" to="/library">Browse library</RouterLink>
  </section>
</template>
