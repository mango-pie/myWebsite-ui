<script setup lang="ts">
/**
 * 用户注册页 - 路径：/user/register
 * 表单：账号、密码、确认密码；校验通过后调用注册接口，成功则跳转登录页
 */
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { userRegister } from '@/api/userController.ts'
import { siteConfig } from '@/config/site'

const router = useRouter()

// 表单数据，与后端 UserRegisterRequest 对齐
const formState = reactive<API.UserRegisterRequest>({
  userAccount: '',
  userPassword: '',
  checkPassword: '',
})

/** 自定义校验：确认密码必须与密码一致 */
const validateCheckPassword = async (_rule: unknown, value: string) => {
  if (!value) return Promise.resolve()
  if (value !== formState.userPassword) return Promise.reject(new Error('两次输入的密码不一致'))
  return Promise.resolve()
}

/** 提交注册：调用接口，成功则提示并跳转登录页，失败则提示后端返回的 message */
const handleSubmit = async (values: API.UserRegisterRequest) => {
  const res = await userRegister(values)
  if (res.data.code === 0 && res.data.data) {
    message.success('注册成功，请登录')
    router.push({
      path: '/user/login',
      replace: true,
    })
  } else {
    message.error('注册失败，' + res.data.message)
  }
}
</script>

<template>
  <div id="userRegisterPage" class="theme-glass-card">
    <h2 class="title">{{ siteConfig.siteName }} · 用户注册</h2>
    <div class="desc">创建账号后即可开始你的个人实验与记录</div>

    <a-form :model="formState" name="register" autocomplete="off" @finish="handleSubmit">
      <a-form-item
        name="userAccount"
        :rules="[
          { required: true, message: '请输入账号' },
          { min: 4, message: '账号不能小于 4 位' },
        ]"
      >
        <a-input v-model:value="formState.userAccount" placeholder="请输入账号" />
      </a-form-item>

      <a-form-item
        name="userPassword"
        :rules="[
          { required: true, message: '请输入密码' },
          { min: 8, message: '密码不能小于 8 位' },
        ]"
      >
        <a-input-password v-model:value="formState.userPassword" placeholder="请输入密码" />
      </a-form-item>

      <a-form-item
        name="checkPassword"
        :rules="[
          { required: true, message: '请再次输入密码' },
          {
            validator: validateCheckPassword,
          },
        ]"
      >
        <a-input-password v-model:value="formState.checkPassword" placeholder="确认密码" />
      </a-form-item>

      <div class="tips">
        已有账号？
        <RouterLink to="/user/login">去登录</RouterLink>
      </div>

      <a-form-item>
        <a-button type="primary" html-type="submit" style="width: 100%">注册</a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<style scoped>
#userRegisterPage {
  max-width: 420px;
  margin: 24px auto;
  padding: 24px;
}

.title {
  text-align: center;
  margin-bottom: 16px;
  color: var(--color-text-primary);
}

.desc {
  text-align: center;
  color: var(--color-text-muted);
  margin-bottom: 16px;
}

.tips {
  margin-bottom: 16px;
  color: var(--color-text-muted);
  font-size: 13px;
  text-align: right;
}

#userRegisterPage :deep(.ant-input),
#userRegisterPage :deep(.ant-input-affix-wrapper),
#userRegisterPage :deep(.ant-btn),
#userRegisterPage :deep(.ant-input-password) {
  border-radius: var(--radius-md);
}

#userRegisterPage :deep(.ant-input),
#userRegisterPage :deep(.ant-input-affix-wrapper) {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--color-border);
  color: var(--color-text-primary);
}
</style>
