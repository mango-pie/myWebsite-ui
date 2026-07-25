<script setup lang="ts">
import { RouterView, RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const navGroups = [
  {
    title: '内 容',
    items: [{ path: '/admin/blogManage', label: '博客管理', icon: 'feather' }],
  },
  {
    title: '用 户',
    items: [{ path: '/admin/userManage', label: '用户管理', icon: 'users' }],
  },
  {
    title: '系 统',
    items: [
      { path: '/admin/settings', label: '站点设置', icon: 'settings' },
      { path: '/admin/ops/stats', label: '运维统计', icon: 'bar-chart-3' },
    ],
  },
]

function isActive(path: string) {
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="admin-layout">
    <div class="paper-bg" />
    <div class="paper-grain" />

    <aside class="admin-sidebar">
      <RouterLink to="/" class="brand">
        <span class="brand-deco">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 2 L14 10 L22 11 L15 16 L18 24 L12 19 L6 24 L9 16 L2 11 L10 10 Z"
            />
          </svg>
        </span>
        管理后台
      </RouterLink>
      <div v-for="group in navGroups" :key="group.title" class="nav-group">
        <div class="nav-group-title">{{ group.title }}</div>
        <RouterLink
          v-for="item in group.items"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
        >
          {{ item.label }}
        </RouterLink>
      </div>
    </aside>

    <main class="admin-main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 100vh;
}

.admin-sidebar {
  background: var(--paper-surface);
  border-right: 1.5px dashed var(--hairline);
  padding: 20px 0;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.brand {
  font: 22px var(--fd);
  color: var(--ink);
  letter-spacing: 0.08em;
  padding: 0 20px 16px;
  border-bottom: 1.5px dashed var(--hairline);
  margin: 0 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.brand-deco {
  color: var(--st-cream);
  display: inline-flex;
}

.nav-group {
  padding: 8px 12px;
}

.nav-group-title {
  font: 10px var(--fd);
  color: var(--ink-soft);
  letter-spacing: 0.15em;
  padding: 4px 8px;
  margin-bottom: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 8px;
  font: 13px var(--fd);
  color: var(--ink);
  text-decoration: none;
  transition: all 0.2s;
}

.nav-item:hover {
  background: rgba(255, 253, 248, 0.6);
}

.nav-item.active {
  background: var(--accent);
  color: #FFFDF8;
}

.admin-main {
  padding: 28px 32px;
  overflow-x: hidden;
}

@media (max-width: 1100px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }
  .admin-sidebar {
    display: none;
  }
}

@media (max-width: 640px) {
  .admin-main {
    padding: 20px 16px;
  }
}
</style>
