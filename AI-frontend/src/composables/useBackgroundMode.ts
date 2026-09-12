import { ref } from 'vue'

export type StationBgMode = 'period' | 'carousel'

const STORAGE_KEY = 'station-bg-mode'

function readStored(): StationBgMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'period' || v === 'carousel') return v
  } catch {
    /* ignore */
  }
  return 'period'
}

const mode = ref<StationBgMode>(readStored())

export function useBackgroundMode() {
  const setMode = (next: StationBgMode) => {
    mode.value = next
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }

  return {
    mode,
    setMode,
  }
}
