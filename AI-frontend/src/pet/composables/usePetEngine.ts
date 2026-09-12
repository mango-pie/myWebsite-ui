import { onUnmounted, ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { siteConfig } from '@/config/site'
import { usePulsePlayer } from '@/composables/usePulsePlayer'
import {
  PET_ARRIVAL_THRESHOLD,
  PET_STORAGE_KEY,
} from '../constants'
import { getRouteReaction } from '../routeReactions'
import {
  clampPointToWanderBounds,
  getViewportMoveMetrics,
  getWanderBounds,
  pickWanderTarget,
} from './usePetAvoidance'
import type {
  PetEnableMode,
  PetFacing,
  PetOverlayState,
  PetPoint,
  PetState,
  PetViewModel,
  PetWalkPace,
} from '../types'

interface SavedPetState {
  x: number
  y: number
}

export interface UsePetEngineOptions {
  petSize: number
  getMode: () => PetEnableMode
  onRouteLine?: (line: string) => void
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function distance(a: PetPoint, b: PetPoint) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

function getDefaultPosition(petSize: number): PetPoint {
  const cfg = siteConfig.effects.petDango.defaultPosition
  const bounds = getWanderBounds({ w: window.innerWidth, h: window.innerHeight }, petSize)
  return {
    x: cfg.x ?? bounds.minX + 32,
    y: cfg.y ?? bounds.maxY,
  }
}

export function usePetEngine(options: UsePetEngineOptions) {
  const route = useRoute()
  const { petSize, getMode, onRouteLine } = options
  const cfg = siteConfig.effects.petDango
  const p = usePulsePlayer()

  const position = ref<PetPoint>(getDefaultPosition(petSize))
  const wanderTarget = ref<PetPoint | null>(null)
  const state = ref<PetState>('idle')
  const overlayState = ref<PetOverlayState | null>(null)
  const walkPace = ref<PetWalkPace>('slow')
  const facing = ref<PetFacing>('right')
  const lookAt = ref<PetPoint | null>(null)

  let rafId = 0
  let lastTs = 0
  let idleTimer = 0
  let idleDuration = 0
  let lastInteractionAt = performance.now()
  let lastOverlayAt = 0
  let overlayUntil = 0
  let hoverStartAt = 0
  let hoverGreeted = false
  let pendingRouteGreet = false
  let routeInitialized = false

  const viewModel = shallowRef<PetViewModel>({
    state: 'idle',
    overlay: null,
    walkPace: 'slow',
    musicPlaying: false,
    facing: 'right',
    lookAt: null,
  })

  function syncViewModel() {
    viewModel.value = {
      state: state.value,
      overlay: overlayState.value,
      walkPace: walkPace.value,
      musicPlaying: p.isPlaying.value,
      facing: facing.value,
      lookAt: lookAt.value,
    }
  }

  function clearOverlay() {
    if (!overlayState.value) return
    overlayState.value = null
    overlayUntil = 0
  }

  function resolveOverlayDuration(overlay: PetOverlayState) {
    return cfg.gif.overlayDurationMs[overlay] ?? 700
  }

  function triggerOverlay(
    overlay: PetOverlayState,
    options?: {
      bypassCooldown?: boolean
    },
  ) {
    if (!cfg.gif.overlayEnabled) return false
    if (state.value !== 'idle') return false
    const now = performance.now()
    if (!options?.bypassCooldown && now - lastOverlayAt < cfg.gif.overlayCooldownMs) return false
    overlayState.value = overlay
    overlayUntil = now + resolveOverlayDuration(overlay)
    lastOverlayAt = now
    syncViewModel()
    return true
  }

  function loadPosition() {
    try {
      const raw = localStorage.getItem(PET_STORAGE_KEY)
      if (!raw) {
        position.value = clampPointToWanderBounds(getDefaultPosition(petSize), petSize)
        return
      }
      const saved = JSON.parse(raw) as SavedPetState
      position.value = clampPointToWanderBounds(saved, petSize)
    } catch {
      position.value = clampPointToWanderBounds(getDefaultPosition(petSize), petSize)
    }
  }

  function savePosition() {
    localStorage.setItem(
      PET_STORAGE_KEY,
      JSON.stringify({
        x: position.value.x,
        y: position.value.y,
      }),
    )
  }

  function pickIdleDuration() {
    idleDuration = cfg.idleMinMs + Math.random() * (cfg.idleMaxMs - cfg.idleMinMs)
  }

  function scheduleWander() {
    if (getMode() !== 'full') return
    const metrics = getViewportMoveMetrics(undefined, {
      maxStep: cfg.wanderMaxStepRatio,
      slowDistance: cfg.gif.walkSlowDistanceRatio,
    })
    const target = pickWanderTarget(petSize, 8, {
      current: position.value,
      maxStep: metrics.maxWanderStep,
    })
    if (!target) return
    clearOverlay()
    const travelDistance = distance(position.value, target)
    walkPace.value = travelDistance < metrics.walkSlowThreshold ? 'slow' : 'fast'
    wanderTarget.value = target
    state.value = 'walk'
    syncViewModel()
  }

  function touchInteraction() {
    lastInteractionAt = performance.now()
    if (state.value === 'sleep') {
      state.value = 'idle'
      pickIdleDuration()
      idleTimer = 0
      syncViewModel()
    }
  }

  function setReact() {
    touchInteraction()
    clearOverlay()
    state.value = 'react'
    wanderTarget.value = null
    syncViewModel()
  }

  function onAnimationComplete(completedState: PetState) {
    if (completedState !== 'react') return
    if (state.value !== 'react') return
    state.value = 'idle'
    pickIdleDuration()
    idleTimer = 0
    if (pendingRouteGreet) {
      pendingRouteGreet = false
      triggerOverlay('happy', { bypassCooldown: true })
    } else {
      triggerOverlay('jump', { bypassCooldown: true })
    }
    syncViewModel()
  }

  function setDrag(active: boolean) {
    touchInteraction()
    if (active) {
      clearOverlay()
      walkPace.value = 'fast'
      state.value = 'drag'
      wanderTarget.value = null
    } else {
      state.value = 'idle'
      walkPace.value = 'slow'
      pickIdleDuration()
      idleTimer = 0
      savePosition()
    }
    syncViewModel()
  }

  function setPosition(point: PetPoint) {
    position.value = clampPointToWanderBounds(point, petSize)
  }

  function setLookAt(point: PetPoint | null) {
    const now = performance.now()
    if (point) {
      if (!hoverStartAt) {
        hoverStartAt = now
        hoverGreeted = false
      }
      if (!hoverGreeted && now - hoverStartAt >= 320) {
        hoverGreeted = triggerOverlay('happy')
      }
    } else {
      hoverStartAt = 0
      hoverGreeted = false
    }
    lookAt.value = point
    syncViewModel()
  }

  function tick(ts: number) {
    if (getMode() !== 'full') return

    const dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.05) : 0
    lastTs = ts
    const now = performance.now()

    if (overlayState.value && now >= overlayUntil) {
      overlayState.value = null
      overlayUntil = 0
      syncViewModel()
    }

    if (state.value === 'walk' && wanderTarget.value) {
      const target = wanderTarget.value
      const paceMultiplier = walkPace.value === 'fast' ? 1.35 : 1
      const next = {
        x: lerp(position.value.x, target.x, cfg.wanderSpeed * paceMultiplier * dt * 3),
        y: lerp(position.value.y, target.y, cfg.wanderSpeed * paceMultiplier * dt * 3),
      }
      if (target.x - position.value.x !== 0) {
        facing.value = target.x >= position.value.x ? 'right' : 'left'
      }
      position.value = next

      if (distance(position.value, target) < PET_ARRIVAL_THRESHOLD) {
        position.value = target
        wanderTarget.value = null
        state.value = 'idle'
        walkPace.value = 'slow'
        pickIdleDuration()
        idleTimer = 0
      }
      syncViewModel()
    } else if (state.value === 'idle') {
      idleTimer += dt * 1000
      if (idleTimer >= idleDuration) {
        scheduleWander()
      }

      if (
        cfg.gif.overlayEnabled &&
        !overlayState.value &&
        now - lastOverlayAt >= cfg.gif.overlayCooldownMs
      ) {
        const roll = Math.random()
        const threshold = cfg.gif.overlayChance * dt * 2
        if (roll < threshold) {
          triggerOverlay(Math.random() < 0.6 ? 'sigh' : 'jump')
        }
      }

      if (now - lastInteractionAt >= cfg.sleepAfterMs) {
        clearOverlay()
        state.value = 'sleep'
        syncViewModel()
      }
    }

    rafId = requestAnimationFrame(tick)
  }

  function startLoop() {
    if (getMode() !== 'full') return
    cancelAnimationFrame(rafId)
    lastTs = 0
    rafId = requestAnimationFrame(tick)
  }

  function stopLoop() {
    cancelAnimationFrame(rafId)
    rafId = 0
    lastTs = 0
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      stopLoop()
    } else {
      startLoop()
    }
  }

  function onResize() {
    position.value = clampPointToWanderBounds(position.value, petSize)
    savePosition()
  }

  watch(
    () => route.path,
    (path) => {
      if (!routeInitialized) {
        routeInitialized = true
        return
      }
      const reaction = getRouteReaction(path)
      if (!reaction) return
      if (reaction.state) {
        pendingRouteGreet = true
        setReact()
      } else {
        touchInteraction()
        triggerOverlay('happy', { bypassCooldown: true })
      }
      if (reaction.line && onRouteLine) {
        onRouteLine(reaction.line)
      }
    },
  )

  watch(
    () => p.isPlaying.value,
    () => {
      if (state.value === 'idle' || state.value === 'sleep') {
        syncViewModel()
      }
    },
  )

  function mount() {
    loadPosition()
    pickIdleDuration()
    syncViewModel()

    if (getMode() === 'full') {
      window.addEventListener('resize', onResize)
      document.addEventListener('visibilitychange', onVisibilityChange)
      startLoop()
    }
  }

  function unmount() {
    stopLoop()
    window.removeEventListener('resize', onResize)
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }

  onUnmounted(unmount)

  return {
    position,
    viewModel,
    state,
    facing,
    lookAt,
    mount,
    unmount,
    setReact,
    setDrag,
    setPosition,
    setLookAt,
    touchInteraction,
    onAnimationComplete,
    savePosition,
  }
}
