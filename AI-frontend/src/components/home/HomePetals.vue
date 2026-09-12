<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { HOME_STAGE_H, HOME_STAGE_W } from '@/composables/useHomeStageScale'
import type { HomeSeason } from '@/composables/useHomeTheme'

const props = defineProps<{
  season: HomeSeason
  enabled: boolean
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)

const SEASON_CFG = {
  spring: { count: 26, kind: 'petal' as const, palette: ['#ffc2d4', '#ffd9e4', '#ffabc5', '#ffe3ec'] },
  summer: {
    count: 64,
    kind: 'rain' as const,
    palette: ['rgba(150,200,235,.55)', 'rgba(170,215,240,.45)', 'rgba(190,225,245,.4)'],
  },
  autumn: { count: 22, kind: 'leaf' as const, palette: ['#f0a35e', '#e07a5f', '#d9a441', '#cd6f4a'] },
  winter: { count: 54, kind: 'snow' as const, palette: ['#ffffff', '#f4f9ff', '#e8f1fb'] },
}

type Particle = {
  x: number
  y: number
  color: string
  sway: number
  len?: number
  vy: number
  vx: number
  r?: number
  vr?: number
  rot?: number
}

let parts: Particle[] = []
let wind = 0
let lastMouseX: number | null = null
let rafId = 0
let ctx: CanvasRenderingContext2D | null = null

function spawn(cfg: (typeof SEASON_CFG)[HomeSeason], anyY: boolean): Particle {
  const base = {
    x: Math.random() * HOME_STAGE_W,
    y: anyY ? Math.random() * HOME_STAGE_H : -40,
    color: cfg.palette[Math.floor(Math.random() * cfg.palette.length)],
    sway: Math.random() * Math.PI * 2,
  }
  if (cfg.kind === 'rain') {
    return { ...base, len: 14 + Math.random() * 14, vy: 7 + Math.random() * 4, vx: -1.2 - Math.random() * 0.8 }
  }
  if (cfg.kind === 'snow') {
    return {
      ...base,
      r: 1.8 + Math.random() * 2.8,
      vy: 0.4 + Math.random() * 0.7,
      vx: -0.2 + Math.random() * 0.4,
      vr: 0,
      rot: 0,
    }
  }
  return {
    ...base,
    r: 6 + Math.random() * 8,
    vy: 0.5 + Math.random() * 1.1,
    vx: -0.3 + Math.random() * 0.6,
    rot: Math.random() * Math.PI * 2,
    vr: -0.02 + Math.random() * 0.04,
  }
}

function rebuild() {
  const cfg = SEASON_CFG[props.season]
  parts = Array.from({ length: cfg.count }, () => spawn(cfg, true))
}

function draw() {
  if (!ctx) return
  ctx.clearRect(0, 0, HOME_STAGE_W, HOME_STAGE_H)
  if (props.enabled) {
    const cfg = SEASON_CFG[props.season]
    wind *= 0.94
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]
      p.sway += 0.02
      if (cfg.kind === 'rain') {
        p.x += p.vx
        p.y += p.vy
        ctx.strokeStyle = p.color
        ctx.lineWidth = 1.6
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(p.x - p.vx * 1.8, p.y - (p.len || 14))
        ctx.stroke()
      } else if (cfg.kind === 'snow') {
        p.x += p.vx + Math.sin(p.sway) * 0.7 + wind * 0.5
        p.y += p.vy
        ctx.fillStyle = p.color
        ctx.globalAlpha = 0.92
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r || 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      } else {
        p.x += p.vx + Math.sin(p.sway) * 0.6 + wind
        p.y += p.vy
        p.rot = (p.rot || 0) + (p.vr || 0) + wind * 0.01
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.color
        ctx.globalAlpha = 0.9
        const r = p.r || 6
        ctx.beginPath()
        ctx.moveTo(0, -r)
        ctx.quadraticCurveTo(r * 0.9, -r * 0.3, 0, r)
        ctx.quadraticCurveTo(-r * 0.9, -r * 0.3, 0, -r)
        ctx.fill()
        ctx.restore()
        ctx.globalAlpha = 1
      }
      if (p.y > HOME_STAGE_H + 40 || p.x < -60 || p.x > HOME_STAGE_W + 60) {
        parts[i] = spawn(cfg, false)
      }
    }
  }
  rafId = requestAnimationFrame(draw)
}

const onMouseMove = (e: MouseEvent) => {
  if (lastMouseX !== null) wind += (e.clientX - lastMouseX) * 0.012
  lastMouseX = e.clientX
  wind = Math.max(-3, Math.min(3, wind))
}

onMounted(() => {
  const cv = canvasRef.value
  if (!cv) return
  cv.width = HOME_STAGE_W
  cv.height = HOME_STAGE_H
  ctx = cv.getContext('2d')
  rebuild()
  rafId = requestAnimationFrame(draw)
  window.addEventListener('mousemove', onMouseMove)
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
  window.removeEventListener('mousemove', onMouseMove)
})

watch(
  () => props.season,
  () => rebuild(),
)
</script>

<template>
  <canvas id="petals" ref="canvasRef" />
</template>
