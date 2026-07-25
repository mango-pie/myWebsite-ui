<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ConfigProvider } from 'ant-design-vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import PublicLayout from './layouts/PublicLayout.vue'
import WorkspaceLayout from './layouts/WorkspaceLayout.vue'
import MouseTrail from '@/components/MouseTrail.vue'
import { useLoginUserStore } from '@/stores/loginUser.ts'
import FloatingPlayer from '@/design/FloatingPlayer.vue'
import FloatingLyric from '@/design/FloatingLyric.vue'
import FloatingBubbleMenu from '@/components/FloatingBubbleMenu.vue'
import { PetDango } from '@/pet'
import { useAudioPlayer } from '@/design'
import { siteConfig } from '@/config/site'

const showLyric = ref(false)
const route = useRoute()

const isWorkspace = computed(() => route.meta.shell === 'workspace')

const antdTheme = computed(() => ({
  token: {
    fontFamily: "'Source Sans 3', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    fontSize: 15,
    fontSizeLG: 17,
    fontSizeSM: 13,
    fontSizeXL: 20,
    fontSizeHeading1: 40,
    fontSizeHeading2: 32,
    fontSizeHeading3: 26,
    fontSizeHeading4: 22,
    fontSizeHeading5: 18,
    colorPrimary: '#7a1f1f',
    colorText: '#2a2218',
    colorTextSecondary: '#6b5e4a',
    colorBgBase: '#f5f0e1',
    colorBgContainer: '#faf6eb',
    colorBorder: '#c9b99a',
    borderRadius: 2,
    wireframe: false,
  },
}))

const { addToPlaylist, state: playerState } = useAudioPlayer()

if (playerState.value.playlist.length === 0) {
  addToPlaylist([
    {
      id: '1',
      title: siteConfig.music.demoTracks[0].title,
      artist: siteConfig.music.demoTracks[0].artist,
      album: '氛围',
      coverUrl: 'https://picsum.photos/200/200?random=10',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      duration: 180,
    },
    {
      id: '2',
      title: siteConfig.music.demoTracks[1].title,
      artist: siteConfig.music.demoTracks[1].artist,
      album: '氛围',
      coverUrl: 'https://picsum.photos/200/200?random=20',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      duration: 240,
    },
  ])
}

const loginUserStore = useLoginUserStore()
loginUserStore.fetchLoginUser().catch(() => {})
</script>

<template>
  <ConfigProvider :locale="zhCN" :theme="antdTheme">
    <MouseTrail />
    <WorkspaceLayout v-if="isWorkspace" />
    <PublicLayout v-else />
  </ConfigProvider>
  <FloatingPlayer @open-lyric="showLyric = true" />
  <FloatingLyric :visible="showLyric" @close="showLyric = false" />
  <FloatingBubbleMenu v-if="siteConfig.effects.bubbleMenu.enabled" />
  <PetDango v-if="siteConfig.effects.petDango.enabled" />
</template>
