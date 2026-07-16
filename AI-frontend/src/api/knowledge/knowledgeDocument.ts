import request from '@/request'
import type { AxiosProgressEvent } from 'axios'

/** GET /kb/knowledge-bases/{kbId}/documents */
export async function listKnowledgeDocuments(
  kbId: number | string,
  params?: API.KnowledgeDocumentQueryRequest,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponsePageKnowledgeDocumentVO>(`/kb/knowledge-bases/${kbId}/documents`, {
    method: 'GET',
    params: { ...params },
    ...(options || {}),
  })
}

/** POST /kb/knowledge-bases/{kbId}/documents — multipart field: file */
export async function uploadKnowledgeDocument(
  kbId: number | string,
  file: File,
  onUploadProgress?: (e: AxiosProgressEvent) => void,
  options?: { [key: string]: unknown },
) {
  const form = new FormData()
  form.append('file', file)
  return request<API.BaseResponseKnowledgeDocumentVO>(`/kb/knowledge-bases/${kbId}/documents`, {
    method: 'POST',
    data: form,
    onUploadProgress,
    ...(options || {}),
  })
}

/** GET /kb/documents/{id} */
export async function getKnowledgeDocument(id: number | string, options?: { [key: string]: unknown }) {
  return request<API.BaseResponseKnowledgeDocumentVO>(`/kb/documents/${id}`, {
    method: 'GET',
    ...(options || {}),
  })
}

/** DELETE /kb/documents/{id} */
export async function deleteKnowledgeDocument(
  id: number | string,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponseBoolean>(`/kb/documents/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  })
}

/** GET /kb/documents/{id}/download-url */
export async function getKnowledgeDocumentDownloadUrl(
  id: number | string,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponseKnowledgeDownloadUrlVO>(`/kb/documents/${id}/download-url`, {
    method: 'GET',
    ...(options || {}),
  })
}

/** POST /kb/documents/{id}/parse */
export async function parseKnowledgeDocument(
  id: number | string,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponseKnowledgeDocumentVO>(`/kb/documents/${id}/parse`, {
    method: 'POST',
    ...(options || {}),
  })
}

/** GET /kb/documents/{id}/chunks */
export async function listKnowledgeDocumentChunks(
  id: number | string,
  params?: { pageNum?: number; pageSize?: number },
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponseListKnowledgeChunkVO>(`/kb/documents/${id}/chunks`, {
    method: 'GET',
    params: {
      pageNum: params?.pageNum ?? 1,
      pageSize: params?.pageSize ?? 20,
    },
    ...(options || {}),
  })
}
