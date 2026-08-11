import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './styles.css'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('./views/HomeView.vue') },
    { path: '/library', component: () => import('./views/LibraryView.vue') },
    { path: '/fiction/:id', component: () => import('./views/FictionView.vue') },
    {
      path: '/read/:fictionId/:chapterId',
      component: () => import('./views/ReaderView.vue'),
    },
  ],
})

createApp(App).use(router).mount('#app')
