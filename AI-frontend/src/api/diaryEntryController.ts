// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** 此处后端没有提供注释 POST /diary/delete */
export async function deleteDiaryEntry(body: API.DeleteRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean>('/diary/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /diary/get/by-date */
export async function getDiaryByDate(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getDiaryByDateParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseDiaryEntryVO>('/diary/get/by-date', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /diary/get/vo */
export async function getDiaryEntryVo(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getDiaryEntryVOParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseDiaryEntryVO>('/diary/get/vo', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /diary/list/month */
export async function listDiaryByMonth(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listDiaryByMonthParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseListDiaryEntryMonthItemVO>('/diary/list/month', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /diary/list/page */
export async function queryDiaryPage(
  body: API.DiaryEntryQueryRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageDiaryEntryVO>('/diary/list/page', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /diary/prev-next */
export async function getDiaryPrevNext(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getDiaryPrevNextParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseDiaryEntryPrevNextVO>('/diary/prev-next', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /diary/save */
export async function saveDiaryEntry(
  body: API.DiaryEntrySaveRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseLong>('/diary/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}
