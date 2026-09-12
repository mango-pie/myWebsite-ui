<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BookOpen, GraduationCap, PenLine, Sparkles } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const items = [
  { key: 'ingest', label: '采集', path: '/admin/knowledge/ingest', icon: Sparkles },
  { key: 'notes', label: '文章', path: '/admin/knowledge/notes', icon: BookOpen },
  { key: 'learning', label: '学习', path: '/admin/knowledge/learning', icon: GraduationCap },
] as const

const active = computed(() => {
  const p = route.path
  if (p.includes('/learning')) return 'learning'
  if (/\/notes\/\d+/.test(p)) return 'detail'
  if (p.includes('/notes')) return 'notes'
  return 'ingest'
})
</script>

<template>
  <nav class="reading-subnav" aria-label="精读工作台">
    <button
      v-for="item in items"
      :key="item.key"
      type="button"
      :class="{ on: active === item.key }"
      @click="route.path !== item.path && router.push(item.path)"
    >
      <component :is="item.icon" :size="13" stroke-width="2.1" />
      {{ item.label }}
    </button>
    <button v-if="active === 'detail'" type="button" class="on" disabled>
      <PenLine :size="13" stroke-width="2.1" />
      审阅
    </button>
  </nav>
</template>
