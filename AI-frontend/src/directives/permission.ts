/**
 * v-permission 指令
 * 用法：
 * <button v-permission="'admin'">管理员可见</button>
 * <div v-permission="'user'">登录用户可见</div>
 * <span v-permission="{ custom: (user) => user.id === 123 }">自定义权限</span>
 */
import type { Directive, DirectiveBinding } from 'vue'
import { useLoginUserStore } from '../stores/loginUser'
import { isAdminRole, isAdministrator } from '../config/permission'
import type { RequiredRole } from '../config/permission'

type PermissionValue =
  | RequiredRole
  | {
      custom: (user: API.LoginUserVO) => boolean
    }

function checkPermission(value: PermissionValue): boolean {
  const loginUserStore = useLoginUserStore()
  const user = loginUserStore.loginUser

  // 自定义检查
  if (typeof value === 'object' && value.custom) {
    return value.custom(user)
  }

  // 字符串角色检查
  if (typeof value === 'string') {
    if (value === 'user') {
      return !!user?.id
    }
    if (value === 'admin') {
      return !!user?.id && isAdminRole(user.userRole)
    }
    if (value === 'administrator') {
      return !!user?.id && isAdministrator(user.userRole)
    }
  }

  return false
}

export const permissionDirective: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<PermissionValue>) {
    const hasPermission = checkPermission(binding.value)
    if (!hasPermission) {
      // 移除元素
      el.parentNode?.removeChild(el)
    }
  },
  updated(el: HTMLElement, binding: DirectiveBinding<PermissionValue>) {
    const hasPermission = checkPermission(binding.value)
    if (!hasPermission && el.parentNode) {
      el.parentNode.removeChild(el)
    }
  },
}
