import { ref } from 'vue'
import type { PetPoint, PetRect } from '../types'
import {
  BUBBLE_MENU_SIZE,
  BUBBLE_MENU_STORAGE_KEY,
  BUBBLE_MENU_ZONE_EXPANDED,
  PET_VIEWPORT_MARGIN,
  PET_WANDER_ZONE_START_RATIO,
} from '../constants'

const extraZones = ref<PetRect[]>([])

function rectsOverlap(a: PetRect, b: PetRect): boolean {
  return (
    a.x < b.x + b.width
    && a.x + a.width > b.x
    && a.y < b.y + b.height
    && a.y + a.height > b.y
  )
}

function pointInRect(point: PetPoint, rect: PetRect): boolean {
  return (
    point.x >= rect.x
    && point.x <= rect.x + rect.width
    && point.y >= rect.y
    && point.y <= rect.y + rect.height
  )
}

function readBubbleMenuZone(): PetRect | null {
  try {
    const raw = localStorage.getItem(BUBBLE_MENU_STORAGE_KEY)
    if (!raw) return null

    const saved = JSON.parse(raw) as { x: number; y: number }
    const half = BUBBLE_MENU_ZONE_EXPANDED / 2
    const centerX = saved.x + BUBBLE_MENU_SIZE / 2
    const centerY = saved.y + BUBBLE_MENU_SIZE / 2

    return {
      x: centerX - half,
      y: centerY - half,
      width: BUBBLE_MENU_ZONE_EXPANDED,
      height: BUBBLE_MENU_ZONE_EXPANDED,
    }
  } catch {
    return null
  }
}

export function registerAvoidanceZone(rect: PetRect) {
  extraZones.value.push(rect)
}

export function unregisterAvoidanceZone(rect: PetRect) {
  extraZones.value = extraZones.value.filter(
    (zone) =>
      zone.x !== rect.x
      || zone.y !== rect.y
      || zone.width !== rect.width
      || zone.height !== rect.height,
  )
}

export function getAvoidanceZones(): PetRect[] {
  const zones: PetRect[] = [...extraZones.value]
  const bubbleZone = readBubbleMenuZone()
  if (bubbleZone) {
    zones.push(bubbleZone)
  }
  return zones
}

export function isPointInAvoidanceZone(point: PetPoint, petSize: number): boolean {
  const rect: PetRect = { x: point.x, y: point.y, width: petSize, height: petSize }
  return getAvoidanceZones().some((zone) => rectsOverlap(rect, zone))
}

export function getWanderBounds(viewport: { w: number; h: number }, petSize: number) {
  const margin = PET_VIEWPORT_MARGIN
  const minY = viewport.h * PET_WANDER_ZONE_START_RATIO
  return {
    minX: margin,
    maxX: viewport.w - petSize - margin,
    minY: minY > 0 ? minY : margin,
    maxY: viewport.h - petSize - margin,
  }
}

export function clampPointToWanderBounds(point: PetPoint, petSize: number): PetPoint {
  const bounds = getWanderBounds({ w: window.innerWidth, h: window.innerHeight }, petSize)
  return {
    x: Math.min(Math.max(point.x, bounds.minX), bounds.maxX),
    y: Math.min(Math.max(point.y, bounds.minY), bounds.maxY),
  }
}

export interface ViewportMoveMetrics {
  maxWanderStep: number
  walkSlowThreshold: number
}

export function getViewportMoveMetrics(
  viewport: { w: number; h: number } = { w: window.innerWidth, h: window.innerHeight },
  ratios: { maxStep?: number; slowDistance?: number } = {},
): ViewportMoveMetrics {
  const ref = Math.min(viewport.w, viewport.h)
  const maxStepRatio = ratios.maxStep ?? 0.5
  const slowRatio = ratios.slowDistance ?? 0.25
  return {
    maxWanderStep: ref * maxStepRatio,
    walkSlowThreshold: ref * slowRatio,
  }
}

export interface PickWanderTargetOptions {
  current: PetPoint
  maxStep: number
}

function pickNearbyPoint(
  current: PetPoint,
  maxStep: number,
  bounds: ReturnType<typeof getWanderBounds>,
): PetPoint {
  const angle = Math.random() * Math.PI * 2
  const dist = Math.random() * maxStep
  return {
    x: Math.min(Math.max(current.x + Math.cos(angle) * dist, bounds.minX), bounds.maxX),
    y: Math.min(Math.max(current.y + Math.sin(angle) * dist, bounds.minY), bounds.maxY),
  }
}

export function pickWanderTarget(
  petSize: number,
  maxAttempts = 8,
  options: PickWanderTargetOptions,
): PetPoint | null {
  const bounds = getWanderBounds({ w: window.innerWidth, h: window.innerHeight }, petSize)

  for (let i = 0; i < maxAttempts; i += 1) {
    const candidate = pickNearbyPoint(options.current, options.maxStep, bounds)

    if (!isPointInAvoidanceZone(candidate, petSize)) {
      return candidate
    }
  }

  return pickNearbyPoint(options.current, options.maxStep, bounds)
}

export function isPointInZone(point: PetPoint, zone: PetRect): boolean {
  return pointInRect(point, zone)
}
