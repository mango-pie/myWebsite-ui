/** 知识库文档展示工具 */

export function formatFileSize(bytes: number | undefined | null): string {
  if (bytes == null || Number.isNaN(bytes)) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export const KB_PARSE_STATUS_LABEL: Record<string, string> = {
  UPLOADED: '待解析',
  PENDING: '待解析',
  PARSING: '解析中',
  PARSED: '已完成',
  SUCCESS: '已完成',
  FAILED: '失败',
}

export const KB_PARSE_STATUS_COLOR: Record<string, string> = {
  UPLOADED: 'default',
  PENDING: 'default',
  PARSING: 'processing',
  PARSED: 'success',
  SUCCESS: 'success',
  FAILED: 'error',
}

/** 是否可触发解析（Ai-Backend 上传后为 UPLOADED） */
export function canParseDocument(status: string | undefined): boolean {
  if (!status) return true
  return status === 'UPLOADED' || status === 'PENDING' || status === 'FAILED'
}

/** 是否解析完成可问答/看切块 */
export function isParsedDocument(status: string | undefined): boolean {
  return status === 'PARSED' || status === 'SUCCESS'
}

/** 是否解析进行中 */
export function isParsingDocument(status: string | undefined): boolean {
  return status === 'PARSING'
}

export function kbParseStatusLabel(status: string | undefined): string {
  if (!status) return '-'
  return KB_PARSE_STATUS_LABEL[status] ?? status
}

export function kbParseStatusColor(status: string | undefined): string {
  if (!status) return 'default'
  return KB_PARSE_STATUS_COLOR[status] ?? 'default'
}

export const KB_UPLOAD_ACCEPT =
  '.pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown'

export const KB_MAX_UPLOAD_BYTES = 50 * 1024 * 1024

const ALLOWED_EXTS = ['.pdf', '.docx', '.txt', '.md']

export function isAllowedKbUploadFile(file: File): { ok: boolean; message?: string } {
  const name = file.name.toLowerCase()
  const okExt = ALLOWED_EXTS.some((ext) => name.endsWith(ext))
  if (!okExt) {
    return { ok: false, message: `仅支持 ${ALLOWED_EXTS.join(' / ')}` }
  }
  if (file.size > KB_MAX_UPLOAD_BYTES) {
    return { ok: false, message: '单文件不能超过 50MB' }
  }
  return { ok: true }
}
