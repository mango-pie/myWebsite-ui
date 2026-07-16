<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import { studyContextKey } from '@/composables/study/useStudyContext'
import { FOCUS_STATUS } from '@/constants/study'

const ctx = inject(studyContextKey)!

const selectedMinutes = ref(ctx.studySettings.value.focusDefaultMinutes)

watch(
  () => ctx.studySettings.value.focusDefaultMinutes,
  (m) => {
    if (!ctx.activeFocus.value) selectedMinutes.value = m
  },
)

const session = computed(() => ctx.activeFocus.value)
const isRunning = computed(() => session.value?.status === FOCUS_STATUS.RUNNING)
const isPaused = computed(() => session.value?.status === FOCUS_STATUS.PAUSED)
const hasActive = computed(
  () => session.value && (isRunning.value || isPaused.value),
)

const displayTime = computed(() => {
  const sec = ctx.remainingSeconds.value
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const progress = computed(() => {
  const planned = (session.value?.plannedMinutes ?? selectedMinutes.value) * 60
  if (!planned) return 0
  return 1 - ctx.remainingSeconds.value / planned
})

const statusLabel = computed(() => {
  if (!hasActive.value) return '准备专注'
  if (isPaused.value) return '已暂停'
  return session.value?.taskTitle ? `专注：${session.value.taskTitle}` : '专注中'
})

async function start() {
  await ctx.startFocusSession(undefined, selectedMinutes.value)
}

async function pause() {
  await ctx.pauseFocusSession()
}

async function resume() {
  await ctx.resumeFocusSession()
}

async function complete() {
  await ctx.completeFocusSession()
}

async function abandon() {
  await ctx.abandonFocusSession()
}
</script>

<template>
  <div class="study-pomodoro">
    <div class="study-pomodoro__ring" :style="{ '--progress': progress }">
      <div class="study-pomodoro__ring-inner">
        <div class="study-pomodoro__time">{{ displayTime }}</div>
        <div class="study-pomodoro__label">{{ statusLabel }}</div>
      </div>
    </div>

    <div v-if="!hasActive" class="study-pomodoro__presets">
      <a-button
        v-for="m in ctx.focusPresets.value"
        :key="m"
        size="small"
        :type="selectedMinutes === m ? 'primary' : 'default'"
        @click="selectedMinutes = m"
      >
        {{ m }} 分钟
      </a-button>
    </div>

    <div class="study-pomodoro__actions">
      <template v-if="!hasActive">
        <a-button type="primary" @click="start">开始专注</a-button>
      </template>
      <template v-else>
        <a-button v-if="isRunning" @click="pause">暂停</a-button>
        <a-button v-if="isPaused" type="primary" @click="resume">继续</a-button>
        <a-button type="primary" @click="complete">完成</a-button>
        <a-button danger @click="abandon">放弃</a-button>
      </template>
    </div>

    <div v-if="ctx.focusHistory.value.length" class="study-focus-history">
      <div class="study-sidebar__section-label">最近专注</div>
      <div
        v-for="item in ctx.focusHistory.value.slice(0, 5)"
        :key="item.id"
        class="study-focus-history__item"
      >
        <span>{{ item.taskTitle || '自由专注' }}</span>
        <span>{{ Math.round((item.actualSeconds ?? 0) / 60) }} 分钟</span>
      </div>
    </div>
  </div>
</template>
