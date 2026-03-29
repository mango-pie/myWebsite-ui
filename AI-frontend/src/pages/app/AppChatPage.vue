<script setup lang="ts">
/**
 * 应用生成对话页 - /app/chat/:appId
 * 左侧：消息列表 + 输入框；右侧：生成的网页预览
 * 顶部栏右侧：应用详情 + 部署按钮
 * 部署成功后弹出 Modal 展示 URL
 */
import { ref, onMounted, nextTick, h, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { getAppById, deployApp } from '@/api/appController'
import { getLatestChatHistory, listAppChatHistory } from '@/api/chatHistoryController'
import {
  RocketOutlined,
  SendOutlined,
  ArrowLeftOutlined,
  CheckCircleFilled,
  ReloadOutlined,
} from '@ant-design/icons-vue'
import { marked, Renderer } from 'marked'
import hljs from 'highlight.js/lib/core'
// 按需注册常用语言
import langHtml from 'highlight.js/lib/languages/xml'
import langCss from 'highlight.js/lib/languages/css'
import langJs from 'highlight.js/lib/languages/javascript'
import langTs from 'highlight.js/lib/languages/typescript'
import langJson from 'highlight.js/lib/languages/json'
import langBash from 'highlight.js/lib/languages/bash'
import langMarkdown from 'highlight.js/lib/languages/markdown'
import 'highlight.js/styles/github.css'

hljs.registerLanguage('html', langHtml)
hljs.registerLanguage('xml', langHtml)
hljs.registerLanguage('css', langCss)
hljs.registerLanguage('javascript', langJs)
hljs.registerLanguage('js', langJs)
hljs.registerLanguage('typescript', langTs)
hljs.registerLanguage('ts', langTs)
hljs.registerLanguage('json', langJson)
hljs.registerLanguage('bash', langBash)
hljs.registerLanguage('sh', langBash)
hljs.registerLanguage('markdown', langMarkdown)

// 配置 marked：启用 GFM + 换行，自定义代码块渲染
const renderer = new Renderer()
renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
  const language = lang && hljs.getLanguage(lang) ? lang : ''
  const highlighted = language
    ? hljs.highlight(text, { language }).value
    : hljs.highlightAuto(text).value
  const langLabel = language || 'code'
  return `<div class="code-block"><div class="code-block__header"><span class="code-block__lang">${langLabel}</span><button class="code-block__copy" onclick="navigator.clipboard.writeText(this.closest('.code-block').querySelector('code').innerText)">复制</button></div><pre><code class="hljs language-${langLabel}">${highlighted}</code></pre></div>`
}
marked.use({ renderer, breaks: true, gfm: true })

const route = useRoute()
const router = useRouter()
const appId = (route.params.appId as string) || ''
const initPrompt = route.query.initPrompt as string | undefined

const appInfo = ref<API.AppVO | null>(null)

interface ChatMessage {
  role: 'user' | 'ai'
  content: string
  isStreaming?: boolean
  id?: string
  createTime?: string
}
const messages = ref<ChatMessage[]>([])
const messagesEndRef = ref<HTMLElement | null>(null)
const inputValue = ref('')
const isStreaming = ref(false)

// 对话历史相关
const loadingHistory = ref(false)
const hasMoreHistory = ref(true)
const lastCreateTime = ref<string>('')

// 预览
const previewUrl = ref('')
const deploying = ref(false)
const deployKey = ref('')

// 部署成功弹窗
const deployModalVisible = ref(false)
const deployedUrl = ref('')

const scrollToBottom = async () => {
  await nextTick()
  messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' })
}

const scrollToTop = async () => {
  await nextTick()
  const messagesContainer = document.querySelector('.chat-messages')
  messagesContainer?.scrollTo({ top: 0, behavior: 'smooth' })
}

/** 渲染 AI 消息的 Markdown（含代码高亮） */
function renderMarkdown(text: string): string {
  return marked.parse(text) as string
}

const fetchAppInfo = async () => {
  const res = await getAppById({ id: appId })
  if (res.data.code === 0 && res.data.data) {
    appInfo.value = res.data.data
    if (res.data.data.deployKey) {
      const k = res.data.data.deployKey.replace(/^https?:\/\/[^/]+\//, '').replace(/\/+$/, '')
      deployKey.value = k
      previewUrl.value = `${import.meta.env.VITE_DEPLOY_BASE_URL}/${k}/`
    }
  }
}

const fetchChatHistory = async (isLoadMore = false) => {
  if (loadingHistory.value) return
  
  loadingHistory.value = true
  try {
    const params: API.getLatestChatHistoryParams = {
      appId: appId,
      limit: 10
    }
    
    if (isLoadMore && lastCreateTime.value) {
      const res = await listAppChatHistory({
        appId: appId,
        pageSize: 10,
        lastCreateTime: lastCreateTime.value
      })
      
      if (res.data.code === 0 && res.data.data) {
        const historyMessages = res.data.data.records || []
        if (historyMessages.length < 10) {
          hasMoreHistory.value = false
        }
        
        if (historyMessages.length > 0) {
          lastCreateTime.value = historyMessages[0].createTime || ''
          const newMessages = historyMessages.map((msg) => ({
            id: msg.id?.toString(),
            role: msg.messageType === 'user' ? 'user' : 'ai',
            content: msg.message || '',
            createTime: msg.createTime
          }))
          messages.value = [...newMessages, ...messages.value]
          await scrollToTop()
        }
      }
    } else {
      const res = await getLatestChatHistory(params)
      if (res.data.code === 0 && res.data.data) {
        const historyMessages = res.data.data || []
        if (historyMessages.length > 0) {
          lastCreateTime.value = historyMessages[0].createTime || ''
          messages.value = historyMessages.map((msg) => ({
            id: msg.id?.toString(),
            role: msg.messageType === 'user' ? 'user' : 'ai',
            content: msg.message || '',
            createTime: msg.createTime
          }))
        }
      }
    }
  } finally {
    loadingHistory.value = false
  }
}

const loadMoreHistory = async () => {
  if (hasMoreHistory.value) {
    await fetchChatHistory(true)
  }
}

const sendMessage = async (userMsg: string) => {
  if (!userMsg.trim() || isStreaming.value) return
  messages.value.push({ role: 'user', content: userMsg })
  inputValue.value = ''
  await scrollToBottom()

  const aiMsg: ChatMessage = { role: 'ai', content: '', isStreaming: true }
  messages.value.push(aiMsg)
  isStreaming.value = true

  try {
    const url = `${import.meta.env.VITE_API_BASE_URL}/app/chat/gen/code?appId=${appId}&message=${encodeURIComponent(userMsg)}`
    const response = await fetch(url, { credentials: 'include' })
    if (!response.ok || !response.body) throw new Error('请求失败')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let streamError = false

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        // 解析 SSE 格式：data:{"d":"文字内容"}
        const matches = chunk.matchAll(/data:\s*(\{[^}]*\})/g)
        for (const match of matches) {
          try {
            const raw = match[1]
            if (!raw) continue
            const json = JSON.parse(raw)
            const text: string = json.d ?? ''
            if (text) {
              const last = messages.value[messages.value.length - 1]
              if (last?.role === 'ai') last.content += text
            }
          } catch {
            // 解析失败跳过
          }
        }
        await scrollToBottom()
      }
    } catch {
      streamError = true
    }

    const last = messages.value[messages.value.length - 1]
    if (last?.role === 'ai') last.isStreaming = false
    isStreaming.value = false

    if (!streamError) {
      // 流结束后自动部署并展示预览
      await handleDeploy(true)
    }
  } catch {
    const last = messages.value[messages.value.length - 1]
    if (last?.role === 'ai') last.isStreaming = false
    isStreaming.value = false
    message.error('发送失败，请重试')
  }
}

const handleSend = () => {
  if (inputValue.value.trim()) sendMessage(inputValue.value.trim())
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

/**
 * @param silent - true 时为流结束后自动部署，不弹窗提示失败；false 时为手动点击部署
 */
const handleDeploy = async (silent = false) => {
  if (deploying.value) return
  deploying.value = true
  try {
    const res = await deployApp({ appId: appId })
    if (res.data.code === 0 && res.data.data) {
      const raw = res.data.data as string
      // 后端可能返回完整 URL 或纯 key，统一提取最后一段路径作为 key
      const key = raw.replace(/^https?:\/\/[^/]+\//, '').replace(/\/+$/, '')
      deployKey.value = key
      const url = `${import.meta.env.VITE_DEPLOY_BASE_URL}/${key}/`
      previewUrl.value = url
      deployedUrl.value = url
      // 手动点击部署时弹出成功弹窗
      if (!silent) deployModalVisible.value = true
    } else if (!silent) {
      message.error('部署失败：' + res.data.message)
    }
  } finally {
    deploying.value = false
  }
}

const copyDeployUrl = () => {
  navigator.clipboard.writeText(deployedUrl.value).then(() => message.success('已复制'))
}

const goToDetail = () => router.push(`/app/edit/${appId}`)

onMounted(async () => {
  await fetchAppInfo()
  await fetchChatHistory()
  
  // 修改自动发送初始消息的逻辑：如果是自己的 app，并且没有对话历史，才自动将 initPrompt 作为第一条消息触发对话
  if (initPrompt && messages.value.length === 0) {
    await sendMessage(initPrompt)
  }
  
  // 修改网站展示的逻辑：进入页面时，如果 app 有至少 2 条对话记录，也展示对应的网站
  if (messages.value.length >= 2 && appInfo.value?.deployKey) {
    const k = appInfo.value.deployKey.replace(/^https?:\/\/[^/]+\//, '').replace(/\/+$/, '')
    deployKey.value = k
    previewUrl.value = `${import.meta.env.VITE_DEPLOY_BASE_URL}/${k}/`
  }
})
</script>

<template>
  <div class="chat-page">
    <!-- 顶部栏 -->
    <div class="chat-header">
      <div class="chat-header__left">
        <a-button type="text" :icon="h(ArrowLeftOutlined)" @click="router.push('/')" />
        <span class="chat-header__title">{{ appInfo?.appName ?? '应用生成' }}</span>
      </div>
      <div class="chat-header__right">
        <a-button style="margin-right: 8px" @click="goToDetail">应用详情</a-button>
        <a-button
          type="primary"
          :icon="h(RocketOutlined)"
          :loading="deploying"
          @click="handleDeploy(false)"
        >
          部署
        </a-button>
      </div>
    </div>

    <!-- 核心内容区 -->
    <div class="chat-body">
      <!-- 左侧对话区 -->
      <div class="chat-left">
        <div class="chat-messages">
          <!-- 加载更多按钮 -->
          <div v-if="hasMoreHistory" class="load-more-container">
            <a-button 
              type="link" 
              :loading="loadingHistory" 
              @click="loadMoreHistory"
              icon="<ReloadOutlined />"
            >
              加载更多历史消息
            </a-button>
          </div>
          
          <div
            v-for="(msg, idx) in messages"
            :key="msg.id || idx"
            :class="['chat-msg', msg.role === 'user' ? 'chat-msg--user' : 'chat-msg--ai']"
          >
            <div v-if="msg.role === 'ai'" class="chat-msg__avatar">🤖</div>
            <div class="chat-msg__bubble">
              <span v-if="msg.isStreaming && !msg.content" class="chat-msg__typing">
                <span class="dot" /><span class="dot" /><span class="dot" />
              </span>
              <!-- AI 消息用 marked 渲染 Markdown -->
              <div
                v-else-if="msg.role === 'ai'"
                class="chat-msg__markdown"
                v-html="renderMarkdown(msg.content ?? '')"
              />
              <span v-else class="chat-msg__text">{{ msg.content }}</span>
            </div>
            <div v-if="msg.role === 'user'" class="chat-msg__avatar">👤</div>
          </div>
          <div ref="messagesEndRef" />
        </div>

        <!-- 输入框 -->
        <div class="chat-input-area">
          <a-textarea
            v-model:value="inputValue"
            placeholder="描述越详细，页面越具体，可以一步一步完善生成效果"
            :auto-size="{ minRows: 2, maxRows: 5 }"
            :disabled="isStreaming"
            @keydown="handleKeydown"
          />
          <a-button
            type="primary"
            shape="circle"
            :icon="h(SendOutlined)"
            :disabled="isStreaming || !inputValue.trim()"
            class="chat-send-btn"
            @click="handleSend"
          />
        </div>
      </div>

      <!-- 右侧预览区 -->
      <div class="chat-right">
        <div v-if="!previewUrl" class="chat-preview-placeholder">
          <div class="chat-preview-placeholder__inner">
            <p>🎨 生成后的网页将在这里展示</p>
            <p style="font-size: 13px; color: #aaa">等待 AI 生成完成...</p>
          </div>
        </div>
        <iframe
          v-else
          :src="previewUrl"
          class="chat-preview-iframe"
          sandbox="allow-scripts allow-same-origin"
          title="生成的网页预览"
        />
      </div>
    </div>

    <!-- 部署成功弹窗 -->
    <a-modal
      v-model:open="deployModalVisible"
      :footer="null"
      :closable="false"
      centered
      width="420px"
    >
      <div class="deploy-modal">
        <CheckCircleFilled class="deploy-modal__icon" />
        <div class="deploy-modal__title">网站部署成功！</div>
        <div class="deploy-modal__url-row">
          <a-input :value="deployedUrl" readonly class="deploy-modal__url-input" />
          <a-button type="primary" @click="copyDeployUrl">复制</a-button>
        </div>
        <div class="deploy-modal__actions">
          <a :href="deployedUrl" target="_blank">
            <a-button type="primary">访问网站</a-button>
          </a>
          <a-button @click="deployModalVisible = false">关闭</a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
  background: #f7f8fa;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 52px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.chat-header__left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-header__title {
  font-size: 16px;
  font-weight: 600;
}

.chat-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.chat-left {
  width: 400px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #f0f0f0;
  background: #fff;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.load-more-container {
  display: flex;
  justify-content: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 8px;
}

.chat-msg {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.chat-msg--user {
  flex-direction: row-reverse;
}

.chat-msg__avatar {
  font-size: 22px;
  flex-shrink: 0;
  margin-top: 2px;
}

.chat-msg__bubble {
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 12px;
  background: #f0f2f5;
  font-size: 13px;
  line-height: 1.6;
}

.chat-msg--user .chat-msg__bubble {
  background: #1677ff;
  color: #fff;
}

.chat-msg__text {
  white-space: pre-wrap;
  word-break: break-word;
}

/* Markdown 渲染区域 */
.chat-msg__markdown {
  word-break: break-word;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.7;
  color: #1a1a1a;
}

.chat-msg__markdown :deep(p) {
  margin: 0 0 8px;
}

.chat-msg__markdown :deep(p:last-child) {
  margin-bottom: 0;
}

.chat-msg__markdown :deep(h1),
.chat-msg__markdown :deep(h2),
.chat-msg__markdown :deep(h3),
.chat-msg__markdown :deep(h4) {
  margin: 12px 0 6px;
  font-weight: 600;
  line-height: 1.4;
  color: #111;
}

.chat-msg__markdown :deep(h1) {
  font-size: 16px;
}
.chat-msg__markdown :deep(h2) {
  font-size: 15px;
}
.chat-msg__markdown :deep(h3) {
  font-size: 14px;
}
.chat-msg__markdown :deep(h4) {
  font-size: 13px;
}

.chat-msg__markdown :deep(ul),
.chat-msg__markdown :deep(ol) {
  padding-left: 20px;
  margin: 4px 0 8px;
}

.chat-msg__markdown :deep(li) {
  margin: 2px 0;
}

.chat-msg__markdown :deep(blockquote) {
  margin: 8px 0;
  padding: 6px 12px;
  border-left: 3px solid #d0d7de;
  background: #f6f8fa;
  color: #57606a;
  border-radius: 0 4px 4px 0;
}

.chat-msg__markdown :deep(hr) {
  border: none;
  border-top: 1px solid #e8e8e8;
  margin: 10px 0;
}

.chat-msg__markdown :deep(a) {
  color: #1677ff;
  text-decoration: none;
}

.chat-msg__markdown :deep(a:hover) {
  text-decoration: underline;
}

.chat-msg__markdown :deep(table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  margin: 8px 0;
}

.chat-msg__markdown :deep(th),
.chat-msg__markdown :deep(td) {
  border: 1px solid #d0d7de;
  padding: 5px 10px;
  text-align: left;
}

.chat-msg__markdown :deep(th) {
  background: #f6f8fa;
  font-weight: 600;
}

/* 行内代码 */
.chat-msg__markdown :deep(code:not(pre code)) {
  background: #eef0f3;
  color: #c7254e;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}

/* 代码块容器 */
.chat-msg__markdown :deep(.code-block) {
  margin: 8px 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e8e8e8;
  background: #f6f8fa;
}

.chat-msg__markdown :deep(.code-block__header) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: #e8eaed;
  border-bottom: 1px solid #d8dde3;
}

.chat-msg__markdown :deep(.code-block__lang) {
  font-size: 11px;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.chat-msg__markdown :deep(.code-block__copy) {
  font-size: 11px;
  color: #666;
  background: none;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 1px 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.chat-msg__markdown :deep(.code-block__copy:hover) {
  background: #fff;
  color: #1677ff;
  border-color: #1677ff;
}

.chat-msg__markdown :deep(pre) {
  margin: 0;
  padding: 12px 14px;
  overflow-x: auto;
  background: #f6f8fa;
}

.chat-msg__markdown :deep(pre code) {
  font-size: 12px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  line-height: 1.6;
  background: none;
  padding: 0;
  color: inherit;
}

.chat-msg__typing {
  display: flex;
  gap: 4px;
  align-items: center;
  height: 20px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #999;
  animation: blink 1.2s infinite;
}
.dot:nth-child(2) {
  animation-delay: 0.2s;
}
.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes blink {
  0%,
  80%,
  100% {
    opacity: 0.2;
  }
  40% {
    opacity: 1;
  }
}

.chat-input-area {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.chat-input-area :deep(.ant-input) {
  border-radius: 10px;
  resize: none;
}

.chat-send-btn {
  flex-shrink: 0;
  margin-bottom: 2px;
}

.chat-right {
  flex: 1;
  overflow: hidden;
  background: #f7f8fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-preview-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.chat-preview-placeholder__inner {
  text-align: center;
  color: #bbb;
  font-size: 15px;
}

.chat-preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
}

/* 部署成功弹窗 */
.deploy-modal {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px 8px;
  gap: 16px;
}

.deploy-modal__icon {
  font-size: 52px;
  color: #52c41a;
}

.deploy-modal__title {
  font-size: 18px;
  font-weight: 600;
  color: #222;
}

.deploy-modal__url-row {
  display: flex;
  gap: 8px;
  width: 100%;
}

.deploy-modal__url-input {
  flex: 1;
}

.deploy-modal__actions {
  display: flex;
  gap: 12px;
}
</style>
