/**
 * Knowledge RAG SSE：event = message | done | error
 * 与生图 chat 的 chunk/segment_plan 协议不同，勿复用 sseChatStream。
 */

export type KnowledgeSseHandlers = {
  onMessage: (chunk: string) => void
  onDone: () => void
  onError: (msg: string) => void
}

function resolveStreamUrl(): string {
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
  return `${base}/kb/chat/stream`
}

/** 解析 SSE 文本块（按空行分隔事件） */
export function parseKnowledgeSseBlock(part: string): { event: string; data: string } | null {
  const lines = part.split('\n')
  let event = 'message'
  let data = ''
  for (const line of lines) {
    if (line.startsWith('event:')) event = line.slice(6).trim()
    else if (line.startsWith('data:')) data += (data ? '\n' : '') + line.slice(5).trimStart()
  }
  if (!data && event === 'message') return null
  return { event, data }
}

export async function streamKnowledgeChat(
  body: API.KnowledgeChatRequest,
  handlers: KnowledgeSseHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(resolveStreamUrl(), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  if (!res.ok || !res.body) {
    handlers.onError(`HTTP ${res.status}`)
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      const parts = buffer.split('\n\n')
      buffer = parts.pop() || ''

      for (const part of parts) {
        if (!part.trim()) continue
        const parsed = parseKnowledgeSseBlock(part)
        if (!parsed) continue

        if (parsed.event === 'message') {
          handlers.onMessage(parsed.data)
        } else if (parsed.event === 'done') {
          handlers.onDone()
        } else if (parsed.event === 'error') {
          handlers.onError(parsed.data || '流式问答失败')
        }
      }
    }

    if (buffer.trim()) {
      const parsed = parseKnowledgeSseBlock(buffer)
      if (parsed?.event === 'message') handlers.onMessage(parsed.data)
      else if (parsed?.event === 'done') handlers.onDone()
      else if (parsed?.event === 'error') handlers.onError(parsed.data || '流式问答失败')
    }
  } finally {
    reader.releaseLock()
  }
}
