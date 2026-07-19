/**
 * AI 精读异步任务本地跟踪：把提交过的合蒸任务（jobId + 标题 + 时间）存入 localStorage，
 * 供「精读任务」页列出并轮询各自最新状态。仅记录本浏览器提交过的任务。
 */

const STORAGE_KEY = 'kb-reading-jobs'
const MAX_RECORDS = 60

export interface ReadingJobRecord {
  jobId: string
  title: string
  total?: number
  status?: string | null
  progress?: string | null
  noteId?: string | number | null
  success?: boolean
  errorMsg?: string | null
  submittedAt: number
  updatedAt: number
}

function safeParse(raw: string | null): ReadingJobRecord[] {
  if (!raw) return []
  try {
    const data = JSON.parse(raw)
    if (!Array.isArray(data)) return []
    return data.filter((r): r is ReadingJobRecord => !!r && typeof r.jobId === 'string')
  } catch {
    return []
  }
}

export function listReadingJobs(): ReadingJobRecord[] {
  if (typeof localStorage === 'undefined') return []
  return safeParse(localStorage.getItem(STORAGE_KEY)).sort(
    (a, b) => b.submittedAt - a.submittedAt,
  )
}

function persist(list: ReadingJobRecord[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_RECORDS)))
  } catch {
    /* quota / private mode — ignore */
  }
}

/** 新增或按 jobId 合并更新一条任务记录 */
export function recordReadingJob(
  rec: Partial<Omit<ReadingJobRecord, 'jobId'>> & { jobId: string | number },
): void {
  const jobId = String(rec.jobId)
  if (!jobId || jobId === 'null' || jobId === 'undefined') return
  const now = Date.now()
  const list = listReadingJobs()
  const idx = list.findIndex((r) => r.jobId === jobId)
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...rec, jobId, updatedAt: now } as ReadingJobRecord
  } else {
    list.unshift({
      jobId,
      title: rec.title || `任务 #${jobId}`,
      total: rec.total,
      status: rec.status ?? null,
      progress: rec.progress ?? null,
      noteId: rec.noteId ?? null,
      success: rec.success,
      errorMsg: rec.errorMsg ?? null,
      submittedAt: rec.submittedAt ?? now,
      updatedAt: now,
    })
  }
  persist(list)
}

/** 按 jobId 局部更新（轮询到新快照时用） */
export function updateReadingJob(
  jobId: string | number,
  patch: Partial<ReadingJobRecord>,
): void {
  const id = String(jobId)
  const list = listReadingJobs()
  const idx = list.findIndex((r) => r.jobId === id)
  if (idx < 0) return
  list[idx] = { ...list[idx], ...patch, jobId: id, updatedAt: Date.now() } as ReadingJobRecord
  persist(list)
}

export function removeReadingJob(jobId: string | number): void {
  const id = String(jobId)
  persist(listReadingJobs().filter((r) => r.jobId !== id))
}

export function clearFinishedReadingJobs(): void {
  persist(
    listReadingJobs().filter((r) => {
      const s = String(r.status || '').toUpperCase()
      return s !== 'SUCCESS' && s !== 'FAILED'
    }),
  )
}

export function clearAllReadingJobs(): void {
  persist([])
}
