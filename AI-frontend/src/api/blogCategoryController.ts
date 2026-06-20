// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** 此处后端没有提供注释 POST /blog/category/add */
export async function addCategory(
  body: API.BlogCategoryAddRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseLong>('/blog/category/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /blog/category/delete */
export async function deleteCategory(body: API.DeleteRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean>('/blog/category/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /blog/category/get/vo */
export async function getCategoryVo(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getCategoryVOParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBlogCategoryVO>('/blog/category/get/vo', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 GET /blog/category/list/all */
export async function getAllCategories(options?: { [key: string]: any }) {
  return request<API.BaseResponseListBlogCategory>('/blog/category/list/all', {
    method: 'GET',
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /blog/category/list/page/vo */
export async function queryCategoryPage(
  body: API.BlogCategoryQueryRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageBlogCategoryVO>('/blog/category/list/page/vo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /blog/category/update */
export async function updateCategory(
  body: API.BlogCategoryUpdateRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean>('/blog/category/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}
