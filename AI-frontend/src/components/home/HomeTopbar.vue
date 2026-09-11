<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useCapabilitiesStore } from '@/stores/capabilities'
import { isGatedEntryVisible } from '@/utils/moduleGate'

const caps = useCapabilitiesStore()

type HeroAction = {
  key: string
  to: string
  label: string
  className: string
  requireModule?: string
}

const actions = computed(() => {
  const gate = { loaded: caps.loaded, enabled: caps.enabled }
  const list: HeroAction[] = [
    { key: 'blog', to: '/blog', label: '翻翻随笔', className: 'btn', requireModule: 'blog' },
    { key: 'about', to: '/about', label: '认识站主', className: 'btn ghost' },
  ]
  return list.filter((item) => isGatedEntryVisible(item.requireModule, gate))
})
</script>

<template>
  <div class="hero-actions">
    <RouterLink v-for="item in actions" :key="item.key" :to="item.to" :class="item.className">
      {{ item.label }}
    </RouterLink>
  </div>
</template>

<style scoped>
.hero-actions {
  margin-top: 36px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
