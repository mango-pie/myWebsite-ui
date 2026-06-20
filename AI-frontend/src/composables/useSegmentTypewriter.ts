import type { Ref } from 'vue'
import { chatSseLog, revealTextWithTypewriter } from '@/utils/sseChatStream'

export type SegmentTypewriterOptions = {
  charDelayMs?: number
  signal?: AbortSignal
  onProgress?: () => void
}

/** rAF 节流，避免打字机每帧多次触发滚动等副作用 */
export function createThrottledProgress(onProgress: () => void): () => void {
  let scheduled = false
  return () => {
    if (scheduled) return
    scheduled = true
    requestAnimationFrame(() => {
      scheduled = false
      onProgress()
    })
  }
}

export interface ChatPageBubbleMessage {
  role: 'ai' | 'user'
  content: string
  isStreaming?: boolean
  _clientId?: string
  mode?: 'ask' | 'agent'
  tools?: unknown[]
}

export function createChatPageSegmentHandlers(deps: {
  messages: Ref<ChatPageBubbleMessage[]>
  nextClientId: (prefix?: string) => string
  chatMode: 'ask' | 'agent'
  /** 打字机滚动用，避免 nextTick 堆积造成卡顿 */
  onScroll?: () => void
  options?: SegmentTypewriterOptions
}) {
  const throttledScroll = deps.onScroll
    ? createThrottledProgress(deps.onScroll)
    : () => {}

  const typewriterOpts = {
    charDelayMs: deps.options?.charDelayMs ?? 18,
    maxCharsPerFrame: 8,
    signal: deps.options?.signal,
    onProgress: () => {
      throttledScroll()
      deps.options?.onProgress?.()
    },
  }

  async function typewriteBubble(msg: ChatPageBubbleMessage, text: string) {
    if (!text) return
    msg.isStreaming = true
    if (text.length <= 1) {
      msg.content = text
      msg.isStreaming = false
      throttledScroll()
      return
    }
    msg.content = text.charAt(0)
    await revealTextWithTypewriter(
      (visible) => { msg.content = visible },
      text,
      { ...typewriterOpts, clearBefore: false, prefixLength: 1 },
    )
    msg.isStreaming = false
    throttledScroll()
  }

  const revealReplace = async (text: string) => {
    const last = deps.messages.value[deps.messages.value.length - 1]
    const msg =
      last?.role === 'ai'
        ? last
        : (() => {
            const created: ChatPageBubbleMessage = {
              role: 'ai',
              content: '',
              isStreaming: true,
              _clientId: deps.nextClientId('a'),
              mode: deps.chatMode,
            }
            deps.messages.value.push(created)
            return created
          })()
    await typewriteBubble(msg, text)
  }

  const revealAppend = async (text: string) => {
    const msg: ChatPageBubbleMessage = {
      role: 'ai',
      content: '',
      isStreaming: true,
      _clientId: deps.nextClientId('a'),
      mode: deps.chatMode,
    }
    deps.messages.value.push(msg)
    await typewriteBubble(msg, text)
  }

  const revealIntoLast = async (text: string) => {
    const last = deps.messages.value[deps.messages.value.length - 1]
    if (last?.role !== 'ai' || !text) return
    await typewriteBubble(last, text)
  }

  const replaceLast = (text: string) => {
    const last = deps.messages.value[deps.messages.value.length - 1]
    if (last?.role === 'ai') {
      chatSseLog('UI replaceLastAiBubble', { from: last.content, to: text })
      last.content = text
    }
  }

  const append = (text: string) => {
    chatSseLog('UI appendAiBubble (new bubble)', text)
    deps.messages.value.push({
      role: 'ai',
      content: text,
      isStreaming: false,
      _clientId: deps.nextClientId('a'),
      mode: deps.chatMode,
    })
    throttledScroll()
  }

  return { revealReplace, revealAppend, revealIntoLast, replaceLast, append }
}

export function createPetSegmentHandlers(deps: {
  replySegments: Ref<string[]>
  options?: SegmentTypewriterOptions
}) {
  const throttledProgress = deps.options?.onProgress
    ? createThrottledProgress(deps.options.onProgress)
    : undefined

  const typewriterOpts = {
    charDelayMs: deps.options?.charDelayMs ?? 18,
    maxCharsPerFrame: 8,
    signal: deps.options?.signal,
    onProgress: throttledProgress,
  }

  async function typewriteSegment(lastIdx: number, text: string) {
    if (!text) return
    if (text.length <= 1) {
      deps.replySegments.value[lastIdx] = text
      throttledProgress?.()
      return
    }
    deps.replySegments.value[lastIdx] = text.charAt(0)
    await revealTextWithTypewriter(
      (visible) => { deps.replySegments.value[lastIdx] = visible },
      text,
      { ...typewriterOpts, clearBefore: false, prefixLength: 1 },
    )
    throttledProgress?.()
  }

  const revealReplace = async (text: string) => {
    if (!deps.replySegments.value.length) {
      deps.replySegments.value.push('')
    }
    const lastIdx = deps.replySegments.value.length - 1
    await typewriteSegment(lastIdx, text)
  }

  const revealAppend = async (text: string) => {
    deps.replySegments.value.push('')
    const lastIdx = deps.replySegments.value.length - 1
    await typewriteSegment(lastIdx, text)
  }

  const replaceLast = (text: string) => {
    if (!deps.replySegments.value.length) {
      deps.replySegments.value.push(text)
      return
    }
    deps.replySegments.value[deps.replySegments.value.length - 1] = text
  }

  const append = (text: string) => {
    deps.replySegments.value.push(text)
    throttledProgress?.()
  }

  return { revealReplace, revealAppend, replaceLast, append }
}
