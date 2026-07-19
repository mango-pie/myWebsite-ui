<script setup lang="ts">
/**
 * 个人信息页 - 路径：/user/profile，可从顶栏头像下拉“个人信息”进入
 * 已登录：展示头像、昵称、账号、角色、简介、创建时间；支持编辑昵称/头像/简介，退出登录
 * 未登录：展示 403 结果与“去登录/去注册”按钮
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { Pencil, LogOut, Save, X, LogIn, UserPlus } from 'lucide-vue-next'
import IconAction from '@/components/ui/IconAction.vue'
import { useLoginUserStore } from '@/stores/loginUser'
import { userLogout, updateUser } from '@/api/userController'

const router = useRouter()
const loginUserStore = useLoginUserStore()

// 进入页面时若 store 里还没有用户信息则拉取一次（例如直接访问 /user/profile）
onMounted(async () => {
  if (!loginUserStore.loginUser?.id) {
    await loginUserStore.fetchLoginUser()
  }
})

/** 是否已登录（有 id 即视为已登录） */
const isLogin = computed(() => Boolean(loginUserStore.loginUser?.id))

/** 是否处于编辑模式 */
const editing = ref(false)

/** 编辑表单（仅可修改的字段） */
const form = reactive<{ userName: string; userAvatar: string; userProfile: string }>({
  userName: '',
  userAvatar: '',
  userProfile: '',
})

/** 进入编辑：从当前用户填充表单 */
const startEdit = () => {
  const u = loginUserStore.loginUser
  form.userName = u?.userName ?? ''
  form.userAvatar = u?.userAvatar ?? ''
  form.userProfile = u?.userProfile ?? ''
  editing.value = true
}

/** 取消编辑 */
const cancelEdit = () => {
  editing.value = false
}

/** 保存修改 */
const saveProfile = async () => {
  const id = loginUserStore.loginUser?.id
  if (!id) return
  const res = await updateUser({
    id,
    userName: form.userName.trim() || undefined,
    userAvatar: form.userAvatar.trim() || undefined,
    userProfile: form.userProfile.trim() || undefined,
  })
  if (res.data?.code === 0 && res.data?.data) {
    message.success('保存成功')
    await loginUserStore.fetchLoginUser()
    editing.value = false
  } else {
    message.error('保存失败，' + (res.data?.message ?? '请稍后重试'))
  }
}

const handleGoLogin = () => router.push('/user/login')
const handleGoRegister = () => router.push('/user/register')

/** 退出登录：调用接口后清空 store 并跳转登录页 */
const handleLogout = async () => {
  const res = await userLogout()
  if (res.data.code === 0 && res.data.data) {
    loginUserStore.setLoginUser({ userName: '未登录' })
    message.success('已退出登录')
    router.push({
      path: '/user/login',
      replace: true,
    })
  } else {
    message.error('退出失败，' + res.data.message)
  }
}
</script>

<template>
  <div class="profile-page">
    <a-card title="个人信息" :bordered="false" class="profile-card">
      <!-- 已登录：展示用户信息、编辑入口与退出按钮 -->
      <template v-if="isLogin">
        <a-space direction="vertical" size="middle" style="width: 100%">
          <!-- 查看模式 -->
          <template v-if="!editing">
            <a-space>
              <a-avatar :size="64" :src="loginUserStore.loginUser.userAvatar" />
              <div class="profile-meta">
                <div class="profile-name">{{ loginUserStore.loginUser.userName ?? '无名' }}</div>
                <div class="profile-account">账号：{{ loginUserStore.loginUser.userAccount ?? '-' }}</div>
              </div>
            </a-space>

            <a-descriptions :column="1" size="small" bordered>
              <a-descriptions-item label="用户角色">
                {{ loginUserStore.loginUser.userRole ?? '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="个人简介">
                {{ loginUserStore.loginUser.userProfile ?? '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="创建时间">
                {{ loginUserStore.loginUser.createTime ?? '-' }}
              </a-descriptions-item>
            </a-descriptions>

            <a-space>
              <IconAction :icon="Pencil" label="修改信息" variant="primary" motion="pop" @click="startEdit" />
              <IconAction :icon="LogOut" label="退出登录" variant="danger" motion="slide" @click="handleLogout" />
            </a-space>
          </template>

          <!-- 编辑模式 -->
          <template v-else>
            <a-form layout="vertical" style="max-width: 480px">
              <a-form-item label="用户名">
                <a-input v-model:value="form.userName" placeholder="请输入用户名" allow-clear />
              </a-form-item>
              <a-form-item label="头像地址">
                <a-input v-model:value="form.userAvatar" placeholder="请输入头像图片 URL" allow-clear />
                <template v-if="form.userAvatar">
                  <a-avatar :size="48" :src="form.userAvatar" class="profile-edit-avatar" />
                </template>
              </a-form-item>
              <a-form-item label="个人简介">
                <a-textarea
                  v-model:value="form.userProfile"
                  placeholder="请输入个人简介"
                  :rows="4"
                  allow-clear
                />
              </a-form-item>
              <a-space>
                <IconAction :icon="Save" label="保存" variant="primary" motion="pop" @click="saveProfile" />
                <IconAction :icon="X" label="取消" variant="soft" @click="cancelEdit" />
              </a-space>
            </a-form>
          </template>
        </a-space>
      </template>

      <!-- 未登录：提示并引导去登录/注册 -->
      <template v-else>
        <a-result status="403" title="未登录" sub-title="登录后即可查看个人信息。">
          <template #extra>
            <a-space>
              <IconAction :icon="LogIn" label="去登录" variant="primary" motion="pop" @click="handleGoLogin" />
              <IconAction :icon="UserPlus" label="去注册" variant="soft" motion="pop" @click="handleGoRegister" />
            </a-space>
          </template>
        </a-result>
      </template>
    </a-card>
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 880px;
  margin: 0 auto;
}

.profile-card {
  border-radius: var(--radius-lg);
}

.profile-card :deep(.ant-card) {
  background: transparent;
}

.profile-card :deep(.ant-card-head),
.profile-card :deep(.ant-card-body),
.profile-card :deep(.ant-descriptions-view),
.profile-card :deep(.ant-descriptions-row > th),
.profile-card :deep(.ant-descriptions-row > td) {
  background: var(--color-bg-card) !important;
  border-color: var(--color-border) !important;
  color: var(--color-text-primary) !important;
}

.profile-card :deep(.ant-input),
.profile-card :deep(.ant-input-affix-wrapper),
.profile-card :deep(.ant-input-textarea textarea) {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--color-border);
  color: var(--color-text-primary);
}

.profile-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profile-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.profile-account {
  color: var(--color-text-muted);
  font-size: 13px;
}

.profile-edit-avatar {
  display: block;
  margin-top: 8px;
  border-radius: 8px;
}
</style>

