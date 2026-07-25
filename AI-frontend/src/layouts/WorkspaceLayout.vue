<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { Bell, HelpCircle, LogIn, LogOut, Search, Settings, User } from 'lucide-vue-next'
import { message } from 'ant-design-vue'
import WorkspaceRail from '@/components/workspace/WorkspaceRail.vue'
import { useLoginUserStore } from '@/stores/loginUser'
import { siteConfig } from '@/config/site'
import { userLogout } from '@/api/userController'

const route = useRoute()
const router = useRouter()
const loginUserStore = useLoginUserStore()
const searchDraft = ref('')
const year = new Date().getFullYear()

const chapterTitle = computed(() => {
  const name = typeof route.name === 'string' ? route.name : ''
  return name || '正文'
})

const goHome = () => {
  if (route.path !== '/') router.push('/')
}

const submitSearch = () => {
  const q = searchDraft.value.trim()
  if (!q) return
  router.push({ path: '/blog', query: { q } })
}

const goLogin = () => {
  if (route.path !== '/user/login') router.push('/user/login')
}

const handleAvatarClick = async (key: string) => {
  if (key === 'profile') {
    await router.push('/user/profile')
    return
  }
  if (key === 'settings') {
    await router.push('/admin/settings/site')
    return
  }
  if (key === 'logout') {
    const res = await userLogout()
    if (res.data.code === 0 && res.data.data) {
      loginUserStore.setLoginUser({ userName: '未登录' })
      message.success('已合上此页')
      await router.push('/user/login')
    } else {
      message.error('退出失败，' + res.data.message)
    }
  }
}

onMounted(() => {
  loginUserStore.fetchLoginUser()
})
</script>

<template>
  <div class="book-shell" :data-room="(route.meta.room as string) || 'workspace'">
    <header class="book-titlebar">
      <button type="button" class="book-titlebar__brand" @click="goHome">
        <span class="book-seal" aria-hidden="true">紙</span>
        <span class="book-titlebar__name">{{ siteConfig.siteName }}</span>
      </button>

      <div class="book-titlebar__chapter">
        <span class="book-titlebar__chapter-label">本章</span>
        <span class="book-titlebar__chapter-title">{{ chapterTitle }}</span>
      </div>

      <div class="book-titlebar__actions">
        <label class="book-search">
          <Search :size="14" :stroke-width="2" aria-hidden="true" />
          <input
            v-model="searchDraft"
            type="search"
            placeholder="检索书页…"
            @keydown.enter.prevent="submitSearch"
          />
        </label>
        <button type="button" class="book-icon-btn" aria-label="通知" title="通知">
          <Bell :size="16" :stroke-width="1.75" />
        </button>
        <template v-if="loginUserStore.loginUser.id">
          <a-dropdown placement="bottomRight" :trigger="['click']">
            <button type="button" class="book-user" aria-label="用户菜单">
              <a-avatar :size="28" :src="loginUserStore.loginUser.userAvatar" />
            </button>
            <template #overlay>
              <a-menu @click="({ key }: { key: string | number }) => handleAvatarClick(String(key))">
                <a-menu-item key="profile">
                  <span class="menu-row"><User :size="14" /> 个人信息</span>
                </a-menu-item>
                <a-menu-item key="settings">
                  <span class="menu-row"><Settings :size="14" /> 设置</span>
                </a-menu-item>
                <a-menu-divider />
                <a-menu-item key="logout">
                  <span class="menu-row"><LogOut :size="14" /> 退出</span>
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </template>
        <button v-else type="button" class="book-icon-btn" aria-label="登录" title="登录" @click="goLogin">
          <LogIn :size="16" :stroke-width="1.75" />
        </button>
      </div>
    </header>

    <div class="book-spread">
      <aside class="book-index" aria-label="侧边索引">
        <div class="book-index__label">目录索引</div>
        <WorkspaceRail />
        <div class="book-index__tools">
          <button
            type="button"
            class="book-bookmark"
            title="帮助"
            @click="router.push('/about')"
          >
            <HelpCircle :size="16" :stroke-width="1.75" />
            <span class="book-bookmark__label">帮助</span>
          </button>
          <button
            type="button"
            class="book-bookmark"
            title="设置"
            @click="router.push(loginUserStore.loginUser.id ? '/user/profile' : '/user/login')"
          >
            <Settings :size="16" :stroke-width="1.75" />
            <span class="book-bookmark__label">设置</span>
          </button>
        </div>
      </aside>

      <section class="book-folio">
        <div class="book-folio__scroll">
          <RouterView v-slot="{ Component, route: viewRoute }">
            <Transition name="folio-ink" mode="out-in">
              <KeepAlive include="ChatPage">
                <component
                  :is="Component"
                  v-if="Component"
                  :key="viewRoute.meta.keepAlive ? viewRoute.path : viewRoute.fullPath"
                />
              </KeepAlive>
            </Transition>
          </RouterView>
        </div>
        <div class="book-folio__colophon">
          © {{ year }} {{ siteConfig.siteName }} · 页脚注释
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.book-user {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.2em;
  height: 2.2em;
  padding: 0;
  border: 1px solid var(--book-rule, var(--color-border));
  border-radius: 2px;
  background: rgba(250, 246, 235, 0.75);
  cursor: pointer;
  transition:
    border-color 0.25s ease,
    transform 0.28s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.book-user:hover {
  border-color: rgba(122, 31, 31, 0.35);
}

.book-user:active {
  transform: scale(0.94) rotateY(-6deg);
}

.menu-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

/* WorkspaceRail 嵌在索引栏内时，去掉固定定位外壳 */
.book-index :deep(.workspace-rail) {
  width: auto;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.book-index :deep(.rail-inner) {
  position: static;
  width: auto !important;
  height: auto;
  flex: 1;
  min-height: 0;
  padding: 0;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  overflow: visible;
}

.book-index :deep(.rail-nav) {
  overflow-y: auto;
}

@media (max-width: 900px) {
  .book-index :deep(.workspace-rail) {
    flex: 1;
    min-width: 0;
  }

  .book-index :deep(.rail-inner),
  .book-index :deep(.rail-inner.is-expanded) {
    position: static;
    top: auto;
    bottom: auto;
    left: auto;
    right: auto;
    width: auto !important;
    flex-direction: row;
    padding: 0;
    border: none !important;
    box-shadow: none !important;
  }

  .book-index :deep(.rail-nav) {
    flex-direction: row;
    overflow-x: auto;
  }

  .book-index :deep(.rail-divider),
  .book-index :deep(.rail-item__label),
  .book-index :deep(.rail-item__chevron),
  .book-index :deep(.rail-group .rail-sub) {
    display: none;
  }

  .book-index :deep(.rail-item) {
    width: 2.85em;
    min-height: 2.85em;
    padding: 0;
    justify-content: center;
  }

  .book-index :deep(.rail-group) {
    display: contents;
  }
}
</style>
