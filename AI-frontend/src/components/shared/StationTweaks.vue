<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import type { HomeTheme } from '@/composables/useHomeTheme'
import type { InkMode } from '@/composables/useInkMode'
import type { StationBgMode } from '@/composables/useBackgroundMode'
import { hasBackgroundImages } from '@/composables/useBackgroundSlideshow'

defineProps<{
  theme: HomeTheme
  autoTheme: boolean
  inkMode: InkMode
  bgMode: StationBgMode
}>()

const emit = defineEmits<{
  setTheme: [HomeTheme]
  setAutoTheme: [boolean]
  setInkMode: [InkMode]
  setBgMode: [StationBgMode]
}>()

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)

const themes: { key: HomeTheme; label: string }[] = [
  { key: 'morning', label: '晨' },
  { key: 'noon', label: '午' },
  { key: 'dusk', label: '昏' },
  { key: 'night', label: '夜' },
]

const inks: { key: InkMode; label: string }[] = [
  { key: 'day', label: '日间' },
  { key: 'night', label: '夜间' },
]

const bgModes: { key: StationBgMode; label: string }[] = [
  { key: 'period', label: '时段' },
  { key: 'carousel', label: '轮播' },
]

const onDocClick = (e: MouseEvent) => {
  if (!rootRef.value?.contains(e.target as Node)) open.value = false
}

onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div id="tweaks" ref="rootRef" :class="{ open }">
    <div class="panel">
      <h4>TWEAKS</h4>
      <div class="row">
        <label>时段</label>
        <div class="seg">
          <button
            v-for="t in themes"
            :key="t.key"
            type="button"
            :class="{ on: theme === t.key }"
            :disabled="autoTheme"
            @click="emit('setTheme', t.key)"
          >
            {{ t.label }}
          </button>
        </div>
      </div>
      <div class="row">
        <label>跟随时间</label>
        <button
          type="button"
          class="switch"
          :class="{ on: autoTheme }"
          aria-label="跟随真实时间"
          @click="emit('setAutoTheme', !autoTheme)"
        />
      </div>
      <div class="row">
        <label>阅读模式</label>
        <div class="seg">
          <button
            v-for="m in inks"
            :key="m.key"
            type="button"
            :class="{ on: inkMode === m.key }"
            @click="emit('setInkMode', m.key)"
          >
            {{ m.label }}
          </button>
        </div>
      </div>
      <div class="row">
        <label>背景</label>
        <div class="seg">
          <button
            v-for="b in bgModes"
            :key="b.key"
            type="button"
            :class="{ on: bgMode === b.key }"
            :disabled="b.key === 'carousel' && !hasBackgroundImages"
            @click="emit('setBgMode', b.key)"
          >
            {{ b.label }}
          </button>
        </div>
      </div>
      <slot />
    </div>
    <button class="fab" type="button" @click="open = true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M4 8h10M18 8h2M4 16h2M10 16h10" />
        <circle cx="16" cy="8" r="2.4" />
        <circle cx="8" cy="16" r="2.4" />
      </svg>
      Tweaks
    </button>
  </div>
</template>
