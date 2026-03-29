<script setup lang="ts">
import { ConfigProvider } from 'ant-design-vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import BasicLayout from './layouts/BasicLayout.vue'
import { useLoginUserStore } from '@/stores/loginUser.ts'





const loginUserStore = useLoginUserStore()
loginUserStore.fetchLoginUser().catch(() => {
  // 后端未启动或未登录时保持未登录状态，不影响页面打开
})

</script>
<template>
  <ConfigProvider :locale="zhCN">
    <BasicLayout />
  </ConfigProvider>
</template>
