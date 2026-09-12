import { nextTick, onMounted, onUnmounted, ref, type Ref } from 'vue'
import { HOME_PAGE_H } from '@/composables/useHomePager'

export const HOME_STAGE_W = 1920
/** Visible stage = one page */
export const HOME_STAGE_H = HOME_PAGE_H

/**
 * Fit one 1920×1080 page into the viewport (width + height), no browser scroll.
 */
export function useHomeStageScale(
  stageWrapRef: Ref<HTMLElement | null>,
  stageRef: Ref<HTMLElement | null>,
) {
  const scale = ref(1)

  const fit = () => {
    const s = Math.min(window.innerWidth / HOME_STAGE_W, window.innerHeight / HOME_STAGE_H, 1)
    scale.value = s
    const stage = stageRef.value
    const wrap = stageWrapRef.value
    if (stage) stage.style.transform = `scale(${s})`
    if (wrap) {
      wrap.style.width = `${HOME_STAGE_W * s}px`
      wrap.style.height = `${HOME_STAGE_H * s}px`
    }
  }

  onMounted(async () => {
    await nextTick()
    fit()
    requestAnimationFrame(fit)
    window.addEventListener('resize', fit)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', fit)
  })

  return { scale, fit }
}
