// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** 此处后端没有提供注释 POST /upload/common */
export async function uploadCommonImage(body: {}, options?: { [key: string]: any }) {
  return request<API.BaseResponseString>('/upload/common', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /upload/image */
export async function uploadImage(body: {}, options?: { [key: string]: any }) {
  return request<API.BaseResponseImageUploadResponse>('/upload/image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 DELETE /upload/image */
export async function deleteImage1(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteImage1Params,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean>('/upload/image', {
    method: 'DELETE',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}
