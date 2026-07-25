/**
 * 可复用的模块路由表（无 UI）
 * 重建页面时：挂组件到同名路由，或按 moduleKey 接 getAppModules 显隐。
 */
export type AppModuleRoute = {
  path: string
  name: string
  title: string
  /** 对应 GET /app/modules；无则为常驻入口 */
  moduleKey?: string
  note?: string
}

export const publicModuleRoutes: AppModuleRoute[] = [
  { path: 'blog', name: 'blog', title: '随笔', moduleKey: 'blog', note: 'FEATURES §4' },
  { path: 'diary', name: 'diary', title: '日记', moduleKey: 'diary', note: 'FEATURES §5' },
  { path: 'chat', name: 'chat', title: '对话', moduleKey: 'chat', note: 'FEATURES §6' },
  {
    path: 'knowledge',
    name: 'knowledge',
    title: '知识库',
    moduleKey: 'knowledge',
    note: 'FEATURES §7',
  },
  { path: 'lab', name: 'lab', title: '实验室', moduleKey: 'app-lab', note: 'FEATURES §8' },
  { path: 'about', name: 'about', title: '关于', note: 'FEATURES §2' },
  { path: 'user/login', name: 'login', title: '登录', note: 'FEATURES §2' },
  { path: 'user/register', name: 'register', title: '注册', note: 'FEATURES §2' },
]

/** 工作区 / 管理端路由（重建时挂入） */
export const workspaceModuleRoutes: AppModuleRoute[] = [
  { path: 'user/profile', name: 'profile', title: '个人资料', note: 'FEATURES §2' },
  {
    path: 'administrator/study',
    name: 'study',
    title: '学习工作台',
    moduleKey: 'study',
    note: 'FEATURES §9',
  },
  { path: 'admin/userManage', name: 'admin-users', title: '用户管理', note: 'FEATURES §10' },
  { path: 'admin/blogManage', name: 'admin-blog', title: '博客管理', moduleKey: 'blog' },
  { path: 'admin/appManage', name: 'admin-apps', title: '应用管理', moduleKey: 'app-lab' },
  {
    path: 'admin/chatHistoryManage',
    name: 'admin-chat',
    title: '对话管理',
    moduleKey: 'chat',
  },
  {
    path: 'admin/knowledge/ingest',
    name: 'admin-kb-ingest',
    title: '知识采集',
    moduleKey: 'knowledge',
  },
  {
    path: 'admin/knowledge/jobs',
    name: 'admin-kb-jobs',
    title: '精读任务',
    moduleKey: 'knowledge',
  },
  {
    path: 'admin/knowledge/notes',
    name: 'admin-kb-notes',
    title: '精读列表',
    moduleKey: 'knowledge',
  },
  {
    path: 'admin/knowledge/learning',
    name: 'admin-kb-learning',
    title: '领域知识树',
    moduleKey: 'knowledge',
  },
  { path: 'admin/settings/:module?', name: 'admin-settings', title: '站点设置' },
  { path: 'admin/ops/usage', name: 'ops-usage', title: 'AI 用量', moduleKey: 'ops' },
  { path: 'admin/ops/audit', name: 'ops-audit', title: '操作审计', moduleKey: 'ops' },
  { path: 'admin/ops/stats', name: 'ops-stats', title: '业务统计', moduleKey: 'ops' },
  {
    path: 'admin/ops/access-logs',
    name: 'ops-access',
    title: '访问日志',
    moduleKey: 'ops',
  },
]
