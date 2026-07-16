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
import BlogManagePage from '@/pages/admin/BlogManagePage.vue'
import AppChatPage from '@/pages/app/AppChatPage.vue'
import AppEditPage from '@/pages/app/AppEditPage.vue'
import ChatHomePage from '@/pages/chat/ChatHomePage.vue'
import ChatPage from '@/pages/chat/ChatPage.vue'
 import AboutView from '@/pages/AboutView.vue'
import StudyView from '@/pages/admin/StudyView.vue'
import TestView from '@/examples/PermissionExample.vue'
import BlogHomePage from '@/pages/blog/BlogHomePage.vue'
import BlogPostPage from '@/pages/blog/BlogPostPage.vue'
import BlogCategoryPage from '@/pages/blog/BlogCategoryPage.vue'
import BlogTagPage from '@/pages/blog/BlogTagPage.vue'
import BlogCreatePage from '@/pages/blog/BlogCreatePage.vue'
import LabPage from '@/pages/lab/LabPage.vue'
import DiaryHomePage from '@/pages/diary/DiaryHomePage.vue'
import DiaryWritePage from '@/pages/diary/DiaryWritePage.vue'
import DiaryDetailPage from '@/pages/diary/DiaryDetailPage.vue'
import KnowledgeListPage from '@/pages/knowledge/KnowledgeListPage.vue'
import KnowledgeDetailPage from '@/pages/knowledge/KnowledgeDetailPage.vue'
import KnowledgeChatPage from '@/pages/knowledge/KnowledgeChatPage.vue'
import KnowledgeIngestPage from '@/pages/admin/KnowledgeIngestPage.vue'
import KnowledgeNoteListPage from '@/pages/admin/KnowledgeNoteListPage.vue'
import KnowledgeNoteDetailPage from '@/pages/admin/KnowledgeNoteDetailPage.vue'
import SiteSettingsPage from '@/pages/admin/SiteSettingsPage.vue'
import SiteSettingsAuditPage from '@/pages/admin/SiteSettingsAuditPage.vue'
import SiteSettingsHealthPage from '@/pages/admin/SiteSettingsHealthPage.vue'
import OpsUsagePage from '@/pages/admin/OpsUsagePage.vue'
import OpsAuditPage from '@/pages/admin/OpsAuditPage.vue'
import OpsStatsPage from '@/pages/admin/OpsStatsPage.vue'
import OpsAccessLogsPage from '@/pages/admin/OpsAccessLogsPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: '主页', component: HomePage },
    { path: '/lab', name: '实验室', component: LabPage },
    { path: '/blog', name: '博客首页', component: BlogHomePage },
    { path: '/blog/create', name: '发布文章', component: BlogCreatePage },
    { path: '/blog/edit/:id', name: '编辑文章', component: BlogCreatePage },
    { path: '/blog/:id', name: '博客文章', component: BlogPostPage },
    { path: '/diary', name: '日记首页', component: DiaryHomePage },
    { path: '/diary/write', name: '写日记', component: DiaryWritePage },
    { path: '/diary/:id', name: '日记详情', component: DiaryDetailPage },
    { path: '/knowledge', name: '知识库', component: KnowledgeListPage },
    { path: '/knowledge/:kbId', name: '知识库详情', component: KnowledgeDetailPage },
    { path: '/knowledge/:kbId/chat', name: '知识库问答', component: KnowledgeChatPage },
    { path: '/category/:name', name: '分类文章', component: BlogCategoryPage },
    { path: '/tag/:name', name: '标签文章', component: BlogTagPage },
    { path: '/user/login', name: '用户登录', component: UserLoginPage },
    { path: '/user/register', name: '用户注册', component: UserRegisterPage },
    { path: '/user/profile', name: '个人信息', component: UserProfilePage },
    { path: '/admin/userManage', name: '用户管理', component: UserManagerPage },
    { path: '/admin/appManage', name: '应用管理', component: AppManagerPage },
    { path: '/admin/blogManage', name: '博客管理', component: BlogManagePage },
    { path: '/admin/knowledge', redirect: '/admin/knowledge/ingest' },
    { path: '/admin/knowledge/ingest', name: '内容采集', component: KnowledgeIngestPage },
    { path: '/admin/knowledge/notes', name: '精读列表', component: KnowledgeNoteListPage },
    { path: '/admin/knowledge/notes/:noteId', name: '精读详情', component: KnowledgeNoteDetailPage },
    { path: '/admin/chatHistoryManage', name: '对话管理', component: ChatHistoryManagerPage },
    { path: '/admin/settings', redirect: '/admin/settings/site' },
    { path: '/admin/settings/audit', name: '变更审计', component: SiteSettingsAuditPage },
    { path: '/admin/settings/health', name: '依赖健康', component: SiteSettingsHealthPage },
    { path: '/admin/settings/:module', name: '站点设置', component: SiteSettingsPage },
    { path: '/admin/ops', redirect: '/admin/ops/usage' },
    { path: '/admin/ops/usage', name: 'AI用量', component: OpsUsagePage },
    { path: '/admin/ops/audit', name: '操作审计', component: OpsAuditPage },
    { path: '/admin/ops/stats', name: '业务统计', component: OpsStatsPage },
    { path: '/admin/ops/access-logs', name: '访问日志', component: OpsAccessLogsPage },
    { path: '/app/chat/:appId', name: '应用对话', component: AppChatPage },
    { path: '/app/edit/:appId', name: '编辑应用', component: AppEditPage },
    { path: '/about', name: '关于', component: AboutView },
    { path: '/administrator/study', name: '学习', component: StudyView },
    { path: '/test', name: '测试', component: TestView },
    { path: '/chat', name: '对话首页', component: ChatHomePage },
    { path: '/chat/:conversationId', name: '对话页面', component: ChatPage, meta: { keepAlive: true } },
  ],
})

export default router
