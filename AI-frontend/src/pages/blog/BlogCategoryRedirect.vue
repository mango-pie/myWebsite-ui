<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAllCategories } from '@/api/blogCategoryController'
import { buildFilterQuery } from '@/utils/blogFilterQuery'

const route = useRoute()
const router = useRouter()

onMounted(async () => {
  const name = decodeURIComponent(String(route.params.name || ''))
  try {
    const res = await getAllCategories()
    const list = (res.data.data || []) as API.BlogCategoryVO[]
    const hit = list.find((c) => c.name === name)
    if (hit?.id) {
      await router.replace({ path: '/blog/filter', query: buildFilterQuery([hit.id], []) })
      return
    }
  } catch {
    /* fall through */
  }
  await router.replace('/blog/filter')
})
</script>

<template>
  <div style="padding: 48px; text-align: center; color: #888">正在跳转筛选…</div>
</template>
