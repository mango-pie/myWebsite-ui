import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vitest/config'

// 纯逻辑单测（node 环境），不挂 Vue 插件；组件级测试引入时再扩展
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/__tests__/**/*.test.ts'],
    environment: 'node',
  },
})
