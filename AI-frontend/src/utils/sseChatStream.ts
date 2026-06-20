/**
 * SSE 对话流解析：按行缓冲 + JSON.parse，避免 chunk 截断与 [^}]* 误匹配丢字。
 * 支持 chunk / segment_plan / done（Ask 模式 AstrBot 智能分段）以及 Agent 模式的 tool_call / tool_result / error。
 */
import { sanitizeSegmentList } from '@/utils/chatSegmentDisplay'
export interface ChatStreamDelta {
  text: string
  type?: string
}

export type AgentUiAction = {
  type: 'refresh' | 'navigate' | 'toast'
  module?: string
  path?: string
  message?: string
}

export type ChatSsePayload = {
  event?: 'chunk' | 'segment_plan' | 'done' | 'tool_call' | 'tool_result' | 'error'
  d?: string
  type?: string
  segments?: string[]
  delays?: number[]
  // Agent-specific fields (passed through for tool events)
  tool?: string
  args?: Record<string, unknown>
  step?: number
  success?: boolean
  data?: Record<string, unknown>
  uiAction?: AgentUiAction
  message?: string
}

export type AgentToolStep = {
  tool: string
  args?: Record<string, unknown>
  success?: boolean
  data?: Record<string, unknown>
  status: 'running' | 'done' | 'error'
  step?: number
}

/** 开发环境或 localStorage.setItem('debug_chat_sse','1') 时输出 SSE 调试日志 */
export const isChatSseDebugEnabled = (): boolean =>
  import.meta.env.DEV ||
  (typeof localStorage !== 'undefined' && localStorage.getItem('debug_chat_sse') === '1')

export function chatSseLog(...args: unknown[]): void {
  if (isChatSseDebugEnabled()) {
    console.log('[ChatSSE]', ...args)
  }
}

export class SseChatStreamParser {
  private buffer = ''

  /** 喂入解码后的文本块，返回本块内完整 data 行解析出的事件 */
  feed(chunk: string): ChatSsePayload[] {
    this.buffer += chunk
    const events: ChatSsePayload[] = []

    while (true) {
      const nl = this.buffer.indexOf('\n')
      if (nl === -1) break

      let line = this.buffer.slice(0, nl)
      this.buffer = this.buffer.slice(nl + 1)
      if (line.endsWith('\r')) line = line.slice(0, -1)

      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith(':')) continue

      if (trimmed.startsWith('data:')) {
        const payload = trimmed.slice(5).trimStart()
        if (!payload || payload === '[DONE]') continue
        const parsed = parseDataPayload(payload)
        if (parsed) {
          events.push(parsed)
        } else {
          chatSseLog('parse skipped (null):', payload.slice(0, 200))
        }
      }
    }

    return events
  }

  /** 流结束时刷出末尾未换行的一行 */
  finish(): ChatSsePayload[] {
    const rest = this.buffer.trim()
    this.buffer = ''
    if (!rest) return []

    if (rest.startsWith('data:')) {
      const payload = rest.slice(5).trimStart()
      const parsed = parseDataPayload(payload)
      return parsed ? [parsed] : []
    }

    return this.feed(`${rest}\n`)
  }
}

function parseDataPayload(payload: string): ChatSsePayload | null {
  try {
    const json = JSON.parse(payload) as {
      event?: unknown
      d?: unknown
      data?: unknown
      type?: unknown
      segments?: unknown
      delays?: unknown
      tool?: unknown
      args?: unknown
      step?: unknown
      success?: unknown
      uiAction?: unknown
      message?: unknown
    }

    const type = json.type != null ? String(json.type) : undefined
    const event = json.event != null ? String(json.event) : undefined

    if (event === 'segment_plan') {
      const segments = Array.isArray(json.segments)
        ? json.segments.map((s) => String(s))
        : []
      if (!segments.length) return null
      const delays = Array.isArray(json.delays)
        ? json.delays.map((d) => Number(d))
        : undefined
      return { event: 'segment_plan', segments, delays, type }
    }

    if (event === 'done') {
      return { event: 'done', type }
    }

    if (event === 'tool_call' || event === 'tool_result' || event === 'error') {
      return {
        event: event as 'tool_call' | 'tool_result' | 'error',
        tool: json.tool != null ? String(json.tool) : undefined,
        args: (json.args as Record<string, unknown>) ?? undefined,
        step: json.step != null ? Number(json.step) : undefined,
        success: json.success as boolean | undefined,
        data: (json.data as Record<string, unknown>) ?? undefined,
        uiAction: (json.uiAction as AgentUiAction) ?? undefined,
        message: json.message != null ? String(json.message) : undefined,
        type,
      }
    }

    const delta = json.d ?? json.data
    if (delta != null && delta !== '') {
      return {
        event: 'chunk',
        d: String(delta),
        type,
      }
    }

    if (event === 'chunk') {
      return null
    }

    return null
  } catch {
    return { event: 'chunk', d: payload }
  }
}

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export type TypewriterOptions = {
  charDelayMs?: number
  maxCharsPerFrame?: number
  signal?: AbortSignal
  onProgress?: () => void
  /** false = append mode, do not reset visible text before typing */
  clearBefore?: boolean
  /** 首段已同步展示的字数（如首字），其余部分用 rAF 打字机 */
  prefixLength?: number
}

/** 打字机效果：rAF 批处理逐字写入，长文自动追赶进度（abort 时直接展示全文） */
export async function revealTextWithTypewriter(
  setText: (text: string) => void,
  fullText: string,
  options?: TypewriterOptions,
): Promise<void> {
  const charDelayMs = options?.charDelayMs ?? 18
  const maxCharsPerFrame = options?.maxCharsPerFrame ?? 6
  const signal = options?.signal
  const prefixLength = options?.prefixLength ?? 0

  if (options?.clearBefore !== false && prefixLength === 0) {
    setText('')
  }

  if (prefixLength > 0) {
    setText(fullText.slice(0, prefixLength))
  }

  if (fullText.length <= prefixLength) {
    if (prefixLength === 0 && fullText) {
      setText(fullText)
    }
    return
  }

  let progressScheduled = false
  const scheduleProgress = () => {
    if (!options?.onProgress || progressScheduled) return
    progressScheduled = true
    requestAnimationFrame(() => {
      progressScheduled = false
      options.onProgress?.()
    })
  }

  const startTime = performance.now()
  let visibleLen = prefixLength

  return new Promise<void>((resolve) => {
    const tick = (now: number) => {
      if (signal?.aborted) {
        setText(fullText)
        options?.onProgress?.()
        resolve()
        return
      }

      const elapsed = now - startTime
      const targetLen = Math.min(
        fullText.length,
        prefixLength + Math.floor(elapsed / charDelayMs),
      )
      const nextLen = Math.min(targetLen, visibleLen + maxCharsPerFrame)

      if (nextLen > visibleLen) {
        visibleLen = nextLen
        setText(fullText.slice(0, visibleLen))
        scheduleProgress()
      }

      if (visibleLen >= fullText.length) {
        options?.onProgress?.()
        resolve()
        return
      }

      requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  })
}

export async function applySegmentPlan(
  segments: string[],
  delays: number[] | undefined,
  handlers: {
    replaceLast: (text: string) => void
    append: (text: string) => void
    signal?: AbortSignal
    /** 打字机写入首段（不提供则瞬间 replaceLast） */
    revealReplace?: (text: string, signal?: AbortSignal) => Promise<void>
    /** 打字机写入后续段（不提供则瞬间 append） */
    revealAppend?: (text: string, signal?: AbortSignal) => Promise<void>
  },
): Promise<void> {
  if (!segments.length) return

  const cleaned = sanitizeSegmentList(segments)
  if (!cleaned.length) return

  chatSseLog('applySegmentPlan start', { segments: cleaned, delays })

  if (handlers.revealReplace) {
    await handlers.revealReplace(cleaned[0]!, handlers.signal)
  } else {
    handlers.replaceLast(cleaned[0]!)
  }

  for (let i = 1; i < cleaned.length; i++) {
    if (handlers.signal?.aborted) break
    const delayMs = delays?.[i] ?? 350
    await sleep(delayMs)
    if (handlers.signal?.aborted) break

    if (handlers.revealAppend) {
      await handlers.revealAppend(cleaned[i]!, handlers.signal)
    } else {
      handlers.append(cleaned[i]!)
    }
  }
  chatSseLog('applySegmentPlan done')
}

/** 读取 ReadableStream，按 SSE 事件回调（支持 segment_plan 异步处理） */
export async function readSseChatEvents(
  body: ReadableStream<Uint8Array>,
  onEvent: (payload: ChatSsePayload) => void | Promise<void>,
): Promise<void> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  const parser = new SseChatStreamParser()
  const stats = { chunk: 0, segment_plan: 0, done: 0, tool_call: 0, tool_result: 0, error: 0, other: 0 }

  chatSseLog('stream start')

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      for (const payload of parser.feed(chunk)) {
        const event = payload.event ?? (payload.d ? 'chunk' : 'unknown')
        if (event === 'chunk') stats.chunk++
        else if (event === 'segment_plan') stats.segment_plan++
        else if (event === 'done') stats.done++
        else if (event === 'tool_call') stats.tool_call++
        else if (event === 'tool_result') stats.tool_result++
        else if (event === 'error') stats.error++
        else stats.other++

        if (event === 'chunk') {
          // chunk 数量多，仅在汇总里统计，不逐条打印
        } else {
          chatSseLog('event', event, payload)
        }

        await onEvent(payload)
      }
    }

    const tail = decoder.decode()
    for (const payload of parser.feed(tail)) {
      chatSseLog('event (tail)', payload.event ?? 'chunk', payload)
      await onEvent(payload)
    }
    for (const payload of parser.finish()) {
      chatSseLog('event (finish)', payload.event ?? 'chunk', payload)
      await onEvent(payload)
    }
  } finally {
    reader.releaseLock()
    chatSseLog('stream end', stats)
  }
}

function payloadToDelta(payload: ChatSsePayload): ChatStreamDelta | null {
  const event = payload.event ?? (payload.d ? 'chunk' : undefined)
  if (event !== 'chunk' || !payload.d) return null
  return { text: payload.d, type: payload.type }
}

/** 读取 ReadableStream，对每个 delta 调用 onDelta（仅文本，保持向后兼容） */
export async function readSseChatStream(
  body: ReadableStream<Uint8Array>,
  onDelta: (text: string) => void,
): Promise<void> {
  await readSseChatEvents(body, (payload) => {
    const delta = payloadToDelta(payload)
    if (delta) onDelta(delta.text)
  })
}

/** 读取 ReadableStream，对每个 delta 调用 onDelta（含 type，用于角色区分等） */
export async function readSseChatStreamWithMeta(
  body: ReadableStream<Uint8Array>,
  onDelta: (delta: ChatStreamDelta) => void,
): Promise<void> {
  await readSseChatEvents(body, (payload) => {
    const delta = payloadToDelta(payload)
    if (delta) onDelta(delta)
  })
}
