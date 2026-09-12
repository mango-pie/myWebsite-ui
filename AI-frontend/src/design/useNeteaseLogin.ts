import { ref, computed, onMounted, onUnmounted } from 'vue'
import { clearNeteaseCookie, neteaseFetch, setNeteaseCookie } from '@/integrations/musicRuntime'

const CAPTCHA_COOLDOWN_SEC = 60

type LoginStatus = 'logged-out' | 'logging' | 'logged-in' | 'error'
type QrStatus = 'idle' | 'waiting-scan' | 'waiting-confirm' | 'expired'
type LoginMode = 'qr' | 'phone'

const isLoggedIn = ref(false)
const loginStatus = ref<LoginStatus>('logged-out')
const loginError = ref('')
const qrStatus = ref<QrStatus>('idle')
const loginMode = ref<LoginMode>('phone')
const loginInfo = ref<{
  userId?: string
  nickname?: string
  avatar?: string
}>({})
const qrCodeUrl = ref('')

const phone = ref('')
const captcha = ref('')
const countrycode = ref('86')
const captchaSending = ref(false)
const captchaCooldown = ref(0)
const phoneLogging = ref(false)

let checkTimer: ReturnType<typeof setTimeout> | null = null
let cooldownTimer: ReturnType<typeof setInterval> | null = null
let subscribers = 0
let bootstrapped = false

const loginStatusText = computed(() => {
  if (loginStatus.value === 'logged-in') {
    return loginInfo.value.nickname ? `已登录：${loginInfo.value.nickname}` : '已登录'
  }
  if (loginStatus.value === 'error') {
    return loginError.value || '登录失败'
  }
  if (phoneLogging.value) return '正在验证手机号…'
  if (captchaSending.value) return '正在发送验证码…'
  if (loginStatus.value === 'logging') {
    if (qrStatus.value === 'waiting-confirm') return '已扫码，等待确认'
    if (qrStatus.value === 'waiting-scan') return '等待扫码'
    return '准备二维码中'
  }
  if (qrStatus.value === 'expired') return '二维码已过期'
  return '未登录'
})

const canSendCaptcha = computed(
  () =>
    !captchaSending.value &&
    !phoneLogging.value &&
    captchaCooldown.value <= 0 &&
    /^1\d{10}$/.test(phone.value.trim()),
)

const canSubmitPhoneLogin = computed(
  () =>
    !phoneLogging.value &&
    /^1\d{10}$/.test(phone.value.trim()) &&
    /^\d{4,8}$/.test(captcha.value.trim()),
)

function clearQrPoll() {
  if (checkTimer) {
    clearTimeout(checkTimer)
    checkTimer = null
  }
}

function clearCooldown() {
  if (cooldownTimer) {
    clearInterval(cooldownTimer)
    cooldownTimer = null
  }
  captchaCooldown.value = 0
}

function startCooldown(seconds = CAPTCHA_COOLDOWN_SEC) {
  clearCooldown()
  captchaCooldown.value = seconds
  cooldownTimer = setInterval(() => {
    captchaCooldown.value -= 1
    if (captchaCooldown.value <= 0) clearCooldown()
  }, 1000)
}

function normalizeCookie(raw: unknown): string {
  if (!raw) return ''
  if (Array.isArray(raw)) return raw.filter(Boolean).join('; ')
  if (typeof raw === 'string') return raw
  return ''
}

function extractCookie(payload: Record<string, unknown>): string {
  const direct = normalizeCookie(payload.cookie)
  if (direct) return direct
  const body = payload.body as Record<string, unknown> | undefined
  if (body) return normalizeCookie(body.cookie)
  return ''
}

function saveCookie(cookieStr: string) {
  setNeteaseCookie(cookieStr)
}

async function fetchJson(path: string, init?: RequestInit) {
  const res = await neteaseFetch(path, init)
  return res.json() as Promise<Record<string, unknown>>
}

function resultCode(data: Record<string, unknown>): number {
  if (typeof data.code === 'number') return data.code
  const body = data.body as Record<string, unknown> | undefined
  if (typeof body?.code === 'number') return body.code
  if (typeof data.status === 'number' && data.status === 200) return 200
  return Number(data.code || 0)
}

function resultMessage(data: Record<string, unknown>): string {
  const body = data.body as Record<string, unknown> | undefined
  return String(data.message || data.msg || body?.message || body?.msg || '')
}

function pickAccountInfo(data: Record<string, unknown>) {
  const body = data.body as Record<string, unknown> | undefined
  return (body?.data || body || data.data || data) as Record<string, unknown>
}

function applyLoggedIn(accountInfo: Record<string, unknown>) {
  const profile = (accountInfo.profile || {}) as Record<string, unknown>
  const account = (accountInfo.account || {}) as Record<string, unknown>
  isLoggedIn.value = true
  loginStatus.value = 'logged-in'
  qrStatus.value = 'idle'
  loginError.value = ''
  loginInfo.value = {
    userId: String(profile.userId || account.id || account.userId || accountInfo.userId || ''),
    nickname: String(profile.nickname || accountInfo.nickname || ''),
    avatar: String(profile.avatarUrl || accountInfo.avatar || ''),
  }
}

export function useNeteaseLogin() {
  const checkLoginStatus = async () => {
    // 扫码轮询中不要打断
    if (checkTimer) return

    try {
      const data = await fetchJson(`/login/status?timestamp=${Date.now()}`)
      const accountInfo = pickAccountInfo(data)
      const profile = (accountInfo.profile || {}) as Record<string, unknown>
      const account = (accountInfo.account || {}) as Record<string, unknown>
      const hasLogin =
        resultCode(data) === 200 &&
        Boolean(profile.userId || account.id || account.userId || accountInfo.userId)

      if (hasLogin) {
        applyLoggedIn(accountInfo)
      } else if (!phoneLogging.value && loginStatus.value !== 'logging') {
        isLoggedIn.value = false
        loginStatus.value = 'logged-out'
        qrStatus.value = 'idle'
      }
    } catch (error) {
      console.error('检查登录状态失败:', error)
      if (!phoneLogging.value && loginStatus.value !== 'logging') {
        loginStatus.value = 'error'
        loginError.value = '检查登录状态失败'
        qrStatus.value = 'idle'
      }
    }
  }

  const generateQrCode = async () => {
    const keyData = await fetchJson(`/login/qr/key?timestamp=${Date.now()}`)
    const keyPayload = (keyData.data || keyData.body || keyData) as Record<string, unknown>
    const unikey = String(keyPayload.unikey || '')
    if (Number(keyData.code) !== 200 || !unikey) {
      throw new Error('获取二维码 key 失败')
    }

    const createData = await fetchJson(
      `/login/qr/create?key=${encodeURIComponent(unikey)}&platform=web&qrimg=true&timestamp=${Date.now()}`,
    )
    const createPayload = (createData.data || createData.body || createData) as Record<string, unknown>
    const qrimg = String(createPayload.qrimg || '')
    if (Number(createData.code) !== 200 || !qrimg) {
      throw new Error('获取二维码图片失败')
    }

    qrCodeUrl.value = qrimg
    qrStatus.value = 'waiting-scan'
    return unikey
  }

  const handleLogin = async () => {
    if (loginStatus.value === 'logging' || phoneLogging.value) return

    clearQrPoll()
    loginMode.value = 'qr'
    loginStatus.value = 'logging'
    loginError.value = ''
    qrCodeUrl.value = ''
    qrStatus.value = 'idle'

    try {
      const qrKey = await generateQrCode()
      let attempts = 0
      const maxAttempts = 100

      const checkStatus = async () => {
        if (attempts >= maxAttempts) {
          loginStatus.value = 'error'
          loginError.value = '登录超时，请重试'
          qrStatus.value = 'expired'
          return
        }
        attempts++

        try {
          const checkData = await fetchJson(
            `/login/qr/check?key=${encodeURIComponent(qrKey)}&timestamp=${Date.now()}`,
          )
          const code = Number(checkData.code)

          switch (code) {
            case 800:
              loginStatus.value = 'error'
              loginError.value = '二维码已过期，请重新获取'
              qrStatus.value = 'expired'
              return
            case 801:
              qrStatus.value = 'waiting-scan'
              checkTimer = setTimeout(checkStatus, 2000)
              return
            case 802:
              qrStatus.value = 'waiting-confirm'
              checkTimer = setTimeout(checkStatus, 1500)
              return
            case 803: {
              saveCookie(extractCookie(checkData))
              qrCodeUrl.value = ''
              qrStatus.value = 'idle'
              await checkLoginStatus()
              if (!isLoggedIn.value) {
                isLoggedIn.value = true
                loginStatus.value = 'logged-in'
              }
              return
            }
            default:
              if (code === 200) {
                saveCookie(extractCookie(checkData))
                qrCodeUrl.value = ''
                qrStatus.value = 'idle'
                await checkLoginStatus()
              } else {
                loginStatus.value = 'error'
                loginError.value = String(checkData.message || '登录失败')
                qrStatus.value = 'idle'
              }
          }
        } catch (error) {
          console.error('检查状态失败:', error)
          checkTimer = setTimeout(checkStatus, 3000)
        }
      }

      checkTimer = setTimeout(checkStatus, 1000)
    } catch (error) {
      console.error('登录失败:', error)
      loginStatus.value = 'error'
      loginError.value = error instanceof Error ? error.message : '登录失败'
      qrStatus.value = 'idle'
    }
  }

  const cancelQrLogin = () => {
    clearQrPoll()
    qrCodeUrl.value = ''
    qrStatus.value = 'idle'
    if (loginStatus.value === 'logging') {
      loginStatus.value = isLoggedIn.value ? 'logged-in' : 'logged-out'
    }
  }

  const sendCaptcha = async () => {
    const mobile = phone.value.trim()
    if (!/^1\d{10}$/.test(mobile)) {
      loginError.value = '请输入正确的手机号'
      loginStatus.value = 'error'
      return false
    }
    if (!canSendCaptcha.value) return false

    cancelQrLogin()
    loginMode.value = 'phone'
    captchaSending.value = true
    loginError.value = ''

    try {
      const query = new URLSearchParams({
        phone: mobile,
        ctcode: countrycode.value.trim() || '86',
        timestamp: String(Date.now()),
      })
      const data = await fetchJson(`/captcha/sent?${query.toString()}`)
      const code = resultCode(data)
      if (code !== 200) {
        throw new Error(resultMessage(data) || `发送失败（${code}）`)
      }
      startCooldown()
      if (loginStatus.value !== 'logged-in') {
        loginStatus.value = 'logged-out'
      }
      return true
    } catch (error) {
      console.error('发送验证码失败:', error)
      loginStatus.value = 'error'
      loginError.value = error instanceof Error ? error.message : '发送验证码失败'
      return false
    } finally {
      captchaSending.value = false
    }
  }

  const loginWithPhone = async () => {
    const mobile = phone.value.trim()
    const captchaCode = captcha.value.trim()
    if (!/^1\d{10}$/.test(mobile)) {
      loginError.value = '请输入正确的手机号'
      loginStatus.value = 'error'
      return false
    }
    if (!/^\d{4,8}$/.test(captchaCode)) {
      loginError.value = '请输入短信验证码'
      loginStatus.value = 'error'
      return false
    }
    if (phoneLogging.value) return false

    cancelQrLogin()
    loginMode.value = 'phone'
    phoneLogging.value = true
    loginStatus.value = 'logging'
    loginError.value = ''

    try {
      const query = new URLSearchParams({
        phone: mobile,
        captcha: captchaCode,
        countrycode: countrycode.value.trim() || '86',
        timestamp: String(Date.now()),
      })
      const data = await fetchJson(`/login/cellphone?${query.toString()}`)
      const responseCode = resultCode(data)
      if (responseCode !== 200) {
        throw new Error(resultMessage(data) || `登录失败（${responseCode}）`)
      }

      saveCookie(extractCookie(data))
      const accountInfo = pickAccountInfo(data)
      if (accountInfo.profile || accountInfo.account) {
        applyLoggedIn(accountInfo)
      } else {
        await checkLoginStatus()
        if (!isLoggedIn.value) {
          // cookie 已写入，视为登录成功
          isLoggedIn.value = true
          loginStatus.value = 'logged-in'
        }
      }
      captcha.value = ''
      return true
    } catch (error) {
      console.error('手机号登录失败:', error)
      isLoggedIn.value = false
      loginStatus.value = 'error'
      loginError.value = error instanceof Error ? error.message : '手机号登录失败'
      return false
    } finally {
      phoneLogging.value = false
    }
  }

  const handleLogout = async () => {
    clearQrPoll()
    try {
      await fetchJson(`/logout?timestamp=${Date.now()}`)
    } catch (error) {
      console.error('退出登录失败:', error)
    }

    clearNeteaseCookie()
    isLoggedIn.value = false
    loginStatus.value = 'logged-out'
    loginInfo.value = {}
    qrCodeUrl.value = ''
    qrStatus.value = 'idle'
    loginError.value = ''
    captcha.value = ''
  }

  onMounted(() => {
    subscribers += 1
    if (!bootstrapped) {
      bootstrapped = true
      void checkLoginStatus()
    }
  })

  onUnmounted(() => {
    subscribers = Math.max(0, subscribers - 1)
    if (subscribers === 0) {
      clearQrPoll()
      clearCooldown()
      bootstrapped = false
    }
  })

  return {
    isLoggedIn,
    loginStatus,
    loginError,
    loginStatusText,
    loginInfo,
    loginMode,
    qrStatus,
    qrCodeUrl,
    phone,
    captcha,
    countrycode,
    captchaSending,
    captchaCooldown,
    phoneLogging,
    canSendCaptcha,
    canSubmitPhoneLogin,
    handleLogin,
    cancelQrLogin,
    sendCaptcha,
    loginWithPhone,
    handleLogout,
    checkLoginStatus,
  }
}
