import type { PulseAccentPreset, PulseRoomMode } from '@/composables/pulse/pulseTypes'

export const ACCENT_PRESETS: Record<
  Exclude<PulseAccentPreset, 'custom'>,
  { night: string; day: string; label: string }
> = {
  iris: { night: '#C9A6FF', day: '#6E4CB8', label: '虹膜紫' },
  amber: { night: '#F0A36A', day: '#C47A3A', label: '窗灯琥珀' },
  rose: { night: '#E8A0B8', day: '#A85A78', label: '夜樱' },
  mint: { night: '#7EC8C0', day: '#3A8A82', label: '青磁' },
}

export const ROOM_BLUR_MIN = 0
export const ROOM_BLUR_MAX = 40
export const ROOM_VEIL_MIN = 0
export const ROOM_VEIL_MAX = 0.85

export function clampRoomBlur(n: number) {
  return Math.min(ROOM_BLUR_MAX, Math.max(ROOM_BLUR_MIN, Math.round(n)))
}

export function clampRoomVeil(n: number) {
  return Math.min(ROOM_VEIL_MAX, Math.max(ROOM_VEIL_MIN, Math.round(n * 100) / 100))
}

export function normalizeHex(input: string) {
  const raw = input.trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    return `#${raw
      .split('')
      .map((c) => c + c)
      .join('')
      .toUpperCase()}`
  }
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw.toUpperCase()}`
  return ''
}

export function hexToRgb(hex: string): [number, number, number] | null {
  const normalized = normalizeHex(hex)
  if (!normalized) return null
  const n = normalized.slice(1)
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)]
}

function rgbToken(hex: string) {
  const rgb = hexToRgb(hex)
  return rgb ? `${rgb[0]} ${rgb[1]} ${rgb[2]}` : '201 166 255'
}

function playFgFor(hex: string) {
  const rgb = hexToRgb(hex)
  if (!rgb) return '#0A0814'
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return lum > 0.45 ? '#0A0814' : '#F7F2FC'
}

export function resolveAccent(preset: PulseAccentPreset, hex: string, mode: PulseRoomMode) {
  if (preset !== 'custom') {
    const swatch = ACCENT_PRESETS[preset][mode]
    return { hex: swatch, rgb: rgbToken(swatch), playFg: playFgFor(swatch) }
  }
  const custom = normalizeHex(hex) || ACCENT_PRESETS.iris[mode]
  return { hex: custom, rgb: rgbToken(custom), playFg: playFgFor(custom) }
}

export function roomCssVars(opts: {
  mode: PulseRoomMode
  preset: PulseAccentPreset
  hex: string
  blur: number
  veil: number
}): Record<string, string> {
  const blur = clampRoomBlur(opts.blur)
  const veil = clampRoomVeil(opts.veil)
  const accent = resolveAccent(opts.preset, opts.hex, opts.mode)
  return {
    '--accent': accent.hex,
    '--accent-rgb': accent.rgb,
    '--petal-rgb': accent.rgb,
    '--mint': accent.hex,
    '--mint-rgb': accent.rgb,
    '--magenta': accent.hex,
    '--magenta-rgb': accent.rgb,
    '--yellow': accent.hex,
    '--play-fg': accent.playFg,
    '--blur': `${blur}px`,
    '--scale': String(1 + blur / 250),
    '--veil': String(veil),
    '--tint': `rgb(${accent.rgb} / 0.14)`,
  }
}
