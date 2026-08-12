<script setup lang="ts">
import { computed } from 'vue'
import site from '../../config/site'
import { useThemeStore, type Theme } from '../../stores/theme.store'
import IconButton from '../ui/IconButton.vue'

const themeStore = useThemeStore()

/**
 * Single-glyph representation of each theme, matching the existing
 * IconButton convention elsewhere in the app (plain Unicode
 * characters — see ReaderView's "Aa"/"×" and the dev preview's
 * "←"/"→"/"⚙" — rather than an icon library).
 */
const THEME_GLYPHS: Record<Theme, string> = {
  light: '☀',
  cream: '◐',
  dark: '☾',
}

const themeGlyph = computed(() => THEME_GLYPHS[themeStore.theme])

const nextTheme = computed<Theme>(() => {
  const themes = themeStore.availableThemes
  const currentIndex = themes.indexOf(themeStore.theme)
  return themes[(currentIndex + 1) % themes.length] as Theme
})

function cycleTheme() {
  themeStore.setTheme(nextTheme.value)
}
</script>

<template>
  <header class="site-header glass-surface">
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

    <div class="header-actions">
      <nav aria-label="Main navigation">
        <RouterLink to="/library">
          Library
        </RouterLink>
        <RouterLink to="/search">
          Search
        </RouterLink>
      </nav>

      <IconButton
        class="theme-toggle"
        :label="`Switch to ${nextTheme} theme`"
        @click="cycleTheme"
      >
        {{ themeGlyph }}
      </IconButton>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem max(1rem, calc((100vw - 1100px) / 2));
  /* Color comes from the .glass-surface utility (border-color), so
     this only sets the edge's width/style. */
  border-bottom-width: 1px;
  border-bottom-style: solid;
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

nav {
  display: flex;
  gap: 1rem;
}

.theme-toggle {
  font-size: 1.1rem;
}
</style>
