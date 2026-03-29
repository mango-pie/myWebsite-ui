/**
 * 前端路由配置
 * - 公开页：首页、登录、注册、关于
 * - 需登录：个人信息 /user/profile（在 src/config/permission.ts 的 ROUTE_PERMISSIONS 中配置）
 * - 需管理员：/admin/*（同上或按路径前缀默认）
 * 具体鉴权逻辑在 src/access.ts 与 src/config/permission.ts 中统一处理
 */
import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import UserRegisterPage from '@/pages/user/UserRegisterPage.vue'
import UserLoginPage from '@/pages/user/UserLoginPage.vue'
import UserProfilePage from '@/pages/user/UserProfilePage.vue'
import UserManagerPage from '@/pages/admin/UserManagerPage.vue'
import AppManagerPage from '@/pages/admin/AppManagerPage.vue'
import ChatHistoryManagerPage from '@/pages/admin/ChatHistoryManagerPage.vue'
import AppChatPage from '@/pages/app/AppChatPage.vue'
import AppEditPage from '@/pages/app/AppEditPage.vue'
import AboutView from '@/pages/AboutView.vue'
import StudyView from '@/pages/admin/StudyView.vue'
import TestView from '@/examples/PermissionExample.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: '主页', component: HomePage },
    { path: '/user/login', name: '用户登录', component: UserLoginPage },
    { path: '/user/register', name: '用户注册', component: UserRegisterPage },
    { path: '/user/profile', name: '个人信息', component: UserProfilePage },
    { path: '/admin/userManage', name: '用户管理', component: UserManagerPage },
    { path: '/admin/appManage', name: '应用管理', component: AppManagerPage },
    { path: '/admin/chatHistoryManage', name: '对话管理', component: ChatHistoryManagerPage },
    { path: '/app/chat/:appId', name: '应用对话', component: AppChatPage },
    { path: '/app/edit/:appId', name: '编辑应用', component: AppEditPage },
    { path: '/about', name: '关于', component: AboutView },
    { path: '/administrator/study', name: '学习', component: StudyView },
    { path: '/test', name: '测试', component: TestView },
  ],
})

export default router
