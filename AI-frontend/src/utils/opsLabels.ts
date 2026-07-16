/** 运维可观测：scene / action / metric 文案映射（FRONTEND_SYNC_A–D） */

export const OPS_USAGE_SCENE_LABELS: Record<string, string> = {
  knowledge_chat: '知识库问答',
  distill: '精读蒸馏',
  agent: 'Agent',
  codegen: '代码生成',
  caption: '图片转述',
  segmentation: '朗读分段',
  other: '其他',
}

export const OPS_USAGE_SCENE_OPTIONS = Object.entries(OPS_USAGE_SCENE_LABELS).map(
  ([value, label]) => ({ value, label }),
)

export function formatOpsUsageScene(scene?: string | null): string {
  if (!scene) return '-'
  return OPS_USAGE_SCENE_LABELS[scene] || scene
}

export const OPS_AUDIT_ACTION_LABELS: Record<string, string> = {
  'user.login.success': '登录成功',
  'user.login.fail': '登录失败',
  'user.logout': '登出',
  'site.maintenance.toggle': '维护模式切换',
  'app.deploy': '应用部署',
  'app.delete': '删除应用',
  'knowledge.base.delete': '删除知识库',
  'knowledge.document.delete': '删除文档',
  'reading.note.delete': '删除精读笔记',
}

export const OPS_AUDIT_ACTION_OPTIONS = Object.entries(OPS_AUDIT_ACTION_LABELS).map(
  ([value, label]) => ({ value, label }),
)

export function formatOpsAuditAction(action?: string | null): string {
  if (!action) return '-'
  return OPS_AUDIT_ACTION_LABELS[action] || action
}

/** Phase C 业务日统计 metric 白名单（顺序即 UI 卡片顺序） */
export const OPS_BIZ_METRIC_LABELS: Record<string, string> = {
  'blog.post.view': '博客阅读',
  'blog.post.like': '博客点赞',
  'blog.post.publish': '博客发布',
  'chat.conversation.create': '新建会话',
  'chat.message.user': '用户消息',
  'reading.ingest.success': '精读采集成功',
  'reading.distill.success': '蒸馏成功',
  'study.habit.checkin': '习惯打卡',
  'study.focus.complete': '专注完成',
}

export const OPS_BIZ_METRIC_KEYS = Object.keys(OPS_BIZ_METRIC_LABELS)

export function formatOpsBizMetric(metric?: string | null): string {
  if (!metric) return '-'
  return OPS_BIZ_METRIC_LABELS[metric] || metric
}

/** Phase D HTTP 日志 statusClass */
export const OPS_HTTP_STATUS_CLASS_OPTIONS = [
  { value: '4xx', label: '4xx' },
  { value: '5xx', label: '5xx' },
]

/** 站点设置 boolean 可能是 true / "true" / 1 */
export function isOpsSwitchOn(value: unknown): boolean {
  return value === true || value === 'true' || value === 1 || value === '1'
}
