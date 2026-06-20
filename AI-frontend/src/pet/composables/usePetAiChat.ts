import { ref } from 'vue'
import { resolveDefault, listMessages } from '@/api/chatConversationController'
import { parseApiBody } from '@/utils/safeJson'
import { readSseChatEvents } from '@/utils/sseChatStream'

const PET_CHAT_CONVERSATION_ID_KEY = 'pet_chat_conversation_id'
const LEGACY_PET_CHAT_APP_ID_KEY = 'pet_chat_app_id_v2'
const LEGACY_PET_CHAT_APP_ID_V1 = 'pet_chat_app_id_v1'

export interface PetChatMessage {
  role: 'user' | 'ai'
  content: string
  streaming?: boolean
}

export interface PetChatSegment {
  type: 'plain' | 'image'
  text?: string
  attachmentId?: string
}

export interface PetStreamHandlers {
  onChunk?: (text: string) => void
  onSegmentPlan?: (segments: string[], delays?: number[]) => Promise<void>
  onDone?: () => void
}

function isValidConversationId(value: string) {
  return /^\d+$/.test(value)
}

async function resolvePetConversation(configId: string): Promise<string> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/chat/conversations/resolve`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ configId }),
  })

  const raw = await response.text()
  const body = parseApiBody(raw)
  const data = body.data as { id?: number } | null | undefined
  if (body.code !== 0 || data?.id == null) {
    throw new Error(body.message || '创建桌宠对话失败')
  }

  return String(data.id)
}

async function streamChatByConversationId(
  currentConversationId: string,
  question: string,
  handlers?: PetStreamHandlers,
  segments?: PetChatSegment[],
): Promise<string> {
  const base = import.meta.env.VITE_API_BASE_URL
  const requestBody: Record<string, unknown> = {
    conversationId: Number(currentConversationId),
  }
  if (segments?.length) {
    requestBody.segments = segments
  } else {
    requestBody.message = question
  }

  const response = await fetch(`${base}/chat/chat`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  })
  if (!response.ok || !response.body) {
    throw new Error('请求失败')
  }

  let fullText = ''
  await readSseChatEvents(response.body, async (payload) => {
    const event = payload.event ?? (payload.d ? 'chunk' : undefined)

    if (event === 'chunk' && payload.d) {
      fullText += payload.d
      handlers?.onChunk?.(payload.d)
    } else if (event === 'segment_plan' && payload.segments?.length) {
      fullText = payload.segments.join('')
      if (handlers?.onSegmentPlan) {
        await handlers.onSegmentPlan(payload.segments, payload.delays)
      }
    } else if (event === 'done') {
      handlers?.onDone?.()
    }
  })

  return fullText.trim()
}

// cached pet persona id (fuzzy matched from /configs)
let cachedPetConfigId: string | null = null

async function pickPetConfigId(): Promise<string | undefined> {
  if (cachedPetConfigId) return cachedPetConfigId
  const base = import.meta.env.VITE_API_BASE_URL
  try {
    const res = await fetch(`${base}/chat/configs`, { credentials: 'include' })
    if (!res.ok) return undefined
    const body = parseApiBody(await res.text())
    const list: Array<{ id?: string; name?: string }> =
      body?.code === 0 && Array.isArray(body?.data) ? body.data : []
    if (!list.length) return undefined

    const keywords = ['pet', '桌宠', '助手', 'aemeath', 'dango', '宠物', 'companion', 'assistant', 'bot']
    const found = list.find((r) => {
      const n = ((r.name || r.id) || '').toLowerCase()
      return keywords.some((k) => n.includes(k.toLowerCase()))
    })
    const picked = found?.id || list[0]?.id || null
    cachedPetConfigId = picked
    return picked || undefined
  } catch {
    return undefined
  }
}

export function usePetAiChat() {
  const conversationId = ref<string | null>(null)

  function resetConversationId() {
    conversationId.value = null
    localStorage.removeItem(PET_CHAT_CONVERSATION_ID_KEY)
    localStorage.removeItem(LEGACY_PET_CHAT_APP_ID_KEY)
    localStorage.removeItem(LEGACY_PET_CHAT_APP_ID_V1)
  }

  function loadCachedConversationId() {
    localStorage.removeItem(LEGACY_PET_CHAT_APP_ID_KEY)
    localStorage.removeItem(LEGACY_PET_CHAT_APP_ID_V1)
    const raw = localStorage.getItem(PET_CHAT_CONVERSATION_ID_KEY)
    if (!raw) return
    const value = raw.trim()
    if (!isValidConversationId(value)) {
      localStorage.removeItem(PET_CHAT_CONVERSATION_ID_KEY)
      return
    }
    conversationId.value = value
  }

  async function ensureConversationId() {
    if (conversationId.value) return conversationId.value
    loadCachedConversationId()
    if (conversationId.value) return conversationId.value

    const configId = await pickPetConfigId()
    if (!configId) {
      throw new Error('暂无可用桌宠角色配置')
    }

    const nextId = await resolvePetConversation(configId)
    conversationId.value = nextId
    localStorage.setItem(PET_CHAT_CONVERSATION_ID_KEY, nextId)
    return nextId
  }

  async function askByConversationId(currentConversationId: string, question: string): Promise<string> {
    return streamChatByConversationId(currentConversationId, question)
  }

  async function ask(question: string): Promise<string> {
    const currentConversationId = await ensureConversationId()
    try {
      return await askByConversationId(currentConversationId, question)
    } catch {
      resetConversationId()
      const newConversationId = await ensureConversationId()
      return askByConversationId(newConversationId, question)
    }
  }

  async function askStream(
    question: string,
    handlers: PetStreamHandlers,
    segments?: PetChatSegment[],
  ): Promise<string> {
    const currentConversationId = await ensureConversationId()
    try {
      return await streamChatByConversationId(currentConversationId, question, handlers, segments)
    } catch {
      resetConversationId()
      const newConversationId = await ensureConversationId()
      return streamChatByConversationId(newConversationId, question, handlers, segments)
    }
  }

  async function loadRecentHistory(limit = 8): Promise<PetChatMessage[]> {
    loadCachedConversationId()
    if (!conversationId.value) return []

    const id = Number(conversationId.value)
    const probe = await listMessages({ id, pageNum: 1, pageSize: limit })
    if (probe.data.code !== 0 || !probe.data.data) return []

    const total = probe.data.data.totalPage ?? 1
    const res =
      total <= 1
        ? probe
        : await listMessages({ id, pageNum: total, pageSize: limit })

    if (res.data.code !== 0 || !res.data.data?.records?.length) return []

    const records = res.data.data.records
    const messages: PetChatMessage[] = records.map((msg) => ({
      role: msg.messageType === 'user' ? 'user' : 'ai',
      content: msg.content || '',
    }))

    return messages
  }

  /** @deprecated 兼容旧调用方 */
  const ensureAppId = ensureConversationId
  /** @deprecated 兼容旧调用方 */
  const resetAppId = resetConversationId

  return {
    ask,
    askStream,
    loadRecentHistory,
    ensureConversationId,
    resetConversationId,
    ensureAppId,
    resetAppId,
  }
}
