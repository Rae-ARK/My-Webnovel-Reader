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
  <div class="app-shell">
    <SiteHeader />

    <!-- Each view owns its own <main> landmark, so this is a plain
         wrapper (not another <main>) — it exists purely to grow and
         push SiteFooter to the bottom on short pages. -->
    <div class="app-content">
      <RouterView />
    </div>

    <SiteFooter />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-content {
  flex: 1 0 auto;
}
</style>
