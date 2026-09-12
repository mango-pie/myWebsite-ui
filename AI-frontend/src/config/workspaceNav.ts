/**
 * 工作台左侧 rail 导航配置
 */
import type { Component } from 'vue'
import {
  Home,
  MessagesSquare,
  LibraryBig,
  NotebookPen,
  FlaskConical,
  GraduationCap,
  Settings,
  Sparkles,
  Activity,
  BookOpen,
  Users,
  AppWindowMac,
  PenTool,
  Info,
  ListChecks,
  ListTree,
  ClipboardList,
} from 'lucide-vue-next'
import type { CapabilityGate, RequiredRole } from '@/config/permission'
import { canShowMenuItem, type MenuItemConfig } from '@/config/permission'

export interface WorkspaceNavItem {
  key: string
  label: string
  path: string
  icon: Component
  requiredRole?: RequiredRole
  /** 依赖的后端模块 key；模块关闭时隐藏该项 */
  requireModule?: string
  /** 匹配路径前缀（用于高亮） */
  matchPrefix?: string
  children?: WorkspaceNavItem[]
}

export const WORKSPACE_NAV: WorkspaceNavItem[] = [
  {
    key: 'chat',
    label: '对话',
    path: '/chat',
    icon: MessagesSquare,
    requiredRole: 'user',
    requireModule: 'chat',
    matchPrefix: '/chat',
  },
  {
    key: 'knowledge',
    label: '知识库',
    path: '/knowledge',
    icon: LibraryBig,
    requiredRole: 'user',
    requireModule: 'knowledge',
    matchPrefix: '/knowledge',
  },
  {
    key: 'diary',
    label: '日记',
    path: '/diary',
    icon: NotebookPen,
    requiredRole: 'user',
    requireModule: 'diary',
    matchPrefix: '/diary',
  },
  {
    key: 'worklog',
    label: '工作日志',
    path: '/worklog',
    icon: ClipboardList,
    requiredRole: 'user',
    requireModule: 'worklog',
    matchPrefix: '/worklog',
  },
  {
    key: 'blog',
    label: '随笔',
    path: '/blog',
    icon: BookOpen,
    requireModule: 'blog',
    matchPrefix: '/blog',
  },
  {
    key: 'lab',
    label: '实验室',
    path: '/lab',
    icon: FlaskConical,
    requireModule: 'app-lab',
    matchPrefix: '/lab',
  },
  {
    key: 'study',
    label: '学习',
    path: '/administrator/study',
    icon: GraduationCap,
    requiredRole: 'administrator',
    requireModule: 'study',
    matchPrefix: '/administrator/study',
  },
  {
    key: 'reading',
    label: 'AI 精读',
    path: '/admin/knowledge/ingest',
    icon: Sparkles,
    requiredRole: 'admin',
    requireModule: 'knowledge',
    matchPrefix: '/admin/knowledge',
    children: [
      {
        key: 'knowledgeIngest',
        label: '内容采集',
        path: '/admin/knowledge/ingest',
        icon: Sparkles,
        requiredRole: 'admin',
        requireModule: 'knowledge',
      },
      {
        key: 'knowledgeJobs',
        label: '精读任务',
        path: '/admin/knowledge/jobs',
        icon: ListChecks,
        requiredRole: 'admin',
        requireModule: 'knowledge',
      },
      {
        key: 'knowledgeNotes',
        label: '精读列表',
        path: '/admin/knowledge/notes',
        icon: BookOpen,
        requiredRole: 'admin',
        requireModule: 'knowledge',
      },
      {
        key: 'knowledgeLearning',
        label: '领域知识树',
        path: '/admin/knowledge/learning',
        icon: ListTree,
        requiredRole: 'admin',
        requireModule: 'knowledge',
        matchPrefix: '/admin/knowledge/learning',
      },
    ],
  },
  {
    key: 'manage',
    label: '管理',
    path: '/admin/userManage',
    icon: Settings,
    requiredRole: 'admin',
    matchPrefix: '/admin',
    children: [
      {
        key: 'userManage',
        label: '用户',
        path: '/admin/userManage',
        icon: Users,
        requiredRole: 'admin',
      },
      {
        key: 'appManage',
        label: '应用',
        path: '/admin/appManage',
        icon: AppWindowMac,
        requiredRole: 'admin',
        requireModule: 'app-lab',
      },
      {
        key: 'blogManage',
        label: '博客',
        path: '/admin/blogManage',
        icon: PenTool,
        requiredRole: 'admin',
        requireModule: 'blog',
      },
      {
        key: 'siteSettings',
        label: '站点设置',
        path: '/admin/settings/site',
        icon: Settings,
        requiredRole: 'admin',
        matchPrefix: '/admin/settings',
      },
      {
        key: 'opsCenter',
        label: '运维中心',
        path: '/admin/ops/usage',
        icon: Activity,
        requiredRole: 'admin',
        requireModule: 'ops',
        matchPrefix: '/admin/ops',
      },
    ],
  },
]

export const WORKSPACE_HOME: WorkspaceNavItem = {
  key: 'hall',
  label: '门厅',
  path: '/',
  icon: Home,
}

/** 公开顶栏导航 */
export const PUBLIC_NAV: WorkspaceNavItem[] = [
  { key: 'blog', label: '随笔', path: '/blog', icon: BookOpen, matchPrefix: '/blog', requireModule: 'blog' },
  { key: 'lab', label: '实验室', path: '/lab', icon: FlaskConical, matchPrefix: '/lab', requireModule: 'app-lab' },
  { key: 'about', label: '关于', path: '/about', icon: Info, matchPrefix: '/about' },
]

/** 把 WorkspaceNavItem 适配到 canShowMenuItem */
function toMenuConfig(item: WorkspaceNavItem): MenuItemConfig {
  return {
    key: item.key,
    label: item.label,
    path: item.path,
    requiredRole: item.requiredRole,
    requireModule: item.requireModule,
    children: item.children?.map(toMenuConfig),
  }
}

export function filterWorkspaceNav(
  items: WorkspaceNavItem[],
  user: { id?: number; userRole?: string } | null,
  caps?: CapabilityGate,
): WorkspaceNavItem[] {
  return items
    .filter((item) => canShowMenuItem(toMenuConfig(item), user, caps))
    .map((item) => {
      if (!item.children?.length) return item
      return {
        ...item,
        children: filterWorkspaceNav(item.children, user, caps),
      }
    })
}

export function isNavActive(item: WorkspaceNavItem, path: string): boolean {
  if (item.matchPrefix) {
    if (item.matchPrefix === '/admin') {
      // 管理分组：admin 下但排除 knowledge / ops 已有独立入口时仍高亮父级
      return (
        path.startsWith('/admin') &&
        !path.startsWith('/admin/knowledge') &&
        !path.startsWith('/admin/ops')
      )
    }
    return path === item.matchPrefix || path.startsWith(item.matchPrefix + '/')
  }
  return path === item.path || path.startsWith(item.path + '/')
}
