import { computed, onMounted, onUnmounted, ref } from 'vue'
import { siteConfig } from '@/config/site'

const backgroundModules = import.meta.glob<string>(
  '@/assets/backgrounds/*.{jpg,jpeg,png,webp,avif}',
  { eager: true, import: 'default' },
)

const backgroundUrls = Object.values(backgroundModules)

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

export function useBackgroundSlideshow() {
  const { intervalMs, fadeMs, enabled } = siteConfig.backgroundSlideshow
  const hasImages = backgroundUrls.length > 0
  const canRotate = enabled && backgroundUrls.length > 1

  const currentIndex = ref(pickRandomIndex())
  const activeLayer = ref<'a' | 'b'>('a')
  const layerA = ref(hasImages && currentIndex.value >= 0 ? backgroundUrls[currentIndex.value] : '')
  const layerB = ref('')

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

  onMounted(() => {
    if (!hasImages) return

    if (canRotate) {
      const nextIndex = pickRandomIndex(currentIndex.value)
      const nextUrl = backgroundUrls[nextIndex]
      if (nextUrl) preloadImage(nextUrl)
      timer = setInterval(switchToNext, intervalMs)
    }
  })

  onUnmounted(() => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  })

  return {
    layerA,
    layerB,
    activeLayer,
    hasImages,
    fadeDuration,
  }
}
