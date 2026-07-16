import { getSiteSettingValues } from '@/api/siteSettings'

export type DiaryUxSettings = {
  defaultPrivate: boolean
  exportEnabled: boolean
  pageSizeDefault: number
}

const DEFAULTS: DiaryUxSettings = {
  defaultPrivate: true,
  exportEnabled: false,
  pageSizeDefault: 20,
}

let cache: DiaryUxSettings | null = null
let inflight: Promise<DiaryUxSettings> | null = null

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

export async function loadDiarySettings(force = false): Promise<DiaryUxSettings> {
  if (!force && cache) return cache
  if (!force && inflight) return inflight

  inflight = (async () => {
    try {
      const res = await getSiteSettingValues('diary')
      if (res.data.code !== 0 || !res.data.data?.values) {
        cache = { ...DEFAULTS }
        return cache
      }
      const values = res.data.data.values
      cache = {
        defaultPrivate: toBool(values['privacy.default_private'], DEFAULTS.defaultPrivate),
        exportEnabled: toBool(values['export.enabled'], DEFAULTS.exportEnabled),
        pageSizeDefault: toInt(values['list.page_size_default'], DEFAULTS.pageSizeDefault),
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

export function clearDiarySettingsCache() {
  cache = null
  inflight = null
}

/** 私密→草稿(0)，否则完成(1) */
export function diaryDefaultStatus(settings: DiaryUxSettings): number {
  return settings.defaultPrivate ? 0 : 1
}
