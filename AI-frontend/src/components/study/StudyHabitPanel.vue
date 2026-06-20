<script setup lang="ts">
import { inject, ref } from 'vue'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import { Modal, message } from 'ant-design-vue'
import { studyContextKey } from '@/composables/study/useStudyContext'
import StudyHabitCalendar from './StudyHabitCalendar.vue'

const ctx = inject(studyContextKey)!

const modalOpen = ref(false)
const editing = ref<API.StudyHabitVO | null>(null)
const expandedId = ref<number>()
const form = ref({ title: '', color: '#e879a9', description: '' })

function openAdd() {
  editing.value = null
  form.value = { title: '', color: '#e879a9', description: '' }
  modalOpen.value = true
}

function openEdit(habit: API.StudyHabitVO, e: Event) {
  e.stopPropagation()
  editing.value = habit
  form.value = {
    title: habit.title || '',
    color: habit.color || '#e879a9',
    description: habit.description || '',
  }
  modalOpen.value = true
}

async function submit() {
  const title = form.value.title.trim()
  if (!title) {
    message.warning('请输入习惯名称')
    return
  }
  if (editing.value?.id) {
    await ctx.updateHabitFields({
      id: editing.value.id,
      title,
      color: form.value.color,
      description: form.value.description,
    })
  } else {
    await ctx.addHabitItem(title, form.value.color)
  }
  modalOpen.value = false
}

function handleDelete(habit: API.StudyHabitVO) {
  if (!habit.id) return
  Modal.confirm({
    title: `删除习惯「${habit.title}」？`,
    okType: 'danger',
    onOk: () => ctx.deleteHabitById(habit.id!),
  })
}

function toggleExpand(id?: number) {
  expandedId.value = expandedId.value === id ? undefined : id
}
</script>

<template>
  <a-spin :spinning="ctx.habitsLoading.value">
    <div class="study-habit-toolbar">
      <a-button size="small" type="dashed" @click="openAdd">
        <PlusOutlined /> 新建习惯
      </a-button>
    </div>

    <div v-if="ctx.habits.value.length" class="study-habit-grid">
      <div v-for="habit in ctx.habits.value" :key="habit.id" class="study-habit-card">
        <div class="study-habit-card__head">
          <span class="study-habit-card__dot" :style="{ background: habit.color || '#e879a9' }" />
          <span class="study-habit-card__title">{{ habit.title }}</span>
          <a-button
            size="small"
            :type="habit.checkedToday ? 'primary' : 'default'"
            @click="ctx.toggleHabitCheck(habit)"
          >
            {{ habit.checkedToday ? '已打卡' : '打卡' }}
          </a-button>
        </div>
        <div class="study-habit-card__streak">
          连续 <strong>{{ habit.streakCount ?? 0 }}</strong> 天 · 最佳 {{ habit.bestStreak ?? 0 }} 天
        </div>
        <div class="study-habit-card__actions">
          <a-button type="link" size="small" @click="toggleExpand(habit.id)">月历</a-button>
          <EditOutlined @click="openEdit(habit, $event)" />
          <DeleteOutlined @click="handleDelete(habit)" />
        </div>
        <StudyHabitCalendar v-if="expandedId === habit.id && habit.id" :habit-id="habit.id" />
      </div>
    </div>
    <div v-else class="study-empty" style="padding: 32px">还没有习惯，创建一个吧</div>

    <a-modal
      v-model:open="modalOpen"
      :title="editing ? '编辑习惯' : '新建习惯'"
      ok-text="保存"
      @ok="submit"
    >
      <a-form layout="vertical">
        <a-form-item label="名称">
          <a-input v-model:value="form.title" />
        </a-form-item>
        <a-form-item label="描述">
          <a-input v-model:value="form.description" />
        </a-form-item>
        <a-form-item label="颜色">
          <input v-model="form.color" type="color" />
        </a-form-item>
      </a-form>
    </a-modal>
  </a-spin>
</template>

<style scoped>
.study-habit-toolbar {
  margin-bottom: 12px;
}

.study-habit-card__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 14px;
  color: var(--color-text-muted);
  cursor: pointer;
}
</style>
