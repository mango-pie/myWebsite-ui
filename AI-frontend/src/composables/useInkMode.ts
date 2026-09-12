import { onMounted, onUnmounted, ref, watch } from 'vue'

export type InkMode = 'day' | 'night'

const STORAGE_KEY = 'station-ink-mode'
const inkMode = ref<InkMode>('day')
let wired = 0

function readStored(): InkMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'day' || v === 'night') return v
  } catch {
    /* ignore */
  }
  return 'day'
}

function applyInkToDom(mode: InkMode) {
  document.documentElement.dataset.ink = mode
}

// hydrate early to avoid flash
if (typeof document !== 'undefined') {
  inkMode.value = readStored()
  applyInkToDom(inkMode.value)
}

export function useInkMode() {
  const setInkMode = (mode: InkMode) => {
    inkMode.value = mode
    applyInkToDom(mode)
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      /* ignore */
    }
  }

  onMounted(() => {
    wired += 1
    applyInkToDom(inkMode.value)
  })

  onUnmounted(() => {
    wired = Math.max(0, wired - 1)
  })

  watch(inkMode, (m) => applyInkToDom(m))

  return {
    inkMode,
    setInkMode,
  }
}
