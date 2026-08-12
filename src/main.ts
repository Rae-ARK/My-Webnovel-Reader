import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './styles.css'
import { appContainer } from './container'
import site from './config/site'

// index.html's <title> is static HTML in a Vite SPA and can't read
// site.config.reader.ts at build time, so the real tab title is set
// here at runtime. This means the very first paint briefly shows the
// static fallback title from index.html before JS runs.
document.title = site.site.title

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
