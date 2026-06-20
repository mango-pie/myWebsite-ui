// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** 此处后端没有提供注释 GET /study/stats/range */
export async function getRangeStats(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getRangeStatsParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseStudyRangeStatsVO>('/study/stats/range', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /study/stats/today */
export async function getTodayStats(options?: { [key: string]: any }) {
  return request<API.BaseResponseStudyTodayStatsVO>('/study/stats/today', {
    method: 'GET',
    ...(options || {}),
  })
}
