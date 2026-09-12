import { computed, onMounted, onUnmounted, ref } from 'vue'
import { siteConfig } from '@/config/site'

const backgroundModules = import.meta.glob<string>(
  '@/assets/backgrounds/*.{jpg,jpeg,png,webp,avif}',
  { eager: true, import: 'default' },
)

const backgroundUrls = Object.values(backgroundModules)

/** 是否至少有一张背景图（供设置面板禁用「轮播」选项） */
export const hasBackgroundImages = backgroundUrls.length > 0

function pickRandomIndex(exclude?: number): number {
  if (backgroundUrls.length === 0) return -1
  if (backgroundUrls.length === 1) return 0

  let index = Math.floor(Math.random() * backgroundUrls.length)
  while (index === exclude) {
    index = Math.floor(Math.random() * backgroundUrls.length)
  }
  return index
}

function preloadImage(url: string) {
  const img = new Image()
  img.src = url
}

export interface BackgroundSlideshowOptions {
  /** 挂载后是否立即开始轮换，默认 true（公开壳沿用旧行为）；轮播图模式组件传 false 手动 start/stop */
  autoRun?: boolean
}

export function useBackgroundSlideshow(options: BackgroundSlideshowOptions = {}) {
  const { autoRun = true } = options
  const { intervalMs, fadeMs, enabled } = siteConfig.backgroundSlideshow
  const hasImages = backgroundUrls.length > 0
  const canRotate = enabled && backgroundUrls.length > 1

  const currentIndex = ref(pickRandomIndex())
  const activeLayer = ref<'a' | 'b'>('a')
  const layerA = ref(hasImages && currentIndex.value >= 0 ? backgroundUrls[currentIndex.value] : '')
  const layerB = ref('')
  const running = ref(false)

  let timer: ReturnType<typeof setInterval> | null = null

  const fadeDuration = computed(() => `${fadeMs}ms`)

  const switchToNext = () => {
    if (!canRotate || currentIndex.value < 0) return

    const nextIndex = pickRandomIndex(currentIndex.value)
    const nextUrl = backgroundUrls[nextIndex]
    if (!nextUrl) return

    preloadImage(nextUrl)

    if (activeLayer.value === 'a') {
      layerB.value = nextUrl
      activeLayer.value = 'b'
    } else {
      layerA.value = nextUrl
      activeLayer.value = 'a'
    }
    currentIndex.value = nextIndex
  }

  const start = () => {
    if (!canRotate || running.value) return

    const nextIndex = pickRandomIndex(currentIndex.value)
    const nextUrl = backgroundUrls[nextIndex]
    if (nextUrl) preloadImage(nextUrl)

    running.value = true
    timer = setInterval(switchToNext, intervalMs)
  }

  const stop = () => {
    running.value = false
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  onMounted(() => {
    if (!hasImages) return
    if (autoRun && canRotate) start()
  })

  onUnmounted(stop)

  return {
    layerA,
    layerB,
    activeLayer,
    hasImages,
    running,
    start,
    stop,
    fadeDuration,
  }
}
