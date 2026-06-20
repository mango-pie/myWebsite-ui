<script setup lang="ts">
import { computed, inject, reactive, watch } from 'vue'
import { DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons-vue'
import { Modal } from 'ant-design-vue'
import { studyContextKey } from '@/composables/study/useStudyContext'
import { PRIORITY_MAP } from '@/constants/study'
import StudyChecklistEditor from './StudyChecklistEditor.vue'

const ctx = inject(studyContextKey)!

const open = computed({
  get: () => !!ctx.selectedTask.value,
  set: (v) => {
    if (!v) ctx.closeTaskDetail()
  },
})

const form = reactive({
  title: '',
  content: '',
  priority: 0,
  isToday: false,
  listId: undefined as number | undefined,
  dueDate: '',
})

function toDatetimeLocalValue(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromDatetimeLocalValue(local: string): string | undefined {
  if (!local) return undefined
  const d = new Date(local)
  if (Number.isNaN(d.getTime())) return undefined
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`
}

watch(
  () => ctx.selectedTask.value,
  (task) => {
    if (!task) return
    form.title = task.title || ''
    form.content = task.content || ''
    form.priority = task.priority ?? 0
    form.isToday = task.isToday === 1
    form.listId = task.listId
    form.dueDate = toDatetimeLocalValue(task.dueDate)
  },
  { immediate: true },
)

const priorityOptions = Object.entries(PRIORITY_MAP).map(([value, { label }]) => ({
  value: Number(value),
  label,
}))

const listOptions = computed(() =>
  ctx.lists.value.map((l) => ({ value: l.id, label: l.name })),
)

async function save() {
  const task = ctx.selectedTask.value
  if (!task?.id) return
  await ctx.updateTaskFields({
    id: task.id,
    title: form.title.trim(),
    content: form.content,
    priority: form.priority,
    isToday: form.isToday,
    listId: form.listId,
    dueDate: fromDatetimeLocalValue(form.dueDate),
  })
}

function handleDelete() {
  const id = ctx.selectedTask.value?.id
  if (!id) return
  Modal.confirm({
    title: '删除此任务？',
    okType: 'danger',
    onOk: () => ctx.deleteTaskById(id),
  })
}

async function startFocus() {
  const id = ctx.selectedTask.value?.id
  await ctx.startFocusSession(id, 25)
  ctx.closeTaskDetail()
  ctx.mobileTab.value = 'focus'
}
</script>

<template>
  <a-drawer
    v-model:open="open"
    :title="form.title || '任务详情'"
    placement="right"
    width="400"
    class="study-detail-drawer"
  >
    <a-form layout="vertical">
      <a-form-item label="标题">
        <a-input v-model:value="form.title" @blur="save" />
      </a-form-item>
      <a-form-item label="备注">
        <a-textarea v-model:value="form.content" :rows="4" @blur="save" />
      </a-form-item>
      <a-form-item label="清单">
        <a-select v-model:value="form.listId" :options="listOptions" @change="save" />
      </a-form-item>
      <a-form-item label="优先级">
        <a-select v-model:value="form.priority" :options="priorityOptions" @change="save" />
      </a-form-item>
      <a-form-item label="截止日期">
        <input
          v-model="form.dueDate"
          type="datetime-local"
          class="study-datetime-input"
          @change="save"
        />
      </a-form-item>
      <a-form-item>
        <a-checkbox v-model:checked="form.isToday" @change="save">标记为今天要做</a-checkbox>
      </a-form-item>
    </a-form>

    <StudyChecklistEditor
      :items="ctx.selectedTask.value?.checklistItems"
      @add="(title) => ctx.addChecklistItem(ctx.selectedTask.value!.id!, title)"
      @toggle="(item, done) => ctx.toggleChecklistItem(item, done)"
      @delete="(id) => ctx.deleteChecklistItem(id)"
    />

    <div class="study-detail-actions">
      <a-button type="primary" @click="startFocus">
        <PlayCircleOutlined /> 开始专注 25 分钟
      </a-button>
      <a-button danger @click="handleDelete">
        <DeleteOutlined /> 删除任务
      </a-button>
    </div>
  </a-drawer>
</template>

<style scoped>
.study-datetime-input {
  width: 100%;
  padding: 6px 10px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.05);
  color: var(--color-text-primary);
}

.study-detail-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}
</style>
