// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** 此处后端没有提供注释 POST /blog/post/add */
export async function addBlogPost(body: API.BlogPostAddRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseLong>('/blog/post/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /blog/post/delete */
export async function deleteBlogPost(body: API.DeleteRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean>('/blog/post/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /blog/post/get/vo */
export async function getBlogPostVo(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getBlogPostVOParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBlogPostVO>('/blog/post/get/vo', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /blog/post/like/${param0} */
export async function incrementLikeCount(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.incrementLikeCountParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.BaseResponseBoolean>(`/blog/post/like/${param0}`, {
    method: 'POST',
    params: { ...queryParams },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /blog/post/list/page/category/${param0} */
export async function getBlogPostPageByCategory(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getBlogPostPageByCategoryParams,
  options?: { [key: string]: any }
) {
  const { categoryId: param0, ...queryParams } = params
  return request<API.BaseResponsePageBlogPostVO>(`/blog/post/list/page/category/${param0}`, {
    method: 'GET',
    params: {
      // pageNum has a default value: 1
      pageNum: '1',
      // pageSize has a default value: 10
      pageSize: '10',
      ...queryParams,
    },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /blog/post/list/page/published */
export async function getPublishedBlogPostPage(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getPublishedBlogPostPageParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageBlogPostVO>('/blog/post/list/page/published', {
    method: 'GET',
    params: {
      // pageNum has a default value: 1
      pageNum: '1',
      // pageSize has a default value: 10
      pageSize: '10',
      ...params,
    },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /blog/post/list/page/tag/${param0} */
export async function getBlogPostPageByTag(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getBlogPostPageByTagParams,
  options?: { [key: string]: any }
) {
  const { tagId: param0, ...queryParams } = params
  return request<API.BaseResponsePageBlogPostVO>(`/blog/post/list/page/tag/${param0}`, {
    method: 'GET',
    params: {
      // pageNum has a default value: 1
      pageNum: '1',
      // pageSize has a default value: 10
      pageSize: '10',
      ...queryParams,
    },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /blog/post/list/page/vo */
export async function queryBlogPostPage(
  body: API.BlogPostQueryRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageBlogPostVO>('/blog/post/list/page/vo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /blog/post/update */
export async function updateBlogPost(
  body: API.BlogPostUpdateRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean>('/blog/post/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /blog/post/update/status */
export async function updateBlogPostStatus(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.updateBlogPostStatusParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean>('/blog/post/update/status', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /blog/post/update/top */
export async function toggleTopStatus(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.toggleTopStatusParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean>('/blog/post/update/top', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /blog/post/view/${param0} */
export async function incrementViewCount(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.incrementViewCountParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.BaseResponseBoolean>(`/blog/post/view/${param0}`, {
    method: 'POST',
    params: { ...queryParams },
    ...(options || {}),
  })
}
