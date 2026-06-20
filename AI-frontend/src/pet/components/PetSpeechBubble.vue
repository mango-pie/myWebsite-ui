<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  text: string
  visible: boolean
}>()

const show = ref(false)
let hideTimer: ReturnType<typeof setTimeout> | null = null

function clearTimer() {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

watch(
  () => props.visible,
  (visible) => {
    clearTimer()
    if (!visible || !props.text) {
      show.value = false
      return
    }
    show.value = true
    hideTimer = setTimeout(() => {
      show.value = false
      hideTimer = null
    }, 3000)
  },
  { immediate: true },
)

watch(
  () => props.text,
  () => {
    if (!props.visible || !props.text) return
    clearTimer()
    show.value = true
    hideTimer = setTimeout(() => {
      show.value = false
      hideTimer = null
    }, 3000)
  },
)

onUnmounted(clearTimer)
</script>

<template>
  <Transition name="pet-bubble">
    <div v-if="show && text" class="pet-speech-bubble">
      {{ text }}
    </div>
  </Transition>
</template>

<style scoped>
.pet-speech-bubble {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  transform: translateX(-50%);
  width: max-content;
  max-width: min(280px, calc(100vw - 32px));
  min-width: 120px;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: rgba(45, 36, 56, 0.94);
  backdrop-filter: blur(10px);
  box-shadow: var(--shadow-md);
  color: var(--color-text-primary);
  font-size: 13px;
  line-height: 1.5;
  text-align: center;
  white-space: normal;
  word-break: break-word;
  pointer-events: none;
  z-index: 3;
}

.pet-speech-bubble::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -5px;
  width: 10px;
  height: 10px;
  background: rgba(45, 36, 56, 0.94);
  border-right: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  transform: translateX(-50%) rotate(45deg);
}

.pet-bubble-enter-active,
.pet-bubble-leave-active {
  transition: opacity var(--transition-normal), transform var(--transition-normal);
}

.pet-bubble-enter-from,
.pet-bubble-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(6px);
}
</style>
