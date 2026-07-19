/**
 * 数字滚动：目标值变化时用 rAF 从当前值缓动到目标（easeOutExpo）。
 * 尊重 prefers-reduced-motion：直接跳到目标值。
 */
import { onUnmounted, ref, watch, type Ref } from 'vue'

interface UseCountUpOptions {
  /** 动画时长（毫秒） */
  duration?: number
}

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const easeOutExpo = (t: number): number => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))

export function useCountUp(
  target: Ref<number>,
  options: UseCountUpOptions = {},
): Ref<number> {
  const duration = options.duration ?? 800
  const display = ref(0)

  let rafId = 0
  let startTime = 0
  let fromValue = 0

  const stop = () => {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = 0
    }
  }

  const run = (to: number) => {
    stop()

    if (prefersReducedMotion() || duration <= 0) {
      display.value = to
      return
    }

    fromValue = display.value
    startTime = 0

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = easeOutExpo(progress)
      display.value = Math.round(fromValue + (to - fromValue) * eased)

      if (progress < 1) {
        rafId = requestAnimationFrame(step)
      } else {
        display.value = to
        rafId = 0
      }
    }

    rafId = requestAnimationFrame(step)
  }

  watch(target, (value) => run(value ?? 0), { immediate: true })

  onUnmounted(stop)

  return display
}
