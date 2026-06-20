<script setup lang="ts">
import { onMounted, onUnmounted, shallowRef } from 'vue'
import { siteConfig } from '@/config/site'

const MAX_TRAIL_POINTS = 42
const TRAIL_LIFE_DECAY = 0.038
const TRAIL_SAMPLE_DISTANCE = 1
/** 快速移动时两点间插值步长（px），越小越顺滑 */
const TRAIL_INTERPOLATE_STEP = 5
const TRAIL_LERP = 0.34
const TRAIL_WIDTH_MIN = 6
const TRAIL_WIDTH_MAX = 16
const TRAIL_ALPHA = 0.38

const CORE_ALPHA = 0.42
const CORE_RADIUS_MIN = 12
const CORE_RADIUS_MAX = 28

const STAR_SPAWN_THRESHOLD = 8
const STAR_MAX_COUNT = 24
const STAR_SIZE_MIN = 4
const STAR_SIZE_MAX = 10.4
const STAR_LIFE_DECAY = 0.038

interface TrailPoint {
  x: number
  y: number
  life: number
  speedFactor: number
}

interface StarParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  life: number
  phase: number
  color: string
}

const canvasRef = shallowRef<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let rafId = 0
let running = false
let colors = {
  primary: '232, 121, 169',
  secondary: '124, 156, 224',
}

const target = { x: 0, y: 0 }
const display = { x: 0, y: 0 }
let hasPointer = false
let lastSampleX = 0
let lastSampleY = 0

const points: TrailPoint[] = []
const stars: StarParticle[] = []

function shouldEnable(): boolean {
  if (!siteConfig.effects.mouseTrail.enabled) return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  if (window.matchMedia('(pointer: coarse)').matches) return false
  return true
}

function parseCssColorToRgb(cssColor: string): string | null {
  const el = document.createElement('div')
  el.style.color = cssColor
  document.body.appendChild(el)
  const computed = getComputedStyle(el).color
  document.body.removeChild(el)
  const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!match) return null
  return `${match[1]}, ${match[2]}, ${match[3]}`
}

function readThemeColors(): { primary: string; secondary: string } {
  const root = getComputedStyle(document.documentElement)
  const primary =
    parseCssColorToRgb(root.getPropertyValue('--color-primary').trim() || '#e879a9') ??
    '232, 121, 169'
  const secondary =
    parseCssColorToRgb(root.getPropertyValue('--color-secondary').trim() || '#7c9ce0') ??
    '124, 156, 224'
  return { primary, secondary }
}

function clearCanvas() {
  const canvas = canvasRef.value
  if (!ctx || !canvas) return
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

function resize() {
  const canvas = canvasRef.value
  if (!canvas || !ctx) return
  const dpr = 1
  const w = window.innerWidth
  const h = window.innerHeight
  canvas.width = Math.floor(w * dpr)
  canvas.height = Math.floor(h * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function addTrailPoint(x: number, y: number, speed: number) {
  const speedFactor = Math.min(speed / 18, 1)
  points.push({ x, y, life: 1, speedFactor })
  if (points.length > MAX_TRAIL_POINTS) {
    points.shift()
  }
}

function spawnStars(x: number, y: number, speed: number) {
  if (speed < STAR_SPAWN_THRESHOLD) return
  const baseCount = Math.min(3, 1 + Math.floor((speed - STAR_SPAWN_THRESHOLD) / 7))

  for (let i = 0; i < baseCount; i++) {
    if (stars.length >= STAR_MAX_COUNT) return
    const angle = Math.random() * Math.PI * 2
    const force = speed * (0.06 + Math.random() * 0.14)
    const size = STAR_SIZE_MIN + Math.random() * (STAR_SIZE_MAX - STAR_SIZE_MIN)
    stars.push({
      x,
      y,
      vx: Math.cos(angle) * force,
      vy: Math.sin(angle) * force,
      size,
      life: 0.65 + Math.random() * 0.35,
      phase: Math.random() * Math.PI * 2,
      color: Math.random() > 0.4 ? colors.secondary : colors.primary,
    })
  }
}

function sampleTrailAt(x: number, y: number) {
  const dx = x - lastSampleX
  const dy = y - lastSampleY
  const dist = Math.hypot(dx, dy)
  if (dist < TRAIL_SAMPLE_DISTANCE) return

  const step = Math.min(TRAIL_INTERPOLATE_STEP, Math.max(TRAIL_SAMPLE_DISTANCE, dist / 8))
  const count = Math.max(1, Math.ceil(dist / step))

  for (let i = 1; i <= count; i++) {
    const t = i / count
    const ix = lastSampleX + dx * t
    const iy = lastSampleY + dy * t
    addTrailPoint(ix, iy, dist / count)
  }

  if (dist >= STAR_SPAWN_THRESHOLD) {
    spawnStars(x, y, dist)
  }

  lastSampleX = x
  lastSampleY = y
}

function onPointerMove(e: PointerEvent) {
  target.x = e.clientX
  target.y = e.clientY

  if (!hasPointer) {
    hasPointer = true
    display.x = target.x
    display.y = target.y
    lastSampleX = target.x
    lastSampleY = target.y
    startLoop()
    return
  }

  // 快速划动时直接按真实指针位置补点，避免只跟 lerp 产生大间距
  sampleTrailAt(target.x, target.y)
  if (!running) startLoop()
}

function onPointerLeave() {
  hasPointer = false
}

function drawGlow(x: number, y: number, radius: number, rgb: string, alpha: number) {
  if (!ctx || alpha <= 0.01) return
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
  gradient.addColorStop(0, `rgba(${rgb}, ${alpha})`)
  gradient.addColorStop(0.5, `rgba(${rgb}, ${alpha * 0.32})`)
  gradient.addColorStop(1, `rgba(${rgb}, 0)`)
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
}

function segmentWidth(life: number, speedFactor: number): number {
  const widthFactor = 0.65 + speedFactor * 0.35
  return (TRAIL_WIDTH_MIN + (TRAIL_WIDTH_MAX - TRAIL_WIDTH_MIN) * life) * widthFactor
}

function drawTrailRibbon() {
  if (!ctx || points.length < 2) return

  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.globalCompositeOperation = 'source-over'

  // points[0] 最旧（细），points[n-1] 最新（粗）— 每段按靠近光标端的 life 决定粗细
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1]
    const p1 = points[i]
    if (!p0 || !p1) continue

    const tOld = p0.life
    const tNew = p1.life
    if (tNew <= 0.02) continue

    const width = segmentWidth(tOld * 0.25 + tNew * 0.75, p1.speedFactor)
    const alpha = TRAIL_ALPHA * (tOld * 0.2 + tNew * 0.8)

    const gradient = ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y)
    gradient.addColorStop(0, `rgba(${colors.primary}, ${alpha * 0.55})`)
    gradient.addColorStop(1, `rgba(${colors.secondary}, ${alpha * 0.85})`)

    ctx.beginPath()
    ctx.moveTo(p0.x, p0.y)
    ctx.lineTo(p1.x, p1.y)
    ctx.lineWidth = width
    ctx.strokeStyle = gradient
    ctx.stroke()
  }

  ctx.restore()
}

function drawCoreGlow() {
  if (!ctx || !hasPointer) return
  const latest = points[points.length - 1]
  const speedFactor = latest ? latest.speedFactor : 0.4
  const radius = CORE_RADIUS_MIN + (CORE_RADIUS_MAX - CORE_RADIUS_MIN) * speedFactor

  ctx.save()
  ctx.globalCompositeOperation = 'source-over'
  drawGlow(display.x, display.y, radius, colors.primary, CORE_ALPHA)
  drawGlow(display.x, display.y, radius * 0.65, colors.secondary, CORE_ALPHA * 0.55)
  ctx.restore()
}

function drawStarShape(x: number, y: number, size: number, alpha: number, rgb: string, phase: number) {
  if (!ctx || alpha <= 0.01) return
  const diagonal = size * 0.62

  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(phase * 0.12)
  ctx.strokeStyle = `rgba(${rgb}, ${alpha})`
  ctx.lineWidth = Math.max(1, size * 0.22)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-size, 0)
  ctx.lineTo(size, 0)
  ctx.moveTo(0, -size)
  ctx.lineTo(0, size)
  ctx.moveTo(-diagonal, -diagonal)
  ctx.lineTo(diagonal, diagonal)
  ctx.moveTo(-diagonal, diagonal)
  ctx.lineTo(diagonal, -diagonal)
  ctx.stroke()
  ctx.restore()
}

function drawStars(nowMs: number) {
  if (!ctx) return
  ctx.save()
  ctx.globalCompositeOperation = 'source-over'

  for (const star of stars) {
    if (star.life <= 0.02) continue
    const twinkle = 0.6 + 0.4 * Math.sin(nowMs * 0.018 + star.phase)
    const alpha = star.life * twinkle * 0.62
    drawStarShape(star.x, star.y, star.size, alpha, star.color, star.phase)
  }

  ctx.restore()
}

function updateTrailPoints() {
  for (let i = points.length - 1; i >= 0; i--) {
    const point = points[i]
    if (!point) continue
    point.life -= TRAIL_LIFE_DECAY
    if (point.life <= 0) {
      points.splice(i, 1)
    }
  }
}

function updateStars() {
  for (let i = stars.length - 1; i >= 0; i--) {
    const star = stars[i]
    if (!star) continue
    star.x += star.vx
    star.y += star.vy
    star.vx *= 0.9
    star.vy *= 0.9
    star.life -= STAR_LIFE_DECAY
    if (star.life <= 0) {
      stars.splice(i, 1)
    }
  }
}

function shouldKeepAnimating(): boolean {
  return hasPointer || points.length > 0 || stars.length > 0
}

function tick(nowMs: number) {
  if (!running || !ctx) return

  if (hasPointer) {
    display.x += (target.x - display.x) * TRAIL_LERP
    display.y += (target.y - display.y) * TRAIL_LERP
    sampleTrailAt(display.x, display.y)
  }

  updateTrailPoints()
  updateStars()
  clearCanvas()

  if (shouldKeepAnimating()) {
    if (points.length >= 2) drawTrailRibbon()
    drawCoreGlow()
    drawStars(nowMs)
    rafId = requestAnimationFrame(tick)
    return
  }

  running = false
  cancelAnimationFrame(rafId)
}

function startLoop() {
  if (running) return
  running = true
  rafId = requestAnimationFrame(tick)
}

function stopLoop() {
  running = false
  cancelAnimationFrame(rafId)
  clearCanvas()
}

function onVisibilityChange() {
  if (document.hidden) {
    stopLoop()
    return
  }
  if (shouldKeepAnimating()) {
    startLoop()
  }
}

function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  ctx = canvas.getContext('2d', { alpha: true, desynchronized: true })
  if (!ctx) return
  resize()
  clearCanvas()
}

function teardown() {
  stopLoop()
  window.removeEventListener('resize', resize)
  window.removeEventListener('pointermove', onPointerMove)
  document.removeEventListener('pointerleave', onPointerLeave)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  ctx = null
  points.length = 0
  stars.length = 0
  hasPointer = false
}

onMounted(() => {
  if (!shouldEnable()) return
  colors = readThemeColors()
  initCanvas()
  window.addEventListener('resize', resize, { passive: true })
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  document.addEventListener('pointerleave', onPointerLeave, { passive: true })
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onUnmounted(teardown)
</script>

<template>
  <canvas ref="canvasRef" class="mouse-trail-canvas" />
</template>

<style scoped>
.mouse-trail-canvas {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  pointer-events: none;
}
</style>
