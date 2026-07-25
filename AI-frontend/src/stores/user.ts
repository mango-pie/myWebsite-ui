import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getLoginUser, userLogin as apiLogin, userLogout } from '@/api/userController'

export const useUserStore = defineStore('user', () => {
  const user = ref<API.LoginUserVO | null>(null)
  const loading = ref(false)

  const isLoggedIn = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.userRole === 'admin')
  const role = computed(() => user.value?.userRole ?? 'guest')

  async function fetchUser() {
    loading.value = true
    try {
      const res = await getLoginUser()
      if (res.data?.code === 0 && res.data?.data) {
        user.value = res.data.data
      } else {
        user.value = null
      }
    } catch {
      user.value = null
    } finally {
      loading.value = false
    }
  }

  async function login(account: string, password: string) {
    const res = await apiLogin({ userAccount: account, userPassword: password })
    if (res.data?.code === 0 && res.data?.data) {
      user.value = res.data.data
      return true
    }
    return false
  }

  async function logout() {
    try {
      await userLogout()
    } finally {
      user.value = null
    }
  }

  return { user, loading, isLoggedIn, isAdmin, role, fetchUser, login, logout }
})
