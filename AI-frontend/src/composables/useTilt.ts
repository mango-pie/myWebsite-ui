/**
 * 卡片 3D 倾斜指令：监听元素自身 pointermove（不挂 window，避免与全局鼠标特效抢事件），
 * rAF 合批写入 CSS 变量 --rx/--ry（旋转）与 --mx/--my（高光坐标）。
 * 尊重 prefers-reduced-motion：整体禁用。
 *
 * 用法：
 *   import { vTilt } from '@/composables/useTilt'
 *   <button v-tilt> ... </button>
 */
import type { Directive } from 'vue'

interface TiltState {
  rafId: number
  onEnter: () => void
  onMove: (e: PointerEvent) => void
  onLeave: () => void
}

const MAX_DEG = 6

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const STATE = new WeakMap<HTMLElement, TiltState>()

const reset = (el: HTMLElement) => {
  el.style.setProperty('--rx', '0deg')
  el.style.setProperty('--ry', '0deg')
  el.style.setProperty('--mx', '50%')
  el.style.setProperty('--my', '50%')
}

export const vTilt: Directive<HTMLElement> = {
  mounted(el) {
    if (prefersReducedMotion()) return

    reset(el)

    const state: TiltState = {
      rafId: 0,
      onEnter: () => {
        el.style.willChange = 'transform'
      },
      onMove: (e: PointerEvent) => {
        if (state.rafId) return
        state.rafId = requestAnimationFrame(() => {
          state.rafId = 0
          const rect = el.getBoundingClientRect()
          if (!rect.width || !rect.height) return
          const px = (e.clientX - rect.left) / rect.width
          const py = (e.clientY - rect.top) / rect.height
          const clampedX = Math.min(Math.max(px, 0), 1)
          const clampedY = Math.min(Math.max(py, 0), 1)
          el.style.setProperty('--ry', `${(clampedX - 0.5) * 2 * MAX_DEG}deg`)
          el.style.setProperty('--rx', `${(0.5 - clampedY) * 2 * MAX_DEG}deg`)
          el.style.setProperty('--mx', `${clampedX * 100}%`)
          el.style.setProperty('--my', `${clampedY * 100}%`)
        })
      },
      onLeave: () => {
        if (state.rafId) {
          cancelAnimationFrame(state.rafId)
          state.rafId = 0
        }
        el.style.willChange = ''
        reset(el)
      },
    }

    el.addEventListener('pointerenter', state.onEnter)
    el.addEventListener('pointermove', state.onMove)
    el.addEventListener('pointerleave', state.onLeave)
    STATE.set(el, state)
  },

  unmounted(el) {
    const state = STATE.get(el)
    if (!state) return
    if (state.rafId) cancelAnimationFrame(state.rafId)
    el.removeEventListener('pointerenter', state.onEnter)
    el.removeEventListener('pointermove', state.onMove)
    el.removeEventListener('pointerleave', state.onLeave)
    STATE.delete(el)
  },
}
