/**
 * 权限工具函数
 * 用于在 JS/TS 代码中进行权限检查
 */
import { useLoginUserStore } from '@/stores/loginUser'
import { isAdminRole, isAdministrator } from '@/config/permission'
import type { RequiredRole } from '@/config/permission'

/**
 * 检查当前用户是否有指定权限
 * @param required 所需角色
 * @returns 是否有权限
 */
export function hasPermission(required: RequiredRole): boolean {
  const loginUserStore = useLoginUserStore()
  const user = loginUserStore.loginUser

  if (required === 'user') {
    return !!user?.id
  }

  if (required === 'admin') {
    return !!user?.id && isAdminRole(user.userRole)
  }

  if (required === 'administrator') {
    return !!user?.id && isAdministrator(user.userRole)
  }

  return false
}

/**
 * 检查当前用户是否为管理员
 */
export function isAdmin(): boolean {
  const loginUserStore = useLoginUserStore()
  return isAdminRole(loginUserStore.loginUser.userRole)
}

/**
 * 检查当前用户是否为高级管理员
 */
export function isSuperAdmin(): boolean {
  const loginUserStore = useLoginUserStore()
  return isAdministrator(loginUserStore.loginUser.userRole)
}

/**
 * 检查当前用户是否已登录
 */
export function isLoggedIn(): boolean {
  const loginUserStore = useLoginUserStore()
  return !!loginUserStore.loginUser?.id
}

/**
 * 自定义权限检查
 * @param checkFn 自定义检查函数
 */
export function checkCustomPermission(checkFn: (user: API.LoginUserVO) => boolean): boolean {
  const loginUserStore = useLoginUserStore()
  return checkFn(loginUserStore.loginUser)
}
