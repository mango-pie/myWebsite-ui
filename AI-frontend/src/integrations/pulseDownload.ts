import { isLocalTrack, type PulseTrack } from '@/composables/pulse/pulseTypes'
import {
  getLyricBundle,
  getMvUrl,
  getSongDetails,
  getSongUrl,
  type AudioQuality,
  type LyricLine,
  type MvQuality,
} from '@/integrations/neteaseMusic'
import { getMetingLyricRaw, getMetingUrl, type MetingServer } from '@/integrations/metingMusic'
import { isTauriRuntime, musicRuntimeFetch } from '@/integrations/musicRuntime'
import {
  importDownloadedAudio,
  importFromFsaDir,
  importFromTauriDir,
  joinPath,
  type LocalImportResult,
  type PulseSidecar,
} from '@/integrations/pulseLocalLibrary'
import { toCoverDisplayUrl } from '@/utils/musicCover'

export type DownloadSink =
  | { kind: 'tauri'; dir: string }
  | { kind: 'fsa'; dir: FileSystemDirectoryHandle }
  | { kind: 'browser-download' }

export type DownloadStage = 'audio' | 'tag' | 'cover' | 'lyrics' | 'mv'

export interface DownloadProgress {
  stage: DownloadStage
  title: string
  index: number
  count: number
  loaded?: number
  total?: number
}

export class DownloadAbortError extends Error {
  constructor(message = '已取消下载') {
    super(message)
    this.name = 'DownloadAbortError'
  }
}

export function isDownloadAbortError(err: unknown) {
  return err instanceof DownloadAbortError || (err instanceof DOMException && err.name === 'AbortError')
}

export function canDownloadTrack(track: PulseTrack | null | undefined) {
  if (!track) return false
  if (isLocalTrack(track)) return false
  return !!(track.neteaseId || (track.remoteServer && track.remoteId) || (track.url && !track.url.startsWith('blob:')))
}

export function sanitizeFileStem(name: string) {
  const cleaned = name
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
  return cleaned || 'track'
}

export function downloadSinkLabel(sink: DownloadSink) {
  if (sink.kind === 'tauri') return sink.dir
  if (sink.kind === 'fsa') return sink.dir.name || '已授权文件夹'
  return '浏览器下载文件夹'
}

function downloadStem(track: PulseTrack) {
  const artist = sanitizeFileStem(track.artist || '')
  const title = sanitizeFileStem(track.shortTitle || track.title || 'track')
  const base = !artist || artist === '未知歌手' || artist === '本地文件' ? title : `${artist} - ${title}`
  const id = track.neteaseId || track.remoteId
  return id ? `${base} [${sanitizeFileStem(id).slice(0, 16)}]` : base
}

export async function rememberedFsaDir(): Promise<FileSystemDirectoryHandle | null> {
  return loadFsaDir()
}

export async function importFromDownloadSink(sink: DownloadSink): Promise<LocalImportResult[]> {
  if (sink.kind === 'tauri') return importFromTauriDir(sink.dir)
  if (sink.kind === 'fsa') return importFromFsaDir(sink.dir)
  return []
}

async function ensureSongSink(sink: DownloadSink, folderName: string): Promise<DownloadSink> {
  if (sink.kind === 'tauri') {
    const { mkdir } = await import('@tauri-apps/plugin-fs')
    const dir = joinPath(sink.dir, folderName)
    await mkdir(dir, { recursive: true })
    return { kind: 'tauri', dir }
  }
  if (sink.kind === 'fsa') {
    const dir = await sink.dir.getDirectoryHandle(folderName, { create: true })
    return { kind: 'fsa', dir }
  }
  return sink
}

function refererFor(url: string) {
  try {
    const host = new URL(url).hostname
    if (host.includes('qq.com') || host.includes('gtimg')) return 'https://y.qq.com/'
    if (host.includes('kugou') || host.includes('kgimg')) return 'https://www.kugou.com/'
    return 'https://music.163.com/'
  } catch {
    return 'https://music.163.com/'
  }
}

function browserSafeUrl(url: string) {
  if (isTauriRuntime()) return url
  return url.startsWith('http://') ? `https://${url.slice('http://'.length)}` : url
}

function extFromMimeAndUrl(mime: string, url: string, kind: 'audio' | 'video') {
  const type = mime.toLowerCase()
  if (kind === 'video') {
    if (type.includes('webm')) return '.webm'
    if (type.includes('mp4') || type.includes('mpeg')) return '.mp4'
    const fromUrl = url.match(/\.(mp4|webm|mkv|flv)(?:\?|$)/i)
    return fromUrl ? `.${fromUrl[1]!.toLowerCase()}` : '.mp4'
  }
  if (type.includes('flac')) return '.flac'
  if (type.includes('wav')) return '.wav'
  if (type.includes('ogg')) return '.ogg'
  if (type.includes('aac')) return '.aac'
  if (type.includes('mp4') || type.includes('m4a')) return '.m4a'
  if (type.includes('mpeg') || type.includes('mp3')) return '.mp3'
  const fromUrl = url.match(/\.(mp3|flac|wav|ogg|m4a|aac|opus)(?:\?|$)/i)
  return fromUrl ? `.${fromUrl[1]!.toLowerCase()}` : '.mp3'
}

function linesToLrc(lines: LyricLine[]) {
  return lines
    .map((line) => {
      const total = Math.max(0, line.time)
      const min = Math.floor(total / 60)
      const sec = total - min * 60
      const whole = Math.floor(sec)
      const cs = Math.round((sec - whole) * 100)
      return `[${String(min).padStart(2, '0')}:${String(whole).padStart(2, '0')}.${String(cs).padStart(2, '0')}]${line.text}`
    })
    .join('\n')
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new DownloadAbortError()
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

function bytesToBlob(bytes: Uint8Array, type: string) {
  return new Blob([toArrayBuffer(bytes)], { type })
}

const FSA_DB = 'pulse-download-v1'
const FSA_STORE = 'handles'
const FSA_KEY = 'dir'

function openFsaDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(FSA_DB, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(FSA_STORE)) req.result.createObjectStore(FSA_STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function saveFsaDir(handle: FileSystemDirectoryHandle) {
  try {
    const db = await openFsaDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(FSA_STORE, 'readwrite')
      tx.objectStore(FSA_STORE).put(handle, FSA_KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    /* private mode */
  }
}

async function loadFsaDir(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openFsaDb()
    const handle = await new Promise<FileSystemDirectoryHandle | undefined>((resolve, reject) => {
      const req = db.transaction(FSA_STORE, 'readonly').objectStore(FSA_STORE).get(FSA_KEY)
      req.onsuccess = () => resolve(req.result as FileSystemDirectoryHandle | undefined)
      req.onerror = () => reject(req.error)
    })
    if (!handle) return null
    const scoped = handle as FileSystemDirectoryHandle & {
      queryPermission?: (opts: { mode: 'readwrite' }) => Promise<PermissionState>
      requestPermission?: (opts: { mode: 'readwrite' }) => Promise<PermissionState>
    }
    const query = scoped.queryPermission ? await scoped.queryPermission({ mode: 'readwrite' }) : 'granted'
    const perm =
      query === 'granted'
        ? 'granted'
        : scoped.requestPermission
          ? await scoped.requestPermission({ mode: 'readwrite' })
          : 'denied'
    return perm === 'granted' ? handle : null
  } catch {
    return null
  }
}

export async function rememberedSinkHint(tauriDir?: string): Promise<string> {
  if (isTauriRuntime()) return tauriDir || ''
  try {
    const db = await openFsaDb()
    const handle = await new Promise<FileSystemDirectoryHandle | undefined>((resolve, reject) => {
      const req = db.transaction(FSA_STORE, 'readonly').objectStore(FSA_STORE).get(FSA_KEY)
      req.onsuccess = () => resolve(req.result as FileSystemDirectoryHandle | undefined)
      req.onerror = () => reject(req.error)
    })
    return handle?.name || ''
  } catch {
    return ''
  }
}

export async function persistDownloadSink(sink: DownloadSink): Promise<string | undefined> {
  if (sink.kind === 'tauri') return sink.dir
  if (sink.kind === 'fsa') await saveFsaDir(sink.dir)
  return undefined
}

export async function pickDownloadSink(opts?: { defaultTauriPath?: string }): Promise<DownloadSink | null> {
  if (isTauriRuntime()) {
    const { open } = await import('@tauri-apps/plugin-dialog')
    let defaultPath = opts?.defaultTauriPath
    if (!defaultPath) {
      try {
        const { downloadDir } = await import('@tauri-apps/api/path')
        defaultPath = await downloadDir()
      } catch {
        /* ignore */
      }
    }
    const dir = await open({
      directory: true,
      multiple: false,
      defaultPath,
      title: '选择保存文件夹',
    })
    if (!dir || Array.isArray(dir)) return null
    return { kind: 'tauri', dir }
  }
  if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
    try {
      const picker = window as unknown as {
        showDirectoryPicker: (opts?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>
      }
      const dir = await picker.showDirectoryPicker({ mode: 'readwrite' })
      return { kind: 'fsa', dir }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return null
      return { kind: 'browser-download' }
    }
  }
  return { kind: 'browser-download' }
}

export async function resolveDownloadSink(opts?: {
  reuse?: boolean
  rememberedTauriDir?: string
}): Promise<DownloadSink | null> {
  if (opts?.reuse) {
    if (isTauriRuntime() && opts.rememberedTauriDir) {
      return { kind: 'tauri', dir: opts.rememberedTauriDir }
    }
    if (!isTauriRuntime()) {
      const fsa = await loadFsaDir()
      if (fsa) return { kind: 'fsa', dir: fsa }
      if (!('showDirectoryPicker' in window)) return { kind: 'browser-download' }
    }
  }
  return pickDownloadSink({ defaultTauriPath: opts?.rememberedTauriDir })
}

async function readResponseBytes(
  res: Response,
  signal: AbortSignal | undefined,
  onBytes?: (loaded: number, total: number) => void,
): Promise<Uint8Array> {
  throwIfAborted(signal)
  const total = Number(res.headers.get('content-length')) || 0
  const body = res.body
  if (!body?.getReader) {
    const bytes = new Uint8Array(await res.arrayBuffer())
    onBytes?.(bytes.byteLength, bytes.byteLength)
    return bytes
  }
  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let loaded = 0
  while (true) {
    throwIfAborted(signal)
    const { done, value } = await reader.read()
    if (done) break
    if (value?.byteLength) {
      chunks.push(value)
      loaded += value.byteLength
      onBytes?.(loaded, total)
    }
  }
  const out = new Uint8Array(loaded)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.byteLength
  }
  if (!out.byteLength) throw new Error('empty')
  return out
}

async function fetchMediaBytes(
  url: string,
  signal: AbortSignal | undefined,
  onBytes?: (loaded: number, total: number) => void,
): Promise<{ bytes: Uint8Array; mime: string }> {
  const headers: HeadersInit = {
    Referer: refererFor(url),
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  }

  const tryFetch = async (input: string) => {
    const res = await musicRuntimeFetch(input, { headers, signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const mime = res.headers.get('content-type') || ''
    const bytes = await readResponseBytes(res, signal, onBytes)
    if (!bytes.byteLength) throw new Error('empty')
    return { bytes, mime }
  }

  const target = browserSafeUrl(url)
  try {
    return await tryFetch(target)
  } catch (err) {
    if (isDownloadAbortError(err) || isTauriRuntime()) throw err
    try {
      return await tryFetch(`/media-proxy?url=${encodeURIComponent(target)}`)
    } catch (proxyErr) {
      if (isDownloadAbortError(proxyErr)) throw proxyErr
      throw new Error('网页版受跨域限制，无法拉取文件。请用桌面版下载。')
    }
  }
}

function triggerBrowserDownload(data: Blob, fileName: string) {
  const href = URL.createObjectURL(data)
  const link = document.createElement('a')
  link.href = href
  link.download = fileName
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(href), 8000)
}

async function writeBytes(sink: DownloadSink, fileName: string, bytes: Uint8Array, mime: string) {
  if (sink.kind === 'tauri') {
    const { writeFile } = await import('@tauri-apps/plugin-fs')
    const path = joinPath(sink.dir, fileName)
    await writeFile(path, bytes)
    return { path, handle: undefined as FileSystemFileHandle | undefined }
  }
  if (sink.kind === 'fsa') {
    const handle = await sink.dir.getFileHandle(fileName, { create: true })
    const writable = await handle.createWritable()
    await writable.write(toArrayBuffer(bytes))
    await writable.close()
    return { path: undefined as string | undefined, handle }
  }
  triggerBrowserDownload(bytesToBlob(bytes, mime || 'application/octet-stream'), fileName)
  return { path: undefined as string | undefined, handle: undefined as FileSystemFileHandle | undefined }
}

async function writeText(sink: DownloadSink, fileName: string, text: string) {
  await writeBytes(sink, fileName, new TextEncoder().encode(text), 'text/plain')
}

async function resolveAudioUrl(track: PulseTrack, quality: AudioQuality) {
  if (track.neteaseId) return getSongUrl(track.neteaseId, quality)
  if (track.remoteServer && track.remoteId) {
    const url = await getMetingUrl(track.remoteServer as MetingServer, track.remoteId)
    if (!url) throw new Error('该平台未返回播放地址')
    return url
  }
  if (track.url && !track.url.startsWith('blob:')) return track.url
  throw new Error('没有可下载的播放地址')
}

async function resolveLyricFiles(track: PulseTrack): Promise<{ lrcText: string; transLrcText: string }> {
  if (track.neteaseId) {
    const bundle = await getLyricBundle(track.neteaseId)
    return {
      lrcText: bundle.lrcText.trim() || (track.lrcText || '').trim() || (track.lyrics?.length ? linesToLrc(track.lyrics) : ''),
      transLrcText: bundle.transLrcText.trim() || (track.lrcTransText || '').trim() || (track.lyricsTranslated?.length ? linesToLrc(track.lyricsTranslated) : ''),
    }
  }
  if (track.remoteServer && track.remoteId) {
    const raw = await getMetingLyricRaw(track.remoteServer as MetingServer, track.remoteId)
    return { lrcText: raw.trim() || (track.lrcText || '').trim(), transLrcText: (track.lrcTransText || '').trim() }
  }
  return {
    lrcText: (track.lrcText || '').trim() || (track.lyrics?.length ? linesToLrc(track.lyrics) : ''),
    transLrcText: (track.lrcTransText || '').trim() || (track.lyricsTranslated?.length ? linesToLrc(track.lyricsTranslated) : ''),
  }
}

export async function resolveTrackMvId(track: PulseTrack) {
  if (track.mvId) return track.mvId
  if (track.mvId === '') return ''
  if (!track.neteaseId) return ''
  const details = await getSongDetails([track.neteaseId])
  return details.get(String(track.neteaseId))?.mvId || ''
}

function coverFetchUrl(coverUrl?: string) {
  if (!coverUrl) return ''
  if (isTauriRuntime()) {
    if (coverUrl.startsWith('/netease-img')) {
      return `https://p1.music.126.net${coverUrl.slice('/netease-img'.length)}`
    }
    return coverUrl
  }
  return toCoverDisplayUrl(coverUrl) || coverUrl
}

async function fetchCoverBuffer(coverUrl: string, signal?: AbortSignal): Promise<ArrayBuffer | null> {
  const url = coverFetchUrl(coverUrl)
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) return null
  try {
    const res = await musicRuntimeFetch(url, {
      signal,
      headers: {
        Referer: 'https://music.163.com/',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    })
    if (!res.ok) return null
    const buf = await res.arrayBuffer()
    return buf.byteLength ? buf : null
  } catch {
    return null
  }
}

async function embedMp3Tags(
  bytes: Uint8Array,
  fileName: string,
  mime: string,
  track: PulseTrack,
  signal?: AbortSignal,
): Promise<Uint8Array> {
  const isMp3 = fileName.toLowerCase().endsWith('.mp3') || mime.toLowerCase().includes('mpeg') || mime.toLowerCase().includes('mp3')
  if (!isMp3) return bytes
  try {
    const { ID3Writer } = await import('browser-id3-writer')
    const writer = new ID3Writer(toArrayBuffer(bytes))
    if (track.title) writer.setFrame('TIT2', track.title)
    if (track.artist) writer.setFrame('TPE1', [track.artist])
    if (track.album) writer.setFrame('TALB', track.album)
    throwIfAborted(signal)
    if (track.coverUrl) {
      const cover = await fetchCoverBuffer(track.coverUrl, signal)
      if (cover) {
        writer.setFrame('APIC', {
          type: 3 as import('browser-id3-writer').ImageType,
          data: cover,
          description: 'Cover',
        })
      }
    }
    const tagged = writer.addTag()
    return new Uint8Array(tagged)
  } catch (err) {
    if (isDownloadAbortError(err)) throw err
    return bytes
  }
}

export interface DownloadTrackOptions {
  sink: DownloadSink
  includeLyrics: boolean
  includeMv: boolean
  audioQuality: AudioQuality
  mvQuality: MvQuality
  signal?: AbortSignal
  index?: number
  count?: number
  onProgress?: (progress: DownloadProgress) => void
}

export interface DownloadTrackResult {
  imported: LocalImportResult
  parts: string[]
  warnings: string[]
}

export async function downloadTrackToDisk(
  track: PulseTrack,
  opts: DownloadTrackOptions,
): Promise<DownloadTrackResult> {
  if (!canDownloadTrack(track)) throw new Error('本地文件无需再下载')
  throwIfAborted(opts.signal)

  const folderName = downloadStem(track)
  const sink = await ensureSongSink(opts.sink, folderName)
  const index = opts.index ?? 1
  const count = opts.count ?? 1
  const title = track.shortTitle || track.title
  const report = (stage: DownloadStage, loaded?: number, total?: number) => {
    opts.onProgress?.({ stage, title, index, count, loaded, total })
  }

  report('audio')
  const audioUrl = await resolveAudioUrl(track, opts.audioQuality)
  throwIfAborted(opts.signal)
  const audio = await fetchMediaBytes(audioUrl, opts.signal, (loaded, total) => report('audio', loaded, total))
  const audioExt = extFromMimeAndUrl(audio.mime, audioUrl, 'audio')
  const audioName = sink.kind === 'browser-download' ? `${folderName}${audioExt}` : `audio${audioExt}`

  report('tag')
  const tagged = await embedMp3Tags(audio.bytes, audioName, audio.mime, track, opts.signal)
  throwIfAborted(opts.signal)
  const audioWrite = await writeBytes(sink, audioName, tagged, audio.mime || 'audio/mpeg')
  const parts = ['音频']
  const warnings: string[] = []

  let coverBlob: Blob | undefined
  try {
    report('cover')
    if (track.coverUrl) {
      const cover = await fetchCoverBuffer(track.coverUrl, opts.signal)
      throwIfAborted(opts.signal)
      if (cover) {
        const coverBytes = new Uint8Array(cover)
        await writeBytes(sink, sink.kind === 'browser-download' ? `${folderName}.jpg` : 'cover.jpg', coverBytes, 'image/jpeg')
        coverBlob = new Blob([cover], { type: 'image/jpeg' })
        parts.push('封面')
      } else {
        warnings.push('封面未写入')
      }
    }
  } catch (err) {
    if (isDownloadAbortError(err)) throw err
    warnings.push('封面保存失败')
  }

  let lrcText = ''
  let transLrcText = ''
  if (opts.includeLyrics) {
    try {
      report('lyrics')
      const lyrics = await resolveLyricFiles(track)
      throwIfAborted(opts.signal)
      lrcText = lyrics.lrcText
      transLrcText = lyrics.transLrcText
      if (lrcText) {
        await writeText(sink, sink.kind === 'browser-download' ? `${folderName}.lrc` : 'lyrics.lrc', lrcText)
        parts.push('歌词')
      } else {
        warnings.push('没有歌词')
      }
      if (transLrcText) {
        await writeText(sink, sink.kind === 'browser-download' ? `${folderName}.trans.lrc` : 'lyrics.trans.lrc', transLrcText)
        parts.push('译文')
      }
    } catch (err) {
      if (isDownloadAbortError(err)) throw err
      warnings.push('歌词保存失败')
    }
  }

  let localMvPath: string | undefined
  let localMvUrl: string | undefined
  let mvWriteHandle: FileSystemFileHandle | undefined
  let resolvedMvId = track.mvId || ''
  if (opts.includeMv) {
    try {
      const mvId = await resolveTrackMvId(track)
      resolvedMvId = mvId || resolvedMvId
      if (!mvId) {
        warnings.push('没有官方 MV')
      } else {
        report('mv')
        const mvUrl = await getMvUrl(mvId, opts.mvQuality)
        throwIfAborted(opts.signal)
        const mv = await fetchMediaBytes(mvUrl, opts.signal, (loaded, total) => report('mv', loaded, total))
        const mvExt = extFromMimeAndUrl(mv.mime, mvUrl, 'video')
        const mvName = sink.kind === 'browser-download' ? `${folderName}${mvExt}` : `video${mvExt}`
        const mvWrite = await writeBytes(sink, mvName, mv.bytes, mv.mime || 'video/mp4')
        localMvPath = mvWrite.path
        mvWriteHandle = mvWrite.handle
        if (mvWrite.path && isTauriRuntime()) {
          const { convertFileSrc } = await import('@tauri-apps/api/core')
          localMvUrl = convertFileSrc(mvWrite.path)
        } else if (mvWrite.handle) {
          localMvUrl = URL.createObjectURL(bytesToBlob(mv.bytes, mv.mime || 'video/mp4'))
        }
        parts.push('MV')
      }
    } catch (err) {
      if (isDownloadAbortError(err)) throw err
      warnings.push('MV 下载失败')
    }
  } else if (track.neteaseId && !resolvedMvId) {
    try {
      resolvedMvId = (await resolveTrackMvId(track)) || ''
    } catch {
      /* keep empty */
    }
  }

  const sidecar: PulseSidecar = {
    version: 1,
    title: track.title,
    artist: track.artist,
    album: track.album,
    duration: track.duration,
    neteaseId: track.neteaseId,
    mvId: resolvedMvId || undefined,
    artistId: track.artistId,
    remoteServer: track.remoteServer,
    remoteId: track.remoteId,
  }
  try {
    await writeText(sink, sink.kind === 'browser-download' ? `${folderName}.pulse.json` : 'pulse.json', JSON.stringify(sidecar, null, 2))
  } catch {
    warnings.push('曲目信息未写入')
  }

  const persistKind = sink.kind === 'tauri' ? 'tauri' : sink.kind === 'fsa' ? 'fsa' : 'session'
  const imported = await importDownloadedAudio({
    bytes: tagged,
    fileName: audioName,
    mime: audio.mime,
    lrcText: lrcText || undefined,
    lrcTransText: transLrcText || undefined,
    persistKind,
    localPath: audioWrite.path,
    handle: audioWrite.handle,
    mvHandle: mvWriteHandle,
    coverBlob,
    title: track.title,
    artist: track.artist,
    album: track.album,
    duration: track.duration,
    neteaseId: track.neteaseId,
    mvId: resolvedMvId || undefined,
    artistId: track.artistId,
    remoteServer: track.remoteServer,
    remoteId: track.remoteId,
    localMvPath,
    localMvUrl,
  })

  return { imported, parts, warnings }
}
