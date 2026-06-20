// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** 此处后端没有提供注释 POST /study/focus/abandon */
export async function abandonFocus(
  body: API.StudyFocusIdRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseStudyFocusSessionVO>('/study/focus/abandon', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /study/focus/active */
export async function getActiveFocus(options?: { [key: string]: any }) {
  return request<API.BaseResponseStudyFocusSessionVO>('/study/focus/active', {
    method: 'GET',
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /study/focus/complete */
export async function completeFocus(
  body: API.StudyFocusIdRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseStudyFocusSessionVO>('/study/focus/complete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /study/focus/list/page */
export async function listFocusPage(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listFocusPageParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageStudyFocusSessionVO>('/study/focus/list/page', {
    method: 'GET',
    params: {
      // pageNum has a default value: 1
      pageNum: '1',
      // pageSize has a default value: 20
      pageSize: '20',

      ...params,
    },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /study/focus/pause */
export async function pauseFocus(body: API.StudyFocusIdRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseStudyFocusSessionVO>('/study/focus/pause', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /study/focus/resume */
export async function resumeFocus(body: API.StudyFocusIdRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseStudyFocusSessionVO>('/study/focus/resume', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /study/focus/start */
export async function startFocus(
  body: API.StudyFocusStartRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseStudyFocusSessionVO>('/study/focus/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}
