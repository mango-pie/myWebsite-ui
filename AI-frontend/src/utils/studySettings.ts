import { getSiteSettingValues } from '@/api/siteSettings'

export type StudyUxSettings = {
  focusDefaultMinutes: number
  focusBreakMinutes: number
  habitReminderDefault: boolean
  statsDefaultRangeDays: number
  showChecklist: boolean
}

const DEFAULTS: StudyUxSettings = {
  focusDefaultMinutes: 25,
  focusBreakMinutes: 5,
  habitReminderDefault: true,
  statsDefaultRangeDays: 7,
  showChecklist: true,
}

let cache: StudyUxSettings | null = null
let inflight: Promise<StudyUxSettings> | null = null

function toBool(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value
  if (value == null) return fallback
  const text = String(value).trim().toLowerCase()
  if (text === 'true' || text === '1') return true
  if (text === 'false' || text === '0') return false
  return fallback
}

function toInt(value: unknown, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) ? Math.trunc(n) : fallback
}

export async function loadStudySettings(force = false): Promise<StudyUxSettings> {
  if (!force && cache) return cache
  if (!force && inflight) return inflight

  inflight = (async () => {
    try {
      const res = await getSiteSettingValues('study')
      if (res.data.code !== 0 || !res.data.data?.values) {
        cache = { ...DEFAULTS }
        return cache
      }
      const values = res.data.data.values
      cache = {
        focusDefaultMinutes: toInt(values['focus.default_minutes'], DEFAULTS.focusDefaultMinutes),
        focusBreakMinutes: toInt(values['focus.break_minutes'], DEFAULTS.focusBreakMinutes),
        habitReminderDefault: toBool(
          values['habit.reminder_enabled_default'],
          DEFAULTS.habitReminderDefault,
        ),
        statsDefaultRangeDays: toInt(
          values['stats.default_range_days'],
          DEFAULTS.statsDefaultRangeDays,
        ),
        showChecklist: toBool(values['workspace.show_checklist'], DEFAULTS.showChecklist),
      }
      return cache
    } catch {
      cache = { ...DEFAULTS }
      return cache
    } finally {
      inflight = null
    }
  })()

  return inflight
}

export function clearStudySettingsCache() {
  cache = null
  inflight = null
}

/** 专注预设：默认时长 + 休息时长 + 常用 45 */
export function buildFocusPresets(settings: StudyUxSettings): number[] {
  const set = new Set<number>([
    settings.focusDefaultMinutes,
    settings.focusBreakMinutes,
    45,
  ].filter((n) => n > 0))
  return Array.from(set).sort((a, b) => a - b)
}
