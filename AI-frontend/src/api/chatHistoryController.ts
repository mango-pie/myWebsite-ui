// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** 此处后端没有提供注释 GET /chatHistory/admin/list */
export async function listChatHistoryByPageForAdmin(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listChatHistoryByPageForAdminParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageChatHistoryVO>('/chatHistory/admin/list', {
    method: 'GET',
    params: {
      ...params,
      chatHistoryQueryRequest: undefined,
      ...params['chatHistoryQueryRequest'],
    },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /chatHistory/aiMessage */
export async function saveAiMessage(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.saveAiMessageParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseLong>('/chatHistory/aiMessage', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /chatHistory/app/${param0} */
export async function listAppChatHistory(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listAppChatHistoryParams,
  options?: { [key: string]: any }
) {
  const { appId: param0, ...queryParams } = params
  return request<API.BaseResponsePageChatHistory>(`/chatHistory/app/${param0}`, {
    method: 'GET',
    params: {
      // pageSize has a default value: 10
      pageSize: '10',
      ...queryParams,
    },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 DELETE /chatHistory/deleteByAppId */
export async function deleteByAppId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteByAppIdParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean>('/chatHistory/deleteByAppId', {
    method: 'DELETE',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /chatHistory/errorMessage */
export async function saveErrorMessage(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.saveErrorMessageParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseLong>('/chatHistory/errorMessage', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /chatHistory/latest */
export async function getLatestChatHistory(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getLatestChatHistoryParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseListChatHistoryVO>('/chatHistory/latest', {
    method: 'GET',
    params: {
      // limit has a default value: 10
      limit: '10',
      ...params,
    },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /chatHistory/list */
export async function listChatHistoryByPage(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listChatHistoryByPageParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageChatHistoryVO>('/chatHistory/list', {
    method: 'GET',
    params: {
      ...params,
      chatHistoryQueryRequest: undefined,
      ...params['chatHistoryQueryRequest'],
    },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /chatHistory/userMessage */
export async function saveUserMessage(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.saveUserMessageParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseLong>('/chatHistory/userMessage', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}
