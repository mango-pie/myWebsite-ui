// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** 此处后端没有提供注释 GET /chat/conversations */
export async function listConversations(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listConversationsParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseListChatConversationVO>('/chat/conversations', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /chat/conversations */
export async function createConversation(
  body: API.ChatConversationCreateRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseChatConversationVO>('/chat/conversations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /chat/conversations/${param0} */
export async function getConversation(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getConversationParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.BaseResponseChatConversationVO>(`/chat/conversations/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 DELETE /chat/conversations/${param0} */
export async function deleteConversation(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteConversationParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.BaseResponseBoolean>(`/chat/conversations/${param0}`, {
    method: 'DELETE',
    params: { ...queryParams },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /chat/conversations/${param0}/messages */
export async function listMessages(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listMessagesParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.BaseResponsePageChatMessageVO>(`/chat/conversations/${param0}/messages`, {
    method: 'GET',
    params: {
      // pageNum has a default value: 1
      pageNum: '1',
      // pageSize has a default value: 20
      pageSize: '20',
      ...queryParams,
    },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /chat/conversations/resolve */
export async function resolveDefault(
  body: API.ChatConversationResolveRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseChatConversationVO>('/chat/conversations/resolve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}
