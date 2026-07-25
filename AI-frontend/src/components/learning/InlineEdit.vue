<script setup lang="ts">
/**
 * 行内编辑输入框 — 双击激活、Enter 确认、Esc 取消、blur 保存
 * 用于 DomainTree 的改名和新建枝操作
 */
import { nextTick, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    autofocus?: boolean
  }>(),
  {
    placeholder: '输入标题',
    autofocus: true,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  confirm: [value: string]
  cancel: []
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const text = ref(props.modelValue)

function focusIt() {
  void nextTick(() => {
    inputRef.value?.focus()
    inputRef.value?.select()
  })
}

watch(
  () => props.autofocus,
  (v) => {
    if (v) focusIt()
  },
)

onMounted(() => {
  if (props.autofocus) focusIt()
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    const v = text.value.trim()
    if (v) emit('confirm', v)
  } else if (e.key === 'Escape') {
    e.preventDefault()
    emit('cancel')
  }
}

function onBlur() {
  const v = text.value.trim()
  if (v) emit('confirm', v)
  else emit('cancel')
}
</script>

<template>
  <input
    ref="inputRef"
    v-model="text"
    class="ld-inline-edit"
    :placeholder="placeholder"
    type="text"
    @keydown="onKeydown"
    @blur="onBlur"
  />
</template>

<style scoped>
.ld-inline-edit {
  width: 100%;
  border: 1px solid var(--ld-color-primary-muted);
  border-radius: var(--ld-radius-sm);
  background: var(--ld-color-bg-elevated);
  color: var(--ld-color-text-primary);
  font-family: inherit;
  font-size: var(--ld-font-size-sm);
  font-weight: var(--ld-font-weight-semibold);
  line-height: var(--ld-line-height-tight);
  padding: 4px 8px;
  outline: none;
  transition: border-color var(--ld-duration-fast) var(--ld-ease-out);
}

.ld-inline-edit:focus {
  border-color: var(--ld-color-primary);
  box-shadow: 0 0 0 2px var(--ld-color-primary-subtle);
}
</style>
