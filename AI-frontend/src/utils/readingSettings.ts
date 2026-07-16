import { getSiteSettingValues } from '@/api/siteSettings'

export type ReadingUxSettings = {
  /** 发布默认草稿（status=0） */
  defaultAsDraft: boolean
  /** 发布成功后是否弹「打开编辑器」 */
  askOpenEditor: boolean
  /** 重新蒸馏是否需二次确认 */
  redistillConfirmRequired: boolean
}

const DEFAULTS: ReadingUxSettings = {
  defaultAsDraft: true,
  askOpenEditor: true,
  redistillConfirmRequired: true,
}

let cache: ReadingUxSettings | null = null
let inflight: Promise<ReadingUxSettings> | null = null

function toBool(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value
  if (value == null) return fallback
  const text = String(value).trim().toLowerCase()
  if (text === 'true' || text === '1') return true
  if (text === 'false' || text === '0') return false
  return fallback
}

/** 读取精读工作台 UX 设置（会话内缓存） */
export async function loadReadingUxSettings(force = false): Promise<ReadingUxSettings> {
  if (!force && cache) return cache
  if (!force && inflight) return inflight

  inflight = (async () => {
    try {
      const res = await getSiteSettingValues('reading')
      if (res.data.code !== 0 || !res.data.data?.values) {
        cache = { ...DEFAULTS }
        return cache
      }
      const values = res.data.data.values
      cache = {
        defaultAsDraft: toBool(values['publish.default_as_draft'], DEFAULTS.defaultAsDraft),
        askOpenEditor: toBool(values['publish.ask_open_editor'], DEFAULTS.askOpenEditor),
        redistillConfirmRequired: toBool(
          values['redistill.confirm_required'],
          DEFAULTS.redistillConfirmRequired,
        ),
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

export function clearReadingUxSettingsCache() {
  cache = null
  inflight = null
}
