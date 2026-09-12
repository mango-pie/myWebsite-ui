<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { LogOut, Settings, User } from 'lucide-vue-next'
import { siteConfig } from '@/config/site'
import { isAdminRole } from '@/config/permission'
import { useLoginUserStore } from '@/stores/loginUser'
import { userLogout } from '@/api/userController'
import { resolveBlogMenuClickPath } from '@/composables/useBlogLastPost'
import { useCapabilitiesStore } from '@/stores/capabilities'
import { isGatedEntryVisible } from '@/utils/moduleGate'

export interface HomeNavItem {
  key: string
  label: string
  path: string
  requireLogin?: boolean
  requireModule?: string
}

const props = withDefaults(
  defineProps<{
    clockHtml: string
    clockDate: string
    /** Brand click target; blog room uses `/blog` */
    brandPath?: string
  }>(),
  { brandPath: '/' },
)

const route = useRoute()
const router = useRouter()
const loginUserStore = useLoginUserStore()
const capsStore = useCapabilitiesStore()
const logoSrc = new URL('../../assets/logo.svg', import.meta.url).href

const allNavItems: HomeNavItem[] = [
  { key: 'home', label: '首页', path: '/' },
  { key: 'blog', label: '随笔', path: '/blog', requireModule: 'blog' },
  { key: 'diary', label: '日记', path: '/diary', requireLogin: true, requireModule: 'diary' },
  { key: 'worklog', label: '工作日志', path: '/worklog', requireLogin: true, requireModule: 'worklog' },
  { key: 'knowledge', label: '知识库', path: '/knowledge', requireLogin: true, requireModule: 'knowledge' },
  { key: 'reading', label: '精读', path: '/admin/knowledge/ingest', requireLogin: true, requireModule: 'knowledge' },
  { key: 'lab', label: '实验室', path: '/lab', requireModule: 'app-lab' },
  { key: 'music', label: '音乐', path: '/music' },
  { key: 'chat', label: '对话', path: '/chat', requireLogin: true, requireModule: 'chat' },
]

const navItems = computed(() =>
  allNavItems.filter((item) =>
    isGatedEntryVisible(item.requireModule, {
      loaded: capsStore.loaded,
      enabled: capsStore.enabled,
    }),
  ),
)

const navRef = ref<HTMLElement | null>(null)
const avatarWrapRef = ref<HTMLElement | null>(null)
const menuOpen = ref(false)
const pillStyle = ref({ left: '0px', width: '0px', opacity: 0 })

const isLoggedIn = computed(() => !!loginUserStore.loginUser.id)
const isAdmin = computed(() => isAdminRole(loginUserStore.loginUser.userRole))
const avatarLetter = computed(() => {
  const name = loginUserStore.loginUser.userName || siteConfig.ownerName || '某'
  return name.slice(0, 1)
})
const avatarSrc = computed(() => {
  if (isLoggedIn.value && loginUserStore.loginUser.userAvatar) {
    return loginUserStore.loginUser.userAvatar
  }
  return siteConfig.avatar
})

const isActive = (item: HomeNavItem) => {
  if (item.path === '/') return route.path === '/'
  if (item.key === 'reading') return route.path.startsWith('/admin/knowledge')
  if (item.key === 'lab') return route.path === '/lab' || route.path.startsWith('/app/')
  if (item.key === 'chat') return route.path === '/chat' || route.path.startsWith('/chat/')
  return route.path === item.path || route.path.startsWith(item.path + '/')
}

const movePill = async () => {
  await nextTick()
  const nav = navRef.value
  if (!nav) return
  const activeBtn = nav.querySelector('button.active') as HTMLElement | null
  if (!activeBtn) {
    pillStyle.value = { ...pillStyle.value, opacity: 0 }
    return
  }
  pillStyle.value = {
    left: `${activeBtn.offsetLeft}px`,
    width: `${activeBtn.offsetWidth}px`,
    opacity: 1,
  }
}

const go = (item: HomeNavItem) => {
  if (item.requireLogin && !isLoggedIn.value) {
    router.push('/user/login')
    return
  }
  const target = item.key === 'blog' ? resolveBlogMenuClickPath(route.path) : item.path
  if (route.path !== target) router.push(target)
}

const closeMenu = () => {
  menuOpen.value = false
}

const onAvatarClick = () => {
  if (!isLoggedIn.value) {
    router.push('/user/login')
    return
  }
  menuOpen.value = !menuOpen.value
}

const goMenu = (path: string) => {
  closeMenu()
  if (route.path !== path) router.push(path)
}

const handleLogout = async () => {
  closeMenu()
  const res = await userLogout()
  if (res.data.code === 0 && res.data.data) {
    loginUserStore.setLoginUser({ userName: '未登录' })
    message.success('已退出登录')
    await router.push('/user/login')
  } else {
    message.error('退出失败，' + res.data.message)
  }
}

const onDocClick = (e: MouseEvent) => {
  if (!menuOpen.value) return
  const wrap = avatarWrapRef.value
  if (wrap && !wrap.contains(e.target as Node)) closeMenu()
}

const onDocKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape') closeMenu()
}

onMounted(() => {
  movePill()
  window.addEventListener('resize', movePill)
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onDocKey)
})
onUnmounted(() => {
  window.removeEventListener('resize', movePill)
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onDocKey)
})
watch([() => route.path, navItems], () => {
  movePill()
  closeMenu()
})
</script>

<template>
  <header id="topbar" class="anim" style="animation-delay: 0.05s">
    <div
      class="brand"
      role="link"
      tabindex="0"
      @click="router.push(props.brandPath)"
      @keydown.enter="router.push(props.brandPath)"
    >
      <div class="brand-mark">
        <img :src="logoSrc" alt="" width="28" height="28" />
      </div>
      <div>
        <div class="brand-name font-display">{{ siteConfig.siteName }}</div>
        <div class="brand-sub">{{ siteConfig.brandRoman }}</div>
      </div>
    </div>

    <nav id="mainnav" ref="navRef" aria-label="主页导航">
      <span id="navPill" :style="pillStyle" />
      <button
        v-for="item in navItems"
        :key="item.key"
        type="button"
        :class="{ active: isActive(item) }"
        @click="go(item)"
      >
        {{ item.label }}
      </button>
    </nav>

    <div class="top-right">
      <div class="clock-chip">
        <div class="clock-time" v-html="props.clockHtml" />
        <div class="clock-date">{{ props.clockDate }}</div>
      </div>
      <div ref="avatarWrapRef" class="avatar-wrap">
        <button
          type="button"
          class="avatar"
          :aria-label="isLoggedIn ? '账户菜单' : '登录'"
          :aria-expanded="isLoggedIn ? menuOpen : undefined"
          :aria-haspopup="isLoggedIn ? 'menu' : undefined"
          @click="onAvatarClick"
        >
          <img v-if="avatarSrc" :src="avatarSrc" alt="" class="avatar-img" />
          <span v-else>{{ avatarLetter }}</span>
        </button>
        <div v-if="isLoggedIn && menuOpen" class="avatar-menu" role="menu">
          <button type="button" role="menuitem" class="avatar-menu__item" @click="goMenu('/user/profile')">
            <User :size="14" :stroke-width="2" />
            个人信息
          </button>
          <button
            v-if="isAdmin"
            type="button"
            role="menuitem"
            class="avatar-menu__item"
            @click="goMenu('/admin/settings/site')"
          >
            <Settings :size="14" :stroke-width="2" />
            站点设置
          </button>
          <button type="button" role="menuitem" class="avatar-menu__item avatar-menu__item--danger" @click="handleLogout">
            <LogOut :size="14" :stroke-width="2" />
            退出登录
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.brand {
  cursor: pointer;
}
.brand-mark img {
  width: 28px;
  height: 28px;
  object-fit: contain;
  filter: brightness(0) invert(1);
}
.avatar {
  overflow: hidden;
  padding: 0;
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}
.avatar-wrap {
  position: relative;
  flex: none;
}
.avatar-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 40;
  min-width: 168px;
  padding: 8px;
  border-radius: 18px;
  background: var(--glass-chip, rgba(255, 255, 255, 0.94));
  border: 1.5px solid var(--glass-border, rgba(255, 255, 255, 0.95));
  box-shadow: var(--shadow-1, 0 10px 28px rgba(96, 116, 168, 0.16));
  backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.avatar-menu__item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border-radius: 12px;
  border: none;
  background: transparent;
  color: var(--ink, #4c5570);
  font-size: 14px;
  letter-spacing: 1px;
  text-align: left;
  cursor: pointer;
}
.avatar-menu__item:hover {
  background: color-mix(in srgb, var(--c-violet, #9b8ce8) 14%, white);
  color: var(--ink, #4c5570);
}
.avatar-menu__item--danger:hover {
  background: color-mix(in srgb, #e0699b 16%, white);
}
</style>
