#!/usr/bin/env node
/**
 * meting-lite — 零依赖多平台音乐 API（Meting 风格）
 * 支持平台：qq（QQ音乐）、kugou（酷狗）
 *
 * 接口（与 Meting API 对齐）：
 *   GET /api?server=qq&type=search&id=关键词
 *   GET /api?server=qq&type=url&id=songmid
 *   GET /api?server=qq&type=lyric&id=songmid
 *   GET /api?server=kugou&type=search&id=关键词
 *   GET /api?server=kugou&type=url&id=FileHash
 *   GET /api?server=kugou&type=lyric&id=FileHash
 *
 * 返回：
 *   { code: 200, data: [...] }   搜索
 *   { code: 200, data: { url } } 播放地址
 *   { code: 200, data: { lrc } } 歌词
 *
 * 用法：node server.js   （默认端口 3300，可用 PORT 环境变量覆盖）
 */

import http from 'http'

const PORT = Number(process.env.PORT) || 3300

const REQ_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  Referer: 'https://y.qq.com/',
  Origin: 'https://y.qq.com',
}

function sendJson(res, code, data) {
  const body = JSON.stringify({ code, data })
  res.writeHead(code === 200 ? 200 : 500, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  })
  res.end(body)
}

/* ── QQ 音乐 ─────────────────────────────────────────────── */

async function qqSearch(keyword) {
  const q = encodeURIComponent(keyword)
  const url = `https://c.y.qq.com/soso/fcgi-bin/client_search_cp?p=1&n=20&w=${q}&format=json`
  const r = await fetch(url, { headers: REQ_HEADERS })
  const j = await r.json()
  const list = j?.data?.song?.list || []
  return list.map((s) => ({
    id: s.songmid,
    name: s.songname,
    artist: (s.singer || []).map((x) => x.name).filter(Boolean).join(' / ') || '未知歌手',
    album: s.albumname || '',
    pic: s.albummid ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${s.albummid}.jpg` : '',
    duration: Number(s.interval) || 0,
    lrc: '',
    url: '',
    source: 'qq',
  }))
}

async function qqUrl(songmid) {
  const r = await fetch('https://u.y.qq.com/cgi-bin/musicu.fcg', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...REQ_HEADERS },
    body: JSON.stringify({
      req_0: {
        module: 'vkey.GetVkeyServer',
        method: 'CgiGetVkey',
        param: { guid: '10000', songmid: [songmid], songtype: [0], uin: '0', loginflag: 1, platform: '20' },
      },
      comm: { uin: 0, format: 'json', ct: 24, cv: 0 },
    }),
  })
  const j = await r.json()
  const info = j?.req_0?.data?.midurlinfo?.[0]
  const purl = info?.purl
  if (!purl) return ''
  return `https://isure.stream.qqmusic.qq.com/${purl}`
}

async function qqLyric(songmid) {
  const url = `https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg?songmid=${encodeURIComponent(songmid)}&format=json&nobase64=1`
  const r = await fetch(url, { headers: REQ_HEADERS })
  const j = await r.json()
  return typeof j?.lyric === 'string' ? j.lyric : ''
}

async function qqToplist(topid) {
  const url = `https://c.y.qq.com/v8/fcg-bin/fcg_v8_toplist_cp.fcg?page=detail&topid=${encodeURIComponent(topid)}&type=top&tpl=3&format=json`
  const r = await fetch(url, { headers: REQ_HEADERS })
  const j = await r.json()
  const list = j?.songlist || []
  const out = []
  for (const item of list) {
    const d = item?.data
    if (!d?.songmid) continue
    const singer = Array.isArray(d.singer) ? d.singer.map((s) => s?.name).filter(Boolean).join(' / ') : ''
    out.push({
      id: d.songmid,
      name: d.songname || '未知歌曲',
      artist: singer || '未知歌手',
      album: d.albumname || '',
      pic: d.albummid ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${d.albummid}.jpg` : '',
      duration: (Number(d.interval) || 0) * 1000,
      lrc: '',
      url: '',
      source: 'qq',
    })
  }
  return out
}

/* ── 酷狗音乐 ─────────────────────────────────────────────── */

async function kugouSearch(keyword) {
  const q = encodeURIComponent(keyword)
  const url = `https://songsearch.kugou.com/song_search_v2?keyword=${q}&page=1&pagesize=20&platform=WebFilter`
  const r = await fetch(url, { headers: { 'User-Agent': REQ_HEADERS['User-Agent'] } })
  const j = await r.json()
  const list = j?.data?.lists || []
  return list.map((s) => ({
    id: s.FileHash,
    name: s.SongName,
    artist: (s.SingerName || '').split(',').filter(Boolean).join(' / ') || '未知歌手',
    album: s.AlbumName || '',
    pic: s.ImgUrl || '',
    duration: Number(s.Duration) || 0,
    lrc: '',
    url: '',
    source: 'kugou',
  }))
}

async function kugouUrl(hash) {
  const url = `https://m.kugou.com/app/i/getSongInfo.php?cmd=playInfo&hash=${encodeURIComponent(hash)}`
  const r = await fetch(url, { headers: { 'User-Agent': REQ_HEADERS['User-Agent'] } })
  const j = await r.json()
  return typeof j?.url === 'string' && j.url ? j.url : ''
}

async function kugouLyric(hash) {
  const url = `https://m.kugou.com/app/i/krc.php?cmd=100&hash=${encodeURIComponent(hash)}&timelength=0`
  const r = await fetch(url, { headers: { 'User-Agent': REQ_HEADERS['User-Agent'] } })
  const text = await r.text()
  return text && !text.startsWith('{') ? text : ''
}

async function kugouToplist(rankid) {
  const url = `https://mobiles.kugou.com/api/v3/rank/song?rankid=${encodeURIComponent(rankid)}&page=1&pagesize=30`
  const r = await fetch(url, { headers: { 'User-Agent': REQ_HEADERS['User-Agent'] } })
  const j = await r.json()
  const list = j?.data?.info || []
  const out = []
  for (const s of list) {
    if (!s?.hash) continue
    const filename = s.filename || ''
    const dash = filename.split(' - ')
    const name = dash.length > 1 ? dash.slice(1).join(' - ') : s.songname || filename || '未知歌曲'
    const artist = (s.authors || []).map((a) => a?.name).filter(Boolean).join(' / ') || (dash.length > 1 ? dash[0] : '') || '未知歌手'
    out.push({
      id: s.hash,
      name,
      artist,
      album: s.album_name || s.albumName || '',
      pic: (s.img || s.cover || '').replace('{size}', '400'),
      duration: (Number(s.duration) || Number(s.play_duration) || 0) * 1000,
      lrc: '',
      url: '',
      source: 'kugou',
    })
  }
  return out
}

/* ── 路由 ─────────────────────────────────────────────────── */

async function handle(req, res) {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`)
  if (url.pathname !== '/api') {
    sendJson(res, 404, { msg: 'not found' })
    return
  }
  const server = url.searchParams.get('server') || ''
  const type = url.searchParams.get('type') || ''
  const id = (url.searchParams.get('id') || '').trim()

  try {
    if (type === 'search') {
      if (!id) return sendJson(res, 400, { msg: 'missing id' })
      let songs = []
      if (server === 'qq') songs = await qqSearch(id)
      else if (server === 'kugou') songs = await kugouSearch(id)
      else return sendJson(res, 400, { msg: 'unsupported server' })
      return sendJson(res, 200, songs)
    }
    if (type === 'url') {
      if (!id) return sendJson(res, 400, { msg: 'missing id' })
      let urlStr = ''
      if (server === 'qq') urlStr = await qqUrl(id)
      else if (server === 'kugou') urlStr = await kugouUrl(id)
      else return sendJson(res, 400, { msg: 'unsupported server' })
      return sendJson(res, 200, { url: urlStr })
    }
    if (type === 'toplist') {
      if (!id) return sendJson(res, 400, { msg: 'missing id' })
      let songs = []
      if (server === 'qq') songs = await qqToplist(id)
      else if (server === 'kugou') songs = await kugouToplist(id)
      else return sendJson(res, 400, { msg: 'unsupported server' })
      return sendJson(res, 200, songs)
    }
    if (type === 'lyric') {
      if (!id) return sendJson(res, 400, { msg: 'missing id' })
      let lrc = ''
      if (server === 'qq') lrc = await qqLyric(id)
      else if (server === 'kugou') lrc = await kugouLyric(id)
      else return sendJson(res, 400, { msg: 'unsupported server' })
      return sendJson(res, 200, { lrc })
    }
    return sendJson(res, 400, { msg: 'unsupported type' })
  } catch (e) {
    sendJson(res, 500, { msg: e.message })
  }
}

const server = http.createServer((req, res) => {
  handle(req, res).catch((e) => sendJson(res, 500, { msg: e.message }))
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`meting-lite listening on http://127.0.0.1:${PORT}`)
})
