<script setup lang="ts">
/**
 * 用户登录页 - 路径：/user/login
 * 表单：账号、密码；登录成功后更新全局登录态并跳转首页，失败则提示错误信息
 */
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { LogIn, Lock, User } from 'lucide-vue-next'
import { useLoginUserStore } from '@/stores/loginUser.ts'
import { userLogin } from '@/api/userController.ts'
import { message } from 'ant-design-vue'
import { siteConfig } from '@/config/site'

const formState = reactive<API.UserLoginRequest>({
  userAccount: '',
  userPassword: '',
})
const router = useRouter()
const loginUserStore = useLoginUserStore()

/**
 * 提交登录表单：调用登录接口后，成功则把用户信息写入 store 并跳首页，失败则提示后端 message
 */
/**
 * 提交登录表单：调用登录接口后，成功则把用户信息写入 store 并跳首页，失败则提示后端 message
 */
const handleSubmit = async (values: API.UserLoginRequest) => {
  try {
    const res = await userLogin(values)
    if (res.data.code === 0 && res.data.data) {
      await loginUserStore.fetchLoginUser()
      message.success('登录成功')
      await router.push({
        path: '/',
        replace: true,
      })
    } else {
      message.error('登录失败，' + (res.data.message || '请检查账号密码'))
    }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    message.error(err?.response?.data?.message || err?.message || '登录请求失败，请稍后重试')
  }
}
</script>

<template>
    <div id="userLoginPage" class="theme-glass-card">
      <h2 class="title">{{ siteConfig.siteName }} · 用户登录</h2>
      <a-form :model="formState" name="basic" autocomplete="off" @finish="handleSubmit">
        <a-form-item name="userAccount" :rules="[{ required: true, message: '请输入账号' }]">
          <a-input v-model:value="formState.userAccount" placeholder="请输入账号">
            <template #prefix><User :size="16" class="field-prefix-icon" /></template>
          </a-input>
        </a-form-item>
        <a-form-item
          name="userPassword"
          :rules="[
          { required: true, message: '请输入密码' },
          { min: 8, message: '密码不能小于 8 位' },
        ]"
        >
          <a-input-password v-model:value="formState.userPassword" placeholder="请输入密码">
            <template #prefix><Lock :size="16" class="field-prefix-icon" /></template>
          </a-input-password>
        </a-form-item>
        <div class="tips">
          没有账号？
          <RouterLink to="/user/register">去注册</RouterLink>
        </div>
        <a-form-item>
          <a-button type="primary" html-type="submit" style="width: 100%">
            <template #icon><LogIn :size="16" /></template>
            登录
          </a-button>
        </a-form-item>
      </a-form>
    </div>


</template>

<style scoped>
#userLoginPage {
  max-width: 420px;
  margin: 24px auto;
  padding: 24px;
}

.title {
  text-align: center;
  margin-bottom: 16px;
  color: var(--color-text-primary);
}

#userLoginPage :deep(.ant-input),
#userLoginPage :deep(.ant-input-affix-wrapper),
#userLoginPage :deep(.ant-btn),
#userLoginPage :deep(.ant-input-password) {
  border-radius: var(--radius-md);
}

#userLoginPage :deep(.ant-input),
#userLoginPage :deep(.ant-input-affix-wrapper) {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--color-border);
  color: var(--color-text-primary);
}

.desc {
  text-align: center;
  color: #bbb;
  margin-bottom: 16px;
}

.tips {
  margin-bottom: 16px;
  color: var(--color-text-muted);
  font-size: 13px;
  text-align: right;
}

.field-prefix-icon {
  color: var(--color-text-muted);
}

#userLoginPage :deep(.ant-btn-primary) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

#userLoginPage :deep(.ant-btn-primary .anticon) {
  display: inline-flex;
  align-items: center;
}

</style>
