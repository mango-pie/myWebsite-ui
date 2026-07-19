/**
 * 精读 KPI 概览数据：用现有 listKnowledgeNotes 分别查总数/已发布/已入库（pageSize:1 取 totalRow），
 * 进行中任务数来自本地任务跟踪 listReadingJobs。纯读，不改任何后端状态。
 */
import { ref } from 'vue'
import { listKnowledgeNotes } from '@/api/knowledge'
import { listReadingJobs } from '@/composables/useReadingJobTracker'

export function useKnowledgeNoteStats() {
  const total = ref(0)
  const published = ref(0)
  const indexed = ref(0)
  const running = ref(0)
  const loading = ref(false)

  const countOf = async (extra: Partial<API.KnowledgeNoteQueryRequest>): Promise<number> => {
    try {
      const res = await listKnowledgeNotes({ pageNum: 1, pageSize: 1, ...extra })
      if (res.data.code === 0 && res.data.data) return Number(res.data.data.totalRow ?? 0)
    } catch {
      /* 忽略单项失败，保留 0 */
    }
    return 0
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
      running.value = listReadingJobs().filter((j) => {
        const s = String(j.status || '').toUpperCase()
        return s !== 'SUCCESS' && s !== 'FAILED'
      }).length
    } finally {
      loading.value = false
    }
  }

  return { total, published, indexed, running, loading, refresh }
}
