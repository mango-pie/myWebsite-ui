import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { permissionDirective } from '@/directives/permission'

import App from './App.vue'
import router from './router'

import Antd from 'ant-design-vue'

import 'ant-design-vue/dist/reset.css'
import '@fontsource/zcool-kuaile'
import '@/assets/base.css'
import '@/assets/blog-prose.css'
import '@/assets/blog-shell.css'
import '@/access'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Antd)

app.directive('permission', permissionDirective)

app.mount('#app')
