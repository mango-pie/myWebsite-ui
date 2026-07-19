<script setup lang="ts">
import { ref } from 'vue'
import { Plus } from 'lucide-vue-next'

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
        <a-button type="link" size="small" class="quick-add-btn" :loading="loading" @click="handleSubmit">
          <Plus :size="15" class="quick-add-icon" /> 添加
        </a-button>
      </template>
    </a-input>
  </div>
</template>

<style scoped>
.quick-add-icon {
  vertical-align: -0.16em;
  transition: transform var(--transition-fast);
}
.quick-add-btn:hover .quick-add-icon {
  transform: rotate(90deg) scale(1.1);
}
@media (prefers-reduced-motion: reduce) {
  .quick-add-icon {
    transition: none;
  }
  .quick-add-btn:hover .quick-add-icon {
    transform: none;
  }
}
</style>
