import { getSiteSettingValues } from '@/api/siteSettings'

export type AppUxSettings = {
  codegenEnabled: boolean
  defaultCodeGenType: string
  deployEnabled: boolean
  publicHostDisplay: string
}

const DEFAULTS: AppUxSettings = {
  codegenEnabled: true,
  defaultCodeGenType: 'html',
  deployEnabled: true,
  publicHostDisplay: '',
}

let cache: AppUxSettings | null = null
let inflight: Promise<AppUxSettings> | null = null

function toBool(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value
  if (value == null) return fallback
  const text = String(value).trim().toLowerCase()
  if (text === 'true' || text === '1') return true
  if (text === 'false' || text === '0') return false
  return fallback
}

export async function loadAppSettings(force = false): Promise<AppUxSettings> {
  if (!force && cache) return cache
  if (!force && inflight) return inflight

  inflight = (async () => {
    try {
      const res = await getSiteSettingValues('app')
      if (res.data.code !== 0 || !res.data.data?.values) {
        cache = { ...DEFAULTS }
        return cache
      }
      const values = res.data.data.values
      const type = String(values['codegen.default_type'] ?? DEFAULTS.defaultCodeGenType).trim()
      cache = {
        codegenEnabled: toBool(values['codegen.enabled'], DEFAULTS.codegenEnabled),
        defaultCodeGenType: type || DEFAULTS.defaultCodeGenType,
        deployEnabled: toBool(values['deploy.enabled'], DEFAULTS.deployEnabled),
        publicHostDisplay: String(values['deploy.public_host_display'] ?? '').trim(),
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

export function clearAppSettingsCache() {
  cache = null
  inflight = null
}

/** 部署成功 URL：优先设置前缀，否则回落 env */
export function resolveDeployBaseUrl(settings: AppUxSettings, envFallback?: string): string {
  const host = settings.publicHostDisplay?.trim()
  if (host) return host.replace(/\/$/, '')
  return (envFallback || '').replace(/\/$/, '')
}
