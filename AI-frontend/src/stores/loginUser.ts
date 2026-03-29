/**
 * 登录用户全局状态（Pinia Store）
 * - loginUser：当前登录用户信息（未登录时为默认值，无 id）
 * - fetchLoginUser：请求后端“获取当前登录用户”接口并写回 store（登录后或布局挂载时调用）
 * - setLoginUser：直接覆盖 store 中的用户（用于登出时清空）
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getLoginUser } from '@/api/userController.ts'

export const useLoginUserStore = defineStore('loginUser', () => {
  const loginUser = ref<API.LoginUserVO>({
    userName: '未登录',
  })

  async function fetchLoginUser() {
    const res = await getLoginUser()
    if (res.data.code === 0 && res.data.data) {
      loginUser.value = res.data.data
    }
  }

  function setLoginUser(newLoginUser: API.LoginUserVO) {
    loginUser.value = newLoginUser
  }

  return { loginUser, setLoginUser, fetchLoginUser }
})
