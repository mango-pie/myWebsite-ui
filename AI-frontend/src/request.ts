/**
 * 全局 HTTP 客户端（Axios）
 * - baseURL 指向后端 API 根路径，withCredentials 携带 Cookie（Session 登录）
 * - transformResponse：大整数字面量转字符串，避免雪花 ID 精度丢失
 * - 40100：未登录时跳转登录页（路径可按新 UI 调整）
 */
import axios from 'axios'
import { parseSafeJson } from '@/utils/safeJson'

const myAxios = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 60000,
  withCredentials: true,
  transformResponse: [
    (data) => {
      if (typeof data === 'string') {
        try {
          return parseSafeJson(data)
        } catch {
          return data
        }
      }
      return data
    },
  ],
})

myAxios.interceptors.response.use(
  function (response) {
    const { data } = response
    if (data?.code === 40100) {
      if (
        !response.request.responseURL.includes('user/get/login') &&
        !window.location.pathname.includes('/user/login')
      ) {
        console.warn('[api] 未登录，跳转登录页')
        window.location.href = `/user/login?redirect=${encodeURIComponent(window.location.href)}`
      }
    }
    if (data?.code === 40301) {
      console.warn('[api]', data.message || '系统维护中，暂不可操作')
    }
    return response
  },
  function (error) {
    const url = String(error.config?.url || error.response?.config?.url || '')
    const isProbe = url.includes('/app/modules')
    if (error.response?.status === 404 && !isProbe) {
      console.warn('[api] 该功能未启用或不存在:', url)
    }
    return Promise.reject(error)
  },
)

export default myAxios
