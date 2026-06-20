<script setup lang="ts">
// @ts-nocheck
defineProps<{
  tool: any
}>()
</script>

<template>
    <div
    class="tool-card"
    :class="{
      'tool-card--running': tool.status === 'running',
      'tool-card--success': tool.status === 'done' && tool.success !== false,
      'tool-card--error': tool.status === 'error' || tool.success === false,
    }"
  >
    <div class="tool-card__head">
      <span class="tool-card__icon">{{ tool.status === 'running' ? '⏳' : tool.success === false ? '❌' : '✅' }}</span>
      <span class="tool-card__name">{{ tool.tool }}</span>
      <span v-if="tool.step != null" class="tool-card__step">#{{ tool.step }}</span>
    </div>
    <div v-if="tool.args && Object.keys(tool.args).length" class="tool-card__args">
      {{ JSON.stringify(tool.args) }}
    </div>
    <div v-if="tool.data" class="tool-card__data">
      {{ typeof tool.data === 'string' ? tool.data : JSON.stringify(tool.data) }}
    </div>
  </div>
</template>

<style scoped>
/* Styles live in chat-shell.css (shared) so they match the chat container theme. */
</style>