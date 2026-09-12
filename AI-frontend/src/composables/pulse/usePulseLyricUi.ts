import { nextTick, onUnmounted, ref, watch } from 'vue'
import type { PulsePlayerApi } from '@/pages/music/pulseApi'

export function usePulseLyricUi(p: PulsePlayerApi) {
  const lyricFlowRef = ref<HTMLElement | null>(null)
  const theaterFlowRef = ref<HTMLElement | null>(null)
  const drawerLyricRef = ref<HTMLElement | null>(null)
  const lyricPeekIndex = ref(-1)
  const lyricHoverIndex = ref(-1)
  let lyricUserScroll = false
  let lyricProgrammaticScroll = false
  let lyricUserScrollTimer: ReturnType<typeof setTimeout> | undefined
  let lyricProgrammaticTimer: ReturnType<typeof setTimeout> | undefined

  function updateLyricPeek(container: HTMLElement | null) {
    if (!container) {
      lyricPeekIndex.value = -1
      return
    }
    const lines = [...container.querySelectorAll<HTMLElement>('.lyric-line, .theater-lyric, .drawer-lyric-line')]
    if (!lines.length) {
      lyricPeekIndex.value = -1
      return
    }
    const cRect = container.getBoundingClientRect()
    const mid = cRect.top + cRect.height / 2
    let best = -1
    let bestDist = Number.POSITIVE_INFINITY
    lines.forEach((el, i) => {
      const r = el.getBoundingClientRect()
      const dist = Math.abs(r.top + r.height / 2 - mid)
      if (dist < bestDist) {
        bestDist = dist
        best = i
      }
    })
    lyricPeekIndex.value = best
  }

  function endLyricUserScroll() {
    lyricUserScroll = false
    lyricPeekIndex.value = -1
    void nextTick(() => syncLyricScroll(true))
  }

  function markLyricUserScroll(e?: Event) {
    if (lyricProgrammaticScroll) return
    lyricUserScroll = true
    const target = (e?.currentTarget as HTMLElement | null) ?? lyricFlowRef.value
    updateLyricPeek(target)
    if (lyricUserScrollTimer) clearTimeout(lyricUserScrollTimer)
    lyricUserScrollTimer = setTimeout(endLyricUserScroll, 1400)
  }

  function scrollLyricIntoFocus(container: HTMLElement | null, activeSel: string) {
    if (!container) return
    const active = container.querySelector(activeSel) as HTMLElement | null
    if (!active) return
    const cRect = container.getBoundingClientRect()
    const aRect = active.getBoundingClientRect()
    const delta = aRect.top + aRect.height / 2 - (cRect.top + cRect.height / 2)
    if (Math.abs(delta) < 6) return
    lyricProgrammaticScroll = true
    if (lyricProgrammaticTimer) clearTimeout(lyricProgrammaticTimer)
    container.scrollBy({ top: delta, behavior: 'smooth' })
    lyricProgrammaticTimer = setTimeout(() => {
      lyricProgrammaticScroll = false
    }, 480)
  }

  function syncLyricScroll(force = false) {
    if (lyricUserScroll && !force) return
    scrollLyricIntoFocus(lyricFlowRef.value, '.lyric-line.is-active')
    if (p.theaterOpen.value) {
      scrollLyricIntoFocus(theaterFlowRef.value, '.theater-lyric.is-active')
    }
    if (p.drawerOpen.value && p.drawerTab.value === 'lyrics') {
      scrollLyricIntoFocus(drawerLyricRef.value, '.drawer-lyric-line.is-active')
    }
  }

  function lyricToneClass(index: number) {
    const active = p.lyricIndex.value
    const classes: string[] = []
    if (active >= 0) {
      const dist = Math.abs(index - active)
      if (dist === 0) classes.push('is-active')
      else if (dist === 1) classes.push('is-near')
      else if (dist === 2) classes.push('is-mid')
      else classes.push('is-dim')
    }
    if (index !== active) {
      if (lyricUserScroll && lyricPeekIndex.value === index) classes.push('is-peek')
      if (lyricHoverIndex.value === index) classes.push('is-hover')
    }
    return classes
  }

  function onLyricLineEnter(index: number) {
    lyricHoverIndex.value = index
  }

  function onLyricLineLeave() {
    lyricHoverIndex.value = -1
  }

  function onLyricLineClick(index: number) {
    lyricUserScroll = false
    lyricPeekIndex.value = -1
    lyricHoverIndex.value = -1
    if (lyricUserScrollTimer) clearTimeout(lyricUserScrollTimer)
    p.seekLyric(index)
    void nextTick(() => syncLyricScroll(true))
  }

  watch(
    () => [p.lyricIndex.value, p.showLyricTranslation.value, p.view.value, p.theaterOpen.value] as const,
    async (curr, prev) => {
      await nextTick()
      const index = curr[0]
      const prevIndex = prev?.[0]
      if (!lyricUserScroll) {
        syncLyricScroll(true)
      } else if (index !== prevIndex) {
        updateLyricPeek(lyricFlowRef.value)
      }
    },
  )

  watch(
    () => p.currentId.value,
    async () => {
      lyricUserScroll = false
      lyricPeekIndex.value = -1
      lyricHoverIndex.value = -1
      if (lyricUserScrollTimer) clearTimeout(lyricUserScrollTimer)
      await nextTick()
      if (lyricFlowRef.value) lyricFlowRef.value.scrollTop = 0
      if (theaterFlowRef.value) theaterFlowRef.value.scrollTop = 0
      syncLyricScroll(true)
    },
  )

  onUnmounted(() => {
    if (lyricUserScrollTimer) clearTimeout(lyricUserScrollTimer)
    if (lyricProgrammaticTimer) clearTimeout(lyricProgrammaticTimer)
  })

  return {
    lyricFlowRef,
    theaterFlowRef,
    drawerLyricRef,
    lyricPeekIndex,
    lyricHoverIndex,
    lyricToneClass,
    onLyricLineEnter,
    onLyricLineLeave,
    onLyricLineClick,
    markLyricUserScroll,
    syncLyricScroll,
  }
}

