// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** 此处后端没有提供注释 POST /study/task/add */
export async function addTask(body: API.StudyTaskAddRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseLong>('/study/task/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /study/task/delete */
export async function deleteTask(body: API.DeleteRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean>('/study/task/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /study/task/get/vo */
export async function getTaskVo(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getTaskVOParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseStudyTaskVO>('/study/task/get/vo', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /study/task/list/view */
export async function queryTaskView(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.queryTaskViewParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageStudyTaskVO>('/study/task/list/view', {
    method: 'GET',
    params: {
      ...params,
      request: undefined,
      ...params['request'],
    },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /study/task/move */
export async function moveTasks(body: API.StudyTaskMoveRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean>('/study/task/move', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /study/task/sort */
export async function sortTasks(body: API.StudyTaskSortRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean>('/study/task/sort', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /study/task/sync/blog/drafts */
export async function syncBlogDrafts(options?: { [key: string]: any }) {
  return request<API.BaseResponseStudyBlogSyncVO>('/study/task/sync/blog/drafts', {
    method: 'POST',
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /study/task/toggle */
export async function toggleTask(
  body: API.StudyTaskToggleRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean>('/study/task/toggle', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /study/task/update */
export async function updateTask(
  body: API.StudyTaskUpdateRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean>('/study/task/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}
