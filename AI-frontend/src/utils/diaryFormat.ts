export const MOOD_OPTIONS = [
  { value: 'happy', label: '开心', emoji: '😊' },
  { value: 'calm', label: '平静', emoji: '😌' },
  { value: 'tired', label: '疲惫', emoji: '😴' },
  { value: 'sad', label: '低落', emoji: '😔' },
  { value: 'excited', label: '兴奋', emoji: '🤩' },
] as const

export function formatDiaryDate(dateStr: string | undefined) {
  if (!dateStr) return ''
  const date = new Date(`${dateStr}T00:00:00`)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
}

export function todayDateString() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getMoodEmoji(mood: string | undefined) {
  if (!mood) return ''
  return MOOD_OPTIONS.find((item) => item.value === mood)?.emoji ?? ''
}

export function diaryDisplayTitle(entry: { diaryDate?: string; title?: string }) {
  if (entry.title?.trim()) return entry.title.trim()
  return formatDiaryDate(entry.diaryDate)
}

export function contentExcerpt(content: string | undefined, maxLen = 80) {
  if (!content) return '（暂无内容）'
  const plain = content.replace(/[#>*`_\-\[\]()!]/g, '').replace(/\s+/g, ' ').trim()
  if (plain.length <= maxLen) return plain
  return `${plain.slice(0, maxLen)}…`
}
