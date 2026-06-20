/** 对话会话 localStorage 键（续聊、角色 configId） */
export const CHAT_LAST_CONVERSATION_KEY = 'chat_last_conversation_id'
/** @deprecated 旧版 appId 键，读取时兼容迁移 */
const LEGACY_CHAT_LAST_APP_KEY = 'chat_last_app_id'
export const CHAT_CONFIG_KEY_PREFIX = 'chat_config_'

export function getChatConfigStorageKey(configId: string): string {
  return `${CHAT_CONFIG_KEY_PREFIX}${configId}`
}

export function saveLastChatConversationId(conversationId: string | number) {
  localStorage.setItem(CHAT_LAST_CONVERSATION_KEY, String(conversationId))
}

export function getLastChatConversationId(): string | null {
  const raw =
    localStorage.getItem(CHAT_LAST_CONVERSATION_KEY) ??
    localStorage.getItem(LEGACY_CHAT_LAST_APP_KEY)
  const id = raw?.trim()
  if (!id || !/^\d+$/.test(id)) return null
  return id
}

/** 导航栏「对话」入口：有上次会话则回到具体对话页，否则进入新建页 */
export function getChatEntryPath(): string {
  const last = getLastChatConversationId()
  return last ? `/chat/${last}` : '/chat?new=1'
}

/** 是否应把 /chat 重定向到上次对话（非显式新建） */
export function shouldResumeChatHome(path: string, query: Record<string, unknown>): boolean {
  if (path !== '/chat') return false
  if (query.new === '1' || query.new === 1) return false
  return !!getLastChatConversationId()
}
