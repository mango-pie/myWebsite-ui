<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useCapabilitiesStore } from '@/stores/capabilities'
import { filterGatedEntries } from '@/utils/moduleGate'

const userStore = useUserStore()
const caps = useCapabilitiesStore()
const route = useRoute()

const navItems = [
  { path: '/diary', label: '日记', requireModule: 'diary' },
  { path: '/chat', label: '对话', requireModule: 'chat' },
  { path: '/knowledge', label: '知识库', requireModule: 'knowledge' },
  { path: '/lab', label: '实验室', requireModule: 'app-lab' },
]

const visibleNav = computed(() => {
  const gate = { loaded: caps.loaded, enabled: caps.enabled }
  return filterGatedEntries(navItems, gate)
})

function isActive(path: string) {
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="workspace-layout">
    <div class="paper-bg" />
    <div class="paper-grain" />

    <header class="shell">
      <RouterLink to="/" class="mark">
        <span class="mark-deco">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 2 L14 10 L22 11 L15 16 L18 24 L12 19 L6 24 L9 16 L2 11 L10 10 Z"
            />
          </svg>
        </span>
        纸间 · 工作区
      </RouterLink>
      <nav>
        <RouterLink
          v-for="item in visibleNav"
          :key="item.path"
          :to="item.path"
          :class="{ active: isActive(item.path) }"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
      <nav class="user-nav">
        <RouterLink to="/user/profile" :class="{ active: isActive('/user/profile') }">
          {{ userStore.user?.userName || '我的' }}
        </RouterLink>
      </nav>
    </header>

    <main class="workspace-main">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<style scoped>
.workspace-layout {
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
  gap: 24px;
}

.mark {
  font: 24px var(--fd);
  color: var(--ink);
  letter-spacing: 0.06em;
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  white-space: nowrap;
}

.mark-deco {
  color: var(--st-cream);
  display: inline-flex;
}

.shell nav {
  display: flex;
  gap: 24px;
  font: 14px var(--fd);
}

.user-nav {
  margin-left: auto;
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

.workspace-main {
  flex: 1;
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

@media (max-width: 960px) {
  .shell {
    flex-wrap: wrap;
    gap: 12px;
  }
  .shell nav {
    gap: 14px;
    font-size: 13px;
  }
}

@media (max-width: 640px) {
  .shell {
    padding: 12px 16px;
  }
}
</style>
