<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { ArrowLeft, Trash2, Plus, Send, Square, ArrowDown, Clipboard } from 'lucide-vue-next'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.min.css'
import { getKnowledgeBase } from '@/api/knowledge'
import {
  deleteKnowledgeConversation,
  listKnowledgeConversations,
  listKnowledgeMessages,
} from '@/api/knowledge'
import { streamKnowledgeChat } from '@/utils/knowledgeSseStream'

marked.setOptions({ breaks: true, gfm: true })

function renderMarkdown(text: string): string {
  if (!text) return ''
  try {
    let html = marked.parse(text) as string
    html = html.replace(
      /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g,
      (_m, lang, code) => {
        const decoded = code
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
        if (lang && hljs.getLanguage(lang)) {
          try {
            return `<pre><code class="hljs language-${lang}">${hljs.highlight(decoded, { language: lang }).value}</code></pre>`
          } catch {
            /* ignore */
          }
        }
        return `<pre><code class="hljs">${decoded}</code></pre>`
      },
    )
    return html
  } catch {
    return text
  }
}

type UiMessage = {
  id?: string | number
  role: 'USER' | 'ASSISTANT' | 'SYSTEM' | string
  content: string
  references?: API.KnowledgeReferenceVO[]
  streaming?: boolean
  error?: boolean
  time?: string
}

const route = useRoute()
const router = useRouter()
const kbId = computed(() => String(route.params.kbId ?? ''))

const kb = ref<API.KnowledgeBaseVO | null>(null)
const conversations = ref<API.KnowledgeConversationVO[]>([])
const activeConversationId = ref<string | number | null>(null)
const messages = ref<UiMessage[]>([])
const input = ref('')
const sending = ref(false)
const listLoading = ref(false)
const msgLoading = ref(false)
const abortRef = ref<AbortController | null>(null)
const scrollEl = ref<HTMLElement | null>(null)
const showScrollBtn = ref(false)

/* 建议问题 */
const suggestedQuestions = [
  '这个知识库包含哪些内容？',
  '请总结核心知识点',
  '有哪些最佳实践建议？',
]

/* ---- 滚动控制 ---- */
const scrollBottom = async () => {
  await nextTick()
  if (scrollEl.value) {
    scrollEl.value.scrollTop = scrollEl.value.scrollHeight
  }
}

const onScroll = () => {
  if (!scrollEl.value) return
  const { scrollTop, scrollHeight, clientHeight } = scrollEl.value
  showScrollBtn.value = scrollHeight - scrollTop - clientHeight > 120
}

/* ---- 复制消息 ---- */
const copyMessage = async (content: string) => {
  try {
    await navigator.clipboard.writeText(content)
    message.success('已复制到剪贴板')
  } catch {
    message.error('复制失败')
  }
}

/* ---- 格式化时间 ---- */
function formatMsgTime(str?: string): string {
  if (!str) return ''
  try {
    return new Date(str).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

const loadKb = async () => {
  const res = await getKnowledgeBase(kbId.value)
  if (res.data.code === 0 && res.data.data) {
    kb.value = res.data.data
  } else {
    message.error(res.data.message || '知识库不存在')
    router.replace('/knowledge')
  }
}

const loadConversations = async () => {
  listLoading.value = true
  try {
    const res = await listKnowledgeConversations({ knowledgeBaseId: kbId.value })
    if (res.data.code === 0) {
      conversations.value = res.data.data ?? []
    }
  } finally {
    listLoading.value = false
  }
}

const loadMessages = async (conversationId: string | number) => {
  msgLoading.value = true
  try {
    const res = await listKnowledgeMessages(conversationId, { pageNum: 1, pageSize: 100 })
    if (res.data.code === 0 && res.data.data) {
      const records = res.data.data.records ?? []
      messages.value = records.map((m) => ({
        id: m.id,
        role: m.role || 'USER',
        content: m.content || '',
        references: m.references,
        time: m.createTime || m.updateTime,
      }))
      await scrollBottom()
    }
  } finally {
    msgLoading.value = false
  }
}

const selectConversation = async (id: string | number) => {
  activeConversationId.value = id
  await loadMessages(id)
}

const startNewChat = () => {
  activeConversationId.value = null
  messages.value = []
}

const removeConversation = (c: API.KnowledgeConversationVO) => {
  if (c.id == null) return
  Modal.confirm({
    title: '删除会话',
    content: `确认删除「${c.title || '未命名会话'}」？`,
    okType: 'danger',
    onOk: async () => {
      const res = await deleteKnowledgeConversation(c.id!)
      if (res.data.code === 0) {
        message.success('已删除')
        if (String(activeConversationId.value) === String(c.id)) startNewChat()
        await loadConversations()
      } else {
        message.error(res.data.message || '删除失败')
      }
    },
  })
}

const stopStream = () => {
  abortRef.value?.abort()
  abortRef.value = null
  sending.value = false
}

const send = async () => {
  const question = input.value.trim()
  if (!question || sending.value) return

  input.value = ''
  messages.value.push({ role: 'USER', content: question, time: new Date().toISOString() })
  const assistant: UiMessage = { role: 'ASSISTANT', content: '', streaming: true }
  messages.value.push(assistant)
  await scrollBottom()

  sending.value = true
  const ac = new AbortController()
  abortRef.value = ac

  try {
    await streamKnowledgeChat(
      {
        knowledgeBaseId: kbId.value,
        conversationId: activeConversationId.value ?? undefined,
        question,
        topK: 5,
        mode: 'knowledgeBase',
      },
      {
        onMessage: (chunk) => {
          assistant.content += chunk
          scrollBottom()
        },
        onDone: async () => {
          assistant.streaming = false
          assistant.time = new Date().toISOString()
          await loadConversations()
          if (activeConversationId.value == null && conversations.value.length) {
            const newest = conversations.value[0]
            if (newest?.id != null) {
              activeConversationId.value = newest.id
            }
          }
          if (activeConversationId.value != null) {
            const res = await listKnowledgeMessages(activeConversationId.value, {
              pageNum: 1,
              pageSize: 100,
            })
            if (res.data.code === 0 && res.data.data?.records?.length) {
              const records = res.data.data.records
              messages.value = records.map((m) => ({
                id: m.id,
                role: m.role || 'USER',
                content: m.content || '',
                references: m.references,
                time: m.createTime || m.updateTime,
              }))
            }
          }
          await scrollBottom()
        },
        onError: (msg) => {
          assistant.streaming = false
          assistant.error = true
          assistant.content = assistant.content || msg
          assistant.time = new Date().toISOString()
          message.error(msg)
        },
      },
      ac.signal,
    )
  } catch (e) {
    if ((e as Error)?.name !== 'AbortError') {
      assistant.streaming = false
      assistant.error = true
      assistant.content = assistant.content || '请求失败'
      assistant.time = new Date().toISOString()
      message.error((e as Error)?.message || '请求失败')
    }
  } finally {
    sending.value = false
    abortRef.value = null
  }
}

const useSuggestion = (q: string) => {
  input.value = q
  send()
}

watch(kbId, async () => {
  startNewChat()
  await loadKb()
  await loadConversations()
})

onMounted(async () => {
  await loadKb()
  await loadConversations()
})

onBeforeUnmount(stopStream)
</script>

<template>
  <div class="kb-chat-page">
    <!-- 左侧边栏 -->
    <aside class="kb-chat-side">
      <div class="kb-chat-side__top">
        <a-button type="link" class="kb-back-btn" @click="router.push(`/knowledge/${kbId}`)">
          <ArrowLeft :size="15" /> 详情
        </a-button>
        <a-button type="primary" size="small" class="kb-new-btn" @click="startNewChat">
          <Plus :size="15" /> 新对话
        </a-button>
      </div>
      <div class="kb-chat-side__title">{{ kb?.name || '知识库问答' }}</div>
      <a-spin :spinning="listLoading">
        <div
          v-for="c in conversations"
          :key="String(c.id)"
          class="conv-item"
          :class="{ active: String(c.id) === String(activeConversationId) }"
          @click="selectConversation(c.id!)"
        >
          <div class="conv-item__main">
            <div class="conv-item__title">{{ c.title || '未命名会话' }}</div>
            <div class="conv-item__sub">{{ c.lastMessage || c.updateTime }}</div>
          </div>
          <a-button
            type="text"
            size="small"
            danger
            class="conv-del-btn"
            @click.stop="removeConversation(c)"
          >
            <Trash2 :size="15" />
          </a-button>
        </div>
        <a-empty v-if="!conversations.length" description="暂无会话" :image-style="{ height: '48px' }" />
      </a-spin>
    </aside>

    <!-- 主聊天区 -->
    <section class="kb-chat-main">
      <div
        ref="scrollEl"
        class="kb-chat-messages"
        @scroll="onScroll"
      >
        <a-spin :spinning="msgLoading">
          <!-- 欢迎页 -->
          <div v-if="!messages.length" class="chat-welcome">
            <div class="welcome-icon"></div>
            <h2>{{ kb?.name || '知识库问答' }}</h2>
            <p v-if="kb?.description" class="welcome-desc">{{ kb.description }}</p>
            <p class="welcome-hint">向知识库提问，开始 RAG 智能问答</p>
            <div class="welcome-suggestions">
              <a-button
                v-for="(q, i) in suggestedQuestions"
                :key="i"
                class="suggestion-chip"
                @click="useSuggestion(q)"
              >
                {{ q }}
              </a-button>
            </div>
          </div>

          <!-- 消息列表 -->
          <div v-for="(m, idx) in messages" :key="idx" class="msg" :class="m.role.toLowerCase()">
            <div class="msg__header">
              <span class="msg__role">{{ m.role === 'USER' ? '我' : '助手' }}</span>
              <span v-if="m.time" class="msg__time">{{ formatMsgTime(m.time) }}</span>
            </div>
            <div class="msg__bubble" :class="{ error: m.error }">
              <div v-if="m.role === 'ASSISTANT'" class="md" v-html="renderMarkdown(m.content)" />
              <div v-else class="plain">{{ m.content }}</div>
              <!-- 打字动画 -->
              <div v-if="m.streaming" class="typing-dots">
                <span></span><span></span><span></span>
              </div>
              <!-- 引用来源 -->
              <div v-if="m.references?.length" class="refs">
                <div class="refs__title">引用来源</div>
                <div v-for="(r, ri) in m.references" :key="ri" class="refs__item">
                  <div class="refs__item-head">
                    <strong>{{ r.documentName || `文档#${r.knowledgeDocumentId}` }}</strong>
                    <span v-if="r.similarity != null" class="refs__score">
                      相关度 {{ (Number(r.similarity) * 100).toFixed(1) }}%
                    </span>
                  </div>
                  <p>{{ r.content }}</p>
                </div>
              </div>
            </div>
            <!-- 消息操作 -->
            <div v-if="m.role === 'ASSISTANT' && !m.streaming && m.content" class="msg__actions">
              <a-button type="text" size="small" class="msg-copy-btn" @click="copyMessage(m.content)">
                <Clipboard :size="15" />
              </a-button>
            </div>
          </div>
        </a-spin>
      </div>

      <!-- 滚动到底部按钮 -->
      <button v-if="showScrollBtn" class="scroll-bottom-btn" @click="scrollBottom">
        <ArrowDown :size="18" />
      </button>

      <!-- 输入区 -->
      <div class="kb-chat-input">
        <a-textarea
          v-model:value="input"
          :rows="3"
          :disabled="sending"
          placeholder="输入问题，Enter 发送（Shift+Enter 换行）"
          @keydown.enter.exact.prevent="send"
        />
        <div class="kb-chat-input__actions">
          <span class="kb-chat-input__hint">Enter 发送 · Shift+Enter 换行</span>
          <a-button v-if="sending" danger class="kb-stop-btn" @click="stopStream">
            <Square :size="15" /> 停止
          </a-button>
          <a-button type="primary" class="kb-send-btn" :loading="sending" :disabled="!input.trim()" @click="send">
            <Send :size="15" /> 发送
          </a-button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.kb-chat-page {
  display: flex;
  gap: 16px;
  min-height: calc(100vh - 160px);
  max-width: 1200px;
  margin: 0 auto;
}

/* ---- 侧边栏 ---- */
.kb-chat-side {
  width: 260px;
  flex-shrink: 0;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 12px;
  overflow: auto;
  backdrop-filter: blur(16px);
}
.kb-chat-side__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.kb-chat-side__title {
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--color-text-primary);
}
.conv-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  margin-bottom: 6px;
  transition: background var(--transition-fast);
}
.conv-item:hover,
.conv-item.active {
  background: var(--color-primary-12);
}
.conv-item__main {
  flex: 1;
  min-width: 0;
}
.conv-item__title {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--color-text-primary);
}
.conv-item__sub {
  font-size: 11px;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ---- 主区域 ---- */
.kb-chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-card);
  backdrop-filter: blur(16px);
  position: relative;
}
.kb-chat-messages {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

/* ---- 欢迎页 ---- */
.chat-welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  text-align: center;
  padding: 32px;
}
.welcome-icon {
  font-size: 56px;
  margin-bottom: 16px;
}
.chat-welcome h2 {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 600;
}
.welcome-desc {
  color: var(--color-text-secondary);
  font-size: 14px;
  margin: 0 0 4px;
  max-width: 400px;
}
.welcome-hint {
  color: var(--color-text-muted);
  font-size: 13px;
  margin: 8px 0 20px;
}
.welcome-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}
.suggestion-chip {
  border-radius: 20px !important;
  font-size: 13px;
}

/* ---- 消息 ---- */
.msg {
  margin-bottom: 20px;
}
.msg__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.msg__role {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-muted);
}
.msg__time {
  font-size: 11px;
  color: var(--color-text-muted);
  opacity: 0.7;
}
.msg.user .msg__bubble {
  background: var(--color-primary-12);
  border: 1px solid var(--color-primary-20);
}
.msg.assistant .msg__bubble {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--color-border);
}
.msg__bubble {
  padding: 14px 16px;
  border-radius: var(--radius-md);
  line-height: 1.7;
}
.msg__bubble.error {
  border-color: var(--color-error) !important;
}
.plain {
  white-space: pre-wrap;
}
.md :deep(pre) {
  overflow: auto;
  padding: 12px;
  border-radius: var(--radius-sm);
  background: var(--code-bg);
  border: 1px solid var(--code-border);
}

/* ---- 打字动画 ---- */
.typing-dots {
  display: flex;
  gap: 4px;
  margin-top: 8px;
  padding: 4px 0;
}
.typing-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-text-muted);
  animation: dotBounce 1.4s infinite ease-in-out;
}
.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}
.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes dotBounce {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* ---- 消息操作 ---- */
.msg__actions {
  display: flex;
  gap: 4px;
  margin-top: 4px;
  padding-left: 4px;
  opacity: 0;
  transition: opacity var(--transition-fast);
}
.msg:hover .msg__actions {
  opacity: 1;
}

/* ---- 引用来源 ---- */
.refs {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
}
.refs__title {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--color-text-secondary);
}
.refs__item {
  font-size: 12px;
  margin-bottom: 10px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}
.refs__item:last-child {
  margin-bottom: 0;
}
.refs__item-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  gap: 8px;
}
.refs__item p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.refs__score {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--color-text-muted);
  background: var(--color-primary-08);
  padding: 2px 8px;
  border-radius: 10px;
}

/* ---- 滚动到底部按钮 ---- */
.scroll-bottom-btn {
  position: absolute;
  bottom: 100px;
  right: 24px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-fast);
  z-index: 10;
}
.scroll-bottom-btn:hover {
  background: var(--color-primary-12);
  border-color: var(--color-primary-20);
  color: var(--color-primary-light);
  transform: translateY(-2px);
}

/* ---- 输入区 ---- */
.kb-chat-input {
  padding: 12px 16px 16px;
  border-top: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.02);
}
.kb-chat-input :deep(textarea.ant-input) {
  background: rgba(255, 255, 255, 0.04) !important;
  border-color: var(--color-border) !important;
  color: var(--color-text-primary) !important;
}
.kb-chat-input__actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}
.kb-chat-input__hint {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-right: auto;
}

/* ---- 响应式 ---- */
@media (max-width: 768px) {
  .kb-chat-page {
    flex-direction: column;
  }
  .kb-chat-side {
    width: 100%;
    max-height: 200px;
  }
  .chat-welcome {
    min-height: 240px;
    padding: 20px;
  }
  .welcome-icon {
    font-size: 40px;
  }
  .chat-welcome h2 {
    font-size: 18px;
  }
}

/* ---- 图标微动效 ---- */
.kb-back-btn svg,
.kb-new-btn svg,
.kb-send-btn svg,
.kb-stop-btn svg,
.conv-del-btn svg,
.msg-copy-btn svg {
  vertical-align: -0.18em;
  transition: transform var(--transition-fast);
}
.kb-back-btn:hover svg {
  transform: translateX(-3px);
}
.kb-new-btn:hover svg {
  transform: scale(1.15) rotate(90deg);
}
.kb-send-btn:hover svg {
  transform: translateX(3px) translateY(-2px);
}
.conv-del-btn:hover svg {
  animation: kbShake 0.4s ease;
}
.msg-copy-btn:hover svg {
  transform: scale(1.15);
}
.kb-stop-btn {
  animation: kbStopPulse 1.4s ease-in-out infinite;
}
.scroll-bottom-btn svg {
  transition: transform var(--transition-fast);
}
.scroll-bottom-btn:hover svg {
  animation: kbBounce 0.6s ease;
}
@keyframes kbShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}
@keyframes kbBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(3px); }
}
@keyframes kbStopPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 77, 79, 0.4); }
  50% { box-shadow: 0 0 0 5px rgba(255, 77, 79, 0); }
}
@media (prefers-reduced-motion: reduce) {
  .kb-back-btn:hover svg,
  .kb-new-btn:hover svg,
  .kb-send-btn:hover svg,
  .conv-del-btn:hover svg,
  .msg-copy-btn:hover svg,
  .scroll-bottom-btn:hover svg {
    animation: none;
    transform: none;
  }
  .kb-stop-btn {
    animation: none;
  }
}
</style>
