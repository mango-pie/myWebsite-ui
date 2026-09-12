<script setup lang="ts">
export type FilterChip = {
  key: string
  label: string
  kind: 'cat' | 'tag'
  id: number
}

defineProps<{
  chips: FilterChip[]
}>()

const emit = defineEmits<{
  remove: [chip: FilterChip]
}>()
</script>

<template>
  <div class="filter-chips">
    <span
      v-for="chip in chips"
      :key="chip.key"
      class="filter-chip"
      :class="chip.kind"
    >
      <span>{{ chip.label }}</span>
      <button
        type="button"
        class="x"
        :aria-label="`移除 ${chip.label}`"
        @click="emit('remove', chip)"
      >
        ×
      </button>
    </span>
  </div>
</template>
