/**
 * 设置中心 Tab 列表：以后端 SettingModuleRegistry（bootstrap / modules）为准，
 * 再与 GET /app/modules 交叉过滤。本文件不是 Tab 清单，禁止在此枚举全量设置页。
 *
 * MODULE_GROUPS（页面内字段分组）与此无关，不要把业务分组当成 Tab 源。
 */

/** SettingModuleRegistry.code → GET /app/modules 的能力 key（仅处理已知别名） */
export const SETTING_MODULE_CAPABILITY_ALIAS: Record<string, string> = {
  app: 'app-lab',
  reading: 'knowledge',
}

/**
 * GET /app/modules 已知业务模块 key（FEATURES.md）。
 * 出现在此列的设置 Tab：能力为 false 或未返回时隐藏。
 * 未出现在此列的 registry 模块（如 site / security / integration）视为平台常驻。
 */
export const APP_MODULE_CAPABILITY_KEYS = [
  'blog',
  'diary',
  'chat',
  'knowledge',
  'app-lab',
  'study',
  'ops',
] as const

const APP_MODULE_CAPABILITY_KEY_SET: ReadonlySet<string> = new Set(APP_MODULE_CAPABILITY_KEYS)

export function capabilityKeyForSettingModule(code: string): string {
  return SETTING_MODULE_CAPABILITY_ALIAS[code] || code
}

export function isAppCapabilityKey(key: string): boolean {
  return APP_MODULE_CAPABILITY_KEY_SET.has(key)
}

/**
 * 某个设置模块 Tab 是否应展示。
 * - 能力尚未探测完成：不隐藏，避免首屏误伤
 * - 对应 app.modules.<x> 明确为 false，或已知业务模块未返回：隐藏
 * - 平台模块（不在 capabilities 字典里）：保留
 */
export function isSettingModuleEnabled(
  code: string | undefined,
  capabilities: Record<string, boolean>,
  capsLoaded: boolean,
): boolean {
  if (!code) return false
  if (!capsLoaded) return true

  const capKey = capabilityKeyForSettingModule(code)
  if (Object.prototype.hasOwnProperty.call(capabilities, capKey)) {
    return capabilities[capKey] === true
  }
  if (isAppCapabilityKey(capKey)) {
    return false
  }
  return true
}

export function filterSettingModules(
  modules: API.SettingModuleVO[] | undefined,
  capabilities: Record<string, boolean>,
  capsLoaded: boolean,
): API.SettingModuleVO[] {
  return (modules || []).filter((mod) =>
    isSettingModuleEnabled(mod.code, capabilities, capsLoaded),
  )
}

export function settingModuleCodes(modules: API.SettingModuleVO[]): string[] {
  return modules.map((m) => m.code).filter((code): code is string => !!code)
}

/** 直达已关闭模块时，落到第一个仍可用的 registry Tab */
export function resolveSettingsModuleRoute(
  requested: string | undefined,
  visible: API.SettingModuleVO[],
): { status: 'ok' | 'empty' | 'redirect'; target?: string } {
  const codes = settingModuleCodes(visible)
  if (!codes.length) return { status: 'empty' }
  const code = (requested || '').trim()
  if (!code) return { status: 'redirect', target: codes[0] }
  if (codes.includes(code)) return { status: 'ok', target: code }
  return { status: 'redirect', target: codes[0] }
}
