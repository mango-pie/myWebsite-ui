<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const from = computed(() => {
  const raw = route.query.from
  return typeof raw === 'string' && raw.startsWith('/') ? raw : ''
})

const moduleKey = computed(() => {
  const raw = route.query.module
  return typeof raw === 'string' ? raw : ''
})
</script>

<template>
  <div class="container unavailable">
    <p class="kicker">模块未开放</p>
    <h1>这间屋子暂时上了锁</h1>
    <p class="hint">
      <template v-if="moduleKey">「{{ moduleKey }}」尚未启用，入口不会再露出来。</template>
      <template v-else>当前功能未启用。</template>
    </p>
    <p v-if="from" class="from">来自 {{ from }}</p>
    <RouterLink to="/" class="btn" style="margin-top: 24px">回到首页</RouterLink>
  </div>
</template>

<style scoped>
.unavailable {
  text-align: center;
  padding: 120px 32px;
}

.kicker {
  font: 13px var(--fd);
  letter-spacing: 0.18em;
  color: var(--ink-soft);
  margin: 0 0 12px;
}

h1 {
  margin: 0 0 12px;
}

.hint {
  color: var(--ink-soft);
  font: 16px var(--fd);
  margin: 0;
}

.from {
  margin-top: 8px;
  font: 13px var(--fd);
  color: var(--ink-soft);
}
</style>
