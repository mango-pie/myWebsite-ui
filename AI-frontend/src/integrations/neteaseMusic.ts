/**
 * 网易云音乐 API 封装 — 经 Vite 代理 /netease-api → 本地 api-enhanced (默认 :3000)
 * 见 vite.config.ts、useNeteaseLogin.ts、design/netease-api-enhanced-analysis.md
 *
 * 注意：勿放在 src/api/，该目录由 openapi2ts 自动生成会覆盖手写文件。
 */

import { resolveNeteaseCover } from '@/utils/musicCover'
import { neteaseFetch } from '@/integrations/musicRuntime'

export type { Song, MvSummary } from '@/design/types'

import type { Song, MvSummary } from '@/design/types'

export type AudioQuality = 'standard' | 'exhigh' | 'lossless'

export interface SearchMusicPage {
  songs: Song[]
  total: number
  hasMore: boolean
}

export interface LyricLine {
  time: number
  text: string
}

export interface NeteaseAlbumSummary {
  id: string
  name: string
  artist: string
  coverUrl: string
  size: number
  publishTime?: number
}

export interface NeteaseAlbumDetail {
  album: NeteaseAlbumSummary
  songs: Song[]
}

export interface NeteasePlaylistSummary {
  id: string
  name: string
  coverUrl: string
  playCount: number
  trackCount: number
  copywriter?: string
}

export interface NeteasePlaylistDetail {
  playlist: NeteasePlaylistSummary
  songs: Song[]
}

/** 网易云电台（DJ）摘要 */
export interface NeteaseDjRadio {
  id: string
  name: string
  coverUrl: string
  desc: string
  programCount: number
  playCount: number
}

export interface NeteaseArtistSummary {
  id: string
  name: string
  coverUrl: string
  albumSize: number
  musicSize: number
  alias?: string
}

export interface NeteaseArtistHotSongs {
  artist: NeteaseArtistSummary
  songs: Song[]
}

/** 播放量简写，如 520.4万 */
export function formatPlayCount(count?: number | null): string {
  const n = Math.max(0, Number(count) || 0)
  if (n >= 100_000_000) {
    const v = n / 100_000_000
    return `${v >= 10 ? Math.round(v) : v.toFixed(1).replace(/\.0$/, '')}亿`
  }
  if (n >= 10_000) {
    const v = n / 10_000
    return `${v >= 100 ? Math.round(v) : v.toFixed(1).replace(/\.0$/, '')}万`
  }
  return String(n)
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await neteaseFetch(path)
  if (!res.ok) {
    throw new Error(`Netease API ${res.status}: ${path}`)
  }
  return res.json() as Promise<T>
}

type RawArtist = {
  id?: number
  name?: string
  picUrl?: string
  img1v1Url?: string
  alias?: string[]
  albumSize?: number
  musicSize?: number
}
type RawAlbum = { id?: number; name?: string; picUrl?: string; picId?: number }
type RawAlbumFull = RawAlbum & {
  size?: number
  publishTime?: number
  artist?: RawArtist
  artists?: RawArtist[]
  blurPicUrl?: string
}
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
  mvid?: number
  mv?: number
}

function mapRawArtist(item: RawArtist): NeteaseArtistSummary | null {
  if (!item?.id) return null
  const alias = (item.alias ?? []).map((a) => a.trim()).filter(Boolean)
  return {
    id: String(item.id),
    name: item.name || '未知歌手',
    coverUrl: resolveNeteaseCover({ picUrl: item.picUrl || item.img1v1Url }),
    albumSize: Math.max(0, Number(item.albumSize) || 0),
    musicSize: Math.max(0, Number(item.musicSize) || 0),
    alias: alias.length ? alias.join(' / ') : undefined,
  }
}

function mapRawAlbum(item: RawAlbumFull): NeteaseAlbumSummary | null {
  if (!item?.id) return null
  const artists = item.artists?.length
    ? item.artists
    : item.artist
      ? [item.artist]
      : []
  const coverUrl = resolveNeteaseCover(
    { picUrl: item.picUrl || item.blurPicUrl, picId: item.picId },
  )
  return {
    id: String(item.id),
    name: item.name || '未知专辑',
    artist: artists.map((a) => a.name).filter(Boolean).join(' / ') || '未知歌手',
    coverUrl,
    size: Math.max(0, Number(item.size) || 0),
    publishTime: item.publishTime,
  }
}

function dedupeAlbums(list: NeteaseAlbumSummary[]): NeteaseAlbumSummary[] {
  const seen = new Set<string>()
  const out: NeteaseAlbumSummary[] = []
  for (const album of list) {
    if (seen.has(album.id)) continue
    seen.add(album.id)
    out.push(album)
  }
  return out
}

function mapRawSong(item: RawSong): Song {
  const artists = item.artists ?? item.ar ?? []
  const album = item.album ?? item.al ?? {}
  const durationMs = item.duration ?? item.dt ?? 0
  const rawMv = item.mvid ?? item.mv
  const mvId = rawMv && Number(rawMv) > 0 ? String(rawMv) : ''
  const artistId = artists[0]?.id && Number(artists[0].id) > 0 ? String(artists[0].id) : undefined

  return {
    id: String(item.id),
    title: item.name,
    artist: artists.map((a) => a.name).filter(Boolean).join(' / ') || '未知歌手',
    album: album.name || '未知专辑',
    coverUrl: resolveNeteaseCover(album, item.picUrl),
    audioUrl: '',
    duration: Math.max(0, Math.round(durationMs / 1000)),
    mvId,
    artistId,
  }
}

function upgradeHttpUrl(raw?: string | null): string {
  if (!raw) return ''
  return raw.startsWith('http://') ? `https://${raw.slice('http://'.length)}` : raw
}

function resolveMvCover(cover?: string | null, imgurl?: string | null): string {
  const raw = cover || imgurl || ''
  if (!raw) return ''
  return resolveNeteaseCover({ picUrl: upgradeHttpUrl(raw) })
}

/**
 * 歌曲详情（含专辑封面）。搜索接口常缺 picUrl，需用本接口补齐。
 */
export async function getSongDetails(ids: Array<string | number>): Promise<Map<string, Song>> {
  const unique = [...new Set(ids.map(String).filter(Boolean))]
  const map = new Map<string, Song>()
  if (!unique.length) return map

  // 网易云 ids 过长会失败，分批拉取
  const chunkSize = 50
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize)
    const query = new URLSearchParams({ ids: chunk.join(',') })
    const data = await fetchJson<{
      code?: number
      songs?: RawSong[]
    }>(`/song/detail?${query.toString()}`)

    for (const item of data.songs ?? []) {
      map.set(String(item.id), mapRawSong(item))
    }
  }
  return map
}

export type MvQuality = 480 | 720 | 1080

/**
 * 获取 MV 详情（可用清晰度等）
 */
export async function getMvDetail(id: string | number): Promise<{
  id: string
  name: string
  coverUrl: string
  artist?: string
  duration: number
  resolutions: MvQuality[]
}> {
  const query = new URLSearchParams({ mvid: String(id) })
  const data = await fetchJson<{
    code?: number
    data?: {
      id?: number
      name?: string
      cover?: string
      desc?: string
      artistName?: string
      duration?: number
      brs?: Record<string, number> | Array<{ br?: number }>
    }
  }>(`/mv/detail?${query.toString()}`)

  const detail = data.data
  if (!detail?.id) throw new Error('无法获取 MV 详情')

  const resolutions: MvQuality[] = []
  const brs = detail.brs
  const candidates: number[] = Array.isArray(brs)
    ? brs.map((b) => Number(b.br) || 0)
    : brs
      ? Object.keys(brs).map((k) => Number(k) || 0)
      : [1080, 720, 480]
  for (const q of [1080, 720, 480] as MvQuality[]) {
    if (candidates.some((b) => b >= q) || !candidates.length) resolutions.push(q)
  }
  if (!resolutions.length) resolutions.push(720, 480)

  return {
    id: String(detail.id),
    name: detail.name || 'MV',
    coverUrl: resolveMvCover(detail.cover),
    artist: detail.artistName,
    duration: Math.max(0, Math.round((detail.duration || 0) / 1000)),
    resolutions,
  }
}

/**
 * 获取 MV 播放地址（默认 720p，失败可降清晰度）
 */
export async function getMvUrl(id: string | number, r: MvQuality = 720): Promise<string> {
  const query = new URLSearchParams({ id: String(id), r: String(r) })
  const data = await fetchJson<{
    code?: number
    data?: { id?: number; url?: string | null; r?: number } | Array<{ url?: string | null }>
  }>(`/mv/url?${query.toString()}`)

  const payload = data.data
  const rawUrl = Array.isArray(payload) ? payload[0]?.url : payload?.url
  // 页面若为 https，http 视频会被混合内容拦截或表现为「只有静帧」
  const url = upgradeHttpUrl(rawUrl)
  if (url) return url

  if (r !== 480) {
    return getMvUrl(id, r === 1080 ? 720 : 480)
  }
  throw new Error('无法获取 MV 播放地址')
}

/**
 * 相似 MV
 */
export async function fetchSimilarMvs(mvid: string | number): Promise<MvSummary[]> {
  const query = new URLSearchParams({ mvid: String(mvid) })
  const data = await fetchJson<{
    code?: number
    mvs?: Array<{
      id?: number
      name?: string
      cover?: string
      imgurl?: string
      artistName?: string
      duration?: number
      artists?: Array<{ name?: string }>
    }>
  }>(`/simi/mv?${query.toString()}`)

  return (data.mvs ?? [])
    .filter((m) => m.id)
    .map((m) => ({
      id: String(m.id),
      name: m.name || 'MV',
      coverUrl: resolveMvCover(m.cover, m.imgurl),
      artist: m.artistName || m.artists?.map((a) => a.name).filter(Boolean).join(' / '),
      duration: Math.max(0, Math.round((m.duration || 0) / 1000)),
    }))
}

/**
 * 歌手 MV 列表
 */
export async function fetchArtistMvs(artistId: string | number, limit = 20): Promise<MvSummary[]> {
  const query = new URLSearchParams({ id: String(artistId), limit: String(limit) })
  const data = await fetchJson<{
    code?: number
    mvs?: Array<{
      id?: number
      name?: string
      imgurl?: string
      imgurl16v9?: string
      artistName?: string
      duration?: number
    }>
  }>(`/artist/mv?${query.toString()}`)

  return (data.mvs ?? [])
    .filter((m) => m.id)
    .map((m) => ({
      id: String(m.id),
      name: m.name || 'MV',
      coverUrl: resolveMvCover(m.imgurl16v9, m.imgurl),
      artist: m.artistName,
      duration: Math.max(0, Math.round((m.duration || 0) / 1000)),
    }))
}

/**
 * 单曲封面（经代理的展示 URL）
 */
export async function getSongCoverUrl(id: string | number): Promise<string> {
  const details = await getSongDetails([id])
  return details.get(String(id))?.coverUrl ?? ''
}

export interface HotSearchItem {
  searchWord: string
  score?: number
  content?: string
}

/**
 * 网易云热搜词
 */
export async function fetchHotSearches(): Promise<HotSearchItem[]> {
  try {
    const data = await fetchJson<{
      code?: number
      data?: Array<{ searchWord?: string; score?: number; content?: string }>
    }>('/search/hot/detail')
    const list = (data.data ?? [])
      .map((item) => ({
        searchWord: (item.searchWord || '').trim(),
        score: item.score,
        content: item.content,
      }))
      .filter((item) => item.searchWord)
    if (list.length) return list.slice(0, 16)
  } catch {
    /* fall through */
  }

  const simple = await fetchJson<{
    result?: { hots?: Array<{ first?: string }> }
  }>('/search/hot')
  return (simple.result?.hots ?? [])
    .map((item) => ({ searchWord: (item.first || '').trim() }))
    .filter((item) => item.searchWord)
    .slice(0, 16)
}

/**
 * 搜索歌曲（分页）
 * 搜索结果常无封面，自动用 song/detail 补齐
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
  let songs = rawSongs.map(mapRawSong)

  const missingIds = songs.filter((s) => !s.coverUrl).map((s) => s.id)
  if (missingIds.length) {
    try {
      const details = await getSongDetails(missingIds)
      songs = songs.map((s) => {
        if (s.coverUrl) return s
        const detail = details.get(s.id)
        if (!detail?.coverUrl) return s
        return {
          ...s,
          coverUrl: detail.coverUrl,
          album: s.album === '未知专辑' && detail.album ? detail.album : s.album,
        }
      })
    } catch {
      /* 封面补齐失败不阻断搜索 */
    }
  }

  return {
    songs,
    total,
    hasMore: offset + songs.length < total,
  }
}

/**
 * 获取歌曲播放 URL
 */
export async function getSongUrl(
  id: string | number,
  level: AudioQuality = 'standard',
): Promise<string> {
  const query = new URLSearchParams({ id: String(id), level })
  const data = await fetchJson<{
    code?: number
    data?: Array<{ id?: number; url?: string | null }>
  }>(`/song/url/v1?${query.toString()}`)

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
    const min = match[1] ?? '0'
    const sec = match[2] ?? '0'
    const ms = match[3] ?? '0'
    const text = match[4] ?? ''
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

/** 无时间轴的纯文本歌词，按时长均分，方便本地文件也能滚动显示 */
export function parsePlainLyrics(text: string, duration = 0): LyricLine[] {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*\d+\s*[:.、.]\s*/, '').trim())
    .filter((line) => line && !/^\[(?:ti|ar|al|by|offset):/i.test(line))
  if (!rows.length) return []
  const span = Math.max(duration > 0 ? duration : rows.length * 4, rows.length)
  const step = span / rows.length
  return rows.map((line, i) => ({ time: Math.round(i * step * 100) / 100, text: line }))
}

export function parseLrcOrPlain(lrc: string, duration = 0): LyricLine[] {
  const timed = parseLrc(lrc)
  return timed.length ? timed : parsePlainLyrics(lrc, duration)
}

function normalizeLyricKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[（(].*?[)）]/g, ' ')
    .replace(/\bfeat\.?.*$/i, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .trim()
}

function isPlaceholderArtist(artist: string) {
  return !artist || artist === '本地文件' || artist === '未知歌手'
}

function scoreLocalLyricMatch(title: string, artist: string, song: Song): number {
  const trackTitle = normalizeLyricKey(title)
  const songTitle = normalizeLyricKey(song.title)
  if (!trackTitle || !songTitle) return 0
  const titleExact = trackTitle === songTitle
  const titleClose = titleExact || songTitle.includes(trackTitle) || trackTitle.includes(songTitle)
  if (!titleClose) return 0
  let score = titleExact ? 5 : 2
  if (!isPlaceholderArtist(artist)) {
    const trackArtist = normalizeLyricKey(artist)
    const songArtist = normalizeLyricKey(song.artist)
    if (trackArtist && songArtist) {
      if (trackArtist === songArtist) score += 4
      else if (songArtist.includes(trackArtist) || trackArtist.includes(songArtist)) score += 2
      else score -= 2
    }
  }
  return score
}

/**
 * 用本地文件的标题/歌手在网易云搜带时间轴的歌词（不改播放源）
 */
export async function lookupOnlineLyrics(
  title: string,
  artist = '',
  duration = 0,
): Promise<{ original: LyricLine[]; translation: LyricLine[]; lrcText: string; transLrcText: string } | null> {
  const cleanTitle = title.trim()
  if (!cleanTitle || /^(\d+|track\s*\d+|audio)$/i.test(normalizeLyricKey(cleanTitle))) return null
  const keyword = [cleanTitle, isPlaceholderArtist(artist) ? '' : artist].filter(Boolean).join(' ')
  const page = await searchMusic(keyword, 8)
  let best: Song | null = null
  let bestScore = 0
  for (const song of page.songs) {
    const score = scoreLocalLyricMatch(cleanTitle, artist, song)
    if (score > bestScore) {
      best = song
      bestScore = score
    }
  }
  if (!best || bestScore < 5) return null

  const query = new URLSearchParams({ id: String(best.id) })
  const data = await fetchJson<{
    lrc?: { lyric?: string }
    tlyric?: { lyric?: string }
  }>(`/lyric?${query.toString()}`)
  const lrcText = data.lrc?.lyric ?? ''
  const transLrcText = data.tlyric?.lyric ?? ''
  const original = parseLrcOrPlain(lrcText, duration)
  if (!original.length) return null
  return {
    original,
    translation: parseLrc(transLrcText),
    lrcText,
    transLrcText,
  }
}

/**
 * 获取歌词（原文 + 译文）
 */
export async function getLyricBundle(id: string | number): Promise<{
  original: LyricLine[]
  translation: LyricLine[]
  lrcText: string
  transLrcText: string
}> {
  const query = new URLSearchParams({ id: String(id) })
  const data = await fetchJson<{
    lrc?: { lyric?: string }
    tlyric?: { lyric?: string }
    code?: number
  }>(`/lyric?${query.toString()}`)
  const lrcText = data.lrc?.lyric ?? ''
  const transLrcText = data.tlyric?.lyric ?? ''

  return {
    original: parseLrc(lrcText),
    translation: parseLrc(transLrcText),
    lrcText,
    transLrcText,
  }
}

/**
 * 获取歌词
 */
export async function getLyric(id: string | number): Promise<LyricLine[]> {
  const bundle = await getLyricBundle(id)
  return bundle.original
}

/**
 * 最新专辑（封面墙「新碟」）
 */
export async function getNewestAlbums(limit = 30): Promise<NeteaseAlbumSummary[]> {
  const data = await fetchJson<{
    code?: number
    albums?: RawAlbumFull[]
  }>('/album/newest')
  return dedupeAlbums((data.albums ?? []).map(mapRawAlbum).filter(Boolean) as NeteaseAlbumSummary[]).slice(
    0,
    limit,
  )
}

/**
 * 热门专辑（封面墙「热门」）— top/album 的 month/week 合并去重
 */
export async function getTopAlbums(limit = 30, offset = 0): Promise<NeteaseAlbumSummary[]> {
  const query = new URLSearchParams({
    limit: String(Math.max(limit, 20)),
    offset: String(offset),
  })
  const data = await fetchJson<{
    code?: number
    monthData?: RawAlbumFull[]
    weekData?: RawAlbumFull[]
    albums?: RawAlbumFull[]
  }>(`/top/album?${query.toString()}`)

  const raw = [...(data.monthData ?? []), ...(data.weekData ?? []), ...(data.albums ?? [])]
  return dedupeAlbums(raw.map(mapRawAlbum).filter(Boolean) as NeteaseAlbumSummary[]).slice(0, limit)
}

/**
 * 专辑详情（元信息 + 曲目列表）
 */
export async function getAlbumDetail(id: string | number): Promise<NeteaseAlbumDetail> {
  const query = new URLSearchParams({ id: String(id) })
  const data = await fetchJson<{
    code?: number
    album?: RawAlbumFull
    songs?: RawSong[]
  }>(`/album?${query.toString()}`)

  const album = mapRawAlbum(data.album ?? { id: Number(id) })
  if (!album) throw new Error('专辑不存在或无法解析')

  let songs = (data.songs ?? []).map(mapRawSong).map((s) => ({
    ...s,
    album: album.name,
    coverUrl: s.coverUrl || album.coverUrl,
  }))

  const missingIds = songs.filter((s) => !s.coverUrl).map((s) => s.id)
  if (missingIds.length) {
    try {
      const details = await getSongDetails(missingIds)
      songs = songs.map((s) => {
        if (s.coverUrl) return s
        return { ...s, coverUrl: details.get(s.id)?.coverUrl || album.coverUrl }
      })
    } catch {
      /* ignore */
    }
  }

  if (!album.size && songs.length) album.size = songs.length

  return { album, songs }
}

type RawPlaylist = {
  id?: number
  name?: string
  picUrl?: string
  coverImgUrl?: string
  playCount?: number
  playcount?: number
  trackCount?: number
  copywriter?: string
}

function mapRawPlaylist(item: RawPlaylist): NeteasePlaylistSummary | null {
  if (!item?.id) return null
  const cover = item.picUrl || item.coverImgUrl || ''
  return {
    id: String(item.id),
    name: item.name || '未命名歌单',
    coverUrl: resolveNeteaseCover({ picUrl: cover }),
    playCount: Math.max(0, Number(item.playCount ?? item.playcount) || 0),
    trackCount: Math.max(0, Number(item.trackCount) || 0),
    copywriter: item.copywriter,
  }
}

/**
 * 推荐歌单（发现页补给站）
 */
export async function getPersonalizedPlaylists(limit = 12): Promise<NeteasePlaylistSummary[]> {
  const query = new URLSearchParams({ limit: String(limit) })
  const data = await fetchJson<{
    code?: number
    result?: RawPlaylist[]
  }>(`/personalized?${query.toString()}`)
  return (data.result ?? []).map(mapRawPlaylist).filter(Boolean) as NeteasePlaylistSummary[]
}

/**
 * 热门歌单（personalized 不足时的兜底）
 */
export async function getHotPlaylists(limit = 12): Promise<NeteasePlaylistSummary[]> {
  const query = new URLSearchParams({
    limit: String(limit),
    order: 'hot',
  })
  const data = await fetchJson<{
    code?: number
    playlists?: RawPlaylist[]
  }>(`/top/playlist?${query.toString()}`)
  return (data.playlists ?? []).map(mapRawPlaylist).filter(Boolean) as NeteasePlaylistSummary[]
}

/**
 * 网易云排行榜列表（发现页「网易云榜单」区块）
 */
export async function getToplists(limit = 12): Promise<NeteasePlaylistSummary[]> {
  const data = await fetchJson<{
    code?: number
    list?: RawPlaylist[]
  }>('/toplist')
  return (data.list ?? []).slice(0, limit).map(mapRawPlaylist).filter(Boolean) as NeteasePlaylistSummary[]
}

/**
 * 网易云排行榜详情
 */
export async function getToplistDetail(id: string | number): Promise<NeteasePlaylistDetail> {
  const query = new URLSearchParams({ id: String(id) })
  const data = await fetchJson<{
    code?: number
    playlist?: RawPlaylist & { tracks?: RawSong[] }
  }>(`/toplist/detail?${query.toString()}`)
  const playlist = mapRawPlaylist(data.playlist ?? { id: Number(id) })
  if (!playlist) throw new Error('榜单不存在')
  const songs = (data.playlist?.tracks ?? []).map(mapRawSong).slice(0, 200)
  if (playlist.coverUrl) {
    return {
      playlist: { ...playlist, trackCount: songs.length || playlist.trackCount },
      songs: songs.map((s) => ({ ...s, coverUrl: s.coverUrl || playlist.coverUrl })),
    }
  }
  return { playlist, songs }
}

/**
 * 热门主播电台（发现页「电台」区块）
 */
export async function getHotDjRadios(limit = 10): Promise<NeteaseDjRadio[]> {
  const query = new URLSearchParams({ limit: String(limit) })
  const data = await fetchJson<{
    code?: number
    djRadios?: Array<{
      id?: number
      name?: string
      picUrl?: string
      picId?: number
      desc?: string
      programCount?: number
      playCount?: number
    }>
  }>(`/dj/hot?${query.toString()}`)
  return (data.djRadios ?? [])
    .filter((r) => r && r.id)
    .map((r) => ({
      id: String(r.id),
      name: r.name || '未知电台',
      coverUrl: resolveNeteaseCover({ picUrl: r.picUrl, picId: r.picId }),
      desc: r.desc || '',
      programCount: Math.max(0, Number(r.programCount) || 0),
      playCount: Math.max(0, Number(r.playCount) || 0),
    }))
}

/**
 * 电台节目列表（mainSong 映射为可播放 Song）
 */
export async function getDjPrograms(rid: string | number, limit = 50): Promise<Song[]> {
  const query = new URLSearchParams({ rid: String(rid), limit: String(limit) })
  const data = await fetchJson<{
    code?: number
    programs?: Array<{ mainSong?: RawSong }>
  }>(`/dj/program?${query.toString()}`)
  return (data.programs ?? [])
    .map((p) => p?.mainSong)
    .filter((s): s is RawSong => !!s && !!s.id)
    .map(mapRawSong)
}

/**
 * 相似歌曲（歌曲详情抽屉「相似推荐」）
 */
export async function getSimiSongs(id: string | number, limit = 10): Promise<Song[]> {
  const query = new URLSearchParams({ id: String(id), limit: String(limit) })
  const data = await fetchJson<{
    code?: number
    songs?: RawSong[]
  }>(`/simi/song?${query.toString()}`)
  return (data.songs ?? []).map(mapRawSong)
}

/**
 * 每日推荐歌曲（需登录时更准；未登录也可能有数据）
 */
export async function getDailyRecommendSongs(): Promise<Song[]> {
  const data = await fetchJson<{
    code?: number
    data?: { dailySongs?: RawSong[] }
    recommend?: RawSong[]
  }>('/recommend/songs')
  const raw = data.data?.dailySongs ?? data.recommend ?? []
  return raw.map(mapRawSong)
}

/**
 * 推荐新歌
 */
export async function getPersonalizedNewSongs(limit = 20): Promise<Song[]> {
  const data = await fetchJson<{
    code?: number
    result?: Array<{ id?: number; name?: string; picUrl?: string; song?: RawSong }>
  }>('/personalized/newsong')

  const songs = (data.result ?? [])
    .map((item) => {
      if (item.song) {
        const mapped = mapRawSong(item.song)
        if (!mapped.coverUrl && item.picUrl) {
          mapped.coverUrl = resolveNeteaseCover({ picUrl: item.picUrl })
        }
        return mapped
      }
      return null
    })
    .filter(Boolean) as Song[]

  return songs.slice(0, limit)
}

/**
 * 歌单详情
 */
export async function getPlaylistDetail(id: string | number): Promise<NeteasePlaylistDetail> {
  const query = new URLSearchParams({ id: String(id) })
  const data = await fetchJson<{
    code?: number
    playlist?: RawPlaylist & {
      tracks?: RawSong[]
      creator?: { nickname?: string }
    }
  }>(`/playlist/detail?${query.toString()}`)

  const playlist = mapRawPlaylist(data.playlist ?? { id: Number(id) })
  if (!playlist) throw new Error('歌单不存在或无法解析')

  let songs = (data.playlist?.tracks ?? []).map(mapRawSong).slice(0, 200)
  if (playlist.coverUrl) {
    songs = songs.map((s) => ({ ...s, coverUrl: s.coverUrl || playlist.coverUrl }))
  }

  const missingIds = songs.filter((s) => !s.coverUrl).map((s) => s.id)
  if (missingIds.length) {
    try {
      const details = await getSongDetails(missingIds.slice(0, 50))
      songs = songs.map((s) => {
        if (s.coverUrl) return s
        return { ...s, coverUrl: details.get(s.id)?.coverUrl || playlist.coverUrl }
      })
    } catch {
      /* ignore */
    }
  }

  if (!playlist.trackCount && songs.length) playlist.trackCount = songs.length

  return { playlist, songs }
}

export interface SearchAlbumPage {
  albums: NeteaseAlbumSummary[]
  total: number
  hasMore: boolean
}

export interface SearchPlaylistPage {
  playlists: NeteasePlaylistSummary[]
  total: number
  hasMore: boolean
}

export interface SearchArtistPage {
  artists: NeteaseArtistSummary[]
  total: number
  hasMore: boolean
}

/**
 * 搜索专辑
 */
export async function searchAlbums(
  keyword: string,
  limit = 20,
  offset = 0,
): Promise<SearchAlbumPage> {
  const query = new URLSearchParams({
    keywords: keyword.trim(),
    limit: String(limit),
    offset: String(offset),
    type: '10',
  })
  const data = await fetchJson<{
    result?: { albums?: RawAlbumFull[]; albumCount?: number }
  }>(`/search?${query.toString()}`)
  const albums = (data.result?.albums ?? [])
    .map(mapRawAlbum)
    .filter(Boolean) as NeteaseAlbumSummary[]
  const total = data.result?.albumCount ?? albums.length
  return {
    albums,
    total,
    hasMore: offset + albums.length < total,
  }
}

/**
 * 搜索歌单
 */
export async function searchPlaylists(
  keyword: string,
  limit = 20,
  offset = 0,
): Promise<SearchPlaylistPage> {
  const query = new URLSearchParams({
    keywords: keyword.trim(),
    limit: String(limit),
    offset: String(offset),
    type: '1000',
  })
  const data = await fetchJson<{
    result?: { playlists?: RawPlaylist[]; playlistCount?: number }
  }>(`/search?${query.toString()}`)
  const playlists = (data.result?.playlists ?? [])
    .map(mapRawPlaylist)
    .filter(Boolean) as NeteasePlaylistSummary[]
  const total = data.result?.playlistCount ?? playlists.length
  return {
    playlists,
    total,
    hasMore: offset + playlists.length < total,
  }
}

/**
 * 搜索歌手
 */
export async function searchArtists(
  keyword: string,
  limit = 20,
  offset = 0,
): Promise<SearchArtistPage> {
  const query = new URLSearchParams({
    keywords: keyword.trim(),
    limit: String(limit),
    offset: String(offset),
    type: '100',
  })
  const data = await fetchJson<{
    result?: { artists?: RawArtist[]; artistCount?: number }
  }>(`/search?${query.toString()}`)
  const artists = (data.result?.artists ?? [])
    .map(mapRawArtist)
    .filter(Boolean) as NeteaseArtistSummary[]
  const total = data.result?.artistCount ?? artists.length
  return {
    artists,
    total,
    hasMore: offset + artists.length < total,
  }
}

async function fillMissingSongCovers(songs: Song[], fallbackCover?: string): Promise<Song[]> {
  let next = fallbackCover
    ? songs.map((s) => ({ ...s, coverUrl: s.coverUrl || fallbackCover }))
    : songs
  const missingIds = next.filter((s) => !s.coverUrl).map((s) => s.id)
  if (!missingIds.length) return next
  try {
    const details = await getSongDetails(missingIds.slice(0, 50))
    next = next.map((s) => {
      if (s.coverUrl) return s
      return { ...s, coverUrl: details.get(s.id)?.coverUrl || fallbackCover || '' }
    })
  } catch {
    /* ignore */
  }
  return next
}

/**
 * 歌手热门曲。`/artists` 无曲时再试 `/artist/songs`。
 */
export async function getArtistHotSongs(id: string | number): Promise<NeteaseArtistHotSongs> {
  const query = new URLSearchParams({ id: String(id) })
  const data = await fetchJson<{
    code?: number
    artist?: RawArtist
    hotSongs?: RawSong[]
  }>(`/artists?${query.toString()}`)

  const artist =
    mapRawArtist(data.artist ?? { id: Number(id) }) ??
    ({
      id: String(id),
      name: '未知歌手',
      coverUrl: '',
      albumSize: 0,
      musicSize: 0,
    } satisfies NeteaseArtistSummary)

  let songs = (data.hotSongs ?? []).map(mapRawSong)
  if (!songs.length) {
    try {
      const paged = await fetchJson<{ songs?: RawSong[] }>(
        `/artist/songs?${new URLSearchParams({ id: String(id), limit: '50' }).toString()}`,
      )
      songs = (paged.songs ?? []).map(mapRawSong)
    } catch {
      /* keep empty */
    }
  }

  songs = await fillMissingSongCovers(songs, artist.coverUrl)
  if (!artist.musicSize && songs.length) artist.musicSize = songs.length
  return { artist, songs }
}

/**
 * 用户歌单（含「我喜欢的音乐」）
 */
export async function getUserPlaylists(uid: string | number): Promise<NeteasePlaylistSummary[]> {
  const query = new URLSearchParams({ uid: String(uid), limit: '100' })
  const data = await fetchJson<{
    playlist?: RawPlaylist[]
    playlists?: RawPlaylist[]
  }>(`/user/playlist?${query.toString()}`)
  const raw = data.playlist ?? data.playlists ?? []
  return raw.map(mapRawPlaylist).filter(Boolean) as NeteasePlaylistSummary[]
}

/**
 * 红心歌曲 id 列表
 */
export async function getLikedSongIds(uid: string | number): Promise<string[]> {
  const query = new URLSearchParams({ uid: String(uid) })
  const data = await fetchJson<{ ids?: Array<number | string> }>(`/likelist?${query.toString()}`)
  return (data.ids ?? []).map(String).filter(Boolean)
}

/**
 * 红心歌曲详情（最多 200 首）
 */
export async function getLikedSongs(uid: string | number): Promise<Song[]> {
  const ids = await getLikedSongIds(uid)
  if (!ids.length) return []
  const details = await getSongDetails(ids.slice(0, 200))
  return ids
    .slice(0, 200)
    .map((id) => details.get(id))
    .filter(Boolean) as Song[]
}
