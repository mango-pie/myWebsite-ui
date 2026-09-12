<script setup lang="ts">
import { computed } from 'vue'
import { Download, Heart, ListMusic, ListPlus, Play, X } from 'lucide-vue-next'
import { toCoverDisplayUrl } from '@/utils/musicCover'
import { songToPulseTrack } from '@/composables/pulse/pulseTypes'
import type { PulsePlayerApi } from '@/pages/music/pulseApi'

const props = defineProps<{ p: PulsePlayerApi }>()
const p = props.p

const track = computed(() => p.songDetail.value)
const visible = computed(() => !!track.value)

function playTrackNow() {
  const t = track.value
  if (!t) return
  p.ingestTrack?.(t)
  void p.playTrack(t.id)
  p.closeSongDetail()
}

function playNext() {
  const t = track.value
  if (!t) return
  p.addToQueue?.(t, { next: true })
  p.closeSongDetail()
}

function enqueue() {
  const t = track.value
  if (!t) return
  p.addToQueue?.(t)
  p.closeSongDetail()
}

function addToUserPlaylist() {
  const t = track.value
  if (!t || !p.userPlaylists.value.length) return
  const first = p.playlistKey.value.startsWith('user:')
    ? p.playlistKey.value.slice(5)
    : p.userPlaylists.value[0].id
  p.addTrackToUserPlaylist(first, t)
}
</script>

<template>
  <div v-if="visible" class="song-detail-backdrop" @click.self="p.closeSongDetail()">
    <aside class="song-detail-drawer" role="dialog" aria-modal="true" aria-label="歌曲详情">
      <button class="song-detail-close" type="button" aria-label="关闭详情" @click="p.closeSongDetail()">
        <X :size="16" :stroke-width="2" />
      </button>

      <div class="song-detail-hero">
        <span class="track-cover song-detail-cover" aria-hidden="true">
          <img v-if="toCoverDisplayUrl(track.coverUrl)" :src="toCoverDisplayUrl(track.coverUrl)" alt="" />
          <span v-else class="signal-cover"><b>TRK</b></span>
        </span>
        <div class="song-detail-copy">
          <span class="page-eyebrow">{{ p.qualityLabel(track) }} · SONG DETAIL</span>
          <h2>{{ track.title }}</h2>
          <p>{{ track.artist }}</p>
          <small v-if="track.album">{{ track.album }} · {{ p.formatTime(track.duration) }}</small>
          <span class="source-badge" :class="{ local: track.source === '本地' }">{{ track.source }}</span>
        </div>
      </div>

      <div class="song-detail-actions">
        <button class="action-button primary" type="button" @click="playTrackNow">
          <Play :size="14" :stroke-width="2" /> 播放
        </button>
        <button class="action-button" type="button" @click="playNext">
          <ListPlus :size="14" :stroke-width="2" /> 下一首
        </button>
        <button class="action-button" type="button" @click="enqueue">
          <ListMusic :size="14" :stroke-width="2" /> 加队列
        </button>
        <button
          class="action-button"
          type="button"
          :class="{ 'is-active': track.favorite }"
          @click="p.toggleFavorite(track.id)"
        >
          <Heart :size="14" :stroke-width="2" :fill="track.favorite ? 'currentColor' : 'none'" />
          {{ track.favorite ? '已收藏' : '收藏' }}
        </button>
        <button
          v-if="p.canDownloadTrack(track)"
          class="action-button"
          type="button"
          :disabled="p.downloadBusy.value"
          @click="p.openDownloadPrompt(track)"
        >
          <Download :size="14" :stroke-width="2" /> 下载
        </button>
        <button
          v-if="p.userPlaylists.value.length"
          class="action-button"
          type="button"
          @click="addToUserPlaylist"
        >
          加入歌单
        </button>
      </div>

      <div v-if="track.neteaseId" class="song-detail-simi">
        <header class="panel-head">
          <span class="panel-index">SIMILAR</span><h3>相似歌曲</h3>
        </header>
        <div v-if="p.simiLoading.value" class="queue-empty" style="padding: 14px">正在加载相似歌曲…</div>
        <div v-else-if="!p.simiSongs.value.length" class="queue-empty" style="padding: 14px">暂无相似推荐</div>
        <div v-else class="result-list">
          <button
            v-for="(s, i) in p.simiSongs.value.slice(0, 10)"
            :key="s.id"
            class="result-row"
            type="button"
            @click="p.ingestTrack(songToPulseTrack(s)); p.closeSongDetail(); void p.playTrack(`net-${s.id}`)"
          >
            <span class="duration">{{ String(i + 1).padStart(2, '0') }}</span>
            <span class="result-copy"><strong>{{ s.title }}</strong><small>{{ s.artist }}</small></span>
            <span class="duration">{{ p.formatTime(s.duration) }}</span>
          </button>
        </div>
      </div>
    </aside>
  </div>
</template>
