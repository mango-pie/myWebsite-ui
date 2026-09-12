import request from '@/request'

const LONG_TIMEOUT = 300_000

/** POST /admin/knowledge/ingest/url */
export async function ingestKnowledgeUrl(
  body: API.KnowledgeIngestUrlRequest,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponseKnowledgeNoteDetailVO>('/admin/knowledge/ingest/url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    timeout: LONG_TIMEOUT,
    ...(options || {}),
  })
}

/** POST /admin/knowledge/ingest/file — multipart: file + title/tags */
export async function ingestKnowledgeFile(
  file: File,
  params?: API.KnowledgeIngestFileRequest,
  options?: { [key: string]: unknown },
) {
  const form = new FormData()
  form.append('file', file)
  if (params?.title) form.append('title', params.title)
  if (params?.tags) form.append('tags', params.tags)
  return request<API.BaseResponseKnowledgeNoteDetailVO>('/admin/knowledge/ingest/file', {
    method: 'POST',
    data: form,
    timeout: LONG_TIMEOUT,
    ...(options || {}),
  })
}

/** GET /admin/knowledge/notes */
export async function listKnowledgeNotes(
  params?: API.KnowledgeNoteQueryRequest,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponsePageKnowledgeNoteVO>('/admin/knowledge/notes', {
    method: 'GET',
    params: { ...params },
    ...(options || {}),
  })
}

/** GET /admin/knowledge/notes/{noteId} */
export async function getKnowledgeNoteDetail(
  noteId: number | string,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponseKnowledgeNoteDetailVO>(`/admin/knowledge/notes/${noteId}`, {
    method: 'GET',
    ...(options || {}),
  })
}

/** PUT /admin/knowledge/notes/{noteId} */
export async function updateKnowledgeNote(
  noteId: number | string,
  body: API.KnowledgeNoteUpdateRequest,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponseKnowledgeNoteVO>(`/admin/knowledge/notes/${noteId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  })
}

/** DELETE /admin/knowledge/notes/{noteId} */
export async function deleteKnowledgeNote(
  noteId: number | string,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponseBoolean>(`/admin/knowledge/notes/${noteId}`, {
    method: 'DELETE',
    ...(options || {}),
  })
}

/** PUT /admin/knowledge/notes/{noteId}/review-status — 复习状态流转 NEW/REVIEWING/MASTERED */
export async function updateKnowledgeNoteReviewStatus(
  noteId: number | string,
  reviewStatus: string,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponseKnowledgeNoteVO>(
    `/admin/knowledge/notes/${noteId}/review-status`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      data: { reviewStatus },
      ...(options || {}),
    },
  )
}

/** POST /admin/knowledge/notes/{noteId}/redistill */
export async function redistillKnowledgeNote(
  noteId: number | string,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponseKnowledgeNoteDetailVO>(
    `/admin/knowledge/notes/${noteId}/redistill`,
    {
      method: 'POST',
      timeout: LONG_TIMEOUT,
      ...(options || {}),
    },
  )
}

/** POST /admin/knowledge/notes/{noteId}/publish-blog */
export async function publishKnowledgeNoteBlog(
  noteId: number | string,
  body: API.KnowledgeNotePublishRequest,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponseBlogPostVO>(`/admin/knowledge/notes/${noteId}/publish-blog`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  })
}

/** POST /admin/knowledge/notes/{noteId}/sync-blog */
export async function syncKnowledgeNoteBlog(
  noteId: number | string,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponseBlogPostVO>(`/admin/knowledge/notes/${noteId}/sync-blog`, {
    method: 'POST',
    ...(options || {}),
  })
}

/** POST /admin/knowledge/notes/{noteId}/index */
export async function indexKnowledgeNote(
  noteId: number | string,
  body: API.KnowledgeNoteIndexRequest,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponseKnowledgeDocumentVO>(`/admin/knowledge/notes/${noteId}/index`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    timeout: LONG_TIMEOUT,
    ...(options || {}),
  })
}

/** POST /admin/knowledge/notes/{noteId}/reindex */
export async function reindexKnowledgeNote(
  noteId: number | string,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponseKnowledgeDocumentVO>(`/admin/knowledge/notes/${noteId}/reindex`, {
    method: 'POST',
    timeout: LONG_TIMEOUT,
    ...(options || {}),
  })
}

/** POST /admin/knowledge/search/preview — 同步调试用；产品主路径用 submitKnowledgeReadingSearch */
export async function searchKnowledgePreview(
  body: API.KnowledgeSearchPreviewRequest,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponseKnowledgeSearchPreviewVO>('/admin/knowledge/search/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    timeout: LONG_TIMEOUT,
    ...(options || {}),
  })
}

/** POST /admin/knowledge/reading-jobs/search — 异步搜索，立即返回 jobId */
export async function submitKnowledgeReadingSearch(
  body: API.KnowledgeSearchPreviewRequest,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponseKnowledgeReadingJobVO>('/admin/knowledge/reading-jobs/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  })
}

/** POST /admin/knowledge/ingest/batch-url — 多源合并为 1 篇 note（可传 jobId 复用搜索任务） */
export async function ingestKnowledgeBatchUrl(
  body: API.KnowledgeIngestBatchUrlRequest,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponseKnowledgeReadingJobVO>(
    '/admin/knowledge/ingest/batch-url',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: body,
      timeout: LONG_TIMEOUT,
      ...(options || {}),
    },
  )
}

/** GET /admin/knowledge/reading-jobs — 当前用户任务分页列表 */
export async function listKnowledgeReadingJobs(
  params?: API.KnowledgeReadingJobQueryRequest,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponsePageKnowledgeReadingJobVO>(
    '/admin/knowledge/reading-jobs',
    {
      method: 'GET',
      params: { ...params },
      ...(options || {}),
    },
  )
}

/** GET /admin/knowledge/reading-jobs/{jobId} */
export async function getKnowledgeReadingJob(
  jobId: number | string,
  options?: { [key: string]: unknown },
) {
  return request<API.BaseResponseKnowledgeReadingJobVO>(
    `/admin/knowledge/reading-jobs/${jobId}`,
    {
      method: 'GET',
      ...(options || {}),
    },
  )
}
