<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  submit: [title: string]
}>()

const input = ref('')
const loading = ref(false)

async function handleSubmit() {
  const title = input.value.trim()
  if (!title || loading.value) return
  loading.value = true
  try {
    emit('submit', title)
    input.value = ''
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="study-quick-add">
    <a-input
      v-model:value="input"
      placeholder="添加任务，按 Enter 确认…"
      :disabled="loading"
      @press-enter="handleSubmit"
    >
      <template #suffix>
        <a-button type="link" size="small" :loading="loading" @click="handleSubmit">添加</a-button>
      </template>
    </a-input>
  </div>
</template>
