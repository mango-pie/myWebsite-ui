/**
 * 精读 KPI 概览：
 * - 总精读 / 已发布 / 已入库：走 listKnowledgeNotes（pageSize:1 取 totalRow）
 * - 进行中：本机跟踪的合蒸任务（localStorage）+ 采集页草稿中的进行中 job，并尽量向后端刷新状态
 */
import { ref, type Ref } from 'vue'
import { listKnowledgeNotes, getKnowledgeReadingJob } from '@/api/knowledge'
import {
  listReadingJobs,
  updateReadingJob,
  type ReadingJobRecord,
} from '@/composables/useReadingJobTracker'
import {
  isReadingJobInProgress,
  loadKnowledgeSearchDraft,
} from '@/composables/useKnowledgeSearchDraft'

/** 兼容 totalRow / total，以及大数被安全解析成字符串的情况 */
export function extractPageTotal(page: {
  totalRow?: number | string
  total?: number | string
} | null | undefined): number {
  if (!page) return 0
  const raw = page.totalRow ?? page.total ?? 0
  const n = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0
}

function isJobTerminal(rec: Pick<ReadingJobRecord, 'status' | 'success' | 'noteId'>): boolean {
  const s = String(rec.status || '').toUpperCase()
  if (s === 'SUCCESS' || s === 'FAILED') return true
  if (rec.success && rec.noteId != null) return true
  return false
}

export function countLocalRunningJobs(): number {
  const fromStore = listReadingJobs().filter((j) => !isJobTerminal(j)).length
  const draft = loadKnowledgeSearchDraft()
  const draftRunning = isReadingJobInProgress(draft?.batchResult) ? 1 : 0
  // 草稿 job 若已在 localStorage 里则不重复计
  if (draftRunning && draft?.batchResult?.jobId != null) {
    const id = String(draft.batchResult.jobId)
    if (listReadingJobs().some((j) => j.jobId === id)) return fromStore
  }
  return fromStore + draftRunning
}

async function refreshLocalJobStatuses(): Promise<void> {
  const active = listReadingJobs().filter((j) => !isJobTerminal(j))
  if (!active.length) return
  await Promise.all(
    active.slice(0, 12).map(async (job) => {
      try {
        const res = await getKnowledgeReadingJob(job.jobId)
        if (res.data.code === 0 && res.data.data) {
          const d = res.data.data
          updateReadingJob(job.jobId, {
            status: d.status,
            progress: d.progress,
            noteId: d.noteId ?? job.noteId,
            success: d.success,
            errorMsg: d.errorMsg ?? null,
            total: d.total ?? job.total,
          })
        }
      } catch {
        /* 忽略单条轮询失败 */
      }
    }),
  )
}

export function useKnowledgeNoteStats() {
  const total = ref(0)
  const published = ref(0)
  const indexed = ref(0)
  const running = ref(0)
  const loading = ref(false)

  const countOf = async (extra: Partial<API.KnowledgeNoteQueryRequest>): Promise<number> => {
    try {
      const res = await listKnowledgeNotes({ pageNum: 1, pageSize: 1, ...extra })
      if (res.data.code === 0 && res.data.data) return extractPageTotal(res.data.data)
    } catch {
      /* 忽略单项失败，保留 0 */
    }
    return 0
  }

  const refreshRunning = async (poll = true) => {
    if (poll) await refreshLocalJobStatuses()
    running.value = countLocalRunningJobs()
  }

  /** 列表无筛选时，用同一次分页结果校准「总精读」，避免 KPI 与表头两套数字 */
  const syncTotalFromPage = (pageTotal: number) => {
    if (Number.isFinite(pageTotal) && pageTotal >= 0) total.value = pageTotal
  }

  const refresh = async () => {
    loading.value = true
    try {
      const [t, p, i] = await Promise.all([
        countOf({}),
        countOf({ publishStatus: 'PUBLISHED' }),
        countOf({ indexStatus: 'INDEXED' }),
      ])
      total.value = t
      published.value = p
      indexed.value = i
      await refreshRunning(true)
    } finally {
      loading.value = false
    }
  }

  return {
    total: total as Ref<number>,
    published: published as Ref<number>,
    indexed: indexed as Ref<number>,
    running: running as Ref<number>,
    loading: loading as Ref<boolean>,
    refresh,
    refreshRunning,
    syncTotalFromPage,
  }
}
