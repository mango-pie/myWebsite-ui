<script setup lang="ts">
import {
  PRIORITY_MAP,
  TASK_STATUS,
  SOURCE_TYPE_BLOG,
  isTaskOverdue,
  formatStudyDate,
} from '@/constants/study'

defineProps<{
  task: API.StudyTaskVO
}>()

const emit = defineEmits<{
  toggle: [done: boolean]
  open: []
}>()

function priorityColor(priority?: number) {
  return PRIORITY_MAP[priority ?? 0]?.color ?? 'transparent'
}
</script>

<template>
  <div
    class="study-task-item"
    :class="{ 'study-task-item--done': task.status === TASK_STATUS.DONE }"
    @click="emit('open')"
  >
    <span
      class="study-task-item__priority"
      :style="{ background: priorityColor(task.priority) }"
    />
    <a-checkbox
      :checked="task.status === TASK_STATUS.DONE"
      @click.stop
      @update:checked="(checked: boolean) => emit('toggle', checked)"
    />
    <div class="study-task-item__main">
      <div class="study-task-item__title">{{ task.title }}</div>
      <div class="study-task-item__meta">
        <span v-if="task.isToday === 1" class="study-task-item__tag study-task-item__tag--today">今日</span>
        <span v-if="isTaskOverdue(task)" class="study-task-item__tag study-task-item__tag--overdue">逾期</span>
        <span v-if="task.dueDate" class="study-task-item__tag">{{ formatStudyDate(task.dueDate) }}</span>
        <span v-if="task.sourceType === SOURCE_TYPE_BLOG" class="study-task-item__tag study-task-item__tag--blog">博客草稿</span>
        <span v-if="task.listName && task.listName !== '收集箱'" class="study-task-item__tag">{{ task.listName }}</span>
      </div>
    </div>
  </div>
</template>
