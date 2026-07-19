import { useLoginUserStore } from '@/stores/loginUser'
import { useCapabilitiesStore } from '@/stores/capabilities'
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
  const capsStore = useCapabilitiesStore()
  let loginUser = loginUserStore.loginUser
  if (firstFetchLoginUser) {
    // 首次导航：并行拉取登录用户与模块能力
    await Promise.all([loginUserStore.fetchLoginUser(), capsStore.load()])
    loginUser = loginUserStore.loginUser
    firstFetchLoginUser = false
  }

  // 模块开关：能力已加载且该路由依赖的模块被关闭时拦截（用首页兜底）
  const needModule = to.meta?.requireModule as string | undefined
  if (needModule && capsStore.loaded && !capsStore.enabled(needModule)) {
    message.warning('该功能未启用')
    return { path: '/' }
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
