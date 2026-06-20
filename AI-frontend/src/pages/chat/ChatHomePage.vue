<script setup lang="ts">

import { ref, onMounted } from 'vue'

import { useRouter } from 'vue-router'

import { message } from 'ant-design-vue'

import { resolveDefault } from '@/api/chatConversationController'

import { getConfigs } from '@/api/chatController'

import { useLoginUserStore } from '@/stores/loginUser'

import { siteConfig } from '@/config/site'

import { getChatConfigStorageKey, saveLastChatConversationId } from '@/utils/chatSession'



const router = useRouter()

const loginUserStore = useLoginUserStore()



const inputValue = ref('')

const enteringChat = ref(false)



interface ChatRole {

  id?: string

  name?: string

  description?: string

}

const roles = ref<ChatRole[]>([])

const selectedConfigId = ref<string>('')

const loadingRoles = ref(false)



const handleCreateAndChat = async () => {

  if (!inputValue.value.trim()) {

    message.warning('请输入提示词')

    return

  }

  if (!loginUserStore.loginUser.id) {

    message.warning('请先登录')

    router.push('/user/login')

    return

  }

  if (!selectedConfigId.value && roles.value.length > 0) {

    selectedConfigId.value = roles.value[0]?.id || ''

  }

  if (!selectedConfigId.value) {

    message.warning('暂无可用角色，请稍后重试或联系管理员配置 AstrBot 预设')

    return

  }

  enteringChat.value = true

  try {

    const res = await resolveDefault({ configId: selectedConfigId.value })

    if (res.data.code === 0 && res.data.data?.id != null) {

      const conversationId = String(res.data.data.id)

      localStorage.setItem(getChatConfigStorageKey(selectedConfigId.value), selectedConfigId.value)

      saveLastChatConversationId(conversationId)

      const init = encodeURIComponent(inputValue.value.trim())

      const cfg = encodeURIComponent(selectedConfigId.value)

      router.push(`/chat/${conversationId}?initPrompt=${init}&configId=${cfg}`)

    } else {

      message.error('进入对话失败，' + (res.data.message || '未知错误'))

    }

  } catch {

    message.error('进入对话失败，请重试')

  } finally {

    enteringChat.value = false

  }

}



const loadRoles = async () => {

  loadingRoles.value = true

  try {

    const res = await getConfigs()

    if (res.data.code === 0 && res.data.data) {

      roles.value = res.data.data || []

      if (roles.value.length > 0 && !selectedConfigId.value) {

        selectedConfigId.value = roles.value[0]?.id || ''

      }

    }

  } catch (e) {

    console.warn('加载聊天角色列表失败', e)

  } finally {

    loadingRoles.value = false

  }

}



onMounted(() => {

  void loadRoles()

})

</script>



<template>

  <div id="chatHomePage">

    <div class="hero">

      <h1 class="hero__title">

        {{ siteConfig.heroLabTitle }}

      </h1>

      <p class="hero__desc">选择 AI 角色，开始新对话</p>

      <div class="hero__input-wrap">

        <div class="hero__type-selector">

          <a-select

            v-model:value="selectedConfigId"

            :options="roles.map((r) => ({ value: r.id, label: r.name || r.id }))"

            placeholder="选择 AI 角色"

            :disabled="enteringChat || loadingRoles"

            :loading="loadingRoles"

            class="hero__role-select"

          />

          <p v-if="roles.length === 0 && !loadingRoles" class="hero__role-hint">

            暂无可用角色，请在 AstrBot WebUI 配置预设后刷新

          </p>

        </div>



        <a-textarea

          v-model:value="inputValue"

          placeholder="输入您的问题或指令..."

          :auto-size="{ minRows: 3, maxRows: 6 }"

          class="hero__textarea"

          :disabled="enteringChat"

          @keydown.enter.exact.prevent="handleCreateAndChat"

        />

        <div class="hero__input-footer">

          <a-button

            type="primary"

            size="large"

            :loading="enteringChat"

            class="hero__send-btn"

            @click="handleCreateAndChat"

          >

            开始对话

          </a-button>

        </div>

      </div>

    </div>

  </div>

</template>



<style scoped>

#chatHomePage {

  max-width: 700px;

  margin: 0 auto;

  padding: 40px 16px;

  min-height: calc(100vh - 64px);

  background: transparent;

}



.hero {

  text-align: center;

}



.hero__title {

  font-size: 36px;

  font-weight: 700;

  background: var(--gradient-primary);

  -webkit-background-clip: text;

  -webkit-text-fill-color: transparent;

  background-clip: text;

  margin-bottom: 12px;

}



.hero__desc {

  color: var(--color-text-secondary);

  font-size: 16px;

  margin-bottom: 28px;

}



.hero__input-wrap {

  background: var(--color-bg-card);

  border-radius: var(--radius-lg);

  border: 1px solid var(--color-border);

  box-shadow: var(--shadow-md);

  backdrop-filter: blur(16px);

  padding: 16px;

}



.hero__type-selector {

  margin-bottom: 12px;

  text-align: left;

}



.hero__role-select {

  width: 100%;

}



.hero__role-hint {

  margin: 6px 0 0;

  font-size: 12px;

  color: var(--color-text-muted);

}



.hero__textarea {

  border: none !important;

  box-shadow: none !important;

  resize: none;

  font-size: 15px;

  padding: 0;

  background: transparent !important;

  color: var(--color-text-primary) !important;

}



.hero__textarea::placeholder {

  color: var(--color-text-muted);

}



.hero__input-footer {

  margin-top: 12px;

  text-align: right;

}



.hero__send-btn {

  font-size: 15px;

  padding: 8px 24px;

  background: var(--gradient-primary) !important;

  border: none !important;

  box-shadow: var(--shadow-glow);

}



.hero__type-selector :deep(.ant-select-selector) {

  background: rgba(255, 255, 255, 0.04) !important;

  border-color: var(--color-border) !important;

  color: var(--color-text-primary);

}



.hero__type-selector :deep(.ant-select-selection-placeholder) {

  color: var(--color-text-muted);

}

</style>

