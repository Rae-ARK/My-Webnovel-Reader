<script setup lang="ts">
import site from '../../config/site'
import { useThemeStore, type Theme } from '../../stores/theme.store'
import Button from '../ui/Button.vue'

const themeStore = useThemeStore()

const themeOptions: Theme[] = ['light', 'cream', 'dark']

const contactHref = `mailto:${site.contact.email}?subject=${encodeURIComponent(
  site.contact.subjectTemplate,
)}`

/**
 * Known platforms get a friendlier display label; anything else
 * falls back to a capitalized version of the raw config value so a
 * new platform doesn't need a code change to show up correctly.
 */
const PLATFORM_LABELS: Record<string, string> = {
  github: 'GitHub',
  twitter: 'Twitter / X',
  x: 'Twitter / X',
  discord: 'Discord',
  bluesky: 'Bluesky',
  instagram: 'Instagram',
  kofi: 'Ko-fi',
  patreon: 'Patreon',
}

function platformLabel(platform: string): string {
  return (
    PLATFORM_LABELS[platform.toLowerCase()] ??
    platform.charAt(0).toUpperCase() + platform.slice(1)
  )
}
</script>

<template>
  <footer class="site-footer">
    <div class="shell footer-grid">
      <section
        class="footer-column"
        aria-labelledby="footer-about-heading"
      >
        <h2
          id="footer-about-heading"
          class="footer-heading"
        >
          About
        </h2>
        <p class="footer-about">
          {{ site.site.about }}
        </p>
      </section>

      <section
        class="footer-column"
        aria-labelledby="footer-theme-heading"
      >
        <h2
          id="footer-theme-heading"
          class="footer-heading"
        >
          Theme
        </h2>
        <div class="footer-theme-buttons">
          <Button
            v-for="theme in themeOptions"
            :key="theme"
            :variant="themeStore.theme === theme ? 'primary' : 'secondary'"
            @click="themeStore.setTheme(theme)"
          >
            {{ theme }}
          </Button>
        </div>
      </section>

      <section
        v-if="site.social.length"
        class="footer-column"
        aria-labelledby="footer-social-heading"
      >
        <h2
          id="footer-social-heading"
          class="footer-heading"
        >
          Follow Us On
        </h2>
        <ul class="footer-links">
          <li
            v-for="entry in site.social"
            :key="entry.platform"
          >
            <a
              :href="entry.url"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ platformLabel(entry.platform) }}
            </a>
          </li>
        </ul>
      </section>

      <section
        class="footer-column"
        aria-labelledby="footer-contact-heading"
      >
        <h2
          id="footer-contact-heading"
          class="footer-heading"
        >
          Contact
        </h2>
        <ul class="footer-links">
          <li>
            <a :href="contactHref">{{ site.contact.email }}</a>
          </li>
        </ul>
      </section>

      <section
        class="footer-column"
        aria-labelledby="footer-support-heading"
      >
        <h2
          id="footer-support-heading"
          class="footer-heading"
        >
          Report an Issue
        </h2>
        <ul class="footer-links">
          <li>
            <a
              :href="site.support.issuesUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open an issue
            </a>
          </li>
        </ul>
      </section>

      <section
        v-if="site.advertising"
        class="footer-column"
        aria-labelledby="footer-advertising-heading"
      >
        <h2
          id="footer-advertising-heading"
          class="footer-heading"
        >
          Advertising
        </h2>
        <!-- eslint-disable-next-line vue/no-v-html -- trusted, author-authored config, not user input -->
        <div v-html="site.advertising.html" />
      </section>
    </div>

    <div class="shell footer-legal-bar">
      <RouterLink to="/legal/privacy-policy">
        Privacy Policy
      </RouterLink>
      <span
        class="footer-legal-separator"
        aria-hidden="true"
      >|</span>
      <RouterLink to="/legal/terms">
        Terms & Conditions
      </RouterLink>
      <span
        class="footer-legal-separator"
        aria-hidden="true"
      >|</span>
      <RouterLink to="/legal/code-of-conduct">
        Code of Conduct
      </RouterLink>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  border-top: 1px solid var(--border);
  background: var(--bg-elevated);
}

.footer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: 2rem;
  padding-block: 2.5rem;
}

.footer-heading {
  margin: 0 0 0.75rem;
  color: var(--text);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.footer-about {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.9rem;
  line-height: 1.6;
}

.footer-theme-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.footer-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.footer-links a {
  color: var(--text-muted);
  font-size: 0.9rem;
  text-decoration: none;
}

.footer-links a:hover {
  color: var(--accent);
  text-decoration: underline;
}

.footer-legal-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding-block: 1rem;
  border-top: 1px solid var(--border);
  font-size: 0.8rem;
}

.footer-legal-bar a {
  color: var(--text-muted);
  text-decoration: none;
}

.footer-legal-bar a:hover {
  color: var(--accent);
  text-decoration: underline;
}

.footer-legal-separator {
  color: var(--border);
}
</style>
