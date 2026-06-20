// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** 此处后端没有提供注释 POST /blog/postTag/add */
export async function addPostTag(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.addPostTagParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean>('/blog/postTag/add', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /blog/postTag/check */
export async function existsPostTag(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.existsPostTagParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean>('/blog/postTag/check', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /blog/postTag/list/posts/${param0} */
export async function getPostIdsByTagId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getPostIdsByTagIdParams,
  options?: { [key: string]: any }
) {
  const { tagId: param0, ...queryParams } = params
  return request<API.BaseResponseListLong>(`/blog/postTag/list/posts/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /blog/postTag/list/tags/${param0} */
export async function getTagIdsByPostId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getTagIdsByPostIdParams,
  options?: { [key: string]: any }
) {
  const { postId: param0, ...queryParams } = params
  return request<API.BaseResponseListLong>(`/blog/postTag/list/tags/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /blog/postTag/remove */
export async function removePostTag(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.removePostTagParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean>('/blog/postTag/remove', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}
