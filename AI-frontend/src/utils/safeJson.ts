/**
 * 将 JSON 字符串中超过 15 位的纯整数字面量替换为字符串形式，
 * 防止 JSON.parse 时雪花 ID 等大整数精度丢失。
 */
export function parseSafeJson(raw: string): unknown {
  const safe = raw.replace(/:\s*(\d{16,})/g, ': "$1"')
  return JSON.parse(safe)
}

/** 与对话页一致：只接受安全解析后的 appId 字符串 */
export function extractSafeAppId(data: unknown): string {
  if (typeof data === 'string') {
    const trimmed = data.trim()
    if (/^\d+$/.test(trimmed)) return trimmed
    throw new Error('appId 格式无效')
  }
  if (typeof data === 'number') {
    if (!Number.isSafeInteger(data)) {
      throw new Error('appId 精度已丢失')
    }
    return String(data)
  }
  throw new Error('appId 格式无效')
}

interface ApiBody {
  code?: number
  data?: unknown
  message?: string
}

export function parseApiBody(raw: string): ApiBody {
  return parseSafeJson(raw) as ApiBody
}
