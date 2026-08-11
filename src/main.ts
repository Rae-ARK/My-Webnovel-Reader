import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './styles.css'
import { appContainer } from './container'

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
