// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** 此处后端没有提供注释 POST /blog/image/bind/post */
export async function bindImageToPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.bindImageToPostParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean>('/blog/image/bind/post', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /blog/image/delete */
export async function deleteImage(body: API.DeleteRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean>('/blog/image/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /blog/image/get/vo */
export async function getImageVo(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getImageVOParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBlogImageVO>('/blog/image/get/vo', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /blog/image/list/by/post/${param0} */
export async function getImagesByPostId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getImagesByPostIdParams,
  options?: { [key: string]: any }
) {
  const { postId: param0, ...queryParams } = params
  return request<API.BaseResponseListBlogImage>(`/blog/image/list/by/post/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /blog/image/list/page/vo */
export async function queryImagePage(
  body: API.BlogImageQueryRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageBlogImageVO>('/blog/image/list/page/vo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /blog/image/update/status */
export async function updateImageStatus(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.updateImageStatusParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean>('/blog/image/update/status', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /blog/image/upload */
export async function uploadImage1(body: API.BlogImage, options?: { [key: string]: any }) {
  return request<API.BaseResponseLong>('/blog/image/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}
