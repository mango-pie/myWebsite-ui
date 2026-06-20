<script setup lang="ts">
import { computed, inject } from 'vue'
import { studyContextKey } from '@/composables/study/useStudyContext'
import StudyPomodoro from './StudyPomodoro.vue'
import StudyTodayStats from './StudyTodayStats.vue'
import StudyHabitPanel from './StudyHabitPanel.vue'
import StudyRangeChart from './StudyRangeChart.vue'

const ctx = inject(studyContextKey)!

const toolTab = computed({
  get: () => {
    const m = ctx.mobileTab.value
    if (m === 'focus' || m === 'habits' || m === 'stats') return m
    return 'focus'
  },
  set: (v: string) => {
    if (v === 'focus' || v === 'habits' || v === 'stats') {
      ctx.mobileTab.value = v
    }
  },
})
</script>

<template>
  <aside class="study-panel study-panel--tools">
    <a-tabs v-model:active-key="toolTab" class="study-tool-tabs">
      <a-tab-pane key="focus" tab="专注">
        <div class="study-tool-content">
          <StudyPomodoro />
        </div>
      </a-tab-pane>
      <a-tab-pane key="habits" tab="习惯">
        <div class="study-tool-content">
          <StudyHabitPanel />
        </div>
      </a-tab-pane>
      <a-tab-pane key="stats" tab="统计">
        <div class="study-tool-content">
          <StudyTodayStats />
          <StudyRangeChart />
        </div>
      </a-tab-pane>
    </a-tabs>
  </aside>
</template>

<style scoped>
.study-panel--tools :deep(.ant-tabs-content) {
  max-height: calc(100vh - 220px);
  overflow: auto;
}
</style>
