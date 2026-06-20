import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    hmr: {
      overlay: true,
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
    watch: {
      usePolling: false,
      ignored: ['node_modules', '.git', 'dist'],
    },
    proxy: {
      '/api/uploads': {
        target: 'http://localhost:8123',
        changeOrigin: true,
      },
      '/netease-api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/netease-api/, ''),
      },
      '/hitokoto-api': {
        target: 'https://v1.hitokoto.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/hitokoto-api/, ''),
      },
      '/netease-img': {
        target: 'https://p1.music.126.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/netease-img/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Referer', 'https://music.163.com/')
            proxyReq.setHeader('Origin', 'https://music.163.com')
          })
        },
      },
    },
  },
})
