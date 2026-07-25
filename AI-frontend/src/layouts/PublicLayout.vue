<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useModuleStore } from '@/stores/modules'

const userStore = useUserStore()
const moduleStore = useModuleStore()
const route = useRoute()

onMounted(async () => {
  await Promise.all([userStore.fetchUser(), moduleStore.fetchModules()])
})

const navItems = [
  { path: '/', label: '首页', name: 'home' },
  { path: '/blog', label: '随笔', name: 'blog', module: 'blog' },
  { path: '/about', label: '关于', name: 'about' },
]

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="public-layout">
    <div class="paper-bg" />
    <div class="paper-grain" />

    <header class="shell">
      <RouterLink to="/" class="mark">
        <span class="mark-deco">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 2 L14 10 L22 11 L15 16 L18 24 L12 19 L6 24 L9 16 L2 11 L10 10 Z"
            />
          </svg>
        </span>
        纸间
      </RouterLink>
      <nav>
        <template v-for="item in navItems" :key="item.path">
          <RouterLink
            v-if="!item.module || moduleStore.isEnabled(item.module)"
            :to="item.path"
            :class="{ active: isActive(item.path) }"
          >
            {{ item.label }}
          </RouterLink>
        </template>
        <RouterLink
          v-if="userStore.isLoggedIn"
          to="/user/profile"
          :class="{ active: isActive('/user') }"
        >
          我的
        </RouterLink>
        <RouterLink v-else to="/user/login" :class="{ active: isActive('/user/login') }">
          登录
        </RouterLink>
      </nav>
    </header>

    <main class="public-main">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <footer class="foot">
      <svg
        class="wave"
        width="120"
        height="16"
        viewBox="0 0 120 16"
      >
        <path
          d="M0 8 Q15 0, 30 8 T60 8 T90 8 T120 8"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
        />
      </svg>
      纸间 · {{ new Date().getFullYear() }} · Powered by Vue 3 + Vite
    </footer>
  </div>
</template>

<style scoped>
.public-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.shell {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(253, 249, 240, 0.92);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1.5px dashed var(--hairline);
  padding: 14px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mark {
  font: 28px var(--fd);
  color: var(--ink);
  letter-spacing: 0.08em;
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.mark-deco {
  color: var(--st-cream);
  display: inline-flex;
}

.shell nav {
  display: flex;
  gap: 28px;
  font: 15px var(--fd);
}

.shell nav a {
  color: var(--ink);
  text-decoration: none;
  padding: 6px 4px;
  border-bottom: 2px solid transparent;
  transition: all 0.25s;
}

.shell nav a.active,
.shell nav a:hover {
  color: var(--accent);
  border-bottom-color: var(--accent);
  border-bottom-style: solid;
}

.public-main {
  flex: 1;
}

.foot {
  border-top: 1.5px dashed var(--hairline);
  padding: 48px 32px;
  text-align: center;
  color: var(--ink-soft);
  font-size: 13px;
}

.foot .wave {
  display: block;
  margin: 0 auto 16px;
  color: var(--hairline);
}

.page-enter-active,
.page-leave-active {
  transition: all 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 640px) {
  .shell {
    padding: 12px 20px;
  }
  .shell nav {
    gap: 16px;
    font-size: 13px;
  }
}
</style>
