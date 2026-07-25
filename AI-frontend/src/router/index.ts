/**
 * 前端路由配置
 * meta.shell: public | workspace
 * meta.room: 房间标识（视觉 token）
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
import KnowledgeJobsPage from '@/pages/admin/KnowledgeJobsPage.vue'
import KnowledgeNoteListPage from '@/pages/admin/KnowledgeNoteListPage.vue'
import KnowledgeNoteDetailPage from '@/pages/admin/KnowledgeNoteDetailPage.vue'
import LearningView from '@/components/learning/LearningView.vue'
import SiteSettingsPage from '@/pages/admin/SiteSettingsPage.vue'
import SiteSettingsAuditPage from '@/pages/admin/SiteSettingsAuditPage.vue'
import SiteSettingsHealthPage from '@/pages/admin/SiteSettingsHealthPage.vue'
import OpsUsagePage from '@/pages/admin/OpsUsagePage.vue'
import OpsAuditPage from '@/pages/admin/OpsAuditPage.vue'
import OpsStatsPage from '@/pages/admin/OpsStatsPage.vue'
import OpsAccessLogsPage from '@/pages/admin/OpsAccessLogsPage.vue'

const publicMeta = { shell: 'public' as const }
const workspaceMeta = { shell: 'workspace' as const }

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: '主页', component: HomePage, meta: { ...publicMeta, room: 'hall' } },
    { path: '/lab', name: '实验室', component: LabPage, meta: { ...publicMeta, room: 'lab', requireModule: 'app-lab' } },
    { path: '/blog', name: '博客首页', component: BlogHomePage, meta: { ...publicMeta, room: 'blog', requireModule: 'blog' } },
    { path: '/blog/create', name: '发布文章', component: BlogCreatePage, meta: { ...publicMeta, room: 'blog', requireModule: 'blog' } },
    { path: '/blog/edit/:id', name: '编辑文章', component: BlogCreatePage, meta: { ...publicMeta, room: 'blog', requireModule: 'blog' } },
    { path: '/blog/:id', name: '博客文章', component: BlogPostPage, meta: { ...publicMeta, room: 'blog', requireModule: 'blog' } },
    { path: '/category/:name', name: '分类文章', component: BlogCategoryPage, meta: { ...publicMeta, room: 'blog', requireModule: 'blog' } },
    { path: '/tag/:name', name: '标签文章', component: BlogTagPage, meta: { ...publicMeta, room: 'blog', requireModule: 'blog' } },
    { path: '/about', name: '关于', component: AboutView, meta: { ...publicMeta, room: 'about' } },
    { path: '/user/login', name: '用户登录', component: UserLoginPage, meta: { ...publicMeta, room: 'auth' } },
    { path: '/user/register', name: '用户注册', component: UserRegisterPage, meta: { ...publicMeta, room: 'auth' } },
    { path: '/test', name: '测试', component: TestView, meta: { ...publicMeta, room: 'public' } },

    { path: '/diary', name: '日记首页', component: DiaryHomePage, meta: { ...workspaceMeta, room: 'diary', requireModule: 'diary' } },
    { path: '/diary/write', name: '写日记', component: DiaryWritePage, meta: { ...workspaceMeta, room: 'diary', requireModule: 'diary' } },
    { path: '/diary/:id', name: '日记详情', component: DiaryDetailPage, meta: { ...workspaceMeta, room: 'diary', requireModule: 'diary' } },
    { path: '/knowledge', name: '知识库', component: KnowledgeListPage, meta: { ...workspaceMeta, room: 'knowledge', requireModule: 'knowledge' } },
    { path: '/knowledge/:kbId', name: '知识库详情', component: KnowledgeDetailPage, meta: { ...workspaceMeta, room: 'knowledge', requireModule: 'knowledge' } },
    { path: '/knowledge/:kbId/chat', name: '知识库问答', component: KnowledgeChatPage, meta: { ...workspaceMeta, room: 'knowledge', requireModule: 'knowledge' } },
    { path: '/user/profile', name: '个人信息', component: UserProfilePage, meta: { ...workspaceMeta, room: 'profile' } },
    { path: '/chat', name: '对话首页', component: ChatHomePage, meta: { ...workspaceMeta, room: 'chat', requireModule: 'chat' } },
    {
      path: '/chat/:conversationId',
      name: '对话页面',
      component: ChatPage,
      meta: { ...workspaceMeta, room: 'chat', keepAlive: true, requireModule: 'chat' },
    },
    { path: '/app/chat/:appId', name: '应用对话', component: AppChatPage, meta: { ...workspaceMeta, room: 'lab', requireModule: 'app-lab' } },
    { path: '/app/edit/:appId', name: '编辑应用', component: AppEditPage, meta: { ...workspaceMeta, room: 'lab', requireModule: 'app-lab' } },
    { path: '/administrator/study', name: '学习', component: StudyView, meta: { ...workspaceMeta, room: 'study', requireModule: 'study' } },

    { path: '/admin/userManage', name: '用户管理', component: UserManagerPage, meta: { ...workspaceMeta, room: 'admin' } },
    { path: '/admin/appManage', name: '应用管理', component: AppManagerPage, meta: { ...workspaceMeta, room: 'admin', requireModule: 'app-lab' } },
    { path: '/admin/blogManage', name: '博客管理', component: BlogManagePage, meta: { ...workspaceMeta, room: 'admin', requireModule: 'blog' } },
    { path: '/admin/knowledge', redirect: '/admin/knowledge/ingest' },
    { path: '/admin/knowledge/ingest', name: '内容采集', component: KnowledgeIngestPage, meta: { ...workspaceMeta, room: 'admin', requireModule: 'knowledge' } },
    { path: '/admin/knowledge/jobs', name: '精读任务', component: KnowledgeJobsPage, meta: { ...workspaceMeta, room: 'admin', requireModule: 'knowledge' } },
    { path: '/admin/knowledge/notes', name: '精读列表', component: KnowledgeNoteListPage, meta: { ...workspaceMeta, room: 'admin', requireModule: 'knowledge' } },
    { path: '/admin/knowledge/notes/:noteId', name: '精读详情', component: KnowledgeNoteDetailPage, meta: { ...workspaceMeta, room: 'admin', requireModule: 'knowledge' } },
    { path: '/admin/knowledge/learning', name: '领域知识树', component: LearningView, meta: { ...workspaceMeta, room: 'admin', requireModule: 'knowledge' } },
    { path: '/admin/chatHistoryManage', name: '对话管理', component: ChatHistoryManagerPage, meta: { ...workspaceMeta, room: 'admin', requireModule: 'chat' } },
    { path: '/admin/settings', redirect: '/admin/settings/site' },
    { path: '/admin/settings/audit', name: '变更审计', component: SiteSettingsAuditPage, meta: { ...workspaceMeta, room: 'admin' } },
    { path: '/admin/settings/health', name: '依赖健康', component: SiteSettingsHealthPage, meta: { ...workspaceMeta, room: 'admin' } },
    { path: '/admin/settings/:module', name: '站点设置', component: SiteSettingsPage, meta: { ...workspaceMeta, room: 'admin' } },
    { path: '/admin/ops', redirect: '/admin/ops/usage' },
    { path: '/admin/ops/usage', name: 'AI用量', component: OpsUsagePage, meta: { ...workspaceMeta, room: 'admin', requireModule: 'ops' } },
    { path: '/admin/ops/audit', name: '操作审计', component: OpsAuditPage, meta: { ...workspaceMeta, room: 'admin', requireModule: 'ops' } },
    { path: '/admin/ops/stats', name: '业务统计', component: OpsStatsPage, meta: { ...workspaceMeta, room: 'admin', requireModule: 'ops' } },
    { path: '/admin/ops/access-logs', name: '访问日志', component: OpsAccessLogsPage, meta: { ...workspaceMeta, room: 'admin', requireModule: 'ops' } },
  ],
})

export default router
