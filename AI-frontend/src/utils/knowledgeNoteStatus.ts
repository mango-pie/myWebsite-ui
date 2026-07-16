export type PublishStatus =
  | 'NOT_PUBLISHED'
  | 'DRAFT_CREATED'
  | 'PUBLISHED'
  | 'SYNC_REQUIRED'
  | 'SYNC_FAILED'
  | string

export type IndexStatus =
  | 'NOT_INDEXED'
  | 'INDEXED'
  | 'REINDEX_REQUIRED'
  | 'INDEX_FAILED'
  | string

export function publishStatusLabel(status?: string): string {
  switch (status) {
    case 'NOT_PUBLISHED':
      return '未发布'
    case 'DRAFT_CREATED':
      return '草稿'
    case 'PUBLISHED':
      return '已发布'
    case 'SYNC_REQUIRED':
      return '需同步'
    case 'SYNC_FAILED':
      return '同步失败'
    default:
      return status || '-'
  }
}

export function publishStatusColor(status?: string): string {
  switch (status) {
    case 'NOT_PUBLISHED':
      return 'default'
    case 'DRAFT_CREATED':
      return 'processing'
    case 'PUBLISHED':
      return 'success'
    case 'SYNC_REQUIRED':
      return 'warning'
    case 'SYNC_FAILED':
      return 'error'
    default:
      return 'default'
  }
}

export function indexStatusLabel(status?: string): string {
  switch (status) {
    case 'NOT_INDEXED':
      return '未入库'
    case 'INDEXED':
      return '已入库'
    case 'REINDEX_REQUIRED':
      return '需重建'
    case 'INDEX_FAILED':
      return '入库失败'
    default:
      return status || '-'
  }
}

export function indexStatusColor(status?: string): string {
  switch (status) {
    case 'NOT_INDEXED':
      return 'default'
    case 'INDEXED':
      return 'success'
    case 'REINDEX_REQUIRED':
      return 'warning'
    case 'INDEX_FAILED':
      return 'error'
    default:
      return 'default'
  }
}

export function sourceTypeLabel(type?: string): string {
  switch ((type || '').toUpperCase()) {
    case 'URL':
      return 'URL'
    case 'FILE':
      return '文件'
    case 'AGENT':
      return 'AI 搜索'
    default:
      return type || '-'
  }
}

export function canPublishBlog(publishStatus?: string): boolean {
  return !publishStatus || publishStatus === 'NOT_PUBLISHED'
}

export function canSyncBlog(publishStatus?: string): boolean {
  return publishStatus === 'SYNC_REQUIRED' || publishStatus === 'SYNC_FAILED'
}

export function canIndexKb(indexStatus?: string): boolean {
  return !indexStatus || indexStatus === 'NOT_INDEXED' || indexStatus === 'INDEX_FAILED'
}

export function canReindexKb(indexStatus?: string): boolean {
  return indexStatus === 'REINDEX_REQUIRED' || indexStatus === 'INDEX_FAILED'
}
