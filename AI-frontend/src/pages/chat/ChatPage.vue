<script setup lang="ts">
defineOptions({ name: 'ChatPage' })

import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import {
  createConversation,
  deleteConversation,
  getConversation,
  listConversations,
  listMessages,
  resolveDefault,
} from '@/api/chatConversationController'
import { getConfigs, getAgentConfig } from '@/api/chatController'
import {
  Send,
  ArrowLeft,
  Trash2,
  MessageSquarePlus,
  X,
  History,
} from 'lucide-vue-next'
import { chatSseLog } from '@/utils/sseChatStream'
import {
  getChatSession,
  startChatStream,
  stopChatStream,
  nextChatClientId,
  type ChatMessage,
} from '@/composables/useChatStreamStore'
import {
  getChatConfigStorageKey,
  saveLastChatConversationId,
} from '@/utils/chatSession'
import { marked, Renderer } from 'marked'
import hljs from 'highlight.js/lib/core'
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
const conversationId = computed(() => (route.params.conversationId as string) || '')
const convIdNum = computed(() => Number(conversationId.value))

const conversationInfo = ref<API.ChatConversationVO | null>(null)
const conversations = ref<API.ChatConversationVO[]>([])
const loadingConversations = ref(false)

const session = computed(() => getChatSession(conversationId.value))
const messages = computed<ChatMessage[]>({
  get: () => session.value.messages.value,
  set: (v) => {
    session.value.messages.value = v
  },
})
const isStreaming = computed(() => session.value.isStreaming.value)

const messagesEndRef = ref<HTMLElement | null>(null)
const inputValue = ref('')

const chatMode = ref<'ask' | 'agent'>(
  (typeof localStorage !== 'undefined' ? (localStorage.getItem('chatMode') as 'ask' | 'agent' | null) : null) || 'ask',
)

const HISTORY_PAGE_SIZE = 10

async function loadConversations() {
  loadingConversations.value = true
  try {
    const res = await listConversations({})
    if (res.data?.code === 0 && res.data?.data) {
      conversations.value = res.data.data
    }
  } catch (e) {
    chatSseLog('loadConversations error', e)
  } finally {
    loadingConversations.value = false
  }
}

async function createNewConversation() {
  try {
    const res = await createConversation({ title: '新对话' })
    if (res.data?.code === 0 && res.data?.data) {
      const newId = String(res.data.data)
      saveLastChatConversationId(newId)
      router.push(`/chat/${newId}`)
      message.success('已创建新对话')
    }
  } catch (e) {
    message.error('创建对话失败')
  }
}

async function deleteConversationById(id: number) {
  Modal.confirm({
    title: '确认删除',
    content: '删除后无法恢复，确定要删除吗？',
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        const res = await deleteConversation({ id })
        if (res.data?.code === 0) {
          message.success('已删除')
          await loadConversations()
          if (convIdNum.value === id) {
            router.push('/chat')
          }
        }
      } catch (e) {
        message.error('删除失败')
      }
    },
  })
}

async function loadConversationInfo() {
  if (!convIdNum.value) return
  try {
    const res = await getConversation({ id: convIdNum.value })
    if (res.data?.code === 0 && res.data?.data) {
      conversationInfo.value = res.data.data
    }
  } catch (e) {
    chatSseLog('loadConversationInfo error', e)
  }
}

async function loadMessages() {
  if (!convIdNum.value) return
  try {
    const res = await listMessages({
      id: convIdNum.value,
      pageNum: 1,
      pageSize: 50,
    })
    if (res.data?.code === 0 && res.data?.data) {
      const historyMsgs = res.data.data.records || []
      messages.value = historyMsgs.map((m: API.ChatMessageVO) => ({
        role: m.messageType === 'user' ? 'user' : 'ai',
        content: m.content || '',
        id: String(m.id),
        createTime: m.createTime,
      }))
    }
  } catch (e) {
    chatSseLog('loadMessages error', e)
  }
}

async function sendMessage() {
  if (!inputValue.value.trim() || isStreaming.value) return
  if (!convIdNum.value) {
    message.warning('请先选择或创建对话')
    return
  }

  const userMessage: ChatMessage = {
    role: 'user',
    content: inputValue.value,
    _clientId: nextChatClientId('u'),
  }

  inputValue.value = ''

  try {
    await startChatStream(String(convIdNum.value), {
      userMessage,
      requestBody: {
        message: userMessage.content,
        conversationId: convIdNum.value,
        mode: chatMode.value,
      },
      mode: chatMode.value,
    })
  } catch (e) {
    message.error('发送失败')
  }
}

function stopStream() {
  if (convIdNum.value) {
    stopChatStream(String(convIdNum.value))
  }
}

function switchMode(mode: 'ask' | 'agent') {
  chatMode.value = mode
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('chatMode', mode)
  }
}

function renderMarkdown(content: string): string {
  if (!content) return ''
  try {
    return marked.parse(content) as string
  } catch {
    return content
  }
}

function scrollToBottom() {
  nextTick(() => {
    messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' })
  })
}

import { nextTick, watch } from 'vue'

watch(messages, () => {
  scrollToBottom()
}, { deep: true })

onMounted(async () => {
  await loadConversations()
  if (convIdNum.value) {
    await loadConversationInfo()
    await loadMessages()
  }
})
</script>

<template>
  <div class="chat-container">
    <aside class="conv-sidebar">
      <div class="sidebar-header">
        <button class="btn-new" @click="createNewConversation">
          <MessageSquarePlus :size="18" />
          新对话
        </button>
      </div>
      <div class="conv-list">
        <div
          v-for="conv in conversations"
          :key="conv.id"
          class="conv-item"
          :class="{ active: conv.id === convIdNum }"
          @click="router.push(`/chat/${String(conv.id)}`)"
        >
          <div class="conv-title">{{ conv.title || '未命名对话' }}</div>
          <button class="conv-delete" @click.stop="deleteConversationById(Number(conv.id))">
            <Trash2 :size="14" />
          </button>
        </div>
      </div>
    </aside>

    <main class="chat-main">
      <header class="chat-header">
        <div class="header-left">
          <button class="btn-back" @click="router.push('/chat')">
            <ArrowLeft :size="18" />
          </button>
          <h2>{{ conversationInfo?.title || '对话' }}</h2>
        </div>
        <div class="mode-switch">
          <button :class="{ active: chatMode === 'ask' }" @click="switchMode('ask')">Ask</button>
          <button :class="{ active: chatMode === 'agent' }" @click="switchMode('agent')">Agent</button>
        </div>
      </header>

      <div class="messages-area">
        <div v-if="messages.length === 0" class="empty-state">
          <div class="empty-icon">💬</div>
          <p>开始对话吧</p>
        </div>

        <div v-for="(msg, idx) in messages" :key="msg._clientId || idx" class="message-wrapper">
          <div class="sticker message-bubble" :class="msg.role">
            <div class="tape" v-if="msg.role === 'ai'" />
            <div class="message-content" v-html="renderMarkdown(msg.content)" />
            <div v-if="msg.isStreaming" class="streaming-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
        <div ref="messagesEndRef" />
      </div>

      <footer class="chat-input-area">
        <div class="input-wrapper">
          <textarea
            v-model="inputValue"
            placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
            @keydown.enter.exact.prevent="sendMessage"
            :disabled="isStreaming"
          />
          <button class="btn-send" @click="sendMessage" :disabled="isStreaming || !inputValue.trim()">
            <Send :size="20" />
          </button>
          <button v-if="isStreaming" class="btn-stop" @click="stopStream">
            <X :size="20" />
          </button>
        </div>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.chat-container {
  display: flex;
  height: calc(100vh - 72px);
  background: var(--paper);
}

.conv-sidebar {
  width: 280px;
  background: var(--paper-surface);
  border-right: 1.5px dashed var(--hairline);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1.5px dashed var(--hairline);
}

.btn-new {
  width: 100%;
  padding: 12px;
  background: var(--accent);
  color: #FFFDF8;
  border: none;
  border-radius: 999px;
  font: 14px var(--fd);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  box-shadow: var(--shadow-day);
}

.btn-new:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 0 rgba(69, 64, 58, 0.06), 0 16px 28px -12px rgba(61, 139, 194, 0.6);
}

.conv-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.conv-item {
  padding: 14px 16px;
  margin-bottom: 8px;
  background: #FFFDF8;
  border: 2px solid var(--hairline);
  border-radius: var(--radius-card);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  transform: rotate(calc(var(--sticker-rot, 2deg) * -1));
}

.conv-item:nth-child(2n) {
  transform: rotate(var(--sticker-rot, 2deg));
}

.conv-item:hover {
  transform: rotate(0deg) translateY(-2px);
  box-shadow: var(--shadow-day);
}

.conv-item.active {
  border-color: var(--accent);
  background: var(--st-sky);
}

.conv-title {
  font: 14px var(--fb);
  color: var(--ink);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conv-delete {
  background: none;
  border: none;
  color: var(--ink-soft);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s;
  opacity: 0;
}

.conv-item:hover .conv-delete {
  opacity: 1;
}

.conv-delete:hover {
  background: var(--st-sakura);
  color: var(--ink);
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--paper);
}

.chat-header {
  padding: 16px 24px;
  border-bottom: 1.5px dashed var(--hairline);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(253, 249, 240, 0.92);
  backdrop-filter: blur(8px);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-back {
  background: none;
  border: none;
  color: var(--ink-soft);
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s;
}

.btn-back:hover {
  background: var(--paper-surface);
  color: var(--ink);
}

.chat-header h2 {
  font: 22px var(--fd);
  color: var(--ink);
  margin: 0;
}

.mode-switch {
  display: flex;
  gap: 4px;
  background: var(--paper-surface);
  padding: 4px;
  border-radius: 999px;
  border: 1.5px dashed var(--hairline);
}

.mode-switch button {
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-radius: 999px;
  font: 13px var(--fd);
  color: var(--ink-soft);
  cursor: pointer;
  transition: all 0.2s;
}

.mode-switch button.active {
  background: var(--accent);
  color: #FFFDF8;
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--ink-soft);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.message-wrapper {
  margin-bottom: 20px;
  display: flex;
}

.message-wrapper:has(.user) {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 70%;
  padding: 16px 20px;
  position: relative;
}

.message-bubble.user {
  background: var(--st-sky);
  border-color: rgba(61, 139, 194, 0.2);
}

.message-bubble.ai {
  background: #FFFDF8;
}

.message-bubble .tape {
  position: absolute;
  top: -10px;
  left: 20px;
  --tc: var(--st-cream);
  --tilt: -4deg;
  --tw: 60px;
}

.message-content {
  font: 15px / 1.7 var(--fb);
  color: var(--ink);
}

.message-content :deep(code) {
  background: var(--paper-surface);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
}

.message-content :deep(pre) {
  background: var(--paper-surface);
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 12px 0;
}

.streaming-indicator {
  display: inline-flex;
  gap: 4px;
  margin-left: 8px;
}

.streaming-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  animation: bounce 1.2s infinite;
}

.streaming-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.streaming-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}

.chat-input-area {
  padding: 20px 24px;
  border-top: 1.5px dashed var(--hairline);
  background: var(--paper-surface);
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  background: #FFFDF8;
  border: 2px solid var(--hairline);
  border-radius: var(--radius-card);
  padding: 12px;
  transition: border-color 0.2s;
}

.input-wrapper:focus-within {
  border-color: var(--accent);
}

.input-wrapper textarea {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font: 15px / 1.6 var(--fb);
  color: var(--ink);
  resize: none;
  min-height: 60px;
  max-height: 200px;
}

.btn-send,
.btn-stop {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-send {
  background: var(--accent);
  color: #FFFDF8;
  box-shadow: 0 2px 0 rgba(69, 64, 58, 0.06), 0 8px 16px -8px rgba(61, 139, 194, 0.5);
}

.btn-send:hover:not(:disabled) {
  transform: translateY(-2px);
}

.btn-send:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-stop {
  background: var(--st-sakura);
  color: var(--ink);
}

.btn-stop:hover {
  background: var(--st-sakura);
  opacity: 0.8;
}

@media (max-width: 768px) {
  .conv-sidebar {
    display: none;
  }
}
</style>
