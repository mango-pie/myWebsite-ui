<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { LogIn, LogOut, Menu, User, X } from 'lucide-vue-next'
import { userLogout } from '@/api/userController'
import { useLoginUserStore } from '@/stores/loginUser'
import { useCapabilitiesStore } from '@/stores/capabilities'
import { siteConfig } from '@/config/site'
import { PUBLIC_NAV, filterWorkspaceNav, isNavActive } from '@/config/workspaceNav'
import IconAction from '@/components/ui/IconAction.vue'
import { resolveBlogMenuClickPath } from '@/composables/useBlogLastPost'

const router = useRouter()
const route = useRoute()
const loginUserStore = useLoginUserStore()
const capsStore = useCapabilitiesStore()
const mobileOpen = ref(false)

const navItems = computed(() =>
  filterWorkspaceNav(PUBLIC_NAV, loginUserStore.loginUser ?? null, {
    loaded: capsStore.loaded,
    enabled: capsStore.enabled,
  }),
)

const go = (path: string) => {
  let target = path
  if (path === '/blog') {
    target = resolveBlogMenuClickPath(route.path)
  }
  mobileOpen.value = false
  if (target !== route.path) router.push(target)
}

const goLogin = () => {
  mobileOpen.value = false
  if (route.path !== '/user/login') {
    router.push('/user/login')
  }
}

const handleAvatarClick = async (key: string) => {
  if (key === 'profile') {
    await router.push('/user/profile')
    return
  }
  if (key === 'logout') {
    const res = await userLogout()
    if (res.data.code === 0 && res.data.data) {
      loginUserStore.setLoginUser({ userName: '未登录' })
      message.success('已退出登录')
      await router.push('/user/login')
    } else {
      message.error('退出失败，' + res.data.message)
    }
  }
}
</script>

<template>
  <header class="public-header">
    <div class="public-header__brand" @click="go('/')">
      <span class="public-header__mark" aria-hidden="true">紙</span>
      <div class="public-header__titles">
        <span class="public-header__name">{{ siteConfig.siteName }}</span>
        <span v-if="siteConfig.siteSubtitle" class="public-header__sub">{{ siteConfig.siteSubtitle }}</span>
      </div>
    </div>

    <nav class="public-header__nav" aria-label="公开导航">
      <button
        v-for="item in navItems"
        :key="item.key"
        type="button"
        class="public-header__link"
        :class="{ 'is-active': isNavActive(item, route.path) }"
        @click="go(item.path)"
      >
        <component :is="item.icon" :size="16" :stroke-width="1.75" />
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <div class="public-header__actions">
      <template v-if="loginUserStore.loginUser.id">
        <a-dropdown placement="bottomRight" :trigger="['click']">
          <button type="button" class="public-header__user">
            <a-avatar :size="32" :src="loginUserStore.loginUser.userAvatar" />
            <span class="public-header__user-name">{{ loginUserStore.loginUser.userName ?? '无名' }}</span>
          </button>
          <template #overlay>
            <a-menu
              @click="({ key }: { key: string | number }) => handleAvatarClick(String(key))"
            >
              <a-menu-item key="profile">
                <span class="menu-row"><User :size="14" /> 个人信息</span>
              </a-menu-item>
              <a-menu-divider />
              <a-menu-item key="logout">
                <span class="menu-row"><LogOut :size="14" /> 退出登录</span>
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </template>
      <IconAction
        v-else
        :icon="LogIn"
        label="登录"
        variant="primary"
        size="sm"
        @click="goLogin"
      />

      <button
        type="button"
        class="public-header__burger"
        :aria-label="mobileOpen ? '关闭菜单' : '打开菜单'"
        @click="mobileOpen = !mobileOpen"
      >
        <X v-if="mobileOpen" :size="20" />
        <Menu v-else :size="20" />
      </button>
    </div>

    <div v-if="mobileOpen" class="public-header__drawer">
      <button
        v-for="item in navItems"
        :key="`m-${item.key}`"
        type="button"
        class="public-header__drawer-link"
        :class="{ 'is-active': isNavActive(item, route.path) }"
        @click="go(item.path)"
      >
        <component :is="item.icon" :size="18" />
        <span>{{ item.label }}</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.public-header {
  position: relative;
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
  height: 64px;
  padding: 0 24px;
  font-family: var(--font-sans);
}

.public-header__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  cursor: pointer;
}

.public-header__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-border);
  color: var(--color-primary);
  font-family: var(--font-serif);
  font-size: 16px;
  font-weight: 600;
  line-height: 1;
}

.public-header__titles {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.public-header__name {
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.2;
  white-space: nowrap;
}

.public-header__sub {
  font-size: 11px;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.public-header__nav {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.public-header__link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 14px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-secondary);
  font-family: var(--font-sans);
  font-size: var(--font-size-md);
  cursor: pointer;
  transition:
    background 0.25s ease,
    color 0.25s ease;
}

.public-header__link:hover {
  color: var(--color-text-primary);
  background: var(--color-primary-08);
}

.public-header__link.is-active {
  color: var(--color-primary);
  background: var(--color-primary-12);
}

.public-header__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.public-header__user {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px 4px 4px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  cursor: pointer;
}

.public-header__user-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.public-header__burger {
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  cursor: pointer;
}

.public-header__drawer {
  display: none;
  position: absolute;
  top: 64px;
  left: 12px;
  right: 12px;
  padding: 8px;
  border-radius: var(--radius-md);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-lg);
  z-index: 50;
  flex-direction: column;
  gap: 4px;
}

.public-header__drawer-link {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 44px;
  padding: 0 14px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-secondary);
  font-family: var(--font-sans);
  font-size: 15px;
  cursor: pointer;
  text-align: left;
}

.public-header__drawer-link.is-active,
.public-header__drawer-link:hover {
  background: var(--color-primary-08);
  color: var(--color-primary);
}

.menu-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 768px) {
  .public-header {
    padding: 0 12px;
  }

  .public-header__nav {
    display: none;
  }

  .public-header__sub,
  .public-header__user-name {
    display: none;
  }

  .public-header__burger,
  .public-header__drawer {
    display: flex;
  }
}
</style>
