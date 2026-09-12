<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

/** 任务进度已并入工作台；本路由仅作兼容跳转 */
const router = useRouter()
onMounted(() => {
  router.replace('/admin/knowledge/ingest')
})
</script>

<template>
  <div class="jobs-redirect">正在进入工作台…</div>
</template>

<style scoped>
.jobs-redirect {
  padding: 48px 24px;
  text-align: center;
  color: #667;
  font-size: 14px;
}
</style>
