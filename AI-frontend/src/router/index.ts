import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useModuleStore } from '@/stores/modules'
import PublicLayout from '@/layouts/PublicLayout.vue'
import WorkspaceLayout from '@/layouts/WorkspaceLayout.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: PublicLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/pages/home/HomePage.vue'),
        meta: { title: '首页' },
      },
      {
        path: 'blog',
        name: 'blog',
        component: () => import('@/pages/blog/BlogListPage.vue'),
        meta: { title: '随笔', module: 'blog' },
      },
      {
        path: 'blog/:id',
        name: 'blog-post',
        component: () => import('@/pages/blog/BlogPostPage.vue'),
        meta: { title: '文章详情', module: 'blog' },
      },
      {
        path: 'about',
        name: 'about',
        component: () => import('@/pages/about/AboutPage.vue'),
        meta: { title: '关于' },
      },
      {
        path: 'user/login',
        name: 'login',
        component: () => import('@/pages/user/LoginPage.vue'),
        meta: { title: '登录', guest: true },
      },
      {
        path: 'user/register',
        name: 'register',
        component: () => import('@/pages/user/RegisterPage.vue'),
        meta: { title: '注册', guest: true },
      },
    ],
  },
  {
    path: '/',
    component: WorkspaceLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'user/profile',
        name: 'profile',
        component: () => import('@/pages/user/ProfilePage.vue'),
        meta: { title: '个人资料' },
      },
      {
        path: 'diary',
        name: 'diary',
        component: () => import('@/pages/diary/DiaryListPage.vue'),
        meta: { title: '日记', module: 'diary' },
      },
      {
        path: 'diary/write',
        name: 'diary-write',
        component: () => import('@/pages/diary/DiaryWritePage.vue'),
        meta: { title: '写日记', module: 'diary' },
      },
      {
        path: 'chat',
        name: 'chat',
        component: () => import('@/pages/chat/ChatPage.vue'),
        meta: { title: '对话', module: 'chat' },
      },
      {
        path: 'knowledge',
        name: 'knowledge',
        component: () => import('@/pages/knowledge/KnowledgeListPage.vue'),
        meta: { title: '知识库', module: 'knowledge' },
      },
      {
        path: 'knowledge/:kbId/chat',
        name: 'knowledge-chat',
        component: () => import('@/pages/knowledge/KnowledgeChatPage.vue'),
        meta: { title: '知识问答', module: 'knowledge' },
      },
      {
        path: 'lab',
        name: 'lab',
        component: () => import('@/pages/lab/LabPage.vue'),
        meta: { title: '实验室', module: 'app-lab' },
      },
    ],
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: 'userManage',
        name: 'admin-users',
        component: () => import('@/pages/admin/UserManagePage.vue'),
        meta: { title: '用户管理' },
      },
      {
        path: 'blogManage',
        name: 'admin-blog',
        component: () => import('@/pages/admin/BlogManagePage.vue'),
        meta: { title: '博客管理', module: 'blog' },
      },
      {
        path: 'settings',
        name: 'admin-settings',
        component: () => import('@/pages/admin/SettingsPage.vue'),
        meta: { title: '站点设置' },
      },
      {
        path: 'ops/stats',
        name: 'ops-stats',
        component: () => import('@/pages/admin/OpsStatsPage.vue'),
        meta: { title: '运维统计', module: 'ops' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/pages/NotFoundPage.vue'),
    meta: { title: '404' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  const userStore = useUserStore()
  const moduleStore = useModuleStore()

  if (!moduleStore.loaded) {
    await moduleStore.fetchModules()
  }

  const meta = to.meta as Record<string, unknown>
  const requiresAuth = meta.requiresAuth === true
  const requiresAdmin = meta.requiresAdmin === true
  const guestOnly = meta.guest === true
  const moduleKey = meta.module as string | undefined

  if (moduleKey && !moduleStore.isEnabled(moduleKey)) {
    return { name: 'home' }
  }

  if (requiresAuth && !userStore.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (requiresAdmin && !userStore.isAdmin) {
    return { name: 'home' }
  }

  if (guestOnly && userStore.isLoggedIn) {
    return { name: 'home' }
  }
})

router.afterEach((to) => {
  const page = typeof to.meta.title === 'string' ? to.meta.title : ''
  document.title = page ? `${page} · 纸间` : '纸间'
})

export default router
