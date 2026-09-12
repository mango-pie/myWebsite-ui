import { computed, onMounted, onUnmounted, ref, type Ref } from 'vue'

export const HOME_PAGE_COUNT = 4
export const HOME_PAGE_H = 1080

/**
 * Discrete full-page pager: wheel / keyboard / programmatic.
 */
export function useHomePager(pageCount = HOME_PAGE_COUNT) {
  const pageIndex = ref(0)
  const animating = ref(false)
  let wheelLock = false
  let wheelTimer: ReturnType<typeof setTimeout> | null = null

  const pageLabel = computed(() => `${String(pageIndex.value + 1).padStart(2, '0')} / ${String(pageCount).padStart(2, '0')}`)
  const trackStyle = computed(() => ({
    transform: `translate3d(0, ${-pageIndex.value * HOME_PAGE_H}px, 0)`,
  }))

  const goTo = (index: number) => {
    const next = Math.max(0, Math.min(pageCount - 1, index))
    if (next === pageIndex.value) return
    pageIndex.value = next
    animating.value = true
    window.setTimeout(() => {
      animating.value = false
    }, 700)
  }

  const goNext = () => goTo(pageIndex.value + 1)
  const goPrev = () => goTo(pageIndex.value - 1)

  const onWheel = (e: WheelEvent) => {
    const tag = (e.target as HTMLElement | null)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return
    e.preventDefault()
    if (wheelLock || animating.value) return
    const dy = e.deltaY
    if (Math.abs(dy) < 12) return
    wheelLock = true
    if (dy > 0) goNext()
    else goPrev()
    if (wheelTimer) clearTimeout(wheelTimer)
    wheelTimer = setTimeout(() => {
      wheelLock = false
    }, 820)
  }

  const onKey = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement | null)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault()
      goNext()
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault()
      goPrev()
    } else if (e.key === 'Home') {
      e.preventDefault()
      goTo(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      goTo(pageCount - 1)
    }
  }

  const bind = (el: Ref<HTMLElement | null>) => {
    onMounted(() => {
      const node = el.value
      node?.addEventListener('wheel', onWheel, { passive: false })
      window.addEventListener('keydown', onKey)
    })
    onUnmounted(() => {
      const node = el.value
      node?.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
      if (wheelTimer) clearTimeout(wheelTimer)
    })
  }

  return {
    pageIndex,
    pageLabel,
    trackStyle,
    animating,
    goTo,
    goNext,
    goPrev,
    bind,
  }
}
