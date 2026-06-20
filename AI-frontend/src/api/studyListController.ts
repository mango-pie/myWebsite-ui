// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** 此处后端没有提供注释 POST /study/list/add */
export async function addList(body: API.StudyListAddRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseLong>('/study/list/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /study/list/all */
export async function getAllLists(options?: { [key: string]: any }) {
  return request<API.BaseResponseListStudyListVO>('/study/list/all', {
    method: 'GET',
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /study/list/delete */
export async function deleteList(body: API.DeleteRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean>('/study/list/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /study/list/sort */
export async function sortLists(body: API.StudyListSortRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean>('/study/list/sort', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /study/list/update */
export async function updateList(
  body: API.StudyListUpdateRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean>('/study/list/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}
