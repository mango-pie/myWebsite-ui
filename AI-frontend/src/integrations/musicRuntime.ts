const configuredBase = (import.meta.env.VITE_NETEASE_API_BASE as string | undefined)?.replace(/\/$/, '')

export const NETEASE_COOKIE_KEY = 'netease_music_cookie'

export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

export function getNeteaseApiBase(): string {
  if (configuredBase) return configuredBase
  if (isTauriRuntime()) return 'http://127.0.0.1:3000'
  return '/netease-api'
}

export function getNeteaseCookie(): string {
  if (typeof localStorage === 'undefined') return ''
  return localStorage.getItem(NETEASE_COOKIE_KEY) || ''
}

export function setNeteaseCookie(cookieStr: string) {
  if (!cookieStr || typeof localStorage === 'undefined') return
  localStorage.setItem(NETEASE_COOKIE_KEY, cookieStr)
}

export function clearNeteaseCookie() {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(NETEASE_COOKIE_KEY)
}

/**
 * api-enhanced 从 query.cookie 读取登录态。浏览器禁止 fetch 设置 Cookie 头。
 */
export function withNeteaseCookie(path: string): string {
  const cookie = getNeteaseCookie()
  if (!cookie) return path
  const qIndex = path.indexOf('?')
  const pathname = qIndex >= 0 ? path.slice(0, qIndex) : path
  const search = qIndex >= 0 ? path.slice(qIndex + 1) : ''
  const params = new URLSearchParams(search)
  if (!params.has('cookie')) params.set('cookie', cookie)
  const qs = params.toString()
  return qs ? `${pathname}?${qs}` : pathname
}

/**
 * Tauri 的 HTTP 插件可绕过 WebView CORS；普通网页继续使用浏览器 fetch。
 */
export async function musicRuntimeFetch(
  input: string | URL | Request,
  init?: RequestInit,
): Promise<Response> {
  if (isTauriRuntime()) {
    const { fetch } = await import('@tauri-apps/plugin-http')
    return fetch(input, init)
  }
  return globalThis.fetch(input, init)
}

/** 网易云 API：cookie 走查询参数；Tauri 额外带 Cookie 头。 */
export async function neteaseFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${getNeteaseApiBase()}${withNeteaseCookie(path)}`
  const headers = new Headers(init?.headers || {})
  if (isTauriRuntime()) {
    const cookie = getNeteaseCookie()
    if (cookie && !headers.has('Cookie')) headers.set('Cookie', cookie)
  }
  return musicRuntimeFetch(url, { ...init, headers })
}
