<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { usePulsePlayer } from '@/composables/usePulsePlayer'

const props = defineProps<{
  seasonCaps: [string, string]
  cloudsOn: boolean
  parallaxOn: boolean
}>()

const p = usePulsePlayer()

const stars = ref<{ left: string; top: string; delay: string; size: string }[]>([])
const shootingStyle = ref<Record<string, string>>({})
const shootingFly = ref(false)
const capOpacity = ref(1)
const displayCaps = ref<[string, string]>([...props.seasonCaps])

let pxTargetX = 0
let pxTargetY = 0
let pxX = 0
let pxY = 0
let rafId = 0
let shootTimer: ReturnType<typeof setInterval> | null = null
const skyRef = ref<HTMLElement | null>(null)

const isPlaying = computed(() => p.isPlaying.value)
const trackTitle = computed(() => p.currentTrack.value?.title || '去音乐房间搜一首')
const trackArtist = computed(
  () => p.currentTrack.value?.artist || '舞台空闲',
)
const progressPct = computed(() => p.progressPct.value)

watch(
  () => props.seasonCaps,
  (caps) => {
    capOpacity.value = 0
    setTimeout(() => {
      displayCaps.value = [...caps]
      capOpacity.value = 1
    }, 250)
  },
)

const onMove = (e: MouseEvent) => {
  if (!props.parallaxOn || !skyRef.value) return
  const r = skyRef.value.getBoundingClientRect()
  const cx = r.left + r.width / 2
  const cy = r.top + r.height / 2
  pxTargetX = Math.max(-1, Math.min(1, (e.clientX - cx) / (r.width / 2)))
  pxTargetY = Math.max(-1, Math.min(1, (e.clientY - cy) / (r.height / 2)))
}

const onLeave = () => {
  pxTargetX = 0
  pxTargetY = 0
}

const parallaxLoop = () => {
  pxX += (pxTargetX - pxX) * 0.06
  pxY += (pxTargetY - pxY) * 0.06
  const layers = skyRef.value?.querySelectorAll<HTMLElement>('.px') || []
  for (const layer of layers) {
    if (!props.parallaxOn) {
      layer.style.transform = ''
      continue
    }
    const d = Number(layer.dataset.depth || 0)
    layer.style.transform = `translate3d(${(-pxX * d).toFixed(2)}px, ${(-pxY * d * 0.6).toFixed(2)}px, 0)`
  }
  rafId = requestAnimationFrame(parallaxLoop)
}

const launchShootingStar = () => {
  if (document.documentElement.dataset.theme !== 'night') return
  shootingStyle.value = {
    left: `${30 + Math.random() * 50}%`,
    top: `${6 + Math.random() * 26}%`,
  }
  shootingFly.value = false
  requestAnimationFrame(() => {
    shootingFly.value = true
  })
}

onMounted(() => {
  stars.value = Array.from({ length: 34 }, () => {
    const sz = 2 + Math.random() * 3
    return {
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 62}%`,
      delay: `${Math.random() * 2.6}s`,
      size: `${sz}px`,
    }
  })
  rafId = requestAnimationFrame(parallaxLoop)
  shootTimer = setInterval(launchShootingStar, 5200)
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
  if (shootTimer) clearInterval(shootTimer)
})

defineExpose({ skyRef })
</script>

<template>
  <div
    ref="skyRef"
    class="sky-window anim"
    :class="{ 'clouds-off': !cloudsOn }"
    style="animation-delay: 0.4s"
    @mousemove="onMove"
    @mouseleave="onLeave"
  >
    <div class="stars">
      <i
        v-for="(s, i) in stars"
        :key="i"
        :style="{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: s.delay }"
      />
    </div>
    <div class="shooting" :class="{ fly: shootingFly }" :style="shootingStyle" />
    <div class="birds"><i /><i /><i /></div>

    <div class="px" data-depth="6">
      <div class="sky-glow" />
      <div class="sun-noon" />
      <div class="sun-rays">
        <i v-for="n in 12" :key="n" />
      </div>
      <div class="sun-dusk" />
      <div class="sky-moon" />
    </div>

    <div class="px" data-depth="16">
      <div class="cloud c1"><i /></div>
      <div class="cloud c2"><i /></div>
      <div class="cloud c3"><i /></div>
    </div>

    <div class="px" data-depth="4">
      <div class="sky-mist" />
      <div class="hills">
        <svg viewBox="0 0 700 300" preserveAspectRatio="none">
          <path
            d="M0,190 C90,120 190,110 290,160 C380,205 470,130 560,150 C630,165 680,200 700,210 L700,300 L0,300 Z"
            fill="var(--hill-1)"
            opacity=".65"
          />
          <path
            d="M0,240 C110,180 230,175 330,215 C430,255 540,195 640,225 C675,236 695,248 700,252 L700,300 L0,300 Z"
            fill="var(--hill-2)"
          />
        </svg>
      </div>
    </div>

    <div class="px" data-depth="22">
      <div class="polaroid p1">
        <div class="ph" style="background: linear-gradient(160deg, #ffd9e4, #bfe6f7)" />
        <div class="cap" :style="{ opacity: capOpacity }">{{ displayCaps[0] }}</div>
      </div>
      <div class="polaroid p2">
        <div class="ph" style="background: linear-gradient(160deg, #d8ebfb, #e4dffd)" />
        <div class="cap" :style="{ opacity: capOpacity }">{{ displayCaps[1] }}</div>
      </div>
    </div>

    <div class="px" data-depth="10">
      <div class="standee" title="点击放置你的立绘">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <circle cx="9" cy="9" r="2" />
          <path d="M21 15l-4.5-4.5L7 20" />
        </svg>
        <span class="frame-label font-display">角色立绘占位</span>
        <span class="frame-size">建议比例 3 : 4 · PNG 透明底</span>
      </div>
    </div>

    <div class="mini-player" :class="{ playing: isPlaying }">
      <div class="mp-cover" />
      <div class="mp-info">
        <div class="mp-title">{{ trackTitle }}</div>
        <div class="mp-artist">{{ trackArtist }}</div>
        <div class="mp-bar"><i :style="{ width: progressPct + '%' }" /></div>
      </div>
      <div class="mp-eq"><i /><i /><i /><i /><i /></div>
      <button type="button" class="mp-btn" aria-label="播放/暂停" @click="p.togglePlay">
        <svg v-if="isPlaying" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>
    </div>
  </div>
</template>
