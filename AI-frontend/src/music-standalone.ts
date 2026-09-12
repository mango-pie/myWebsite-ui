import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'

import MusicStandaloneApp from './MusicStandaloneApp.vue'
import { isTauriRuntime } from '@/integrations/musicRuntime'
import { registerSW } from 'virtual:pwa-register'

import '@fontsource/zcool-kuaile'
import '@/assets/base.css'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/:pathMatch(.*)*',
      name: '独立音乐播放器',
      component: MusicStandaloneApp,
    },
  ],
})

const app = createApp(MusicStandaloneApp)

app.use(createPinia())
app.use(router)
app.mount('#app')

if (!isTauriRuntime()) {
  registerSW({ immediate: true })
}
