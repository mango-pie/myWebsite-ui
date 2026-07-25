<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { Bell, LogIn, LogOut, Menu, Search, User, X } from 'lucide-vue-next'
import { message } from 'ant-design-vue'
import GlobalFooter from '@/components/GlobalFooter.vue'
import { useBackgroundSlideshow } from '@/composables/useBackgroundSlideshow'
import { useLoginUserStore } from '@/stores/loginUser'
import { useCapabilitiesStore } from '@/stores/capabilities'
import { siteConfig } from '@/config/site'
import { PUBLIC_NAV, filterWorkspaceNav, isNavActive } from '@/config/workspaceNav'
import { resolveBlogMenuClickPath } from '@/composables/useBlogLastPost'
import { userLogout } from '@/api/userController'

const route = useRoute()
const router = useRouter()
const loginUserStore = useLoginUserStore()
const capsStore = useCapabilitiesStore()
const isScrolled = ref(false)
const mobileOpen = ref(false)
const searchDraft = ref('')
const year = new Date().getFullYear()
const { layerA, layerB, activeLayer, hasImages, fadeDuration } = useBackgroundSlideshow()

const room = computed(() => (route.meta.room as string) || 'public')
const isHome = computed(() => route.path === '/')
const chapterTitle = computed(() => {
  if (isHome.value) return '卷首'
  const name = typeof route.name === 'string' ? route.name : ''
  return name || siteConfig.siteName
})

const navItems = computed(() =>
  filterWorkspaceNav(PUBLIC_NAV, loginUserStore.loginUser ?? null, {
    loaded: capsStore.loaded,
    enabled: capsStore.enabled,
  }),
)

const onScroll = () => {
  isScrolled.value = window.scrollY > 20
}

const go = (path: string) => {
  let target = path
  if (path === '/blog') {
    target = resolveBlogMenuClickPath(route.path)
  }
  mobileOpen.value = false
  if (target !== route.path) router.push(target)
}

const goHome = () => go('/')

const goLogin = () => {
  mobileOpen.value = false
  if (route.path !== '/user/login') router.push('/user/login')
}

const submitSearch = () => {
  const q = searchDraft.value.trim()
  if (!q) return
  router.push({ path: '/blog', query: { q } })
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
      message.success('已合上此页')
      await router.push('/user/login')
    } else {
      message.error('退出失败，' + res.data.message)
    }
  }
}

onMounted(() => {
  loginUserStore.fetchLoginUser()
  window.addEventListener('scroll', onScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <div class="book-shell public-book" :class="{ 'public-book--home': isHome }" :data-room="room">
    <div v-if="hasImages" class="background-effects" :style="{ '--bg-fade-duration': fadeDuration }">
      <img
        v-if="layerA"
        class="background-effects__image"
        :class="{ 'is-active': activeLayer === 'a' }"
        :src="layerA"
        alt=""
      />
      <img
        v-if="layerB"
        class="background-effects__image"
        :class="{ 'is-active': activeLayer === 'b' }"
        :src="layerB"
        alt=""
      />
      <div class="background-effects__overlay" />
    </div>

    <header class="book-titlebar" :class="{ 'is-scrolled': isScrolled }">
      <button type="button" class="book-titlebar__brand" @click="goHome">
        <span class="book-seal" aria-hidden="true">紙</span>
        <span class="book-titlebar__name">{{ siteConfig.siteName }}</span>
      </button>

      <div class="book-titlebar__chapter">
        <span class="book-titlebar__chapter-label">本章</span>
        <span class="book-titlebar__chapter-title">{{ chapterTitle }}</span>
      </div>

      <div class="book-titlebar__actions">
        <nav class="public-book__nav" aria-label="公开导航">
          <button
            v-for="item in navItems"
            :key="item.key"
            type="button"
            class="public-book__nav-link"
            :class="{ 'is-active': isNavActive(item, route.path) }"
            @click="go(item.path)"
          >
            {{ item.label }}
          </button>
        </nav>

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
                <a-menu-divider />
                <a-menu-item key="logout">
                  <span class="menu-row"><LogOut :size="14" /> 退出</span>
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </template>
        <button
          v-else
          type="button"
          class="book-icon-btn"
          aria-label="登录"
          title="登录"
          @click="goLogin"
        >
          <LogIn :size="16" :stroke-width="1.75" />
        </button>

        <button
          type="button"
          class="book-icon-btn public-book__burger"
          :aria-label="mobileOpen ? '关闭目录' : '打开目录'"
          @click="mobileOpen = !mobileOpen"
        >
          <X v-if="mobileOpen" :size="18" />
          <Menu v-else :size="18" />
        </button>
      </div>

      <div v-if="mobileOpen" class="public-book__drawer">
        <button
          v-for="item in navItems"
          :key="`m-${item.key}`"
          type="button"
          class="book-bookmark"
          :class="{ 'is-active': isNavActive(item, route.path) }"
          @click="go(item.path)"
        >
          <component :is="item.icon" :size="16" />
          <span class="book-bookmark__label">{{ item.label }}</span>
        </button>
      </div>
    </header>

    <main class="book-folio public-book__folio">
      <div class="book-folio__scroll">
        <RouterView v-slot="{ Component, route: viewRoute }">
          <Transition name="folio-ink" mode="out-in">
            <component :is="Component" :key="viewRoute.fullPath" />
          </Transition>
        </RouterView>
      </div>
    </main>

    <footer v-if="!isHome" class="public-book__footer">
      <GlobalFooter />
    </footer>
    <footer v-else class="public-book__colophon">
      © {{ year }} {{ siteConfig.siteName }} · {{ siteConfig.footer.tagline }}
    </footer>
  </div>
</template>

<style scoped>
.public-book {
  min-height: 100vh;
  min-height: 100dvh;
}

.background-effects {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.background-effects__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity var(--bg-fade-duration, 1.2s) ease;
}

.background-effects__image.is-active {
  opacity: 0.1;
}

.background-effects__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(245, 240, 225, 0.9) 0%, rgba(245, 240, 225, 0.97) 100%);
}

.book-titlebar {
  position: sticky;
  top: 0;
  z-index: 100;
  transition:
    background 0.35s ease,
    box-shadow 0.35s ease;
}

.book-titlebar.is-scrolled {
  background: rgba(245, 240, 225, 0.94);
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 18px rgba(58, 42, 28, 0.06);
}

.public-book__nav {
  display: none;
  align-items: center;
  gap: 0.15em;
  margin-right: 0.35em;
}

.public-book__nav-link {
  height: 2.1em;
  padding: 0 0.7em;
  border: none;
  border-radius: 2px;
  background: transparent;
  color: var(--book-ink-soft, var(--color-text-secondary));
  font-family: var(--font-sans);
  font-size: 0.82em;
  cursor: pointer;
  transition:
    color 0.25s ease,
    background 0.25s ease;
}

.public-book__nav-link:hover,
.public-book__nav-link.is-active {
  color: var(--book-ribbon, var(--color-primary));
  background: var(--book-ribbon-soft, var(--color-primary-08));
}

.public-book__burger {
  display: none;
}

.public-book__drawer {
  display: none;
  position: absolute;
  top: calc(100% + 0.35em);
  left: 0.75em;
  right: 0.75em;
  padding: 0.5em;
  flex-direction: column;
  gap: 0.2em;
  background: var(--book-paper-lift, var(--color-bg-card));
  border: 1px solid var(--book-rule, var(--color-border));
  box-shadow: var(--shadow-lg);
  z-index: 50;
}

.public-book__folio {
  flex: 1;
  min-height: 0;
  background: transparent;
}

.public-book__folio .book-folio__scroll {
  overflow: visible;
  padding: clamp(1em, 3vh, 2em) clamp(1em, 4vw, 2.5em) 1em;
}

.public-book--home .public-book__folio .book-folio__scroll {
  padding: clamp(0.75em, 2vh, 1.25em) clamp(0.75em, 2.5vw, 1.5em) 0.5em;
}

.public-book__footer {
  position: relative;
  z-index: 1;
  border-top: 1px solid var(--book-rule-soft, var(--color-border));
}

.public-book__colophon {
  position: relative;
  z-index: 1;
  padding: 0.65em 1em 1em;
  text-align: center;
  font-family: var(--font-sans);
  font-size: 0.72em;
  letter-spacing: 0.06em;
  color: var(--book-ink-faint, var(--color-text-muted));
}

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
}

.menu-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

@media (min-width: 901px) {
  .public-book__nav {
    display: flex;
  }
}

@media (max-width: 900px) {
  .public-book__burger,
  .public-book__drawer {
    display: flex;
  }

  .book-search {
    display: none;
  }
}
</style>
