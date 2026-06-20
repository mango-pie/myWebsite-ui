import { useLoginUserStore } from '@/stores/loginUser'
import { message } from 'ant-design-vue'
import router from '@/router'
import { getRequiredRole, isAdminRole } from '@/config/permission'
import { getLastChatConversationId, shouldResumeChatHome } from '@/utils/chatSession'

// 是否为首次获取登录用户
let firstFetchLoginUser = true

/**
 * 全局权限校验（依据 src/config/permission.ts 的 ROUTE_PERMISSIONS 与路径前缀）
 */
router.beforeEach(async (to, _from) => {
  const loginUserStore = useLoginUserStore()
  let loginUser = loginUserStore.loginUser
  if (firstFetchLoginUser) {
    await loginUserStore.fetchLoginUser()
    loginUser = loginUserStore.loginUser
    firstFetchLoginUser = false
  }

  // 回到「对话」时恢复上次具体对话页，而非停留在 /chat 列表
  if (shouldResumeChatHome(to.path, to.query as Record<string, unknown>)) {
    const last = getLastChatConversationId()
    if (last) {
      return { path: `/chat/${last}`, replace: true }
    }
  }

  const required = getRequiredRole(to.path)
  if (!required) {
    return true
  }

  if (!loginUser?.id) {
    message.error('请先登录')
    return { path: '/user/login', query: { redirect: to.fullPath } }
  }

  if (required === 'admin' && !isAdminRole(loginUser.userRole)) {
    message.error('没有权限')
    return { path: '/' }
  }

  return true
})
