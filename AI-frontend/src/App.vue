<script setup lang="ts">
import { computed, ref } from 'vue'
import { ConfigProvider } from 'ant-design-vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import BasicLayout from './layouts/BasicLayout.vue'
import MouseTrail from '@/components/MouseTrail.vue'
import { useLoginUserStore } from '@/stores/loginUser.ts'
import FloatingPlayer from '@/design/FloatingPlayer.vue'
import FloatingLyric from '@/design/FloatingLyric.vue'
import FloatingBubbleMenu from '@/components/FloatingBubbleMenu.vue'
import { PetDango } from '@/pet'
import { useAudioPlayer } from '@/design'
import { siteConfig } from '@/config/site'

const showLyric = ref(false)

const antdTheme = computed(() => ({
  token: {
    fontFamily: "'ZCOOL KuaiLe', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    fontSize: 15,
    fontSizeLG: 17,
    fontSizeSM: 13,
    fontSizeXL: 20,
    fontSizeHeading1: 40,
    fontSizeHeading2: 32,
    fontSizeHeading3: 26,
    fontSizeHeading4: 22,
    fontSizeHeading5: 18,
    colorPrimary: '#e879a9',
    colorText: '#f5f0f8',
    colorTextSecondary: '#c4b8d0',
    colorBgBase: '#1a1625',
    colorBgContainer: 'rgba(45, 36, 56, 0.78)',
    colorBorder: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    wireframe: false,
  },
}))

// 初始化播放器
const { addToPlaylist, state: playerState } = useAudioPlayer()

// 只在播放列表为空时添加示例歌曲（避免页面切换时重复添加）
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
loginUserStore.fetchLoginUser().catch(() => {
  // 后端未启动或未登录时保持未登录状态，不影响页面打开
})

</script>
<template>
  <ConfigProvider :locale="zhCN" :theme="antdTheme">
    <MouseTrail />
    <BasicLayout />
  </ConfigProvider>
  <!-- 全局悬浮播放器 -->
  <FloatingPlayer @open-lyric="showLyric = true" />
  <!-- 悬浮歌词窗口 -->
  <FloatingLyric :visible="showLyric" @close="showLyric = false" />
  <!-- 全站气泡菜单 -->
  <FloatingBubbleMenu v-if="siteConfig.effects.bubbleMenu.enabled" />
  <!-- 团子宠物 -->
  <PetDango v-if="siteConfig.effects.petDango.enabled" />
</template>
