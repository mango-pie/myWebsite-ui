/**
 * 全局 HTTP 客户端（Axios）
 * - baseURL 指向后端 API 根路径，withCredentials 携带 Cookie（Session 登录）
 * - transformResponse：在 JSON.parse 前将超出 JS 安全整数范围的大数字转为字符串，
 *   避免雪花 ID（18位）精度丢失
 * - 响应拦截器：当后端返回 code === 40100（未登录）时跳转登录页
 */
import axios from 'axios'
import { message } from 'ant-design-vue'
import { parseSafeJson } from '@/utils/safeJson'

/**
 * 将 JSON 字符串中超过 15 位的纯整数字面量替换为字符串形式，
 * 防止 JSON.parse 时雪花 ID 等大整数精度丢失
 */
function parseSafeJsonForAxios(raw: string): unknown {
  return parseSafeJson(raw)
}

const myAxios = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 60000,
  withCredentials: true,
  transformResponse: [
    (data) => {
      if (typeof data === 'string') {
        try {
          return parseSafeJsonForAxios(data)
        } catch {
          return data
        }
      }
      return data
    },
  ],
})

myAxios.interceptors.request.use(
  function (config) {
    return config
  },
  function (error) {
    return Promise.reject(error)
  },
)

myAxios.interceptors.response.use(
  function (response) {
    const { data } = response
    if (data.code === 40100) {
      if (
        !response.request.responseURL.includes('user/get/login') &&
        !window.location.pathname.includes('/user/login')
      ) {
        message.warning('请先登录')
        window.location.href = `/user/login?redirect=${window.location.href}`
      }
    }
    if (data.code === 40301) {
      message.warning(data.message || '系统维护中，暂不可操作')
    }
    return response
  },
  function (error) {
    return Promise.reject(error)
  },
)

export default myAxios
