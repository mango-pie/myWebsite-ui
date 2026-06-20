<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { siteConfig } from '@/config/site'
import type { PetState, PetViewModel } from '../../types'
import { resolvePetGifAtlas, resolvePetGifUrl } from '../../gifAtlas'
import PetRendererCss from './PetRendererCss.vue'

const props = defineProps<{
  model: PetViewModel
  size: number
}>()

const emit = defineEmits<{
  animationComplete: [state: PetState]
}>()

const atlas = resolvePetGifAtlas()
const failedStates = new Set<PetState>()
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

let reactTimer = 0

const effectiveModel = computed<PetViewModel>(() => {
  if (reduceMotion && props.model.state !== 'drag') {
    return {
      ...props.model,
      state: 'idle',
      overlay: null,
      walkPace: 'slow',
    }
  }
  if (failedStates.has(props.model.state)) {
    return {
      ...props.model,
      state: atlas.fallbackState,
      overlay: null,
    }
  }
  return props.model
})

const gifSrc = computed(() => resolvePetGifUrl(effectiveModel.value, atlas))

const hasGif = computed(() => Boolean(gifSrc.value))
const isFlipped = computed(() => props.model.facing === 'left')
const gifScale = computed(() => Math.max(1, siteConfig.effects.petDango.gif.renderScale ?? 1))

const imageStyle = computed(() => {
  const scalePrefix = `scale(${gifScale.value})`
  if (props.model.state === 'drag') {
    return {
      transform: isFlipped.value
        ? `${scalePrefix} scaleX(-1) rotate(3deg)`
        : `${scalePrefix} rotate(-3deg)`,
    }
  }
  return {
    transform: isFlipped.value ? `${scalePrefix} scaleX(-1)` : scalePrefix,
  }
})

function clearReactTimer() {
  if (!reactTimer) return
  window.clearTimeout(reactTimer)
  reactTimer = 0
}

watch(
  () => props.model.state,
  (state) => {
    clearReactTimer()
    if (state !== 'react') return
    reactTimer = window.setTimeout(() => {
      emit('animationComplete', 'react')
      reactTimer = 0
    }, siteConfig.effects.petDango.gif.reactDurationMs ?? 800)
  },
  { immediate: true },
)

function onImageError() {
  failedStates.add(props.model.state)
}

onBeforeUnmount(() => {
  clearReactTimer()
})

onMounted(() => {
  if (!import.meta.env.DEV) return
  if (atlas.loadedFiles.length === 0) {
    console.warn('[PetGif] 未发现 GIF 素材，请检查 src/assets/ams 目录。')
    return
  }
  if (!atlas.hasAllCoreStates) {
    console.warn('[PetGif] 核心状态未全部命中，已使用回退状态。')
  }
  if (!atlas.hasAllOverlayStates) {
    console.warn('[PetGif] 微行为状态未全部命中，已回退到核心状态。')
  }
  console.info(`[PetGif] 素材命中 ${atlas.matchedStateCount}/8`)
  if (atlas.unmatchedFiles.length > 0) {
    console.info('[PetGif] 未匹配状态的文件:', atlas.unmatchedFiles.join(', '))
  }
})
</script>

<template>
  <PetRendererCss
    v-if="!hasGif"
    :model="model"
    :size="size"
    @animation-complete="(state) => emit('animationComplete', state)"
  />
  <div v-else class="pet-gif" :style="{ width: `${size}px`, height: `${size}px` }">
    <img
      class="pet-gif__image"
      :style="imageStyle"
      :src="gifSrc"
      alt=""
      loading="eager"
      decoding="async"
      @error="onImageError"
    >
  </div>
</template>

<style scoped>
.pet-gif {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.pet-gif__image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transform-origin: center bottom;
  user-select: none;
  pointer-events: none;
  image-rendering: auto;
}
</style>

