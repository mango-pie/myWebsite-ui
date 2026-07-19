<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { Send } from 'lucide-vue-next'
import { addApp } from '@/api/appController'
import { useLoginUserStore } from '@/stores/loginUser'
import { siteConfig } from '@/config/site'
import { loadAppSettings, type AppUxSettings } from '@/utils/appSettings'
import IconAction from '@/components/ui/IconAction.vue'

const router = useRouter()
const loginUserStore = useLoginUserStore()
const quickPrompts = [...siteConfig.quickPrompts]
const initPrompt = ref('')
const creating = ref(false)
const appUx = ref<AppUxSettings>({
  codegenEnabled: true,
  defaultCodeGenType: 'html',
  deployEnabled: true,
  publicHostDisplay: '',
})

const handleCreate = async () => {
  if (!appUx.value.codegenEnabled) {
    message.warning('应用生成已在站点设置中关闭')
    return
  }
  if (!initPrompt.value.trim()) {
    message.warning('请输入提示词')
    return
  }
  if (!loginUserStore.loginUser.id) {
    message.warning('请先登录')
    router.push('/user/login')
    return
  }
  creating.value = true
  try {
    const res = await addApp({
      initPrompt: initPrompt.value.trim(),
      appName: initPrompt.value.trim().slice(0, 20),
      codeGenType: appUx.value.defaultCodeGenType || 'html',
    })
    if (res.data.code === 0 && res.data.data) {
      router.push('/app/chat/' + res.data.data + '?initPrompt=' + encodeURIComponent(initPrompt.value.trim()))
    } else {
      message.error('创建失败，' + res.data.message)
    }
  } finally {
    creating.value = false
  }
}

onMounted(async () => {
  appUx.value = await loadAppSettings()
})
</script>

<template>
  <div class="lab-create">
    <a-alert
      v-if="!appUx.codegenEnabled"
      type="warning"
      show-icon
      style="margin-bottom: 16px"
      message="应用生成已关闭。管理员可在「站点设置 → 应用生成」中重新开启。"
    />
    <div v-else class="lab-create__input-wrap">
      <a-textarea
        v-model:value="initPrompt"
        :placeholder="siteConfig.heroLabPlaceholder"
        :auto-size="{ minRows: 5, maxRows: 10 }"
        class="lab-create__textarea"
        @keydown.enter.exact.prevent="handleCreate"
      />
      <div class="lab-create__footer">
        <IconAction
          :icon="Send"
          label="开始生成"
          variant="primary"
          size="lg"
          motion="send"
          :loading="creating"
          @click="handleCreate"
        />
      </div>
    </div>
    <div v-if="appUx.codegenEnabled" class="lab-create__quick-tags">
      <span class="lab-create__quick-label">快捷提示</span>
      <a-tag
        v-for="tag in quickPrompts"
        :key="tag"
        class="lab-create__quick-tag"
        @click="initPrompt = tag"
      >
        {{ tag }}
      </a-tag>
    </div>
  </div>
</template>

<style scoped>
.lab-create__input-wrap {
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  padding: 20px;
  transition: border-color var(--transition-normal);
}

.lab-create__input-wrap:focus-within {
  border-color: rgba(232, 121, 169, 0.45);
  box-shadow: var(--shadow-glow);
}

.lab-create__textarea {
  border: none !important;
  box-shadow: none !important;
  resize: none;
  font-size: 16px;
  padding: 0;
  background: transparent !important;
  color: var(--color-text-primary) !important;
}

.lab-create__textarea::placeholder {
  color: var(--color-text-muted);
}

.lab-create__footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.lab-create__send-btn {
  background: var(--gradient-primary) !important;
  border: none !important;
  box-shadow: var(--shadow-glow);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.lab-create__quick-tags {
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.lab-create__quick-label {
  font-size: 13px;
  color: var(--color-text-muted);
}

.lab-create__quick-tag {
  cursor: pointer;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  transition: all var(--transition-normal);
}

.lab-create__quick-tag:hover {
  border-color: rgba(232, 121, 169, 0.4);
  color: var(--color-text-primary);
}
</style>
