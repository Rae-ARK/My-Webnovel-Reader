import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './styles.css'
import { appContainer } from './container'
import site from './config/site'

// index.html's <title>/<link rel="icon"> are static HTML in a Vite
// SPA and can't read site.config.reader.ts at build time, so the real
// tab title/favicon are set here at runtime. This means the very
// first paint briefly shows index.html's static fallback values
// before JS runs — keep those fallbacks reasonably in sync with this
// file's real config.
document.title = site.site.title

const FAVICON_MIME_TYPES: Record<string, string> = {
  svg: 'image/svg+xml',
  png: 'image/png',
  ico: 'image/x-icon',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

const faviconExtension = site.site.icon.split('.').pop()?.toLowerCase() ?? ''
const faviconLink =
  document.querySelector<HTMLLinkElement>('link[rel="icon"]') ??
  document.head.appendChild(document.createElement('link'))

faviconLink.setAttribute('rel', 'icon')
faviconLink.setAttribute('type', FAVICON_MIME_TYPES[faviconExtension] ?? 'image/png')
faviconLink.setAttribute('href', site.site.icon)

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('./views/HomeView.vue') },
    { path: '/library', component: () => import('./views/LibraryView.vue') },
    { path: '/search', component: () => import('./views/SearchView.vue') },
    { path: '/fiction/:id', component: () => import('./views/FictionView.vue') },
    {
      path: '/read/:fictionId/:chapterId',
      component: () => import('./views/ReaderView.vue'),
    },
    {
      path: '/dev/theme-preview',
      component: () => import('./views/dev/ThemePreviewView.vue'),
    },
    {
      path: '/legal/:slug',
      component: () => import('./views/legal/LegalPageView.vue'),
    },
  ],
})

async function bootstrap() {
  await appContainer.initialize()

  createApp(App)
    .use(createPinia())
    .use(router)
    .mount('#app')
}

bootstrap().catch((error) => {
  console.error('Failed to initialize application:', error)
})
