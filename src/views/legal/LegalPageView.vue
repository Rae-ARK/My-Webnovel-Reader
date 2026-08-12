<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import site from '../../config/site'

/**
 * A single reusable view for all three legal routes, since they're
 * identical in structure and only differ in which config field they
 * render. Keeps this to one component instead of three near-copies.
 */
const LEGAL_PAGES = {
  'privacy-policy': {
    key: 'privacyPolicy',
    eyebrow: 'Legal',
    title: 'Privacy Policy',
  },
  terms: {
    key: 'termsAndConditions',
    eyebrow: 'Legal',
    title: 'Terms & Conditions',
  },
  'code-of-conduct': {
    key: 'codeOfConduct',
    eyebrow: 'Legal',
    title: 'Code of Conduct',
  },
} as const satisfies Record<
  string,
  { key: keyof typeof site.legal; eyebrow: string; title: string }
>

type LegalSlug = keyof typeof LEGAL_PAGES

function isLegalSlug(value: unknown): value is LegalSlug {
  return typeof value === 'string' && value in LEGAL_PAGES
}

const route = useRoute()

const page = computed(() => {
  const slug = route.params.slug
  return isLegalSlug(slug) ? LEGAL_PAGES[slug] : null
})

// Author-authored config text may use blank lines to separate
// paragraphs; split on those so a longer policy reads naturally
// instead of as one dense block.
const paragraphs = computed(() => {
  if (!page.value) return []
  const content = site.legal[page.value.key]
  return content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
})
</script>

<template>
  <main class="shell legal-page">
    <template v-if="page">
      <header class="page-header">
        <p class="eyebrow">
          {{ page.eyebrow }}
        </p>
        <h1>{{ page.title }}</h1>
      </header>

      <div class="legal-content">
        <p
          v-for="(paragraph, index) in paragraphs"
          :key="index"
        >
          {{ paragraph }}
        </p>
      </div>
    </template>

    <template v-else>
      <header class="page-header">
        <h1>Page not found</h1>
        <p class="page-description">
          That legal page doesn't exist.
        </p>
      </header>
    </template>
  </main>
</template>

<style scoped>
.legal-page {
  padding-block: 3rem 4rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  margin: 0.25rem 0 0;
  color: var(--text);
}

.page-description {
  margin-top: 0.5rem;
  color: var(--text-muted);
}

.legal-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 65ch;
  color: var(--text);
  line-height: 1.7;
}
</style>
