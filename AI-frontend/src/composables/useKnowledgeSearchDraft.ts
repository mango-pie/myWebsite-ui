/**
 * AI 搜索草稿：当前标签页 sessionStorage，切页不丢候选 / 勾选 / 批量结果
 */

const STORAGE_KEY = 'kb-ingest-search-draft'

export type KnowledgeSearchDraft = {
  goal: string
  preference: string
  tags: string
  manualUrls: string
  distillPrompt: string
  outline: string
  candidates: API.KnowledgeSearchCandidate[]
  selectedUrls: string[]
  searchDone: boolean
  batchResult: API.KnowledgeReadingJobVO | null
  activeTab: string
}

export function isReadingJobInProgress(job: API.KnowledgeReadingJobVO | null | undefined): boolean {
  if (!job?.jobId) return false
  const status = String(job.status || '').toUpperCase()
  if (status === 'SUCCESS' || status === 'FAILED') return false
  // WAITING = 待勾选，仍算「进行中」作业
  return status === 'PENDING' || status === 'RUNNING' || status === 'WAITING'
}

export function isReadingJobAwaitingSelect(job: API.KnowledgeReadingJobVO | null | undefined): boolean {
  if (!job?.jobId) return false
  const status = String(job.status || '').toUpperCase()
  const progress = String(job.progress || '').toUpperCase()
  return status === 'WAITING' || progress === 'AWAITING_SELECT'
}

export function isReadingJobSearching(job: API.KnowledgeReadingJobVO | null | undefined): boolean {
  return String(job?.progress || '').toUpperCase() === 'SEARCHING'
}

export function readingJobProgressLabel(progress: string | null | undefined): string {
  switch (String(progress || '').toUpperCase()) {
    case 'SEARCHING':
      return '正在搜索候选'
    case 'AWAITING_SELECT':
      return '请勾选网页'
    case 'QUEUED':
      return '排队中'
    case 'READING':
      return '正在读取网页'
    case 'DISTILLING':
      return '正在合并生成文章'
    case 'DONE':
      return '完成'
    case 'ERROR':
      return '失败'
    default:
      return progress ? String(progress) : '处理中'
  }
}

/** 工作台步骤 1～4（对应产品五步的前四步） */
export function readingJobWorkbenchStep(job: API.KnowledgeReadingJobVO | null | undefined): 1 | 2 | 3 | 4 {
  if (!job?.jobId) return 1
  const status = String(job.status || '').toUpperCase()
  const progress = String(job.progress || '').toUpperCase()
  if (status === 'SUCCESS' || progress === 'DONE') return 4
  if (status === 'FAILED' || progress === 'ERROR') return 4
  if (progress === 'SEARCHING') return 1
  if (status === 'WAITING' || progress === 'AWAITING_SELECT') return 2
  if (progress === 'QUEUED' || progress === 'READING' || progress === 'DISTILLING') return 4
  return 1
}

export function loadKnowledgeSearchDraft(): KnowledgeSearchDraft | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as Partial<KnowledgeSearchDraft>
    if (!data || typeof data !== 'object') return null
    const searchDone = !!data.searchDone
    const hasBatch = data.batchResult != null
    if (!searchDone && !hasBatch) return null
    return {
      goal: typeof data.goal === 'string' ? data.goal : '',
      preference: typeof data.preference === 'string' ? data.preference : '',
      tags: typeof data.tags === 'string' ? data.tags : '',
      manualUrls: typeof data.manualUrls === 'string' ? data.manualUrls : '',
      distillPrompt: typeof data.distillPrompt === 'string' ? data.distillPrompt : '',
      outline: typeof data.outline === 'string' ? data.outline : '',
      candidates: Array.isArray(data.candidates) ? data.candidates : [],
      selectedUrls: Array.isArray(data.selectedUrls)
        ? data.selectedUrls.map(String)
        : [],
      searchDone,
      batchResult: normalizeBatchResult(data.batchResult),
      activeTab: typeof data.activeTab === 'string' ? data.activeTab : 'agent',
    }
  } catch {
    return null
  }
}

/** 兼容旧草稿（多 note items[]）；无法识别则丢弃 batch 段 */
function normalizeBatchResult(
  raw: unknown,
): API.KnowledgeReadingJobVO | null {
  if (raw == null || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (Array.isArray(r.items)) return null
  return raw as API.KnowledgeReadingJobVO
}

export function saveKnowledgeSearchDraft(state: KnowledgeSearchDraft): void {
  if (typeof sessionStorage === 'undefined') return
  if (!state.searchDone && state.batchResult == null) {
    clearKnowledgeSearchDraft()
    return
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* quota / private mode — ignore */
  }
}

export function clearKnowledgeSearchDraft(): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.removeItem(STORAGE_KEY)
}
