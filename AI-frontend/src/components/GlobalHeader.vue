<script setup lang="ts">
/**
 * 全局顶栏 - 左侧 Logo/标题、中间导航菜单、右侧登录态
 * 已登录：显示头像+昵称，点击展开下拉（个人信息 / 退出登录）
 * 未登录：显示“登录”按钮，点击跳转登录页
 */
import { useLoginUserStore } from '@/stores/loginUser.ts'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { userLogout } from '@/api/userController'

/** 导航菜单单项，与 BasicLayout 中的 MenuItem 一致 */
interface MenuItem {
  key: string
  label: string
  path: string
}

const props = defineProps<{
  menuItems: MenuItem[]
  selectedKeys: string[]
}>()

const emit = defineEmits<{
  (e: 'menuClick', key: string): void
}>()

const router = useRouter()
const logoSrc = new URL('../assets/logo.svg', import.meta.url).href
const loginUserStore = useLoginUserStore()

/** 顶部水平菜单点击：把 key 回传给父布局，由父组件负责跳转 */
const handleMenuClick = (info: { key: string | number }) => {
  emit('menuClick', String(info.key))
}

type MenuClickEvent = { key: string | number }

/** 头像下拉菜单点击：“个人信息”跳转个人页，“退出登录”调接口并清空状态后跳转登录页 */
const handleAvatarClick = async ({ key }: MenuClickEvent) => {
  if (key === 'profile') {
    await router.push('/user/profile')
    return
  }
  if (key === 'logout') {
    const res = await userLogout()
    if (res.data.code === 0 && res.data.data) {
      loginUserStore.setLoginUser({ userName: '未登录' })
      message.success('已退出登录')
      await router.push('/user/login')
    } else {
      message.error('退出失败，' + res.data.message)
    }
  }
}
</script>

<template>
  <div class="global-header">
    <!-- 左侧：Logo + 平台名 -->
    <div class="global-header__left">
      <img class="global-header__logo" :src="logoSrc" alt="Logo" />
      <span class="global-header__title">AI 场景平台</span>
    </div>

    <!-- 中间：水平导航（首页/用户管理(仅管理员)/关于），由父组件传入并高亮 -->
    <div class="global-header__center">
      <a-menu
        mode="horizontal"
        :items="props.menuItems"
        :selectedKeys="props.selectedKeys"
        @click="handleMenuClick"
      />
    </div>

    <!-- 右侧：已登录显示头像+下拉；未登录显示登录按钮 -->
    <div class="user-login-status">
      <div v-if="loginUserStore.loginUser.id">
        <a-dropdown
          placement="bottomRight"
          :trigger="['click']"
        >
          <a-space class="user-entry" size="small">
            <a-avatar :src="loginUserStore.loginUser.userAvatar" />
            <span class="user-entry__name">{{ loginUserStore.loginUser.userName ?? '无名' }}</span>
          </a-space>
          <template #overlay>
            <a-menu @click="handleAvatarClick">
              <a-menu-item key="profile">个人信息</a-menu-item>
              <a-menu-divider />
              <a-menu-item key="logout">退出登录</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
      <div v-else>
        <a-button type="primary" @click="router.push('/user/login')">登录</a-button>
      </div>
    </div>
  </div>
</template>



<style scoped>
.global-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  padding: 0 24px;
  gap: 16px;
}

.global-header__left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.global-header__logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.global-header__title {
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
}

.global-header__center {
  flex: 1;
  min-width: 0;
  overflow-x: auto;
}

.global-header__right {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.user-entry {
  cursor: pointer;
  user-select: none;
}

.user-entry__name {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .global-header {
    padding: 0 12px;
  }

  .global-header__title {
    font-size: 16px;
  }
}
</style>

