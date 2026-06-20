export type SmartViewKey = 'today' | 'week' | 'inbox' | 'completed' | 'list'

export const SMART_VIEWS: { key: SmartViewKey; label: string; icon?: string }[] = [
  { key: 'today', label: '今天' },
  { key: 'week', label: '本周' },
  { key: 'inbox', label: '收集箱' },
  { key: 'completed', label: '已完成' },
]

export const PRIORITY_MAP: Record<number, { label: string; color: string }> = {
  0: { label: '无', color: 'transparent' },
  1: { label: '低', color: '#7c9ce0' },
  2: { label: '中', color: '#e8b84a' },
  3: { label: '高', color: '#e879a9' },
}

export const FOCUS_PRESETS = [25, 45, 5] as const

export const FOCUS_STATUS = {
  RUNNING: 0,
  COMPLETED: 1,
  ABANDONED: 2,
  PAUSED: 3,
} as const

export const LIST_TYPE_INBOX = 1

export const TASK_STATUS = {
  TODO: 0,
  DONE: 1,
  ABANDONED: 2,
} as const

export const SOURCE_TYPE_BLOG = 1

export function isTaskOverdue(task: API.StudyTaskVO): boolean {
  if (task.status !== TASK_STATUS.TODO || !task.dueDate) return false
  return new Date(task.dueDate).getTime() < Date.now()
}

export function formatStudyDate(str: string | undefined): string {
  if (!str) return ''
  const d = new Date(str)
  if (Number.isNaN(d.getTime())) return str
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  if (h === '00' && min === '00') return `${m}-${day}`
  return `${m}-${day} ${h}:${min}`
}

export function getViewTitle(view: SmartViewKey, listName?: string): string {
  if (view === 'list' && listName) return listName
  return SMART_VIEWS.find((v) => v.key === view)?.label ?? '任务'
}
