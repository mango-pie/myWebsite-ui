// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** 此处后端没有提供注释 POST /study/checklist/add */
export async function addChecklist(
  body: API.StudyChecklistAddRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseLong>('/study/checklist/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /study/checklist/delete */
export async function deleteChecklist(body: API.DeleteRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean>('/study/checklist/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /study/checklist/list */
export async function listChecklist(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listChecklistParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseListStudyTaskChecklistVO>('/study/checklist/list', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /study/checklist/update */
export async function updateChecklist(
  body: API.StudyChecklistUpdateRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean>('/study/checklist/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}
