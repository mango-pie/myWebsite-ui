/**
 * 今日一言（Hitokoto）— 直连第三方 API，经 Vite 代理 /hitokoto-api → v1.hitokoto.cn
 * 见 vite.config.ts proxy 配置
 *
 * 注意：勿放在 src/api/，该目录由 openapi2ts 自动生成会覆盖手写文件。
 */

export interface HitokotoItem {
  id: number
  uuid: string
  hitokoto: string
  type: string
  from: string
  from_who: string | null
  creator: string
  creator_uid: number
  reviewer: number
  commit_from: string
  created_at: string
  length: number
}

/** Hitokoto 分类字母 → 中文标签 */
export const hitokotoTypeLabels: Record<string, string> = {
  a: '动画',
  b: '漫画',
  c: '游戏',
  d: '文学',
  e: '原创',
  f: '网络',
  g: '其他',
  h: '影视',
  i: '诗词',
  j: '哲学',
  k: '抖机灵',
}

export function getHitokotoDetailUrl(uuid: string): string {
  return `https://hitokoto.cn?uuid=${encodeURIComponent(uuid)}`
}

let sessionCache: HitokotoItem | null = null

/**
 * @param force true 时跳过会话内缓存并换一句
 */
export async function fetchHitokoto(force = false): Promise<HitokotoItem> {
  if (!force && sessionCache) {
    return sessionCache
  }

  const query = new URLSearchParams({ encode: 'json' })
  if (force) {
    query.set('_t', String(Date.now()))
  }

  const res = await fetch(`/hitokoto-api/?${query.toString()}`)
  if (!res.ok) {
    throw new Error(`Hitokoto API ${res.status}`)
  }

  const data = (await res.json()) as HitokotoItem
  sessionCache = data
  return data
}
