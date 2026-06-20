// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** 此处后端没有提供注释 GET /chat/agent/config */
export async function getAgentConfig(options?: { [key: string]: any }) {
  return request<API.BaseResponseChatAgentConfigVO>('/chat/agent/config', {
    method: 'GET',
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /chat/attachment */
export async function uploadAttachment(body: {}, options?: { [key: string]: any }) {
  return request<API.BaseResponseChatAttachmentVO>('/chat/attachment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /chat/chat */
export async function chat(body: API.ChatRequest, options?: { [key: string]: any }) {
  return request<API.ServerSentEventString[]>('/chat/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /chat/configs */
export async function getConfigs(options?: { [key: string]: any }) {
  return request<API.BaseResponseListChatConfigVO>('/chat/configs', {
    method: 'GET',
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /chat/types */
export async function getPromptTypes(options?: { [key: string]: any }) {
  return request<API.BaseResponseStringArray>('/chat/types', {
    method: 'GET',
    ...(options || {}),
  })
}
