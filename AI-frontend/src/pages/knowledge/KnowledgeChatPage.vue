<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { ArrowLeft, Send, X, MessageSquarePlus, BookOpen } from 'lucide-vue-next'
import { marked } from 'marked'
import hljs from 'highlight.js/lib/core'
import langJs from 'highlight.js/lib/languages/javascript'
import langTs from 'highlight.js/lib/languages/typescript'
import langPython from 'highlight.js/lib/languages/python'
import langJson from 'highlight.js/lib/languages/json'
import langBash from 'highlight.js/lib/languages/bash'
import 'highlight.js/styles/github.css'

hljs.registerLanguage('javascript', langJs)
hljs.registerLanguage('js', langJs)
hljs.registerLanguage('typescript', langTs)
hljs.registerLanguage('ts', langTs)
hljs.registerLanguage('python', langPython)
hljs.registerLanguage('py', langPython)
hljs.registerLanguage('json', langJson)
hljs.registerLanguage('bash', langBash)
hljs.registerLanguage('sh', langBash)

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
const abortRef = ref<AbortController | null>(null)
const scrollEl = ref<HTMLElement | null>(null)

const suggestedQuestions = [
  '这个知识库包含哪些内容？',
  '请总结核心知识点',
  '有哪些最佳实践建议？',
]

const scrollBottom = async () => {
  await nextTick()
  if (scrollEl.value) {
    scrollEl.value.scrollTop = scrollEl.value.scrollHeight
  }
}

const loadKb = async () => {
  try {
    const { getKnowledgeBase } = await import('@/api/knowledge')
    const res = await getKnowledgeBase(kbId.value)
    if (res.data.code === 0 && res.data.data) {
      kb.value = res.data.data
    }
  } catch (e) {
    console.error('loadKb error', e)
  }
}

const loadConversations = async () => {
  try {
    const { listKnowledgeConversations } = await import('@/api/knowledge')
    const res = await listKnowledgeConversations({ knowledgeBaseId: kbId.value })
    if (res.data.code === 0 && res.data.data) {
      conversations.value = res.data.data
    }
  } catch (e) {
    console.error('loadConversations error', e)
  }
}

const loadMessages = async (conversationId: string | number) => {
  try {
    const { listKnowledgeMessages } = await import('@/api/knowledge')
    const res = await listKnowledgeMessages(conversationId, { pageNum: 1, pageSize: 100 })
    if (res.data.code === 0 && res.data.data) {
      messages.value = (res.data.data.records || []).map((m: API.KnowledgeMessageVO) => ({
        id: m.id,
        role: m.role || 'ASSISTANT',
        content: m.content || '',
        references: m.references,
        time: m.createTime,
      }))
      scrollBottom()
    }
  } catch (e) {
    console.error('loadMessages error', e)
  }
}

const startNewConversation = async () => {
  activeConversationId.value = null
  messages.value = []
}

const selectConversation = async (conv: API.KnowledgeConversationVO) => {
  if (!conv.id) return
  activeConversationId.value = conv.id
  await loadMessages(conv.id)
}

const sendMessage = async () => {
  if (!input.value.trim() || sending.value) return

  const question = input.value.trim()
  input.value = ''

  const userMsg: UiMessage = {
    role: 'USER',
    content: question,
    time: new Date().toISOString(),
  }
  messages.value.push(userMsg)
  scrollBottom()

  const aiMsg: UiMessage = {
    role: 'ASSISTANT',
    content: '',
    streaming: true,
  }
  messages.value.push(aiMsg)
  scrollBottom()

  sending.value = true
  const ac = new AbortController()
  abortRef.value = ac

  try {
    const { streamKnowledgeChat } = await import('@/utils/knowledgeSseStream')
    await streamKnowledgeChat(
      {
        knowledgeBaseId: kbId.value,
        conversationId: activeConversationId.value ?? undefined,
        question,
      },
      {
        onMessage(chunk) {
          aiMsg.content += chunk
          scrollBottom()
        },
        onDone() {
          aiMsg.streaming = false
          sending.value = false
          loadConversations()
        },
        onError(msg) {
          aiMsg.streaming = false
          aiMsg.content = `出错了：${msg}`
          sending.value = false
        },
      },
      ac.signal,
    )
  } catch (e) {
    aiMsg.streaming = false
    aiMsg.content = '网络错误，请重试'
    sending.value = false
  }
}

const stopStream = () => {
  abortRef.value?.abort()
  sending.value = false
  const last = messages.value[messages.value.length - 1]
  if (last?.streaming) last.streaming = false
}

const useSuggestion = (q: string) => {
  input.value = q
  sendMessage()
}

onMounted(async () => {
  await loadKb()
  await loadConversations()
})
</script>

<template>
  <div class="rag-container">
    <aside class="rag-sidebar">
      <div class="sidebar-header">
        <button class="btn-back" @click="router.push('/knowledge')">
          <ArrowLeft :size="18" />
        </button>
        <div class="kb-info">
          <h3>{{ kb?.name || '知识库' }}</h3>
          <span class="pill" data-tone="mint">{{ kb?.documentCount ?? 0 }} 文档</span>
        </div>
      </div>
      <div class="sidebar-actions">
        <button class="btn-new" @click="startNewConversation">
          <MessageSquarePlus :size="16" />
          新对话
        </button>
      </div>
      <div class="conv-list">
        <div
          v-for="conv in conversations"
          :key="conv.id"
          class="conv-item"
          :class="{ active: conv.id === activeConversationId }"
          @click="selectConversation(conv)"
        >
          <span class="conv-title">{{ conv.title || '未命名对话' }}</span>
          <span class="conv-time">{{ conv.createTime?.slice(5, 10) }}</span>
        </div>
      </div>
    </aside>

    <main class="rag-main">
      <header class="rag-header">
        <BookOpen :size="20" />
        <span>知识问答</span>
      </header>

      <div class="messages-area" ref="scrollEl">
        <div v-if="messages.length === 0" class="empty-state">
          <div class="sticker empty-card">
            <div class="tape" style="--tc: var(--st-cream); --tilt: -3deg; --tw: 60px;" />
            <h3>向知识库提问</h3>
            <p>基于 {{ kb?.name }} 的内容进行问答</p>
            <div class="suggestions">
              <button
                v-for="q in suggestedQuestions"
                :key="q"
                class="suggestion-btn"
                @click="useSuggestion(q)"
              >
                {{ q }}
              </button>
            </div>
          </div>
        </div>

        <div v-for="(msg, idx) in messages" :key="idx" class="message-wrapper" :class="msg.role.toLowerCase()">
          <div class="sticker message-bubble" :class="msg.role.toLowerCase()">
            <div class="tape" v-if="msg.role === 'ASSISTANT'" style="--tc: var(--st-mint); --tilt: 3deg; --tw: 50px;" />
            <div class="message-content" v-html="renderMarkdown(msg.content)" />
            <div v-if="msg.streaming" class="streaming-indicator">
              <span></span><span></span><span></span>
            </div>
            <div v-if="msg.references?.length" class="references">
              <span class="ref-label">参考来源：</span>
              <span v-for="(ref, i) in msg.references" :key="i" class="ref-badge">
                {{ ref.documentName || `文档${i + 1}` }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <footer class="rag-input-area">
        <div class="input-wrapper">
          <textarea
            v-model="input"
            placeholder="输入你的问题... (Enter 发送, Shift+Enter 换行)"
            @keydown.enter.exact.prevent="sendMessage"
            :disabled="sending"
            rows="2"
          />
          <button v-if="sending" class="btn-stop" @click="stopStream">
            <X :size="20" />
          </button>
          <button v-else class="btn-send" @click="sendMessage" :disabled="!input.trim()">
            <Send :size="20" />
          </button>
        </div>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.rag-container {
  display: flex;
  height: calc(100vh - 72px);
  background: var(--paper);
}

.rag-sidebar {
  width: 280px;
  background: var(--paper-surface);
  border-right: 1.5px dashed var(--hairline);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1.5px dashed var(--hairline);
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
  background: rgba(255, 253, 248, 0.6);
  color: var(--ink);
}

.kb-info h3 {
  margin: 0 0 4px;
  font-size: 16px;
}

.sidebar-actions {
  padding: 12px;
}

.btn-new {
  width: 100%;
  padding: 10px;
  background: var(--accent);
  color: #FFFDF8;
  border: none;
  border-radius: 999px;
  font: 13px var(--fd);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-new:hover {
  transform: translateY(-1px);
}

.conv-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px 12px;
}

.conv-item {
  padding: 12px 14px;
  margin-bottom: 6px;
  background: #FFFDF8;
  border: 1.5px solid var(--hairline);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.conv-item:hover {
  border-color: var(--accent);
}

.conv-item.active {
  background: var(--st-sky);
  border-color: var(--accent);
}

.conv-title {
  font: 13px var(--fb);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conv-time {
  font: 11px var(--fd);
  color: var(--ink-soft);
  margin-left: 8px;
}

.rag-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--paper);
}

.rag-header {
  padding: 16px 24px;
  border-bottom: 1.5px dashed var(--hairline);
  display: flex;
  align-items: center;
  gap: 10px;
  font: 18px var(--fd);
  color: var(--accent);
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.empty-card {
  padding: 40px;
  text-align: center;
  max-width: 400px;
}

.empty-card h3 {
  margin: 0 0 8px;
  font-size: 22px;
}

.empty-card p {
  margin: 0 0 20px;
  color: var(--ink-soft);
  font-size: 14px;
}

.suggestions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.suggestion-btn {
  padding: 10px 16px;
  background: transparent;
  border: 1.5px dashed var(--hairline);
  border-radius: 10px;
  font: 13px var(--fb);
  color: var(--ink);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.suggestion-btn:hover {
  border-style: solid;
  border-color: var(--accent);
  color: var(--accent);
}

.message-wrapper {
  margin-bottom: 20px;
  display: flex;
}

.message-wrapper.user {
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

.message-bubble.assistant {
  background: #FFFDF8;
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
  border: 1px solid var(--hairline);
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

.streaming-indicator span:nth-child(2) { animation-delay: 0.2s; }
.streaming-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}

.references {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--hairline);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.ref-label {
  font: 11px var(--fd);
  color: var(--ink-soft);
}

.ref-badge {
  padding: 2px 8px;
  border-radius: 999px;
  font: 10px var(--fd);
  background: var(--st-cream);
  border: 1px solid var(--hairline);
}

.rag-input-area {
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
}

.btn-send:hover:not(:disabled) {
  transform: translateY(-1px);
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
  opacity: 0.8;
}

@media (max-width: 768px) {
  .rag-sidebar {
    display: none;
  }
}
</style>
