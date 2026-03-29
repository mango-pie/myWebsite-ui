import { useLoginUserStore } from '@/stores/loginUser'
import { message } from 'ant-design-vue'
import router from '@/router'
import { getRequiredRole, isAdminRole } from '@/config/permission'

// 是否为首次获取登录用户
let firstFetchLoginUser = true

/**
 * 全局权限校验（依据 src/config/permission.ts 的 ROUTE_PERMISSIONS 与路径前缀）
 */
router.beforeEach(async (to, _from, next) => {
  const loginUserStore = useLoginUserStore()
  let loginUser = loginUserStore.loginUser
  if (firstFetchLoginUser) {
    await loginUserStore.fetchLoginUser()
    loginUser = loginUserStore.loginUser
    firstFetchLoginUser = false
  }

  const required = getRequiredRole(to.path)
  if (!required) {
    next()
    return
  }

  if (!loginUser?.id) {
    message.error('请先登录')
    next({ path: '/user/login', query: { redirect: to.fullPath } })
    return
  }

  if (required === 'admin' && !isAdminRole(loginUser.userRole)) {
    message.error('没有权限')
    next('/')
    return
  }

  next()
})
