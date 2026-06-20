// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** 此处后端没有提供注释 POST /study/habit/add */
export async function addHabit(body: API.StudyHabitAddRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseLong>('/study/habit/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /study/habit/check */
export async function checkHabit(
  body: API.StudyHabitCheckRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean>('/study/habit/check', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /study/habit/check/calendar */
export async function getCheckCalendar(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getCheckCalendarParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseListString>('/study/habit/check/calendar', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /study/habit/delete */
export async function deleteHabit(body: API.DeleteRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean>('/study/habit/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /study/habit/list/all */
export async function listAllHabits(options?: { [key: string]: any }) {
  return request<API.BaseResponseListStudyHabitVO>('/study/habit/list/all', {
    method: 'GET',
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /study/habit/uncheck */
export async function uncheckHabit(
  body: API.StudyHabitCheckRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean>('/study/habit/uncheck', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /study/habit/update */
export async function updateHabit(
  body: API.StudyHabitUpdateRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean>('/study/habit/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}
