// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** 此处后端没有提供注释 GET /study/workspace/init */
export async function initWorkspace(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.initWorkspaceParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseStudyWorkspaceVO>('/study/workspace/init', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}
