<script setup lang="ts">
/**
 * 设置字段控件：按 schema 渲染，不改变各模块业务字段含义。
 */
const props = defineProps<{
  field: API.SettingFieldSchemaVO
  modelValue: string | number | boolean | null | undefined
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | number | boolean | null | undefined]
}>()

function isTextAreaField(field: API.SettingFieldSchemaVO): boolean {
  const key = field.key || ''
  if (key.includes('notice') || key.includes('prompt')) return true
  return (
    key === 'frontend_public_notice' ||
    key === 'tts.seed_voice.prompt_text' ||
    key === 'image_caption.prompt' ||
    key === 'distill.system_prompt'
  )
}

function onText(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement | HTMLTextAreaElement).value)
}

function onNumber(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  emit('update:modelValue', raw === '' ? undefined : Number(raw))
}

function onBool(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).checked)
}

function onSelect(e: Event) {
  emit('update:modelValue', (e.target as HTMLSelectElement).value)
}
</script>

<template>
  <label v-if="field.valueType === 'bool'" class="toggle">
    <input
      type="checkbox"
      :checked="Boolean(modelValue)"
      @change="onBool"
    />
    <span class="toggle-ui" />
  </label>
  <input
    v-else-if="field.valueType === 'int' || field.valueType === 'long' || field.valueType === 'double'"
    class="form-input"
    type="number"
    :value="modelValue == null ? '' : String(modelValue)"
    :min="field.min"
    :max="field.max"
    @input="onNumber"
  />
  <select
    v-else-if="field.enumValues?.length"
    class="form-select"
    :value="String(modelValue ?? '')"
    @change="onSelect"
  >
    <option v-for="opt in field.enumValues" :key="opt" :value="opt">{{ opt }}</option>
  </select>
  <input
    v-else-if="field.sensitive"
    class="form-input"
    type="password"
    :value="String(modelValue ?? '')"
    placeholder="不修改请留空"
    autocomplete="new-password"
    @input="onText"
  />
  <textarea
    v-else-if="isTextAreaField(field)"
    class="form-textarea"
    :rows="(field.key || '').includes('prompt') ? 5 : 3"
    :value="String(modelValue ?? '')"
    :placeholder="String(field.defaultValue ?? '')"
    @input="onText"
  />
  <input
    v-else
    class="form-input"
    type="text"
    :value="String(modelValue ?? '')"
    :placeholder="String(field.defaultValue ?? '')"
    @input="onText"
  />
</template>

<style scoped>
.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px dashed var(--hairline);
  border-radius: 10px;
  background: #fffdf8;
  font: 14px var(--fb);
  color: var(--ink);
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  border-color: var(--accent);
  border-style: solid;
}

.toggle {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.toggle input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-ui {
  width: 42px;
  height: 24px;
  border-radius: 999px;
  background: var(--hairline);
  position: relative;
  transition: background 0.2s;
}

.toggle-ui::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fffdf8;
  box-shadow: 0 1px 2px rgba(69, 64, 58, 0.2);
  transition: transform 0.2s;
}

.toggle input:checked + .toggle-ui {
  background: var(--accent);
}

.toggle input:checked + .toggle-ui::after {
  transform: translateX(18px);
}

.toggle input:focus-visible + .toggle-ui {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}
</style>
