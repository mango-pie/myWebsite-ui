import type { LyricLine, Song } from '@/integrations/neteaseMusic'
import { toCoverDisplayUrl } from '@/utils/musicCover'

export type PulseView = 'stage' | 'discover' | 'search' | 'library' | 'files' | 'playlists' | 'audio' | 'settings'
export type LibraryTab = 'tracks' | 'albums' | 'artists'
export type SearchState = 'idle' | 'results' | 'loading' | 'empty' | 'error'
export type SearchKind = 'song' | 'artist' | 'album' | 'playlist'
export type PlayModeLabel = 'order' | 'single-loop' | 'list-loop' | 'shuffle'
export type MvMode = 'off' | 'pip' | 'stage' | 'theater'
export type TheaterView = 'mv' | 'balanced' | 'lyrics'
export type LyricSize = 'md' | 'large' | 'xlarge'
export type PulseFontPreset = 'pulse' | 'zcool'
export type PulseRoomMode = 'night' | 'day'
export type PulseRoomBg = 'design' | 'anime'
export type PulseAccentPreset = 'iris' | 'amber' | 'rose' | 'mint' | 'custom'
export type LocalPersistKind = 'session' | 'fsa' | 'tauri' | 'blob'

export interface LyricDisplayLine {
  time: number
  text: string
  translation?: string
}

export interface PulseTrack {
  id: string
  title: string
  shortTitle: string
  artist: string
  album: string
  source: string
  duration: number
  url: string
  coverUrl?: string
  tone?: string
  favorite: boolean
  lyrics?: LyricLine[]
  lyricsTranslated?: LyricLine[]
  neteaseId?: string
  /** 网易云 MV id；undefined=未查，''=无，非空=有 */
  mvId?: string
  artistId?: string
  /** 多平台音乐源（qq/kugou），配合 remoteId 使用 */
  remoteServer?: string
  /** 多平台音乐源曲目 id（QQ songmid / 酷狗 FileHash） */
  remoteId?: string
  file?: File
  /** Tauri 绝对路径，跨进程可再打开 */
  localPath?: string
  /** 原始 LRC 文本，本地曲跨刷新保留 */
  lrcText?: string
  /** 译文 LRC 文本 */
  lrcTransText?: string
  persistKind?: LocalPersistKind
  /** FSA 权限未授予，列表可见但暂不可播 */
  localNeedsPermission?: boolean
  /** 本地下载的 MV 路径（Tauri） */
  localMvPath?: string
  /** 本地下载的 MV 可播地址（blob / asset） */
  localMvUrl?: string
}

export interface PlaylistDef {
  key: string
  name: string
  description: string
  meta: string
  label: string
  tone?: string
}

export interface UserPlaylist {
  id: string
  name: string
  trackIds: string[]
}

export interface LibraryFocus {
  kind: 'album' | 'artist'
  name: string
}

export const VIEW_META: Record<PulseView, { code: string; title: string; route: string }> = {
  stage: { code: 'LIVE DESK / 01', title: 'Virtual Stage · 正在播放', route: '舞台' },
  discover: { code: 'LIVE DESK / 02', title: 'Discover · 发现音乐', route: '发现' },
  search: { code: 'LIVE DESK / 03', title: 'Search · 全局搜索', route: '搜索' },
  library: { code: 'LIVE DESK / 04', title: 'Library · 我的曲库', route: '曲库' },
  files: { code: 'LIVE DESK / 05', title: 'Local Files · 本地文件', route: '本地' },
  playlists: { code: 'LIVE DESK / 06', title: 'Playlists · 歌单与电台', route: '歌单' },
  audio: { code: 'LIVE DESK / 07', title: 'Audio Lab · 音频实验室', route: '音频实验室' },
  settings: { code: 'LIVE DESK / 08', title: 'System · 系统设置', route: '设置' },
}

export const STORAGE_KEY = 'pulse-music-library-v1'
export const FAV_KEY = 'pulse-music-favs-v1'
export const HIST_KEY = 'pulse-music-history-v1'
export const QUEUE_KEY = 'pulse-music-queue-v1'
export const SEARCH_HIST_KEY = 'pulse-music-search-hist-v1'
export const PREFS_KEY = 'pulse-music-prefs-v1'
export const USER_PL_KEY = 'pulse-music-user-playlists-v1'
export const STATS_KEY = 'pulse-music-stats-v1'
export const SEARCH_PAGE_SIZE = 30

/** 主歌词是否偏外语（拉丁 / 假名 / 韩文等），用于决定是否露出翻译开关 */
export function isForeignPrimaryLyrics(lines: LyricLine[]): boolean {
  const sample = lines
    .slice(0, 48)
    .map((l) => l.text)
    .join('')
  const letters = sample.replace(/\s/g, '')
  if (!letters.length) return false
  const foreign =
    (letters.match(/[A-Za-z\u00C0-\u024F\u0400-\u04FF\u3040-\u30FF\u31F0-\u31FF\uAC00-\uD7AF]/g) || [])
      .length
  const han = (letters.match(/[\u3400-\u9FFF\uF900-\uFAFF]/g) || []).length
  if (foreign === 0) return false
  return foreign >= Math.max(4, han * 0.4) || foreign / letters.length > 0.22
}

export function alignLyricTranslation(
  primary: LyricLine[],
  translated: LyricLine[],
  tolerance = 0.35,
): LyricDisplayLine[] {
  if (!primary.length) return []
  if (!translated.length) {
    return primary.map((line) => ({ time: line.time, text: line.text }))
  }
  return primary.map((line) => {
    let best: LyricLine | undefined
    let bestDist = tolerance
    for (const t of translated) {
      const d = Math.abs(t.time - line.time)
      if (d <= bestDist) {
        bestDist = d
        best = t
      }
    }
    const tr = best?.text?.trim()
    return {
      time: line.time,
      text: line.text,
      translation: tr && tr !== line.text.trim() ? tr : undefined,
    }
  })
}

export function formatTime(seconds: number) {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0))
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`
}

export function shortOf(title: string) {
  return title.split(/[／/]/)[0]?.trim() || title
}

export function songToPulseTrack(song: Song, favorite = false): PulseTrack {
  return {
    id: `net-${song.id}`,
    title: song.title,
    shortTitle: shortOf(song.title),
    artist: song.artist,
    album: song.album,
    source: '网易云',
    duration: song.duration,
    url: '',
    coverUrl: song.coverUrl,
    favorite,
    neteaseId: song.id,
    mvId: song.mvId,
    artistId: song.artistId,
  }
}

export function qualityLabel(track: PulseTrack | null) {
  if (!track) return 'IDLE'
  if (track.source === '网易云') return 'NETEASE'
  if (track.source === '本地' || track.file || track.localPath) return 'LOCAL'
  if (track.source === 'QQ音乐') return 'QQ'
  if (track.source === '酷狗') return 'KG'
  return (track.source || 'LIVE').toUpperCase()
}

export function coverOf(track: PulseTrack | null | undefined) {
  return toCoverDisplayUrl(track?.coverUrl) || ''
}

export function isLocalTrack(track: PulseTrack) {
  return track.source === '本地' || !!track.file || !!track.localPath || !!track.persistKind
}

export function newLocalTrackId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}
