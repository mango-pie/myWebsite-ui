/**
 * 全局对话流 store（模块级单例，脱离组件生命周期）。
 *
 * 目的：AI 流式回复由本 store 按 conversationId 持有，切页/切会话都不会中断，
 * 回到会话时能看到实时续写；后台跑完由后端落库。ChatPage 只是这些 session 的"视图"。
 */
import { ref, type Ref } from 'vue'
import { message } from 'ant-design-vue'
import router from '@/router'
import {
  applySegmentPlan,
  chatSseLog,
  readSseChatEvents,
  type AgentToolStep,
  type AgentUiAction,
  type ChatSsePayload,
} from '@/utils/sseChatStream'
import { createChatPageSegmentHandlers } from '@/composables/useSegmentTypewriter'
import { sanitizeSegmentDisplayText } from '@/utils/chatSegmentDisplay'

export interface ChatMessage {
  role: 'user' | 'ai'
  content: string
  previewImages?: string[]
  isStreaming?: boolean
  id?: string
  createTime?: string
  _clientId?: string
  /** 打字机结束后缓存的 markdown HTML，避免多段回复时重复解析 */
  _renderedHtml?: string
  _renderedHtmlContent?: string
  mode?: 'ask' | 'agent'
  tools?: AgentToolStep[]
}

export interface ChatSession {
  conversationId: string
  messages: Ref<ChatMessage[]>
  isStreaming: Ref<boolean>
  /** 历史是否已加载过（避免切回来重复清空/重拉，保留后台流入的内容） */
  historyLoaded: Ref<boolean>
  hasMoreHistory: Ref<boolean>
  historyPageNum: Ref<number>
  totalHistoryPages: Ref<number>
  abortController: AbortController | null
  /** 由当前可见的 ChatPage 实例注册：打字机滚动，组件不在时为 no-op */
  onScroll?: () => void
  /** 由当前可见的 ChatPage 实例注册：流结束后刷新会话列表等 */
  onStreamEnd?: () => void
}

const sessions = new Map<string, ChatSession>()
let clientMsgCounter = 0

export function nextChatClientId(prefix = 'm'): string {
  return `${prefix}-${Date.now()}-${++clientMsgCounter}`
}

export function getChatSession(conversationId: string): ChatSession {
  let session = sessions.get(conversationId)
  if (!session) {
    session = {
      conversationId,
      messages: ref<ChatMessage[]>([]),
      isStreaming: ref(false),
      historyLoaded: ref(false),
      hasMoreHistory: ref(true),
      historyPageNum: ref(0),
      totalHistoryPages: ref(0),
      abortController: null,
    }
    sessions.set(conversationId, session)
  }
  return session
}

export function isConversationStreaming(conversationId: string): boolean {
  return sessions.get(conversationId)?.isStreaming.value ?? false
}

export function stopChatStream(conversationId: string): void {
  const session = sessions.get(conversationId)
  if (!session) return
  if (session.abortController) {
    session.abortController.abort()
    session.abortController = null
  }
  const last = session.messages.value[session.messages.value.length - 1]
  if (last?.role === 'ai') last.isStreaming = false
  session.isStreaming.value = false
}

/** Agent 的 UI 动作：用全局 router / message 处理，组件不在也能生效 */
function handleAgentUiAction(action: AgentUiAction | undefined): void {
  if (!action) return
  chatSseLog('handleAgentUiAction', action)
  if (action.type === 'navigate' && action.path) {
    void router.push(action.path)
    return
  }
  if (action.type === 'toast' && action.message) {
    message.success(action.message)
    return
  }
  if (action.type === 'refresh') {
    try {
      window.dispatchEvent(new CustomEvent('agent-ui-action', { detail: action }))
    } catch {
      /* ignore */
    }
    message.info(`已触发刷新${action.module ? `：${action.module}` : ''}`)
  }
}

export interface StartChatStreamOptions {
  userMessage: ChatMessage
  requestBody: Record<string, unknown>
  mode: 'ask' | 'agent'
}

/**
 * 发起一次流式对话。整个流程（fetch + SSE + 打字机）挂在本 store，
 * 组件卸载/切走都不影响它继续写入 session.messages。
 */
export async function startChatStream(
  conversationId: string,
  opts: StartChatStreamOptions,
): Promise<void> {
  const session = getChatSession(conversationId)
  if (session.isStreaming.value) return

  const messages = session.messages
  messages.value.push(opts.userMessage)
  session.onScroll?.()

  const currentMode = opts.mode
  const aiMsg: ChatMessage = {
    role: 'ai',
    content: '',
    isStreaming: true,
    _clientId: nextChatClientId('a'),
    mode: currentMode,
    tools: currentMode === 'agent' ? [] : undefined,
  }
  messages.value.push(aiMsg)
  session.isStreaming.value = true

  const ac = new AbortController()
  session.abortController = ac

  const finalize = (res?: { streamError?: boolean }) => {
    const last = messages.value[messages.value.length - 1]
    if (last?.role === 'ai') last.isStreaming = false
    session.isStreaming.value = false
    session.hasMoreHistory.value = true
    session.abortController = null
    if (res?.streamError) {
      message.error('请求失败，请重试')
    } else {
      session.onStreamEnd?.()
    }
  }

  try {
    const base = import.meta.env.VITE_API_BASE_URL
    const response = await fetch(`${base}/chat/chat`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opts.requestBody),
      signal: ac.signal,
    })
    if (!response.ok || !response.body) throw new Error('请求失败')

    let streamError = false
    let streamBuffer = ''
    let segmentPlanApplied = false
    const segmentHandlers = createChatPageSegmentHandlers({
      messages,
      nextClientId: nextChatClientId,
      chatMode: currentMode,
      onScroll: () => session.onScroll?.(),
      options: { signal: ac.signal },
    })

    const ensureToolArrayOnLastAi = (): ChatMessage | null => {
      const last = messages.value[messages.value.length - 1]
      if (last?.role === 'ai') {
        if (!last.tools) last.tools = []
        return last
      }
      return null
    }

    const upsertToolStep = (
      ev: ChatSsePayload,
      statusOverride?: 'running' | 'done' | 'error',
    ) => {
      const last = ensureToolArrayOnLastAi()
      if (!last || !ev?.tool) return
      const list = last.tools!
      const idx = list.findIndex(
        (t) => (ev.step != null && t.step === ev.step) || t.tool === ev.tool,
      )
      const baseStep: AgentToolStep = {
        tool: String(ev.tool),
        args: ev.args ?? undefined,
        step: ev.step != null ? Number(ev.step) : undefined,
        success: ev.success as boolean | undefined,
        data: ev.data ?? undefined,
        status: statusOverride ?? (ev.success === false ? 'error' : 'running'),
      }
      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          ...baseStep,
          status: statusOverride ?? (ev.success === false ? 'error' : 'done'),
        }
      } else {
        list.push({ ...baseStep, status: statusOverride ?? 'running' })
      }
    }

    try {
      await readSseChatEvents(response.body, async (payload) => {
        const event = payload.event ?? (payload.d ? 'chunk' : undefined)

        if (currentMode === 'agent') {
          if (event === 'tool_call') {
            chatSseLog('UI tool_call', payload)
            upsertToolStep(payload, 'running')
          } else if (event === 'tool_result') {
            chatSseLog('UI tool_result', payload)
            upsertToolStep(payload)
            if (payload.uiAction) handleAgentUiAction(payload.uiAction)
          } else if (event === 'error') {
            chatSseLog('UI agent error', payload)
            const last = messages.value[messages.value.length - 1]
            if (last?.role === 'ai' && !last.content) {
              last.content = payload.message || 'Agent 遇到错误'
            }
            if (payload.message) message.error(payload.message)
          } else if (event === 'chunk' && payload.d) {
            streamBuffer += payload.d
          } else if (event === 'done') {
            chatSseLog('UI received done (agent)')
          } else if (event) {
            chatSseLog('UI unhandled event (agent)', event, payload)
          }
        } else {
          if (event === 'chunk' && payload.d) {
            streamBuffer += payload.d
          } else if (event === 'segment_plan' && payload.segments?.length) {
            segmentPlanApplied = true
            streamBuffer = ''
            chatSseLog('UI handling segment_plan', payload.segments.length, 'segments')
            await applySegmentPlan(payload.segments, payload.delays, {
              ...segmentHandlers,
              signal: ac.signal,
            })
          } else if (event === 'done') {
            chatSseLog('UI received done')
          } else if (event) {
            chatSseLog('UI unhandled event', event, payload)
          }
        }
      })

      if (currentMode !== 'agent' && !segmentPlanApplied && streamBuffer) {
        const last = messages.value[messages.value.length - 1]
        if (last?.role === 'ai' && !last.content) {
          await segmentHandlers.revealIntoLast(sanitizeSegmentDisplayText(streamBuffer))
        }
      }

      if (currentMode === 'agent' && streamBuffer) {
        const last = messages.value[messages.value.length - 1]
        if (last?.role === 'ai' && !last.content) {
          last.content = streamBuffer
        }
      }
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') {
        // 用户主动停止，按干净停止处理
      } else {
        streamError = true
      }
    }

    finalize({ streamError })
  } catch (err) {
    finalize()
    if ((err as { name?: string })?.name !== 'AbortError') {
      message.error('发送失败，请重试')
    }
  }
}
