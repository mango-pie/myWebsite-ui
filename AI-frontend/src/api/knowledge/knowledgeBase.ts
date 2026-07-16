import request from '@/request'

/** GET /kb/knowledge-bases */
export async function listKnowledgeBases(
  params?: API.KnowledgeBaseQueryRequest,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponsePageKnowledgeBaseVO>('/kb/knowledge-bases', {
    method: 'GET',
    params: { ...params },
    ...(options || {}),
  })
}

/** POST /kb/knowledge-bases */
export async function createKnowledgeBase(
  body: API.KnowledgeBaseCreateRequest,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponseKnowledgeBaseVO>('/kb/knowledge-bases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  })
}

/** GET /kb/knowledge-bases/{id} */
export async function getKnowledgeBase(id: number | string, options?: { [key: string]: unknown }) {
  return request<API.BaseResponseKnowledgeBaseVO>(`/kb/knowledge-bases/${id}`, {
    method: 'GET',
    ...(options || {}),
  })
}

/** PUT /kb/knowledge-bases/{id} */
export async function updateKnowledgeBase(
  id: number | string,
  body: API.KnowledgeBaseUpdateRequest,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponseKnowledgeBaseVO>(`/kb/knowledge-bases/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  })
}

/** DELETE /kb/knowledge-bases/{id} */
export async function deleteKnowledgeBase(id: number | string, options?: { [key: string]: unknown }) {
  return request<API.BaseResponseBoolean>(`/kb/knowledge-bases/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  })
}
