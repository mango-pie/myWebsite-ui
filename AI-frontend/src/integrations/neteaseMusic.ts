/**
 * 网易云音乐 API 封装 — 经 Vite 代理 /netease-api → 本地 api-enhanced (默认 :3000)
 * 见 vite.config.ts、useNeteaseLogin.ts、design/netease-api-enhanced-analysis.md
 *
 * 注意：勿放在 src/api/，该目录由 openapi2ts 自动生成会覆盖手写文件。
 */

import { resolveNeteaseCover } from '@/utils/musicCover'

export type { Song } from '@/design/types'

import type { Song } from '@/design/types'

const BASE_URL = '/netease-api'

const COOKIE_KEY = 'netease_music_cookie'

export interface SearchMusicPage {
  songs: Song[]
  total: number
  hasMore: boolean
}

export interface LyricLine {
  time: number
  text: string
}

function buildHeaders(): HeadersInit {
  const savedCookie = localStorage.getItem(COOKIE_KEY)
  if (!savedCookie) return {}
  return { Cookie: savedCookie }
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { headers: buildHeaders() })
  if (!res.ok) {
    throw new Error(`Netease API ${res.status}: ${path}`)
  }
  return res.json() as Promise<T>
}

type RawArtist = { id?: number; name?: string }
type RawAlbum = { id?: number; name?: string; picUrl?: string; picId?: number }
type RawSong = {
  id: number
  name: string
  artists?: RawArtist[]
  ar?: RawArtist[]
  album?: RawAlbum
  al?: RawAlbum
  duration?: number
  dt?: number
  picUrl?: string
}

function mapRawSong(item: RawSong): Song {
  const artists = item.artists ?? item.ar ?? []
  const album = item.album ?? item.al ?? {}
  const durationMs = item.duration ?? item.dt ?? 0

  return {
    id: String(item.id),
    title: item.name,
    artist: artists.map((a) => a.name).filter(Boolean).join(' / ') || '未知歌手',
    album: album.name || '未知专辑',
    coverUrl: resolveNeteaseCover(album, item.picUrl),
    audioUrl: '',
    duration: Math.max(0, Math.round(durationMs / 1000)),
  }
}

/**
 * 搜索歌曲（分页）
 */
export async function searchMusic(
  keyword: string,
  limit = 30,
  offset = 0,
): Promise<SearchMusicPage> {
  const query = new URLSearchParams({
    keywords: keyword.trim(),
    limit: String(limit),
    offset: String(offset),
    type: '1',
  })

  const data = await fetchJson<{
    code?: number
    result?: { songs?: RawSong[]; songCount?: number }
  }>(`/search?${query.toString()}`)

  const result = data.result
  const rawSongs = result?.songs ?? []
  const total = result?.songCount ?? rawSongs.length
  const songs = rawSongs.map(mapRawSong)

  return {
    songs,
    total,
    hasMore: offset + songs.length < total,
  }
}

/**
 * 获取歌曲播放 URL
 */
export async function getSongUrl(id: string | number): Promise<string> {
  const query = new URLSearchParams({ id: String(id) })
  const data = await fetchJson<{
    code?: number
    data?: Array<{ id?: number; url?: string | null }>
  }>(`/song/url/v1?${query.toString()}&level=standard`)

  const url = data.data?.[0]?.url
  if (url) return url

  const legacy = await fetchJson<{
    data?: Array<{ url?: string | null }>
  }>(`/song/url?${query.toString()}`)
  const legacyUrl = legacy.data?.[0]?.url
  if (legacyUrl) return legacyUrl

  throw new Error('无法获取播放链接，请确认 netease-api 服务已启动或尝试登录')
}

/**
 * 解析 LRC 为带时间轴的歌词行
 */
export function parseLrc(lrc: string): LyricLine[] {
  if (!lrc?.trim()) return []

  const lines: LyricLine[] = []
  for (const line of lrc.split('\n')) {
    const match = line.match(/\[(\d{1,2}):(\d{2})[.:](\d{2,3})](.*)/)
    if (!match) continue
    const [, min, sec, ms, text] = match
    const time =
      parseInt(min, 10) * 60 +
      parseInt(sec, 10) +
      parseInt(ms.padEnd(3, '0').slice(0, 3), 10) / 1000
    const trimmed = text.trim()
    if (trimmed) {
      lines.push({ time, text: trimmed })
    }
  }
  return lines.sort((a, b) => a.time - b.time)
}

/**
 * 获取歌词
 */
export async function getLyric(id: string | number): Promise<LyricLine[]> {
  const query = new URLSearchParams({ id: String(id) })
  const data = await fetchJson<{
    lrc?: { lyric?: string }
    code?: number
  }>(`/lyric?${query.toString()}`)

  return parseLrc(data.lrc?.lyric ?? '')
}
