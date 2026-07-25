<script setup lang="ts">
/**
 * 无样式占位页 — 仅验证路由切换；重建时替换为真实页面。
 */
defineProps<{
  title?: string
  moduleKey?: string
  note?: string
}>()
</script>

<template>
  <div>
    <p v-if="moduleKey">module: {{ moduleKey }}</p>
    <h1>{{ title || 'shell' }}</h1>
    <p v-if="note">{{ note }}</p>
    <p>content pending · API shell</p>
  </div>
</template>
