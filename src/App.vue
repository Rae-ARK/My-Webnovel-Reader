<script setup lang="ts">
import { onMounted } from 'vue'
import { useThemeStore } from './stores/theme.store'
import SiteHeader from './components/layout/SiteHeader.vue'
import SiteFooter from './components/layout/SiteFooter.vue'

const themeStore = useThemeStore()

onMounted(() => {
  themeStore.initialize()
})
</script>

<template>
  <SiteHeader />

  <main>
    <RouterView />
  </main>

  <SiteFooter />
</template>
