/**
 * 将 JSON 中超过 15 位的整数字面量转为字符串，避免雪花 ID 精度丢失。
 * 必须跳过 JSON 字符串内部，否则会破坏 extendInfo 等嵌套 JSON 文本。
 */
export function parseSafeJson(raw: string): unknown {
  let out = ''
  let inString = false
  let escaped = false

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]

    if (inString) {
      out += ch
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === '"') {
        inString = false
      }
      continue
    }

    if (ch === '"') {
      inString = true
      out += ch
      continue
    }

    if (ch === ':') {
      out += ch
      let j = i + 1
      while (j < raw.length && /\s/.test(raw[j]!)) {
        out += raw[j]!
        j++
      }
      const start = j
      while (j < raw.length && raw[j]! >= '0' && raw[j]! <= '9') {
        j++
      }
      const digits = raw.slice(start, j)
      if (digits.length >= 16) {
        out += `"${digits}"`
        i = j - 1
        continue
      }
      i = start - 1
      continue
    }

    out += ch
  }

  return JSON.parse(out)
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
