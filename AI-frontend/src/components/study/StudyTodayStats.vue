<script setup lang="ts">
import { computed, inject } from 'vue'
import { studyContextKey } from '@/composables/study/useStudyContext'

const ctx = inject(studyContextKey)!

const stats = computed(() => ctx.todayStats.value)

const cards = computed(() => {
  const s = stats.value
  if (!s) return []
  return [
    { label: '今日任务', num: `${s.completedTasks ?? 0}/${s.totalTasks ?? 0}` },
    { label: '逾期', num: s.overdueTasks ?? 0 },
    { label: '专注(分)', num: s.focusMinutes ?? 0 },
    { label: '习惯打卡', num: `${s.habitsChecked ?? 0}/${s.habitsTotal ?? 0}` },
  ]
})
</script>

<template>
  <div class="study-stats-grid">
    <div v-for="item in cards" :key="item.label" class="study-stat-card">
      <div class="study-stat-card__num">{{ item.num }}</div>
      <div class="study-stat-card__label">{{ item.label }}</div>
    </div>
  </div>
  <p v-if="stats?.date" class="study-stats-date">统计日期：{{ stats.date }}</p>
</template>

<style scoped>
.study-stats-date {
  margin: 12px 0 0;
  font-size: 0.78rem;
  color: var(--color-text-muted);
  text-align: center;
}
</style>
