<script setup lang="ts">
/**
 * 基础布局页 - 全站通用布局
 * 包含：顶部导航（GlobalHeader）、主内容区（RouterView）、页脚（GlobalFooter）
 * 菜单项来自 src/config/permission.ts 的 MENU_ITEMS，按当前用户权限过滤展示
 */
import { computed, onMounted } from 'vue'
import { useRoute, useRouter, RouterView } from 'vue-router'
import GlobalHeader from '@/components/GlobalHeader.vue'
import GlobalFooter from '@/components/GlobalFooter.vue'
import { useLoginUserStore } from '@/stores/loginUser'
import { MENU_ITEMS, canShowMenuItem } from '@/config/permission'

/** 导航菜单单项类型（与 GlobalHeader 使用一致） */
interface MenuItem {
  key: string
  label: string
  path: string
}

const router = useRouter()
const route = useRoute()
const loginUserStore = useLoginUserStore()

onMounted(() => {
  loginUserStore.fetchLoginUser()
})

/** 根据权限过滤后的菜单项 */
const menuItems = computed<MenuItem[]>(() => {
  const user = loginUserStore.loginUser ?? null
  return MENU_ITEMS.filter((item) => canShowMenuItem(item, user)).map(({ key, label, path }) => ({
    key,
    label,
    path,
  }))
})

/** 当前路由对应的菜单选中项（精确匹配优先，否则按路径前缀匹配，便于子路由高亮父菜单） */
const selectedKeys = computed(() => {
  const currentPath = route.path
  const items = menuItems.value
  const exact = items.find((item) => item.path === currentPath)
  const prefix = items
    .filter((item) => item.path !== '/')
    .find((item) => currentPath.startsWith(item.path))
  const matched = exact ?? prefix
  return matched ? [matched.key] : []
})

/** 顶部菜单点击：根据 key 找到对应 path 并跳转（若已在当前页则不重复 push） */
const handleMenuClick = (key: string) => {
  const target = menuItems.value.find((item) => item.key === key)
  if (target && target.path !== route.path) {
    router.push(target.path)
  }
}
</script>

<template>
  <!-- 整体：上-中-下结构，内容区自适应高度 -->
  <a-layout class="basic-layout">
    <a-layout-header class="basic-layout__header">
      <GlobalHeader
        :menu-items="menuItems"
        :selected-keys="selectedKeys"
        @menuClick="handleMenuClick"
      />
    </a-layout-header>

    <a-layout-content class="basic-layout__content">
      <RouterView />
    </a-layout-content>

    <a-layout-footer class="basic-layout__footer">
      <GlobalFooter />
    </a-layout-footer>
  </a-layout>
</template>

<style scoped>
.basic-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.basic-layout__header {
  display: flex;
  align-items: center;
  padding: 0;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  z-index: 10;
}

.basic-layout__content {
  flex: 1;
  padding: 24px;
  background: #f5f5f5;
}

.basic-layout__footer {
  text-align: center;
  padding: 12px 16px;
  background: #ffffff;
}

@media (max-width: 768px) {
  .basic-layout__content {
    padding: 12px;
  }
}
</style>

