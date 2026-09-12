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
import { siteConfig } from '@/config/site'
import { usePulsePlayer } from '@/composables/usePulsePlayer'

usePulsePlayer()

const showLyric = ref(false)
const route = useRoute()

const isWorkspace = computed(() => route.meta.shell === 'workspace')

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

const loginUserStore = useLoginUserStore()
loginUserStore.fetchLoginUser().catch(() => {})
</script>

<template>
  <ConfigProvider :locale="zhCN" :theme="antdTheme">
    <MouseTrail />
    <WorkspaceLayout v-if="isWorkspace" />
    <PublicLayout v-else />
  </ConfigProvider>
  <!-- Pulse 单例在 App 挂载时 bootstrap，出 /music 不停播。首页用 HomeSkyWindow，房间自有底栏，这两处不叠悬浮条。 -->
  <FloatingPlayer v-if="route.path !== '/' && route.path !== '/music'" @open-lyric="showLyric = true" />
  <FloatingLyric :visible="showLyric" @close="showLyric = false" />
  <FloatingBubbleMenu v-if="siteConfig.effects.bubbleMenu.enabled && route.path !== '/' && route.path !== '/music'" />
  <PetDango v-if="siteConfig.effects.petDango.enabled" />
</template>
