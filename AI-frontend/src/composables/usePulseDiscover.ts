import { computed, ref, watch, type Ref } from 'vue'
import {
  getNewestAlbums,
  getAlbumDetail,
  getPersonalizedPlaylists,
  getHotPlaylists,
  getDailyRecommendSongs,
  getPersonalizedNewSongs,
  getPlaylistDetail,
  getArtistHotSongs,
  getToplists,
  getToplistDetail,
  getHotDjRadios,
  getDjPrograms,
  formatPlayCount,
  type NeteaseAlbumSummary,
  type NeteaseDjRadio,
  type NeteasePlaylistSummary,
  type Song,
} from '@/integrations/neteaseMusic'
import {
  getMetingToplist,
  METING_TOPLISTS,
  METING_SERVER_LABEL,
  type MetingServer,
} from '@/integrations/metingMusic'
import type { PulseTrack, PulseView } from '@/composables/usePulsePlayer'

export type DiscoverPane = 'home' | 'detail'
export type DiscoverDetailKind = 'album' | 'playlist' | 'artist' | 'daily' | 'newsong' | 'toplist'

export interface DiscoverCollection {
  kind: DiscoverDetailKind
  id: string
  name: string
  subtitle: string
  coverUrl: string
  trackCount: number
}

export interface PulseDiscoverPlayer {
  upsertNeteaseTracks: (songs: Song[], opts?: { replaceQueue?: boolean }) => PulseTrack[]
  playTrack: (id: string, autoplay?: boolean) => Promise<void>
  switchView: (view: PulseView) => void
  openPlaylist?: (key: string) => void
  ingestTrack?: (track: PulseTrack) => PulseTrack
  currentId: Ref<string>
  view: Ref<PulseView | string>
}

export interface ChartEntry {
  server: MetingServer
  id: string
  name: string
  songs: PulseTrack[]
  loading: boolean
  error: string
}

/**
 * 发现页（QQ 式）：今日推荐 + 歌单补给站 + 新碟；详情内播放
 */
export function usePulseDiscover(player: PulseDiscoverPlayer) {
  const pane = ref<DiscoverPane>('home')
  const homeLoading = ref(false)
  const homeError = ref('')
  const homeLoaded = ref(false)

  const dailySongs = ref<Song[]>([])
  const newSongs = ref<Song[]>([])
  const playlists = ref<NeteasePlaylistSummary[]>([])
  const albums = ref<NeteaseAlbumSummary[]>([])

  /** 多平台热门榜单（QQ/酷狗），发现页「热门榜单」区块 */
  const charts = ref<ChartEntry[]>([])

  /** 网易云排行榜（发现页「网易云榜单」区块） */
  const neteaseCharts = ref<NeteasePlaylistSummary[]>([])
  const neteaseChartsLoading = ref(false)

  /** 热门主播电台（发现页「电台」区块） */
  const djRadios = ref<NeteaseDjRadio[]>([])
  const djLoading = ref(false)

  function metingToTrack(s: import('@/integrations/metingMusic').MetingSong, server: MetingServer): PulseTrack {
    return {
      id: `${server}-tl-${s.id}`,
      title: s.name,
      shortTitle: s.name.split(/[／/]/)[0]?.trim() || s.name,
      artist: s.artist,
      album: s.album,
      source: METING_SERVER_LABEL[server],
      duration: s.duration,
      url: '',
      coverUrl: s.pic || '',
      favorite: false,
      remoteServer: server,
      remoteId: s.id,
    }
  }

  async function loadCharts(force = false) {
    if (charts.value.length && !force) return
    const defs = METING_TOPLISTS
    charts.value = defs.map((d) => ({ server: d.server, id: d.id, name: d.name, songs: [], loading: true, error: '' }))
    await Promise.all(
      defs.map(async (def, i) => {
        try {
          const list = await getMetingToplist(def.server, def.id)
          const songs = list.slice(0, 20).map((s) => metingToTrack(s, def.server))
          charts.value[i] = { ...charts.value[i]!, songs, loading: false, error: '' }
        } catch {
          charts.value[i] = { ...charts.value[i]!, loading: false, error: '榜单加载失败' }
        }
      }),
    )
  }

  async function loadNeteaseCharts(force = false) {
    if (neteaseCharts.value.length && !force) return
    neteaseChartsLoading.value = true
    try {
      neteaseCharts.value = await getToplists(12).catch(() => [] as NeteasePlaylistSummary[])
    } catch {
      neteaseCharts.value = []
    } finally {
      neteaseChartsLoading.value = false
    }
  }

  async function openNeteaseToplist(id: string) {
    pane.value = 'detail'
    detailLoading.value = true
    detailError.value = ''
    detailSongs.value = []
    const summary = neteaseCharts.value.find((p) => p.id === id) ?? null
    activeCollection.value = summary
      ? {
          kind: 'playlist',
          id: summary.id,
          name: summary.name,
          subtitle: summary.copywriter || '云音乐官方榜单',
          coverUrl: summary.coverUrl,
          trackCount: summary.trackCount,
        }
      : { kind: 'playlist', id, name: '榜单', subtitle: '', coverUrl: '', trackCount: 0 }
    try {
      const detail = await getToplistDetail(id)
      setDetail(
        {
          kind: 'playlist',
          id: detail.playlist.id,
          name: detail.playlist.name,
          subtitle: detail.playlist.copywriter || '云音乐官方榜单',
          coverUrl: detail.playlist.coverUrl,
          trackCount: detail.songs.length,
        },
        detail.songs,
      )
    } catch {
      detailError.value = '榜单详情加载失败'
    } finally {
      detailLoading.value = false
    }
  }

  async function loadDj(force = false) {
    if (djRadios.value.length && !force) return
    djLoading.value = true
    try {
      djRadios.value = await getHotDjRadios(10).catch(() => [] as NeteaseDjRadio[])
    } catch {
      djRadios.value = []
    } finally {
      djLoading.value = false
    }
  }

  async function openDjRadio(id: string) {
    pane.value = 'detail'
    detailLoading.value = true
    detailError.value = ''
    detailSongs.value = []
    const radio = djRadios.value.find((r) => r.id === id) ?? null
    activeCollection.value = radio
      ? {
          kind: 'playlist',
          id: radio.id,
          name: radio.name,
          subtitle: radio.desc || `收听 ${formatPlayCount(radio.playCount)}`,
          coverUrl: radio.coverUrl,
          trackCount: radio.programCount,
        }
      : { kind: 'playlist', id, name: '电台', subtitle: '', coverUrl: '', trackCount: 0 }
    try {
      const songs = await getDjPrograms(id, 50)
      setDetail(
        {
          kind: 'playlist',
          id,
          name: radio?.name || '电台',
          subtitle: radio?.desc || `共 ${songs.length} 期节目`,
          coverUrl: radio?.coverUrl || songs[0]?.coverUrl || '',
          trackCount: songs.length,
        },
        songs,
      )
    } catch {
      detailError.value = '节目加载失败'
    } finally {
      detailLoading.value = false
    }
  }

  const activeCollection = ref<DiscoverCollection | null>(null)
  const detailSongs = ref<Song[]>([])
  const detailLoading = ref(false)
  const detailError = ref('')

  const detailTrackCount = computed(
    () => detailSongs.value.length || activeCollection.value?.trackCount || 0,
  )

  const dailyCover = computed(
    () => dailySongs.value.find((s) => s.coverUrl)?.coverUrl || playlists.value[0]?.coverUrl || '',
  )
  const newsongCover = computed(
    () => newSongs.value.find((s) => s.coverUrl)?.coverUrl || albums.value[0]?.coverUrl || '',
  )

  async function loadHome(force = false) {
    if (homeLoading.value) return
    if (homeLoaded.value && !force) return

    homeLoading.value = true
    homeError.value = ''
    try {
      const [daily, news, personalized, newest] = await Promise.all([
        getDailyRecommendSongs().catch(() => [] as Song[]),
        getPersonalizedNewSongs(12).catch(() => [] as Song[]),
        getPersonalizedPlaylists(12).catch(() => [] as NeteasePlaylistSummary[]),
        getNewestAlbums(12).catch(() => [] as NeteaseAlbumSummary[]),
      ])

      let list = personalized
      if (list.length < 6) {
        const hot = await getHotPlaylists(12).catch(() => [] as NeteasePlaylistSummary[])
        const seen = new Set(list.map((p) => p.id))
        list = [...list, ...hot.filter((p) => !seen.has(p.id))].slice(0, 12)
      }

      dailySongs.value = daily
      newSongs.value = news
      playlists.value = list
      albums.value = newest
      homeLoaded.value = true
      // 多源榜单不阻塞首页，失败静默降级
      void loadCharts()
      void loadNeteaseCharts()
      void loadDj()

      if (!daily.length && !news.length && !list.length && !newest.length) {
        homeError.value = '暂无推荐内容，请检查启动器中的 API 窗口，或尝试登录网易云'
      }
    } catch {
      homeError.value = '加载失败，请检查启动器中的音乐服务窗口'
      dailySongs.value = []
      newSongs.value = []
      playlists.value = []
      albums.value = []
    } finally {
      homeLoading.value = false
    }
  }

  function setDetail(collection: DiscoverCollection, songs: Song[]) {
    activeCollection.value = collection
    detailSongs.value = songs
    pane.value = 'detail'
    if (!songs.length) detailError.value = '暂无曲目'
    else detailError.value = ''
  }

  async function openDailyRecommend() {
    pane.value = 'detail'
    detailLoading.value = true
    detailError.value = ''
    activeCollection.value = {
      kind: 'daily',
      id: 'daily',
      name: '每日推荐',
      subtitle: '根据你的口味生成 · 今日 30 首',
      coverUrl: dailyCover.value,
      trackCount: dailySongs.value.length || 30,
    }
    detailSongs.value = []
    try {
      const songs = dailySongs.value.length ? dailySongs.value : await getDailyRecommendSongs()
      dailySongs.value = songs
      setDetail(
        {
          kind: 'daily',
          id: 'daily',
          name: '每日推荐',
          subtitle: '根据你的口味生成 · 今日推荐',
          coverUrl: songs.find((s) => s.coverUrl)?.coverUrl || dailyCover.value,
          trackCount: songs.length,
        },
        songs,
      )
    } catch {
      detailError.value = '每日推荐加载失败（登录后更准）'
    } finally {
      detailLoading.value = false
    }
  }

  async function openNewSongs() {
    pane.value = 'detail'
    detailLoading.value = true
    detailError.value = ''
    try {
      const songs = newSongs.value.length ? newSongs.value : await getPersonalizedNewSongs(30)
      newSongs.value = songs
      setDetail(
        {
          kind: 'newsong',
          id: 'newsong',
          name: '新歌速递',
          subtitle: '最近上架的新鲜曲目',
          coverUrl: songs.find((s) => s.coverUrl)?.coverUrl || newsongCover.value,
          trackCount: songs.length,
        },
        songs,
      )
    } catch {
      detailError.value = '新歌列表加载失败'
    } finally {
      detailLoading.value = false
    }
  }

  async function openPlaylist(id: string) {
    const summary = playlists.value.find((p) => p.id === id) ?? null
    pane.value = 'detail'
    detailLoading.value = true
    detailError.value = ''
    detailSongs.value = []
    activeCollection.value = summary
      ? {
          kind: 'playlist',
          id: summary.id,
          name: summary.name,
          subtitle: summary.copywriter || `播放 ${formatPlayCount(summary.playCount)}`,
          coverUrl: summary.coverUrl,
          trackCount: summary.trackCount,
        }
      : {
          kind: 'playlist',
          id,
          name: '歌单',
          subtitle: '',
          coverUrl: '',
          trackCount: 0,
        }
    try {
      const detail = await getPlaylistDetail(id)
      setDetail(
        {
          kind: 'playlist',
          id: detail.playlist.id,
          name: detail.playlist.name,
          subtitle: `播放 ${formatPlayCount(detail.playlist.playCount)} · ${detail.songs.length} 首`,
          coverUrl: detail.playlist.coverUrl,
          trackCount: detail.songs.length,
        },
        detail.songs,
      )
    } catch {
      detailError.value = '歌单详情加载失败'
    } finally {
      detailLoading.value = false
    }
  }

  async function openAlbum(id: string) {
    const summary = albums.value.find((a) => a.id === id) ?? null
    pane.value = 'detail'
    detailLoading.value = true
    detailError.value = ''
    detailSongs.value = []
    activeCollection.value = summary
      ? {
          kind: 'album',
          id: summary.id,
          name: summary.name,
          subtitle: summary.artist,
          coverUrl: summary.coverUrl,
          trackCount: summary.size,
        }
      : {
          kind: 'album',
          id,
          name: '专辑',
          subtitle: '',
          coverUrl: '',
          trackCount: 0,
        }
    try {
      const detail = await getAlbumDetail(id)
      setDetail(
        {
          kind: 'album',
          id: detail.album.id,
          name: detail.album.name,
          subtitle: detail.album.artist,
          coverUrl: detail.album.coverUrl,
          trackCount: detail.songs.length,
        },
        detail.songs,
      )
    } catch {
      detailError.value = '专辑详情加载失败'
    } finally {
      detailLoading.value = false
    }
  }

  async function openArtist(id: string) {
    pane.value = 'detail'
    detailLoading.value = true
    detailError.value = ''
    detailSongs.value = []
    activeCollection.value = {
      kind: 'artist',
      id,
      name: '歌手',
      subtitle: '',
      coverUrl: '',
      trackCount: 0,
    }
    try {
      const detail = await getArtistHotSongs(id)
      const subtitle =
        detail.artist.alias ||
        (detail.artist.albumSize ? `${detail.artist.albumSize} 张专辑` : '热门曲目')
      setDetail(
        {
          kind: 'artist',
          id: detail.artist.id,
          name: detail.artist.name,
          subtitle,
          coverUrl: detail.artist.coverUrl,
          trackCount: detail.songs.length,
        },
        detail.songs,
      )
    } catch {
      detailError.value = '歌手详情加载失败'
    } finally {
      detailLoading.value = false
    }
  }

  function closeDetail() {
    pane.value = 'home'
    activeCollection.value = null
    detailSongs.value = []
    detailError.value = ''
  }

  async function playDetailTrack(song: Song, goStage = true) {
    const [track] = player.upsertNeteaseTracks([song])
    if (!track) return
    await player.playTrack(track.id)
    if (goStage) player.switchView('stage')
  }

  async function playDetailAll(goStage = true) {
    if (!detailSongs.value.length) return
    const tracks = player.upsertNeteaseTracks(detailSongs.value, { replaceQueue: true })
    const first = tracks[0]
    if (!first) return
    await player.playTrack(first.id)
    if (goStage) player.switchView('stage')
  }

  async function playDailyQuick() {
    const songs = dailySongs.value.length ? dailySongs.value : await getDailyRecommendSongs()
    if (!songs.length) {
      await openDailyRecommend()
      return
    }
    dailySongs.value = songs
    const tracks = player.upsertNeteaseTracks(songs, { replaceQueue: true })
    const first = tracks[0]
    if (!first) return
    await player.playTrack(first.id)
    player.switchView('stage')
  }

  function openFavorites() {
    player.openPlaylist?.('favorites')
  }

  // 兼容旧模板命名
  const wallLoading = homeLoading
  const wallError = homeError
  const albumSongs = detailSongs
  const albumTrackCount = detailTrackCount
  const activeAlbum = computed(() =>
    activeCollection.value
      ? {
          id: activeCollection.value.id,
          name: activeCollection.value.name,
          artist: activeCollection.value.subtitle,
          coverUrl: activeCollection.value.coverUrl,
          size: activeCollection.value.trackCount,
        }
      : null,
  )

  watch(
    () => player.view.value,
    (v) => {
      if (v === 'discover' && pane.value === 'home') void loadHome()
    },
  )

  return {
    pane,
    homeLoading,
    homeError,
    homeLoaded,
    dailySongs,
    newSongs,
    playlists,
    albums,
    dailyCover,
    newsongCover,
    activeCollection,
    detailSongs,
    detailTrackCount,
    detailLoading,
    detailError,
    formatPlayCount,
    loadHome,
    openDailyRecommend,
    openNewSongs,
    openPlaylist,
    openAlbum,
    openArtist,
    closeDetail,
    playDetailTrack,
    playDetailAll,
    playDailyQuick,
    openFavorites,
    charts,
    loadCharts,
    neteaseCharts,
    neteaseChartsLoading,
    loadNeteaseCharts,
    openNeteaseToplist,
    djRadios,
    djLoading,
    loadDj,
    openDjRadio,
    // compat aliases
    wallLoading,
    wallError,
    activeAlbum,
    albumSongs,
    albumTrackCount,
    loadWall: loadHome,
    closeAlbum: closeDetail,
    playAlbumTrack: playDetailTrack,
    playAlbumAll: playDetailAll,
  }
}
