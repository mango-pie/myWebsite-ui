<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { useBackgroundMode } from '@/composables/useBackgroundMode'
import { useBackgroundSlideshow } from '@/composables/useBackgroundSlideshow'

const { mode } = useBackgroundMode()
const { layerA, layerB, activeLayer, hasImages, fadeDuration, start, stop } =
  useBackgroundSlideshow({ autoRun: false })

const apply = () => {
  const on = hasImages && mode.value === 'carousel'
  document.body.classList.toggle('station-bg-carousel', on)
  if (on) start()
  else stop()
}

onMounted(apply)
watch(mode, apply)

onUnmounted(() => {
  stop()
  document.body.classList.remove('station-bg-carousel')
})
</script>

<template>
  <div
    v-if="hasImages && mode === 'carousel'"
    class="station-bg-carousel-fx"
    :style="{ '--bg-fade-duration': fadeDuration }"
    aria-hidden="true"
  >
    <img
      v-if="layerA"
      class="station-bg-carousel-fx__image"
      :class="{ 'is-active': activeLayer === 'a' }"
      :src="layerA"
      alt=""
    />
    <img
      v-if="layerB"
      class="station-bg-carousel-fx__image"
      :class="{ 'is-active': activeLayer === 'b' }"
      :src="layerB"
      alt=""
    />
  </div>
</template>

<style scoped>
.station-bg-carousel-fx {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}

.station-bg-carousel-fx__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity var(--bg-fade-duration, 1.2s) ease;
}

.station-bg-carousel-fx__image.is-active {
  opacity: 1;
}
</style>
