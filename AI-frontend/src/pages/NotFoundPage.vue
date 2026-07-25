<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="container" style="text-align: center; padding: 120px 32px;">
    <h1>404</h1>
    <p class="hint">页面走丢了…</p>
    <RouterLink to="/" class="btn" style="margin-top: 24px;">回到首页</RouterLink>
  </div>
</template>

<style scoped>
.hint { color: var(--ink-soft); font: 16px var(--fd); }
</style>
