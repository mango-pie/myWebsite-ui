import { ref } from 'vue'

export type BlogLayoutMode = 'card' | 'timeline'

const STORAGE_KEY = 'blog-layout-mode'

function readStoredMode(): BlogLayoutMode {
  if (typeof localStorage === 'undefined') return 'card'
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved === 'timeline' ? 'timeline' : 'card'
}

export function useBlogLayoutMode() {
  const layoutMode = ref<BlogLayoutMode>(readStoredMode())

  function setLayoutMode(mode: BlogLayoutMode) {
    layoutMode.value = mode
    localStorage.setItem(STORAGE_KEY, mode)
  }

  function toggleLayoutMode() {
    setLayoutMode(layoutMode.value === 'card' ? 'timeline' : 'card')
  }

  return {
    layoutMode,
    setLayoutMode,
    toggleLayoutMode,
  }
}
