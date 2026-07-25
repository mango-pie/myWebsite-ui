<script setup lang="ts">
import { useUserStore } from '@/stores/user'
const userStore = useUserStore()
</script>

<template>
  <div class="container">
    <h1>个人资料</h1>
    <p v-if="userStore.user">欢迎，{{ userStore.user.userName || userStore.user.userAccount }}</p>
    <p class="hint">页面建设中</p>
  </div>
</template>

<style scoped>
.hint { color: var(--ink-soft); font: 14px var(--fd); }
</style>
