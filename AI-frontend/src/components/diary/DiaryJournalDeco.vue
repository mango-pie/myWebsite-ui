<script setup lang="ts">
import { computed, ref } from 'vue'
import { message } from 'ant-design-vue'
import {
  MOOD_HEX,
  MO_SHORT,
  SEASON_LINE,
  moodLitDots,
  popCraftAnim,
  seasonOfMonth,
} from '@/utils/diaryCraft'
import { MOOD_OPTIONS, todayDateString } from '@/utils/diaryFormat'

const props = defineProps<{
  date: string
  entry: API.DiaryEntryVO | null
}>()

const SEASONS = [
  { id: 0, label: '春' },
  { id: 1, label: '夏' },
  { id: 2, label: '秋' },
  { id: 3, label: '冬' },
] as const

const overrideSeason = ref<number | null>(null)

const dt = computed(() => new Date(`${props.date}T12:00:00`))
const naturalSeason = computed(() => seasonOfMonth(dt.value.getMonth()))
const activeSeason = computed(() => (overrideSeason.value != null ? overrideSeason.value : naturalSeason.value))

const stampM = computed(() => MO_SHORT[dt.value.getMonth()])
const stampD = computed(() => String(dt.value.getDate()).padStart(2, '0'))
const stampY = computed(() => String(dt.value.getFullYear()))

const ticketText = computed(() => {
  if (props.entry?.title?.trim()) return props.entry.title.trim()
  const md = `${String(dt.value.getMonth() + 1).padStart(2, '0')}.${stampD.value}`
  return `${md} · 空白票根`
})

const mood = computed(() => props.entry?.mood)
const moodHex = computed(() => (mood.value ? MOOD_HEX[mood.value] : ''))
const moodLabel = computed(() => MOOD_OPTIONS.find((x) => x.value === mood.value)?.label ?? '')
const waxChar = computed(() => (moodLabel.value ? moodLabel.value.slice(0, 1) : '空'))
const lit = computed(() => moodLitDots(mood.value))
const stampStyle = computed(() => {
  if (!moodHex.value) return { opacity: '0.55' }
  return { opacity: '0.9', borderColor: moodHex.value, color: moodHex.value }
})
const waxStyle = computed(() => {
  if (!moodHex.value) return {}
  return {
    background: `radial-gradient(circle at 35% 30%, #fff8, ${moodHex.value} 55%, #9a6fb8)`,
    transform: 'rotate(12deg) scale(1.05)',
  }
})
const labelA = computed(() => moodLabel.value || '空白页')
const labelB = computed(() => {
  if (props.entry) return '已落笔'
  return props.date === todayDateString() ? '写今日' : '可补记'
})

function toast(text: string) {
  message.info({ content: text, duration: 1.2 })
}

function onSeason(id: number) {
  overrideSeason.value = id
  toast(SEASON_LINE[id] || SEASONS[id].label)
}

function bump(e: Event, cls: string, ms: number, msg?: string) {
  popCraftAnim(e.currentTarget as HTMLElement, cls, ms)
  if (msg) toast(msg)
}
</script>

<template>
  <div class="journal-deco glass" aria-label="手账装饰，可点击">
    <span class="tape sakura" />
    <h3>手账页</h3>

    <div class="jd-bookmarks">
      <button
        v-for="s in SEASONS"
        :key="s.id"
        type="button"
        class="jd-tab craft-hit"
        :class="{ lit: activeSeason === s.id, dim: activeSeason !== s.id }"
        :title="s.label"
        @click="onSeason(s.id)"
      >
        {{ s.label }}
      </button>
    </div>

    <div class="jd-craft-row">
      <div
        class="jd-open-book craft-hit"
        role="button"
        tabindex="0"
        title="翻一页"
        @click="bump($event, 'is-flip', 550, '翻过一页')"
        @keydown.enter="bump($event, 'is-flip', 550, '翻过一页')"
      >
        <div class="jd-page" />
        <div class="jd-page" />
      </div>
      <div
        class="jd-pressed-flower craft-hit"
        role="button"
        tabindex="0"
        title="压花"
        @click="bump($event, 'is-flutter', 550, '压花轻轻抖了抖')"
        @keydown.enter="bump($event, 'is-flutter', 550, '压花轻轻抖了抖')"
      />
      <div
        class="jd-date-stamp craft-hit"
        role="button"
        tabindex="0"
        title="日期章"
        :style="stampStyle"
        @click="bump($event, 'is-spin', 500, '日期章')"
        @keydown.enter="bump($event, 'is-spin', 500, '日期章')"
      >
        <div>
          <div class="m">{{ stampM }}</div>
          <div class="d">{{ stampD }}</div>
          <div class="y">{{ stampY }}</div>
        </div>
      </div>
    </div>

    <div class="jd-row">
      <div
        class="jd-ticket craft-hit"
        role="button"
        tabindex="0"
        title="票根"
        @click="bump($event, 'is-lift', 450, ticketText)"
        @keydown.enter="bump($event, 'is-lift', 450, ticketText)"
      >
        <div class="k">TICKET · DAY</div>
        <div class="v">{{ ticketText }}</div>
      </div>
      <div
        class="jd-wax craft-hit"
        role="button"
        tabindex="0"
        title="火漆"
        :style="waxStyle"
        @click="bump($event, 'is-press', 550, '火漆按下')"
        @keydown.enter="bump($event, 'is-press', 550, '火漆按下')"
      >
        {{ waxChar }}
      </div>
    </div>

    <div
      class="jd-mood-ribbon craft-hit"
      role="button"
      tabindex="0"
      title="心情点"
      @click="toast(moodLabel ? `情绪条 · ${moodLabel}` : '空白日 · 还没落心情')"
      @keydown.enter="toast(moodLabel ? `情绪条 · ${moodLabel}` : '空白日 · 还没落心情')"
    >
      <span>MOOD</span>
      <span class="dots">
        <i
          v-for="i in 5"
          :key="i"
          class="dot"
          :class="{ on: i <= lit }"
          :style="
            i <= lit && moodHex
              ? { background: moodHex, borderColor: moodHex }
              : undefined
          "
        />
      </span>
    </div>

    <div class="jd-labels">
      <button
        type="button"
        class="jd-label craft-hit"
        @click="bump($event, 'is-pop', 400)"
      >
        {{ labelA }}
      </button>
      <button
        type="button"
        class="jd-label b craft-hit"
        @click="bump($event, 'is-pop', 400)"
      >
        {{ labelB }}
      </button>
    </div>

    <div class="jd-washi" />
    <div class="jd-tools">
      <div
        class="jd-clip craft-hit"
        role="button"
        tabindex="0"
        title="回形针"
        @click="bump($event, 'is-wiggle', 450, '回形针')"
        @keydown.enter="bump($event, 'is-wiggle', 450, '回形针')"
      />
      <div
        class="jd-pen craft-hit"
        role="button"
        tabindex="0"
        title="钢笔"
        @click="bump($event, 'is-write', 500, '钢笔想写字了')"
        @keydown.enter="bump($event, 'is-write', 500, '钢笔想写字了')"
      />
    </div>
  </div>
</template>
