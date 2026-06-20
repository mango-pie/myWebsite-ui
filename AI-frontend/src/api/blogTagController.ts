// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** 此处后端没有提供注释 POST /blog/tag/add */
export async function addTag(body: API.BlogTagAddRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseLong>('/blog/tag/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /blog/tag/delete */
export async function deleteTag(body: API.DeleteRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean>('/blog/tag/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /blog/tag/get/vo */
export async function getTagVo(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getTagVOParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBlogTagVO>('/blog/tag/get/vo', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /blog/tag/list/all */
export async function getAllTags(options?: { [key: string]: any }) {
  return request<API.BaseResponseListBlogTag>('/blog/tag/list/all', {
    method: 'GET',
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /blog/tag/list/cloud */
export async function getTagCloud(options?: { [key: string]: any }) {
  return request<API.BaseResponseListBlogTagVO>('/blog/tag/list/cloud', {
    method: 'GET',
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /blog/tag/list/page/vo */
export async function queryTagPage(
  body: API.BlogTagQueryRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageBlogTagVO>('/blog/tag/list/page/vo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /blog/tag/update */
export async function updateTag(body: API.BlogTagUpdateRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean>('/blog/tag/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}
