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
  batchResult: API.KnowledgeIngestBatchResultVO | null
  activeTab: string
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
): API.KnowledgeIngestBatchResultVO | null {
  if (raw == null || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (Array.isArray(r.items)) return null
  return raw as API.KnowledgeIngestBatchResultVO
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
