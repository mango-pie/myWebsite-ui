import request from '@/request'

/** GET /kb/conversations */
export async function listKnowledgeConversations(
  params?: { knowledgeBaseId?: number | string },
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponseListKnowledgeConversationVO>('/kb/conversations', {
    method: 'GET',
    params: { ...params },
    ...(options || {}),
  })
}

/** DELETE /kb/conversations/{id} */
export async function deleteKnowledgeConversation(
  id: number | string,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponseBoolean>(`/kb/conversations/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  })
}

/** GET /kb/conversations/{id}/messages */
export async function listKnowledgeMessages(
  conversationId: number | string,
  params?: { pageNum?: number; pageSize?: number },
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponsePageKnowledgeMessageVO>(
    `/kb/conversations/${conversationId}/messages`,
    {
      method: 'GET',
      params: {
        pageNum: params?.pageNum ?? 1,
        pageSize: params?.pageSize ?? 50,
      },
      ...(options || {}),
    },
  )
}

/** POST /kb/chat — 同步问答（联调备用） */
export async function knowledgeChat(
  body: API.KnowledgeChatRequest,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponseKnowledgeChatResponse>('/kb/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  })
}
