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

// Browsers render <link rel="icon"> into a square tab slot and will
// stretch or crop a non-square source image to fill it — so if
// site.config.reader.ts's `icon` isn't itself square (e.g. a wide
// wordmark logo), the browser tab icon comes out distorted even
// though the same file looks fine elsewhere (the header/hero <img>
// tags constrain it with height + object-fit: contain instead).
//
// Rather than requiring every author to pre-crop their logo to an
// exact square, wrap whatever they point `icon` at in a small square
// SVG that letterboxes it (preserveAspectRatio="xMidYMid meet"
// scales it down to fit and centers it, adding transparent padding
// on the short axis instead of stretching or cropping). This works
// for any source format — raster or vector — since SVG's <image>
// element can embed either.
function buildSquareFaviconHref(iconPath: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
    `<image href="${iconPath}" x="0" y="0" width="64" height="64" ` +
    `preserveAspectRatio="xMidYMid meet" /></svg>`

  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const faviconLink =
  document.querySelector<HTMLLinkElement>('link[rel="icon"]') ??
  document.head.appendChild(document.createElement('link'))

faviconLink.setAttribute('rel', 'icon')
faviconLink.setAttribute('type', 'image/svg+xml')
faviconLink.setAttribute('href', buildSquareFaviconHref(site.site.icon))

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
