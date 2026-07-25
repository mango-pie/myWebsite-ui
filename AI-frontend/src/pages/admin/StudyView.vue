<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useStudyContext } from '@/composables/study/useStudyContext'
import StudySidebar from '@/components/study/StudySidebar.vue'
import StudyTaskPanel from '@/components/study/StudyTaskPanel.vue'
import StudyToolPanel from '@/components/study/StudyToolPanel.vue'
import StudyTaskDetailDrawer from '@/components/study/StudyTaskDetailDrawer.vue'
import '@/assets/admin-theme.css'
import '@/assets/study-workspace.css'

const ctx = useStudyContext()

const mobileLayoutClass = computed(() => `study-layout--mobile-${ctx.mobileTab.value}`)

const mobileOptions = [
  { label: '任务', value: 'tasks' },
  { label: '专注', value: 'focus' },
  { label: '习惯', value: 'habits' },
  { label: '统计', value: 'stats' },
]

onMounted(() => {
  ctx.bootstrap(true)
})
</script>

<template>
  <div id="studyView" class="study-page admin-theme-page">
    <header class="study-page__header">
      <h1 class="study-page__title">学习</h1>
      <p class="study-page__subtitle">任务 · 专注 · 习惯，像 TickTick 一样管理你的学习节奏</p>
    </header>

    <a-result
      v-if="ctx.forbidden.value"
      status="403"
      title="无权访问"
      sub-title="学习仅 administrator 角色可用"
    />

    <a-spin v-else :spinning="ctx.loading.value">
      <div class="study-mobile-tabs">
        <a-segmented v-model:value="ctx.mobileTab.value" block :options="mobileOptions" />
      </div>

      <div class="study-layout" :class="mobileLayoutClass">
        <StudySidebar />
        <StudyTaskPanel />
        <StudyToolPanel />
      </div>
    </a-spin>

    <StudyTaskDetailDrawer />
  </div>
</template>
