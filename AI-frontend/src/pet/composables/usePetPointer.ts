import { ref } from 'vue'
import {
  PET_CLICK_MAX_MOVE,
  PET_CLICK_MAX_MS,
  PET_LOOK_AT_MAX_OFFSET,
} from '../constants'
import type { PetPoint } from '../types'

export interface UsePetPointerOptions {
  petSize: number
  getPosition: () => PetPoint
  onDragStart: () => void
  onDragEnd: () => void
  onDragMove: (point: PetPoint) => void
  onClick: () => void
  onLookAt: (point: PetPoint | null) => void
  onInteraction: () => void
}

function clampLookAtOffset(value: number) {
  return Math.max(-PET_LOOK_AT_MAX_OFFSET, Math.min(PET_LOOK_AT_MAX_OFFSET, value))
}

export function usePetPointer(options: UsePetPointerOptions) {
  const {
    petSize,
    getPosition,
    onDragStart,
    onDragEnd,
    onDragMove,
    onClick,
    onLookAt,
    onInteraction,
  } = options

  const isDragging = ref(false)
  let pointerId: number | null = null
  let dragOffset = { x: 0, y: 0 }
  let downAt = 0
  let downPoint = { x: 0, y: 0 }

  function updateLookAt(clientX: number, clientY: number) {
    const pos = getPosition()
    const centerX = pos.x + petSize / 2
    const centerY = pos.y + petSize / 2
    onLookAt({
      x: clampLookAtOffset(clientX - centerX),
      y: clampLookAtOffset(clientY - centerY),
    })
  }

  function teardownPointerListeners() {
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerUp)
  }

  function onPointerMove(e: PointerEvent) {
    if (pointerId !== e.pointerId) return

    if (isDragging.value) {
      onDragMove({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      })
      return
    }

    const moved = Math.hypot(e.clientX - downPoint.x, e.clientY - downPoint.y)
    if (moved > PET_CLICK_MAX_MOVE) {
      isDragging.value = true
      onDragStart()
      onDragMove({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      })
    }
  }

  function onPointerUp(e: PointerEvent) {
    if (pointerId !== e.pointerId) return

    const elapsed = performance.now() - downAt
    const moved = Math.hypot(e.clientX - downPoint.x, e.clientY - downPoint.y)

    if (isDragging.value) {
      onDragEnd()
    } else if (elapsed < PET_CLICK_MAX_MS && moved < PET_CLICK_MAX_MOVE) {
      onInteraction()
      onClick()
    }

    isDragging.value = false
    pointerId = null
    teardownPointerListeners()
  }

  function onPointerDown(e: PointerEvent) {
    if (e.button !== 0) return

    pointerId = e.pointerId
    isDragging.value = false
    downAt = performance.now()
    downPoint = { x: e.clientX, y: e.clientY }

    const pos = getPosition()
    dragOffset = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    e.preventDefault()
  }

  function onPointerEnter(e: PointerEvent) {
    updateLookAt(e.clientX, e.clientY)
  }

  function onPointerMoveOver(e: PointerEvent) {
    if (isDragging.value) return
    updateLookAt(e.clientX, e.clientY)
  }

  function onPointerLeave() {
    if (!isDragging.value) {
      onLookAt(null)
    }
  }

  function unmount() {
    teardownPointerListeners()
  }

  return {
    isDragging,
    onPointerDown,
    onPointerEnter,
    onPointerMoveOver,
    onPointerLeave,
    unmount,
  }
}
