<script setup lang="ts">
import { computed, inject } from 'vue'
import { studyContextKey } from '@/composables/study/useStudyContext'

const ctx = inject(studyContextKey)!

const breakdown = computed(() => ctx.rangeStats.value?.dailyBreakdown ?? [])

const maxFocus = computed(() =>
  Math.max(1, ...breakdown.value.map((d) => d.focusMinutes ?? 0)),
)
</script>

<template>
  <div class="study-range-chart">
    <div class="study-sidebar__section-label">近 7 日专注</div>
    <div v-if="breakdown.length" class="study-range-chart__bars">
      <div v-for="item in breakdown" :key="item.date" class="study-range-chart__bar-wrap">
        <div
          class="study-range-chart__bar"
          :style="{ height: `${((item.focusMinutes ?? 0) / maxFocus) * 100}%` }"
          :title="`${item.focusMinutes ?? 0} 分钟`"
        />
        <span class="study-range-chart__date">{{ item.date?.slice(5) }}</span>
      </div>
    </div>
    <div v-else class="study-empty" style="padding: 24px">暂无数据</div>

    <div v-if="ctx.rangeStats.value" class="study-range-summary">
      <span>完成任务 {{ ctx.rangeStats.value.completedTaskCount ?? 0 }} 个</span>
      <span>专注 {{ ctx.rangeStats.value.focusMinutes ?? 0 }} 分钟</span>
      <span>习惯打卡 {{ ctx.rangeStats.value.habitCheckCount ?? 0 }} 次</span>
    </div>
  </div>
</template>

<style scoped>
.study-range-summary {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 12px;
  font-size: 0.82rem;
  color: var(--color-text-secondary);
}
</style>
