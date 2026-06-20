<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  items?: API.StudyTaskChecklistVO[]
}>()

const emit = defineEmits<{
  add: [title: string]
  toggle: [item: API.StudyTaskChecklistVO, done: boolean]
  delete: [id: number]
}>()

const newTitle = ref('')

function submitNew() {
  const title = newTitle.value.trim()
  if (!title) return
  emit('add', title)
  newTitle.value = ''
}
</script>

<template>
  <div class="study-checklist">
    <div class="study-sidebar__section-label">检查项</div>
    <div
      v-for="item in items"
      :key="item.id"
      class="study-checklist-item"
      :class="{ 'study-checklist-item--done': item.done === 1 }"
    >
      <a-checkbox
        :checked="item.done === 1"
        @update:checked="(checked: boolean) => emit('toggle', item, checked)"
      />
      <span>{{ item.title }}</span>
      <a-button type="link" size="small" danger @click="emit('delete', item.id!)">删</a-button>
    </div>
    <a-input
      v-model:value="newTitle"
      size="small"
      placeholder="添加检查项…"
      @press-enter="submitNew"
    />
  </div>
</template>

<style scoped>
.study-checklist {
  margin-top: 16px;
}
</style>
