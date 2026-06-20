<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

onMounted(() => {
  const conversationId = route.params.conversationId
  if (conversationId) {
    router.replace(`/chat/${conversationId}`)
  } else {
    router.replace('/chat?new=1')
  }
})
</script>

<template>
  <div class="simple-chat-page">
    <a-empty description="页面已升级，正在跳转到新版对话页..." />
  </div>
</template>

<style scoped>
.simple-chat-page {
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>