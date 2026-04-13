
<template>
  <slot v-if="hasPermission"></slot>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLoginUserStore } from '@/stores/loginUser'
import { isAdminRole, isAdministrator } from '@/config/permission'
import type { RequiredRole } from '@/config/permission'

interface Props {
  /** 所需角色：'user' | 'admin' | 'administrator' */
  required?: RequiredRole
  /** 自定义权限检查函数 */
  customCheck?: (user: API.LoginUserVO) => boolean
}

const props = defineProps<Props>()
const loginUserStore = useLoginUserStore()

const hasPermission = computed(() => {
  const user = loginUserStore.loginUser

  // 自定义检查优先
  if (props.customCheck) {
    return props.customCheck(user)
  }

  // 未设置权限要求，默认显示
  if (!props.required) {
    return true
  }

  // 需要登录
  if (props.required === 'user') {
    return !!user?.id
  }

  // 需要管理员
  if (props.required === 'admin') {
    return !!user?.id && isAdminRole(user.userRole)
  }

  // 需要高级管理员
  if (props.required === 'administrator') {
    return !!user?.id && isAdministrator(user.userRole)
  }

  return false
})
</script>
