<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const THEMES = ['t-sakura', 't-mint', 't-violet', 't-sun'] as const

type ShelfItem = {
  id: number
  vol: number
  title: string
  theme: (typeof THEMES)[number]
}

type BookSlot = ShelfItem & {
  key: string
  cls: string
}

const props = defineProps<{
  posts: API.BlogPostVO[]
}>()

const emit = defineEmits<{
  open: [id: number]
}>()

const shelfIdx = ref(0)
const flipping = ref(false)
const books = ref<BookSlot[]>([])
const stageRef = ref<HTMLElement | null>(null)

const shelf = computed(() =>
  (props.posts || []).slice(0, 6).map((p, i) => ({
    id: p.id!,
    vol: 26 - i,
    title: p.title || '无标题',
    theme: THEMES[i % THEMES.length],
  })),
)

const cal = computed(() => {
  const d = new Date()
  const mo = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  const weekCN = ['日', '一', '二', '三', '四', '五', '六']
  return {
    mo: mo[d.getMonth()],
    dy: d.getDate(),
    wk: '周' + weekCN[d.getDay()],
  }
})

const front = computed(() => shelf.value[shelfIdx.value] || null)

const footTitle = computed(() => {
  const t = front.value?.title || ''
  return t.length > 10 ? t.slice(0, 10) + '…' : t
})

const footVol = computed(() => (front.value ? `Vol.${front.value.vol}` : 'Vol.—'))

const renderStatic = () => {
  const list = shelf.value
  if (!list.length) {
    books.value = []
    return
  }
  const n = list.length
  const idx = Math.min(shelfIdx.value, n - 1)
  shelfIdx.value = idx
  const frontItem = list[idx]!
  const mid = n >= 2 ? list[(idx + 1) % n]! : null
  const back = n >= 3 ? list[(idx + 2) % n]! : null
  const next: BookSlot[] = []
  if (back) next.push({ ...back, key: `b-${back.id}-${idx}`, cls: 'is-back' })
  if (mid) next.push({ ...mid, key: `m-${mid.id}-${idx}`, cls: 'is-mid' })
  next.push({ ...frontItem, key: `f-${frontItem.id}-${idx}`, cls: 'is-front' })
  books.value = next
}

watch(
  () => props.posts,
  () => {
    shelfIdx.value = 0
    renderStatic()
  },
  { immediate: true },
)

const flip = (dir: 1 | -1, side: 'left' | 'right' = dir > 0 ? 'left' : 'right') => {
  if (flipping.value || shelf.value.length < 2) return
  flipping.value = true

  const list = shelf.value
  const n = list.length
  const exitSide = side === 'right' ? 'right' : 'left'
  const nextIdx = (shelfIdx.value + dir + n) % n
  const incoming = list[nextIdx]
  if (!incoming) {
    flipping.value = false
    return
  }

  books.value = books.value.map((b) => {
    if (b.cls === 'is-front') {
      return {
        ...b,
        cls: dir > 0 ? `is-exit-side-${exitSide}` : 'is-exit-down',
      }
    }
    if (b.cls === 'is-mid' || b.cls === 'is-back') {
      return { ...b, cls: `${b.cls} is-dim` }
    }
    return b
  })

  const enterCls = dir > 0 ? 'is-enter-up' : `is-enter-side-${exitSide}`
  books.value = [
    ...books.value,
    {
      id: incoming.id,
      vol: incoming.vol,
      title: incoming.title,
      theme: incoming.theme,
      key: `in-${incoming.id}-${Date.now()}`,
      cls: enterCls,
    },
  ]

  shelfIdx.value = nextIdx

  window.setTimeout(() => {
    renderStatic()
    flipping.value = false
  }, 600)
}

const openFront = () => {
  if (front.value?.id) emit('open', front.value.id)
}

/* drag / swipe + double-tap open */
let x0 = 0
let dragging = false
let moved = false
let lastTap = 0

const onPointerDown = (e: PointerEvent) => {
  const t = e.target as HTMLElement
  if (!t.closest('.mag-book.is-front')) return
  dragging = true
  moved = false
  x0 = e.clientX
  stageRef.value?.setPointerCapture(e.pointerId)
}

const onPointerMove = (e: PointerEvent) => {
  if (!dragging) return
  if (Math.abs(e.clientX - x0) > 12) moved = true
}

const onPointerUp = (e: PointerEvent) => {
  if (!dragging) return
  dragging = false
  const dx = e.clientX - x0
  if (moved && Math.abs(dx) > 40) {
    if (dx < 0) flip(1, 'left')
    else flip(-1, 'right')
    return
  }
  const now = Date.now()
  if (now - lastTap < 320) openFront()
  lastTap = now
}

const onKeydown = (e: KeyboardEvent) => {
  const t = e.target as HTMLElement | null
  if (t?.closest?.('input, textarea, select, [contenteditable="true"]')) return
  if (e.key === 'ArrowLeft') flip(-1, 'left')
  if (e.key === 'ArrowRight') flip(1, 'right')
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <aside class="deck" id="issueDeck">
    <div class="deck-seal" title="本期印章">樱</div>
    <div class="deck-cal">
      <div class="mo">{{ cal.mo }}</div>
      <div class="dy font-display">{{ cal.dy }}</div>
      <div class="wk">{{ cal.wk }}</div>
    </div>
    <div class="mag-stack">
      <div class="mag-dots" aria-hidden="true">
        <i v-for="(_, i) in shelf" :key="i" :class="{ on: i === shelfIdx }" />
      </div>
      <button
        type="button"
        class="mag-nav prev"
        aria-label="上一本"
        :disabled="shelf.length < 2 || flipping"
        @click="flip(-1, 'left')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
          <path d="M15 6l-6 6 6 6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        class="mag-nav next"
        aria-label="下一本"
        :disabled="shelf.length < 2 || flipping"
        @click="flip(1, 'right')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
          <path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <div
        ref="stageRef"
        class="mag-stage"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <button
          v-for="b in books"
          :key="b.key"
          type="button"
          class="mag-book"
          :class="[b.theme, b.cls]"
          :tabindex="b.cls === 'is-front' ? 0 : -1"
          :aria-label="`Vol.${b.vol}`"
        >
          <span class="washi" aria-hidden="true" />
          <span class="mast">J O U R N A L</span>
          <span class="vol font-display">{{ b.vol }}</span>
          <span class="latest"><b>本期封面故事</b><span>{{ b.title }}</span></span>
        </button>
      </div>
      <div class="mag-hint">拖拽翻页 · 双击打开</div>
    </div>
    <svg class="deck-plane" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M2.5 12.5L21 3l-7.5 18-2.2-7.3L2.5 12.5z" />
    </svg>
    <div
      class="deck-foot"
      role="button"
      tabindex="0"
      @click="openFront"
      @keydown.enter="openFront"
    >
      <div>
        <div class="k">{{ footTitle || '正在翻阅' }}</div>
        <div class="v font-display">{{ footVol }}</div>
      </div>
      <span class="go">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
    </div>
  </aside>
</template>
