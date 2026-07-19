<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { studyContextKey } from '@/composables/study/useStudyContext'

const props = defineProps<{
  habitId: number
}>()

const ctx = inject(studyContextKey)!
const dates = ref<string[]>([])
const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth() + 1)

const weekLabels = ['日', '一', '二', '三', '四', '五', '六']

async function load() {
  dates.value = await ctx.getHabitCalendarDates(props.habitId, year.value, month.value)
}

watch(
  () => props.habitId,
  () => load(),
  { immediate: true },
)

const checkedSet = computed(() => new Set(dates.value))

const cells = computed(() => {
  const first = new Date(year.value, month.value - 1, 1)
  const lastDay = new Date(year.value, month.value, 0).getDate()
  const startPad = first.getDay()
  const result: { day: number | null; checked: boolean }[] = []
  for (let i = 0; i < startPad; i++) result.push({ day: null, checked: false })
  for (let d = 1; d <= lastDay; d++) {
    const key = `${year.value}-${String(month.value).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    result.push({ day: d, checked: checkedSet.value.has(key) })
  }
  return result
})

function prevMonth() {
  if (month.value === 1) {
    month.value = 12
    year.value -= 1
  } else {
    month.value -= 1
  }
  load()
}

function nextMonth() {
  if (month.value === 12) {
    month.value = 1
    year.value += 1
  } else {
    month.value += 1
  }
  load()
}
</script>

<template>
  <div class="study-habit-calendar-wrap">
    <div class="study-habit-calendar-nav">
      <a-button size="small" type="text" class="cal-nav-btn cal-nav-btn--prev" @click="prevMonth">
        <ChevronLeft :size="16" />
      </a-button>
      <span>{{ year }}年{{ month }}月</span>
      <a-button size="small" type="text" class="cal-nav-btn cal-nav-btn--next" @click="nextMonth">
        <ChevronRight :size="16" />
      </a-button>
    </div>
    <div class="study-habit-calendar">
      <div v-for="w in weekLabels" :key="w" class="study-habit-calendar__cell study-habit-calendar__cell--head">
        {{ w }}
      </div>
      <div
        v-for="(cell, idx) in cells"
        :key="idx"
        class="study-habit-calendar__cell"
        :class="{ 'study-habit-calendar__cell--checked': cell.checked && cell.day }"
      >
        {{ cell.day ?? '' }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.study-habit-calendar-wrap {
  margin-top: 8px;
}

.study-habit-calendar-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.82rem;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
}

.cal-nav-btn :deep(svg) {
  transition: transform var(--transition-fast);
}
.cal-nav-btn--prev:hover :deep(svg) {
  transform: translateX(-2px);
}
.cal-nav-btn--next:hover :deep(svg) {
  transform: translateX(2px);
}
@media (prefers-reduced-motion: reduce) {
  .cal-nav-btn :deep(svg) {
    transition: none;
  }
  .cal-nav-btn:hover :deep(svg) {
    transform: none;
  }
}
</style>
