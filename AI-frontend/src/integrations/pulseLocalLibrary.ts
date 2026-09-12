import { isTauriRuntime } from '@/integrations/musicRuntime'
import { parseLrcOrPlain } from '@/integrations/neteaseMusic'
import {
  newLocalTrackId,
  shortOf,
  type LocalPersistKind,
  type PulseTrack,
} from '@/composables/pulse/pulseTypes'

const DB_NAME = 'pulse-local-library-v1'
const DB_VERSION = 2
const STORE_RECORDS = 'records'
const STORE_HANDLES = 'handles'
const STORE_COVERS = 'covers'
const STORE_BLOBS = 'blobs'

/** 超过该大小的音频不写入 IndexedDB（避免撑爆配额），降级为 session 一次性导入 */
const MAX_BLOB_IMPORT_BYTES = 200 * 1024 * 1024

const AUDIO_EXT = /\.(mp3|flac|wav|ogg|m4a|aac|opus|webm)$/i
const LRC_EXT = /\.lrc$/i
const COVER_EXT = /\.(jpe?g|png|webp|gif)$/i
const VIDEO_EXT = /\.(mp4|webm|mkv|mov)$/i
const SIDECAR_NAME = 'pulse.json'

const fileHandles = new Map<string, FileSystemFileHandle>()
const mvHandles = new Map<string, FileSystemFileHandle>()

export interface PulseSidecar {
  version?: number
  title?: string
  artist?: string
  album?: string
  duration?: number
  neteaseId?: string
  mvId?: string
  artistId?: string
  remoteServer?: string
  remoteId?: string
}

export interface LocalLibraryRecord {
  id: string
  title: string
  shortTitle: string
  artist: string
  album: string
  duration: number
  localPath?: string
  lrcText?: string
  lrcTransText?: string
  persistKind: LocalPersistKind
  favorite?: boolean
  neteaseId?: string
  mvId?: string
  artistId?: string
  remoteServer?: string
  remoteId?: string
  localMvPath?: string
}

export interface LocalImportResult {
  id: string
  title: string
  shortTitle: string
  artist: string
  album: string
  duration: number
  url: string
  coverUrl?: string
  coverBlob?: Blob
  file?: File
  localPath?: string
  persistKind: LocalPersistKind
  lrcText?: string
  lrcTransText?: string
  neteaseId?: string
  mvId?: string
  artistId?: string
  remoteServer?: string
  remoteId?: string
  localMvPath?: string
  localMvUrl?: string
}

export function isAudioFile(file: { name: string; type?: string }) {
  return AUDIO_EXT.test(file.name) || !!file.type?.startsWith('audio/')
}

export function isLrcFile(file: { name: string }) {
  return LRC_EXT.test(file.name)
}

export function basenameNoExt(name: string) {
  const base = name.replace(/^.*[/\\]/, '')
  return base.replace(/\.[^.]+$/, '') || base
}

export function hasFileSystemAccess() {
  return typeof window !== 'undefined' && 'showOpenFilePicker' in window
}

export function localLibraryHint() {
  if (isTauriRuntime()) return '桌面版会记住文件路径，关闭后再开会继续播。标题和封面来自文件标签。'
  if (hasFileSystemAccess()) return 'Chrome / Edge 可授权文件夹，刷新后点「恢复本地曲库」即可续播。'
}

export function joinPath(dir: string, name: string) {
  const sep = dir.includes('\\') ? '\\' : '/'
  return dir.endsWith('/') || dir.endsWith('\\') ? `${dir}${name}` : `${dir}${sep}${name}`
}

function mvHandleKey(id: string) {
  return `${id}__mv`
}

function parseSidecarJson(text: string): PulseSidecar | undefined {
  try {
    const data = JSON.parse(text) as PulseSidecar
    if (!data || typeof data !== 'object') return undefined
    return data
  } catch {
    return undefined
  }
}

function isTransLrcName(name: string) {
  const lower = name.toLowerCase()
  return lower.includes('.trans.lrc') || lower.endsWith('.tlyric.lrc') || lower === 'lyrics.trans.lrc'
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

function pictureToBlob(pic: { data: Uint8Array; format?: string } | null | undefined): Blob | undefined {
  if (!pic?.data?.length) return undefined
  const mime = pic.format?.includes('/') ? pic.format : `image/${pic.format || 'jpeg'}`
  const copy = new Uint8Array(pic.data.byteLength)
  copy.set(pic.data)
  return new Blob([copy], { type: mime })
}

function extractEmbeddedLyrics(common: {
  lyrics?: unknown
}): string | undefined {
  const raw = common.lyrics
  if (!raw) return undefined
  const chunks: string[] = []
  const list = Array.isArray(raw) ? raw : [raw]
  for (const item of list) {
    if (typeof item === 'string') {
      chunks.push(item)
      continue
    }
    if (!item || typeof item !== 'object') continue
    const rec = item as { text?: unknown; lyrics?: unknown }
    if (typeof rec.text === 'string') chunks.push(rec.text)
    else if (Array.isArray(rec.text)) chunks.push(rec.text.filter((x) => typeof x === 'string').join('\n'))
    else if (typeof rec.lyrics === 'string') chunks.push(rec.lyrics)
  }
  const text = chunks.join('\n').trim()
  return text || undefined
}

async function parseAudioTags(blob: Blob) {
  try {
    const { parseBlob, selectCover } = await import('music-metadata')
    const meta = await parseBlob(blob, { duration: true })
    const title = meta.common.title?.trim()
    const artist = (meta.common.artist || meta.common.artists?.join(' / ') || '').trim()
    const album = meta.common.album?.trim()
    const duration = meta.format.duration || 0
    const coverBlob = pictureToBlob(selectCover(meta.common.picture) ?? meta.common.picture?.[0])
    return { title, artist, album, duration, coverBlob, lrcText: extractEmbeddedLyrics(meta.common) }
  } catch {
    return { title: undefined, artist: undefined, album: undefined, duration: 0, coverBlob: undefined, lrcText: undefined }
  }
}

async function parseAudioTagsFromBytes(bytes: Uint8Array) {
  try {
    const { parseBuffer, selectCover } = await import('music-metadata')
    const meta = await parseBuffer(bytes, { mimeType: 'audio/mpeg' }, { duration: true })
    const title = meta.common.title?.trim()
    const artist = (meta.common.artist || meta.common.artists?.join(' / ') || '').trim()
    const album = meta.common.album?.trim()
    const duration = meta.format.duration || 0
    const coverBlob = pictureToBlob(selectCover(meta.common.picture) ?? meta.common.picture?.[0])
    return { title, artist, album, duration, coverBlob, lrcText: extractEmbeddedLyrics(meta.common) }
  } catch {
    return { title: undefined, artist: undefined, album: undefined, duration: 0, coverBlob: undefined, lrcText: undefined }
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('no indexedDB'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_RECORDS)) db.createObjectStore(STORE_RECORDS, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(STORE_HANDLES)) db.createObjectStore(STORE_HANDLES)
      if (!db.objectStoreNames.contains(STORE_COVERS)) db.createObjectStore(STORE_COVERS)
      if (!db.objectStoreNames.contains(STORE_BLOBS)) db.createObjectStore(STORE_BLOBS)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function idbRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveLocalRecord(
  record: LocalLibraryRecord,
  opts?: { handle?: FileSystemFileHandle; mvHandle?: FileSystemFileHandle; coverBlob?: Blob; blob?: Blob },
) {
  try {
    const db = await openDb()
    const tx = db.transaction([STORE_RECORDS, STORE_HANDLES, STORE_COVERS, STORE_BLOBS], 'readwrite')
    tx.objectStore(STORE_RECORDS).put(record)
    if (opts?.handle) tx.objectStore(STORE_HANDLES).put(opts.handle, record.id)
    if (opts?.mvHandle) tx.objectStore(STORE_HANDLES).put(opts.mvHandle, mvHandleKey(record.id))
    if (opts?.coverBlob) tx.objectStore(STORE_COVERS).put(opts.coverBlob, record.id)
    if (opts?.blob) tx.objectStore(STORE_BLOBS).put(opts.blob, record.id)
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    if (opts?.handle) fileHandles.set(record.id, opts.handle)
    if (opts?.mvHandle) mvHandles.set(record.id, opts.mvHandle)
  } catch {
    /* private mode / IDB quota */
  }
}

export async function deleteLocalRecord(id: string) {
  fileHandles.delete(id)
  mvHandles.delete(id)
  try {
    const db = await openDb()
    const tx = db.transaction([STORE_RECORDS, STORE_HANDLES, STORE_COVERS, STORE_BLOBS], 'readwrite')
    tx.objectStore(STORE_RECORDS).delete(id)
    tx.objectStore(STORE_HANDLES).delete(id)
    tx.objectStore(STORE_HANDLES).delete(mvHandleKey(id))
    tx.objectStore(STORE_COVERS).delete(id)
    tx.objectStore(STORE_BLOBS).delete(id)
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    /* ignore */
  }
}

export async function loadAllLocalRecords(): Promise<{
  records: LocalLibraryRecord[]
  handles: Map<string, FileSystemFileHandle>
  mvFileHandles: Map<string, FileSystemFileHandle>
  covers: Map<string, Blob>
  blobs: Map<string, Blob>
}> {
  const handles = new Map<string, FileSystemFileHandle>()
  const mvFileHandles = new Map<string, FileSystemFileHandle>()
  const covers = new Map<string, Blob>()
  const blobs = new Map<string, Blob>()
  try {
    const db = await openDb()
    const tx = db.transaction([STORE_RECORDS, STORE_HANDLES, STORE_COVERS, STORE_BLOBS], 'readonly')
    const records = (await idbRequest(tx.objectStore(STORE_RECORDS).getAll())) as LocalLibraryRecord[]
    const handleKeys = (await idbRequest(tx.objectStore(STORE_HANDLES).getAllKeys())) as IDBValidKey[]
    for (const key of handleKeys) {
      const handle = (await idbRequest(tx.objectStore(STORE_HANDLES).get(key))) as FileSystemFileHandle | undefined
      if (!handle) continue
      const id = String(key)
      if (id.endsWith('__mv')) {
        const trackId = id.slice(0, -4)
        mvFileHandles.set(trackId, handle)
        mvHandles.set(trackId, handle)
      } else {
        handles.set(id, handle)
        fileHandles.set(id, handle)
      }
    }
    const coverKeys = (await idbRequest(tx.objectStore(STORE_COVERS).getAllKeys())) as IDBValidKey[]
    for (const key of coverKeys) {
      const blob = (await idbRequest(tx.objectStore(STORE_COVERS).get(key))) as Blob | undefined
      if (blob) covers.set(String(key), blob)
    }
    const blobKeys = (await idbRequest(tx.objectStore(STORE_BLOBS).getAllKeys())) as IDBValidKey[]
    for (const key of blobKeys) {
      const blob = (await idbRequest(tx.objectStore(STORE_BLOBS).get(key))) as Blob | undefined
      if (blob) blobs.set(String(key), blob)
    }
    return { records: Array.isArray(records) ? records : [], handles, mvFileHandles, covers, blobs }
  } catch {
    return { records: [], handles, mvFileHandles, covers, blobs }
  }
}

export function getCachedHandle(id: string) {
  return fileHandles.get(id)
}

function toTrackFields(
  fileName: string,
  tags: { title?: string; artist?: string; album?: string; duration: number; coverBlob?: Blob },
) {
  const fallback = basenameNoExt(fileName)
  const title = tags.title || fallback
  const coverUrl = tags.coverBlob ? URL.createObjectURL(tags.coverBlob) : undefined
  return {
    title,
    shortTitle: shortOf(title),
    artist: tags.artist || '本地文件',
    album: tags.album || '本地导入',
    duration: tags.duration || 0,
    coverUrl,
    coverBlob: tags.coverBlob,
  }
}

async function importFromBrowserFile(
  file: File,
  opts: {
    persistKind: LocalPersistKind
    handle?: FileSystemFileHandle
    lrcText?: string
    lrcTransText?: string
    coverBlob?: Blob
    sidecar?: PulseSidecar
    localMvUrl?: string
    mvHandle?: FileSystemFileHandle
  },
): Promise<LocalImportResult> {
  const tags = await parseAudioTags(file)
  const fields = toTrackFields(file.name, {
    title: opts.sidecar?.title || tags.title,
    artist: opts.sidecar?.artist || tags.artist,
    album: opts.sidecar?.album || tags.album,
    duration: opts.sidecar?.duration || tags.duration,
    coverBlob: opts.coverBlob || tags.coverBlob,
  })
  return {
    id: newLocalTrackId(),
    ...fields,
    url: URL.createObjectURL(file),
    file,
    persistKind: opts.persistKind,
    lrcText: opts.lrcText || tags.lrcText,
    lrcTransText: opts.lrcTransText,
    neteaseId: opts.sidecar?.neteaseId,
    mvId: opts.sidecar?.mvId,
    artistId: opts.sidecar?.artistId,
    remoteServer: opts.sidecar?.remoteServer,
    remoteId: opts.sidecar?.remoteId,
    localMvUrl: opts.localMvUrl,
  }
}

async function readFsaSidecars(dir: FileSystemDirectoryHandle): Promise<{
  coverBlob?: Blob
  lrcByStem: Map<string, string>
  transByStem: Map<string, string>
  folderLrc?: string
  folderTrans?: string
  videos: { name: string; handle: FileSystemFileHandle }[]
  sidecar?: PulseSidecar
}> {
  const lrcByStem = new Map<string, string>()
  const transByStem = new Map<string, string>()
  const videos: { name: string; handle: FileSystemFileHandle }[] = []
  let coverBlob: Blob | undefined
  let folderLrc: string | undefined
  let folderTrans: string | undefined
  let sidecar: PulseSidecar | undefined
  for await (const [name, entry] of dir.entries()) {
    if (entry.kind !== 'file') continue
    const lower = name.toLowerCase()
    if (lower === SIDECAR_NAME) {
      try {
        sidecar = parseSidecarJson(await (await entry.getFile()).text())
      } catch {
        /* skip */
      }
    } else if (COVER_EXT.test(name) && (lower.startsWith('cover') || lower.startsWith('folder') || lower.startsWith('front'))) {
      try {
        coverBlob = await entry.getFile()
      } catch {
        /* skip */
      }
    } else if (LRC_EXT.test(name)) {
      try {
        const text = await (await entry.getFile()).text()
        if (isTransLrcName(name) || lower === 'lyrics.trans.lrc') {
          transByStem.set(basenameNoExt(name).toLowerCase().replace(/\.trans$/, ''), text)
          folderTrans = folderTrans || text
        } else {
          lrcByStem.set(basenameNoExt(name).toLowerCase(), text)
          if (lower === 'lyrics.lrc') folderLrc = text
          else folderLrc = folderLrc || text
        }
      } catch {
        /* skip */
      }
    } else if (VIDEO_EXT.test(name)) {
      videos.push({ name, handle: entry })
    }
  }
  if (!coverBlob) {
    for await (const [name, entry] of dir.entries()) {
      if (entry.kind === 'file' && COVER_EXT.test(name)) {
        try {
          coverBlob = await entry.getFile()
          break
        } catch {
          /* skip */
        }
      }
    }
  }
  return { coverBlob, lrcByStem, transByStem, folderLrc, folderTrans, videos, sidecar }
}

async function collectFsaPackages(
  handle: FileSystemDirectoryHandle,
): Promise<LocalImportResult[]> {
  const out: LocalImportResult[] = []
  const audios: { name: string; handle: FileSystemFileHandle }[] = []
  const subdirs: FileSystemDirectoryHandle[] = []
  for await (const [, entry] of handle.entries()) {
    if (entry.kind === 'directory') subdirs.push(entry)
    else if (AUDIO_EXT.test(entry.name)) audios.push({ name: entry.name, handle: entry })
  }
  const sidecars = await readFsaSidecars(handle)
  const treatAsSongFolder = !!sidecars.sidecar || (audios.length === 1 && (!!sidecars.coverBlob || !!sidecars.folderLrc || sidecars.videos.length > 0))

  const importAudio = async (item: { name: string; handle: FileSystemFileHandle }, folderMode: boolean) => {
    const file = await item.handle.getFile()
    const stem = basenameNoExt(item.name).toLowerCase()
    const mv = folderMode ? sidecars.videos[0] : sidecars.videos.find((v) => basenameNoExt(v.name).toLowerCase() === stem)
    let localMvUrl: string | undefined
    if (mv) {
      try {
        localMvUrl = URL.createObjectURL(await mv.handle.getFile())
      } catch {
        /* skip */
      }
    }
    const imported = await importFromBrowserFile(file, {
      persistKind: 'fsa',
      handle: item.handle,
      lrcText: folderMode ? sidecars.folderLrc || sidecars.lrcByStem.get(stem) : sidecars.lrcByStem.get(stem),
      lrcTransText: folderMode ? sidecars.folderTrans || sidecars.transByStem.get(stem) : sidecars.transByStem.get(stem),
      coverBlob: sidecars.coverBlob,
      sidecar: sidecars.sidecar,
      localMvUrl,
      mvHandle: mv?.handle,
    })
    fileHandles.set(imported.id, item.handle)
    if (mv) mvHandles.set(imported.id, mv.handle)
    out.push(imported)
  }

  if (treatAsSongFolder && audios.length) {
    await importAudio(audios[0]!, true)
  } else {
    for (const item of audios) await importAudio(item, false)
    for (const sub of subdirs) out.push(...(await collectFsaPackages(sub)))
  }
  return out
}

async function pickWithFileSystemAccess(folder: boolean): Promise<LocalImportResult[]> {
  if (folder) {
    const dir = await window.showDirectoryPicker({ mode: 'read' })
    return collectFsaPackages(dir)
  }

  const handles = await window.showOpenFilePicker({
    multiple: true,
    types: [
      {
        description: 'Audio',
        accept: { 'audio/*': ['.mp3', '.flac', '.wav', '.ogg', '.m4a', '.aac', '.opus', '.webm'] },
      },
    ],
  })
  const out: LocalImportResult[] = []
  for (const handle of handles) {
    const file = await handle.getFile()
    if (!isAudioFile(file)) continue
    const imported = await importFromBrowserFile(file, { persistKind: 'fsa', handle })
    fileHandles.set(imported.id, handle)
    out.push(imported)
  }
  return out
}

async function readTauriText(path: string) {
  const { readFile } = await import('@tauri-apps/plugin-fs')
  const bytes = await readFile(path)
  return new TextDecoder().decode(bytes)
}

async function readTauriSidecars(dir: string): Promise<{
  coverPath?: string
  lrcByStem: Map<string, string>
  transByStem: Map<string, string>
  folderLrc?: string
  folderTrans?: string
  videos: string[]
  sidecar?: PulseSidecar
}> {
  const { readDir } = await import('@tauri-apps/plugin-fs')
  const lrcByStem = new Map<string, string>()
  const transByStem = new Map<string, string>()
  const videos: string[] = []
  let coverPath: string | undefined
  let folderLrc: string | undefined
  let folderTrans: string | undefined
  let sidecar: PulseSidecar | undefined
  let entries: Array<{ name: string; isDirectory: boolean; isFile: boolean }>
  try {
    entries = await readDir(dir)
  } catch {
    return { lrcByStem, transByStem, videos }
  }
  for (const entry of entries) {
    if (!entry.isFile) continue
    const full = joinPath(dir, entry.name)
    const lower = entry.name.toLowerCase()
    if (lower === SIDECAR_NAME) {
      try {
        sidecar = parseSidecarJson(await readTauriText(full))
      } catch {
        /* skip */
      }
    } else if (COVER_EXT.test(entry.name) && (lower.startsWith('cover') || lower.startsWith('folder') || lower.startsWith('front'))) {
      coverPath = full
    } else if (LRC_EXT.test(entry.name)) {
      try {
        const text = await readTauriText(full)
        if (isTransLrcName(entry.name)) {
          transByStem.set(basenameNoExt(entry.name).toLowerCase().replace(/\.trans$/, ''), text)
          folderTrans = folderTrans || text
        } else {
          lrcByStem.set(basenameNoExt(entry.name).toLowerCase(), text)
          if (lower === 'lyrics.lrc') folderLrc = text
          else folderLrc = folderLrc || text
        }
      } catch {
        /* skip */
      }
    } else if (VIDEO_EXT.test(entry.name)) {
      videos.push(full)
    }
  }
  if (!coverPath) {
    const cover = entries.find((e) => e.isFile && COVER_EXT.test(e.name))
    if (cover) coverPath = joinPath(dir, cover.name)
  }
  return { coverPath, lrcByStem, transByStem, folderLrc, folderTrans, videos, sidecar }
}

async function coverBlobFromTauri(path?: string): Promise<Blob | undefined> {
  if (!path) return undefined
  try {
    const { readFile } = await import('@tauri-apps/plugin-fs')
    const bytes = await readFile(path)
    const lower = path.toLowerCase()
    const mime = lower.endsWith('.png') ? 'image/png' : lower.endsWith('.webp') ? 'image/webp' : 'image/jpeg'
    return new Blob([toArrayBuffer(bytes)], { type: mime })
  } catch {
    return undefined
  }
}

async function collectTauriPackages(dir: string): Promise<LocalImportResult[]> {
  const { readDir } = await import('@tauri-apps/plugin-fs')
  let entries: Array<{ name: string; isDirectory: boolean; isFile: boolean }>
  try {
    entries = await readDir(dir)
  } catch {
    return []
  }
  const audios = entries.filter((e) => e.isFile && AUDIO_EXT.test(e.name)).map((e) => joinPath(dir, e.name))
  const subdirs = entries.filter((e) => e.isDirectory).map((e) => joinPath(dir, e.name))
  const sidecars = await readTauriSidecars(dir)
  const treatAsSongFolder =
    !!sidecars.sidecar || (audios.length === 1 && (!!sidecars.coverPath || !!sidecars.folderLrc || sidecars.videos.length > 0))
  const out: LocalImportResult[] = []

  const importAudio = async (path: string, folderMode: boolean) => {
    const stem = basenameNoExt(path.replace(/^.*[/\\]/, '')).toLowerCase()
    const mvPath = folderMode
      ? sidecars.videos[0]
      : sidecars.videos.find((v) => basenameNoExt(v.replace(/^.*[/\\]/, '')).toLowerCase() === stem)
    const imported = await importTauriPath(path, {
      lrcText: folderMode ? sidecars.folderLrc || sidecars.lrcByStem.get(stem) : sidecars.lrcByStem.get(stem),
      lrcTransText: folderMode ? sidecars.folderTrans || sidecars.transByStem.get(stem) : sidecars.transByStem.get(stem),
      coverBlob: await coverBlobFromTauri(sidecars.coverPath),
      sidecar: sidecars.sidecar,
      localMvPath: mvPath,
    })
    if (imported) out.push(imported)
  }

  if (treatAsSongFolder && audios.length) {
    await importAudio(audios[0]!, true)
  } else {
    for (const path of audios) await importAudio(path, false)
    for (const sub of subdirs) out.push(...(await collectTauriPackages(sub)))
  }
  return out
}

async function importTauriPath(
  path: string,
  extras?: {
    lrcText?: string
    lrcTransText?: string
    coverBlob?: Blob
    sidecar?: PulseSidecar
    localMvPath?: string
  },
): Promise<LocalImportResult | null> {
  const { readFile } = await import('@tauri-apps/plugin-fs')
  const { convertFileSrc } = await import('@tauri-apps/api/core')
  let bytes: Uint8Array
  try {
    bytes = await readFile(path)
  } catch {
    return null
  }
  const tags = await parseAudioTagsFromBytes(bytes)
  const fileName = path.replace(/^.*[/\\]/, '')
  const fields = toTrackFields(fileName, {
    title: extras?.sidecar?.title || tags.title,
    artist: extras?.sidecar?.artist || tags.artist,
    album: extras?.sidecar?.album || tags.album,
    duration: extras?.sidecar?.duration || tags.duration,
    coverBlob: extras?.coverBlob || tags.coverBlob,
  })
  let url = convertFileSrc(path)
  try {
    void url
  } catch {
    const blob = new Blob([toArrayBuffer(bytes)])
    url = URL.createObjectURL(blob)
  }
  const localMvPath = extras?.localMvPath
  const localMvUrl = localMvPath ? convertFileSrc(localMvPath) : undefined
  return {
    id: newLocalTrackId(),
    ...fields,
    url,
    localPath: path,
    persistKind: 'tauri',
    lrcText: extras?.lrcText || tags.lrcText,
    lrcTransText: extras?.lrcTransText,
    neteaseId: extras?.sidecar?.neteaseId,
    mvId: extras?.sidecar?.mvId,
    artistId: extras?.sidecar?.artistId,
    remoteServer: extras?.sidecar?.remoteServer,
    remoteId: extras?.sidecar?.remoteId,
    localMvPath,
    localMvUrl,
  }
}

async function pickWithTauri(folder: boolean): Promise<LocalImportResult[]> {
  const { open } = await import('@tauri-apps/plugin-dialog')
  if (folder) {
    const dir = await open({ directory: true, multiple: false })
    if (!dir || Array.isArray(dir)) return []
    return collectTauriPackages(dir)
  }
  const selected = await open({
    multiple: true,
    filters: [{ name: 'Audio', extensions: ['mp3', 'flac', 'wav', 'ogg', 'm4a', 'aac', 'opus', 'webm'] }],
  })
  if (!selected) return []
  const paths = Array.isArray(selected) ? selected : [selected]
  const out: LocalImportResult[] = []
  for (const path of paths) {
    const imported = await importTauriPath(path)
    if (imported) out.push(imported)
  }
  return out
}

export async function importBrowserFileList(fileList: FileList | File[]): Promise<LocalImportResult[]> {
  const files = Array.from(fileList)
  const lrcMap = new Map<string, string>()
  const transMap = new Map<string, string>()
  for (const file of files) {
    if (!isLrcFile(file)) continue
    try {
      const text = await file.text()
      if (isTransLrcName(file.name)) {
        transMap.set(basenameNoExt(file.name).toLowerCase().replace(/\.trans$/, ''), text)
      } else {
        lrcMap.set(basenameNoExt(file.name).toLowerCase(), text)
      }
    } catch {
      /* skip */
    }
  }
  const out: LocalImportResult[] = []
  for (const file of files) {
    if (!isAudioFile(file)) continue
    const stem = basenameNoExt(file.name).toLowerCase()
    out.push(
      await importFromBrowserFile(file, {
        persistKind: 'session',
        lrcText: lrcMap.get(stem),
        lrcTransText: transMap.get(stem),
      }),
    )
  }
  return out
}

export async function pickLocalMedia(folder: boolean): Promise<LocalImportResult[] | 'fallback-input'> {
  if (isTauriRuntime()) {
    try {
      return await pickWithTauri(folder)
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return []
      return 'fallback-input'
    }
  }
  if (hasFileSystemAccess()) {
    try {
      return await pickWithFileSystemAccess(folder)
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return []
      return 'fallback-input'
    }
  }
  return 'fallback-input'
}

export async function restoreLocalPlayback(track: PulseTrack): Promise<{
  url: string
  file?: File
  needsPermission: boolean
}> {
  if (track.url && !track.localNeedsPermission) return { url: track.url, file: track.file, needsPermission: false }

  if (track.localPath && isTauriRuntime()) {
    try {
      const { convertFileSrc } = await import('@tauri-apps/api/core')
      return { url: convertFileSrc(track.localPath), needsPermission: false }
    } catch {
      try {
        const { readFile } = await import('@tauri-apps/plugin-fs')
        const bytes = await readFile(track.localPath)
        const blob = new Blob([new Uint8Array(bytes)])
        return { url: URL.createObjectURL(blob), needsPermission: false }
      } catch {
        return { url: '', needsPermission: true }
      }
    }
  }

  const handle = fileHandles.get(track.id)
  if (handle) {
    const query = await handle.queryPermission({ mode: 'read' })
    const perm = query === 'granted' ? 'granted' : await handle.requestPermission({ mode: 'read' })
    if (perm !== 'granted') return { url: '', needsPermission: true }
    const file = await handle.getFile()
    return { url: URL.createObjectURL(file), file, needsPermission: false }
  }

  if (track.file) {
    return { url: URL.createObjectURL(track.file), file: track.file, needsPermission: false }
  }

  // IndexedDB 缓存的音频 Blob（fallback 导入场景）
  if (track.persistKind === 'blob') {
    const blob = await getTrackBlob(track.id)
    if (blob) {
      const file = new File([blob], `${track.title}.${blob.type.split('/')[1] || 'mp3'}`, { type: blob.type })
      track.file = file
      return { url: URL.createObjectURL(blob), file, needsPermission: false }
    }
    if (track.file) return { url: URL.createObjectURL(track.file), file: track.file, needsPermission: false }
  }

  return { url: '', needsPermission: true }
}

async function getTrackBlob(id: string): Promise<Blob | undefined> {
  try {
    const db = await openDb()
    const tx = db.transaction([STORE_BLOBS], 'readonly')
    return (await idbRequest(tx.objectStore(STORE_BLOBS).get(id))) as Blob | undefined
  } catch {
    return undefined
  }
}

export async function hydrateLocalTracks(existingIds: Set<string>): Promise<PulseTrack[]> {
  const { records, handles, mvFileHandles, covers, blobs } = await loadAllLocalRecords()
  const tracks: PulseTrack[] = []
  for (const rec of records) {
    if (existingIds.has(rec.id)) continue
    const coverBlob = covers.get(rec.id)
    const coverUrl = coverBlob ? URL.createObjectURL(coverBlob) : undefined
    const handle = handles.get(rec.id)
    let url = ''
    let file: File | undefined
    let localNeedsPermission = false
    let localMvUrl = ''
    const mvHandle = mvFileHandles.get(rec.id)
    if (rec.localPath && isTauriRuntime()) {
      try {
        const { convertFileSrc } = await import('@tauri-apps/api/core')
        url = convertFileSrc(rec.localPath)
        if (rec.localMvPath) localMvUrl = convertFileSrc(rec.localMvPath)
      } catch {
        localNeedsPermission = true
      }
    } else if (handle) {
      const perm = await handle.queryPermission({ mode: 'read' })
      if (perm === 'granted') {
        try {
          file = await handle.getFile()
          url = URL.createObjectURL(file)
        } catch {
          localNeedsPermission = true
        }
      } else {
        localNeedsPermission = true
      }
      if (mvHandle) {
        const mvPerm = await mvHandle.queryPermission({ mode: 'read' })
        if (mvPerm === 'granted') {
          try {
            localMvUrl = URL.createObjectURL(await mvHandle.getFile())
          } catch {
            /* skip */
          }
        }
      }
    } else if (rec.persistKind === 'blob') {
      // fallback 导入场景：从 IndexedDB 缓存读取音频 Blob，刷新后仍可播放
      const blob = blobs.get(rec.id)
      if (blob) {
        file = new File([blob], `${rec.title}.${blob.type.split('/')[1] || 'mp3'}`, { type: blob.type })
        url = URL.createObjectURL(file)
      } else {
        localNeedsPermission = true
      }
    } else {
      localNeedsPermission = rec.persistKind !== 'session'
    }
    tracks.push({
      id: rec.id,
      title: rec.title,
      shortTitle: rec.shortTitle,
      artist: rec.artist,
      album: rec.album,
      source: '本地',
      duration: rec.duration,
      url,
      coverUrl,
      favorite: !!rec.favorite,
      localPath: rec.localPath,
      lrcText: rec.lrcText,
      lrcTransText: rec.lrcTransText,
      persistKind: rec.persistKind,
      file,
      localNeedsPermission,
      lyrics: rec.lrcText ? parseLrcOrPlain(rec.lrcText, rec.duration) : undefined,
      lyricsTranslated: rec.lrcTransText ? parseLrcOrPlain(rec.lrcTransText, rec.duration) : undefined,
      neteaseId: rec.neteaseId,
      mvId: rec.mvId,
      artistId: rec.artistId,
      remoteServer: rec.remoteServer,
      remoteId: rec.remoteId,
      localMvPath: rec.localMvPath,
      localMvUrl: localMvUrl || undefined,
    })
  }
  return tracks
}

export async function importDownloadedAudio(opts: {
  bytes: Uint8Array
  fileName: string
  mime?: string
  lrcText?: string
  lrcTransText?: string
  persistKind: LocalPersistKind
  localPath?: string
  handle?: FileSystemFileHandle
  mvHandle?: FileSystemFileHandle
  coverBlob?: Blob
  title?: string
  artist?: string
  album?: string
  duration?: number
  neteaseId?: string
  mvId?: string
  artistId?: string
  remoteServer?: string
  remoteId?: string
  localMvPath?: string
  localMvUrl?: string
}): Promise<LocalImportResult> {
  const tags = await parseAudioTagsFromBytes(opts.bytes)
  const fields = toTrackFields(opts.fileName, {
    title: tags.title || opts.title,
    artist: tags.artist || opts.artist,
    album: tags.album || opts.album,
    duration: tags.duration || opts.duration || 0,
    coverBlob: opts.coverBlob || tags.coverBlob,
  })
  let url = ''
  let file: File | undefined
  if (opts.persistKind === 'tauri' && opts.localPath) {
    try {
      const { convertFileSrc } = await import('@tauri-apps/api/core')
      url = convertFileSrc(opts.localPath)
    } catch {
      url = URL.createObjectURL(new Blob([toArrayBuffer(opts.bytes)], { type: opts.mime || 'audio/mpeg' }))
    }
  } else {
    const audioBlob = new Blob([toArrayBuffer(opts.bytes)], { type: opts.mime || 'audio/mpeg' })
    file = new File([audioBlob], opts.fileName, { type: opts.mime || 'audio/mpeg' })
    url = URL.createObjectURL(file)
  }
  const imported: LocalImportResult = {
    id: newLocalTrackId(),
    ...fields,
    url,
    file,
    localPath: opts.localPath,
    persistKind: opts.persistKind,
    lrcText: opts.lrcText || tags.lrcText,
    lrcTransText: opts.lrcTransText,
    neteaseId: opts.neteaseId,
    mvId: opts.mvId,
    artistId: opts.artistId,
    remoteServer: opts.remoteServer,
    remoteId: opts.remoteId,
    localMvPath: opts.localMvPath,
    localMvUrl: opts.localMvUrl,
  }
  if (opts.handle) fileHandles.set(imported.id, opts.handle)
  if (opts.mvHandle) mvHandles.set(imported.id, opts.mvHandle)
  return imported
}

export async function persistImportedLocal(imported: LocalImportResult, favorite = false) {
  if (imported.persistKind === 'session') {
    // fallback <input type=file> 导入：把音频 Blob 写进 IndexedDB，刷新后仍能续播（过大则回退一次性导入）
    if (imported.file && imported.file.size <= MAX_BLOB_IMPORT_BYTES) {
      try {
        await saveLocalRecord(
          {
            id: imported.id,
            title: imported.title,
            shortTitle: imported.shortTitle,
            artist: imported.artist,
            album: imported.album,
            duration: imported.duration,
            localPath: imported.localPath,
            lrcText: imported.lrcText,
            lrcTransText: imported.lrcTransText,
            persistKind: 'blob',
            favorite,
            neteaseId: imported.neteaseId,
            mvId: imported.mvId,
            artistId: imported.artistId,
            remoteServer: imported.remoteServer,
            remoteId: imported.remoteId,
            localMvPath: imported.localMvPath,
          },
          { blob: imported.file },
        )
        imported.persistKind = 'blob'
      } catch {
        /* 存不下则保持一次性导入 */
      }
    }
    return
  }
  await saveLocalRecord(
    {
      id: imported.id,
      title: imported.title,
      shortTitle: imported.shortTitle,
      artist: imported.artist,
      album: imported.album,
      duration: imported.duration,
      localPath: imported.localPath,
      lrcText: imported.lrcText,
      lrcTransText: imported.lrcTransText,
      persistKind: imported.persistKind,
      favorite,
      neteaseId: imported.neteaseId,
      mvId: imported.mvId,
      artistId: imported.artistId,
      remoteServer: imported.remoteServer,
      remoteId: imported.remoteId,
      localMvPath: imported.localMvPath,
    },
    {
      handle: imported.persistKind === 'fsa' ? fileHandles.get(imported.id) : undefined,
      mvHandle: imported.persistKind === 'fsa' ? mvHandles.get(imported.id) : undefined,
      coverBlob: imported.coverBlob,
    },
  )
}

export async function persistLocalTrackMeta(track: PulseTrack) {
  if (!isLocalish(track) || track.persistKind === 'session' || !track.persistKind) return
  await saveLocalRecord(
    {
      id: track.id,
      title: track.title,
      shortTitle: track.shortTitle,
      artist: track.artist,
      album: track.album,
      duration: track.duration,
      localPath: track.localPath,
      lrcText: track.lrcText,
      lrcTransText: track.lrcTransText,
      persistKind: track.persistKind,
      favorite: track.favorite,
      neteaseId: track.neteaseId,
      mvId: track.mvId,
      artistId: track.artistId,
      remoteServer: track.remoteServer,
      remoteId: track.remoteId,
      localMvPath: track.localMvPath,
    },
    { handle: fileHandles.get(track.id), mvHandle: mvHandles.get(track.id) },
  )
}

function isLocalish(track: PulseTrack) {
  return track.source === '本地' || !!track.file || !!track.localPath || !!track.persistKind
}

export function revokeTrackUrls(track: PulseTrack) {
  if (track.url?.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(track.url)
    } catch {
      /* ignore */
    }
  }
  if (track.coverUrl?.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(track.coverUrl)
    } catch {
      /* ignore */
    }
  }
  if (track.localMvUrl?.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(track.localMvUrl)
    } catch {
      /* ignore */
    }
  }
}

export async function importFromTauriDir(dir: string): Promise<LocalImportResult[]> {
  return collectTauriPackages(dir)
}

export async function importFromFsaDir(dir: FileSystemDirectoryHandle): Promise<LocalImportResult[]> {
  return collectFsaPackages(dir)
}

export async function readLrcFile(file: File) {
  return file.text()
}

export async function requestHandlePermission(id: string) {
  const handle = fileHandles.get(id)
  if (!handle) return false
  const perm = await handle.requestPermission({ mode: 'read' })
  return perm === 'granted'
}
