<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const account = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  if (!account.value || !password.value) {
    error.value = '请输入账号和密码'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const ok = await userStore.login(account.value, password.value)
    if (ok) {
      const redirect = (route.query.redirect as string) || '/'
      router.push(redirect)
    } else {
      error.value = '登录失败，请检查账号密码'
    }
  } catch {
    error.value = '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-wrap">
    <div class="login-deco">
      <div class="big-mark">纸间</div>
      <div class="quote-card">
        <span class="tape" style="--tc: var(--st-mint); --tilt: -5deg; top: -10px; right: 18px" />
        <p>"在纸页与代码之间，留一些光。"</p>
        <p class="attr">— 纸间</p>
      </div>
    </div>
    <div class="login-form-wrap">
      <form class="login-form" @submit.prevent="handleLogin">
        <h1>回到纸间</h1>
        <p class="sub">欢迎回来，登录继续。</p>
        <div v-if="error" class="error-msg">{{ error }}</div>
        <div class="field">
          <label>账号</label>
          <input v-model="account" type="text" placeholder="请输入账号" autocomplete="username">
        </div>
        <div class="field">
          <label>密码</label>
          <input v-model="password" type="password" placeholder="••••••••" autocomplete="current-password">
        </div>
        <button class="btn" type="submit" :disabled="loading">
          {{ loading ? '登录中…' : '登 录' }}
        </button>
        <p class="alt">
          还没有账号？<RouterLink to="/user/register">去注册</RouterLink>
        </p>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-wrap {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  min-height: calc(100vh - 72px);
}

.login-deco {
  position: relative;
  background: var(--paper-surface);
  padding: 64px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.big-mark {
  font: clamp(120px, 18vw, 260px) / 0.9 var(--fd);
  color: var(--ink);
  letter-spacing: 0.02em;
  opacity: 0.07;
  position: absolute;
  white-space: nowrap;
}

.quote-card {
  background: #FFFDF8;
  border: 2px solid var(--hairline);
  border-radius: 14px;
  padding: 32px;
  max-width: 340px;
  box-shadow: var(--shadow-day);
  position: relative;
  transform: rotate(-3deg);
}

.quote-card p {
  font: 16px / 1.7 var(--fb);
  margin: 0 0 12px;
}

.attr {
  font: 13px var(--fd) !important;
  color: var(--ink-soft);
  margin: 0 !important;
}

.login-form-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 64px;
}

.login-form {
  width: 380px;
  max-width: 100%;
}

.login-form h1 {
  font: 42px var(--fd);
  margin-bottom: 8px;
}

.sub {
  color: var(--ink-soft);
  margin-bottom: 36px;
  font-size: 14px;
}

.error-msg {
  background: #F5C6C6;
  border: 1.5px solid #E88B8B;
  border-radius: 10px;
  padding: 10px 14px;
  font: 13px var(--fb);
  color: var(--ink);
  margin-bottom: 20px;
}

.field {
  margin-bottom: 20px;
}

.field label {
  display: block;
  font: 14px var(--fd);
  color: var(--ink-soft);
  margin-bottom: 8px;
  letter-spacing: 0.05em;
}

.field input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--hairline);
  border-radius: 10px;
  background: #FFFDF8;
  font: 15px var(--fb);
  color: var(--ink);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.field input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(61, 139, 194, 0.15);
}

.login-form .btn {
  width: 100%;
  justify-content: center;
  margin-top: 8px;
  padding: 13px 24px;
}

.alt {
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
  color: var(--ink-soft);
}

@media (max-width: 960px) {
  .login-wrap {
    grid-template-columns: 1fr;
  }
  .login-deco {
    min-height: 200px;
    padding: 40px;
  }
}
</style>
