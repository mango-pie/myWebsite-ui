<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import '@/assets/styles/home-v3.css'
import '@/assets/styles/period-atmosphere.css'
import '@/assets/styles/reading-room-v1.css'
import '@/assets/styles/station-bridge.css'
import { themeByHour, type HomeTheme } from '@/composables/useHomeTheme'
import { useInkMode } from '@/composables/useInkMode'
import { useBackgroundMode } from '@/composables/useBackgroundMode'
import { useReadingRoomCraft } from '@/composables/useReadingRoomCraft'
import HomeTopbar from '@/components/home/HomeTopbar.vue'
import PeriodAtmosphere from '@/components/shared/PeriodAtmosphere.vue'
import StationTweaks from '@/components/shared/StationTweaks.vue'
import BackgroundCarousel from '@/components/shared/BackgroundCarousel.vue'
import ReadingRoomNav from '@/components/reading/ReadingRoomNav.vue'

const router = useRouter()
const route = useRoute()
const rootRef = ref<HTMLElement | null>(null)

const theme = ref<HomeTheme>(themeByHour(new Date().getHours()))
const autoTheme = ref(true)
const { inkMode, setInkMode } = useInkMode()
const { mode: bgMode, setMode: setBgMode } = useBackgroundMode()

const weekCN = ['日', '一', '二', '三', '四', '五', '六']
const clockHtml = ref('--<span class="colon">:</span>--')
const clockDate = ref('----年--月--日')
let clockTimer: ReturnType<typeof setInterval> | null = null

const toastMsg = ref('')
const toastShow = ref(false)
let toastTimer: ReturnType<typeof setTimeout> | null = null

const pad = (n: number) => String(n).padStart(2, '0')

const applyTheme = (name: HomeTheme) => {
  theme.value = name
  document.documentElement.dataset.theme = name
}

const setTheme = (name: HomeTheme) => {
  applyTheme(name)
}

const setAutoTheme = (on: boolean) => {
  autoTheme.value = on
  if (on) applyTheme(themeByHour(new Date().getHours()))
}

const tick = () => {
  const d = new Date()
  clockHtml.value = `${pad(d.getHours())}<span class="colon">:</span>${pad(d.getMinutes())} <span class="sec">${pad(d.getSeconds())}</span>`
  clockDate.value = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 · 周${weekCN[d.getDay()]}`
  if (autoTheme.value) applyTheme(themeByHour(d.getHours()))
}

const activeKey = computed(() => {
  const p = route.path
  if (p.includes('/learning')) return 'learning'
  if (/\/notes\/\d+/.test(p)) return 'detail'
  if (p.includes('/notes')) return 'notes'
  if (p.includes('/jobs')) return 'jobs'
  return 'ingest'
})

const noteLabel = computed(() => {
  const map: Record<string, string> = {
    ingest: '搜索 → 勾选 → 生成一篇 Markdown',
    jobs: '合蒸任务可离页跟踪',
    notes: '筛选 · 打开 · 再蒸馏',
    detail: '左编辑 / 右预览 · Ctrl+S 保存',
    learning: '门闩 → 搜文 → 挂叶',
  }
  return map[activeKey.value] ?? '精读工作台'
})

const PAGE_BY_KEY: Record<string, string> = {
  '1': '/admin/knowledge/ingest',
  '2': '/admin/knowledge/notes',
  '3': '/admin/knowledge/notes',
  '5': '/admin/knowledge/learning',
}

const showToast = (msg: string) => {
  toastMsg.value = msg
  toastShow.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastShow.value = false
  }, 1600)
}

useReadingRoomCraft(rootRef, showToast)

const onKeydown = (e: KeyboardEvent) => {
  const tag = (e.target as HTMLElement | null)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
  if ((e.target as HTMLElement | null)?.isContentEditable) return

  if (e.key === 'Escape') {
    if (route.path === '/admin/knowledge/ingest') return
    if (route.path.startsWith('/admin/knowledge')) {
      router.push('/admin/knowledge/ingest')
    }
    return
  }

  if (e.key === '4') {
    if (!/\/notes\/\d+/.test(route.path)) {
      router.push('/admin/knowledge/notes')
    }
    return
  }

  const path = PAGE_BY_KEY[e.key]
  if (path && route.path !== path) router.push(path)
}

onMounted(() => {
  tick()
  clockTimer = setInterval(tick, 1000)
  applyTheme(theme.value)
  document.body.classList.add('period-page-bg', 'reading-workbench-lock')
  document.documentElement.classList.add('reading-workbench-lock')
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
  if (toastTimer) clearTimeout(toastTimer)
  document.body.classList.remove('period-page-bg', 'reading-workbench-lock')
  document.documentElement.classList.remove('reading-workbench-lock')
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="rootRef" class="reading-room-root home-v3-root reading-room-elastic reading-workbench">
    <PeriodAtmosphere />
    <header class="elastic-topbar">
      <HomeTopbar
        brand-path="/admin/knowledge/ingest"
        :clock-html="clockHtml"
        :clock-date="clockDate"
      />
    </header>
    <div class="reading-chrome">
      <ReadingRoomNav />
      <span class="reading-hint">{{ noteLabel }} · 1–5 换页 · Esc 回采集</span>
    </div>
    <div class="reading-page reading-page-elastic">
      <slot />
    </div>
    <div class="toast" :class="{ show: toastShow }" role="status" aria-live="polite">{{ toastMsg }}</div>
    <StationTweaks
      :theme="theme"
      :auto-theme="autoTheme"
      :ink-mode="inkMode"
      :bg-mode="bgMode"
      @set-theme="setTheme"
      @set-auto-theme="setAutoTheme"
      @set-ink-mode="setInkMode"
      @set-bg-mode="setBgMode"
    />
    <BackgroundCarousel />
  </div>
</template>
