import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { initWorkspace } from '@/api/studyWorkspaceController'
import { getAllLists } from '@/api/studyListController'
import { getTodayStats } from '@/api/studyStatsController'
import { getActiveFocus } from '@/api/studyFocusController'

export function useStudyWorkspaceState() {
  const loading = ref(true)
  const forbidden = ref(false)
  const inboxListId = ref<number>()
  const lists = ref<API.StudyListVO[]>([])
  const todayStats = ref<API.StudyTodayStatsVO | null>(null)
  const activeFocus = ref<API.StudyFocusSessionVO | null>(null)

  async function refreshLists() {
    const res = await getAllLists()
    if (res.data.code === 0 && res.data.data) {
      lists.value = res.data.data
      const inbox = res.data.data.find((l) => l.listType === 1)
      if (inbox?.id) inboxListId.value = inbox.id
    }
  }

  async function refreshTodayStats() {
    const res = await getTodayStats()
    if (res.data.code === 0 && res.data.data) {
      todayStats.value = res.data.data
    }
  }

  async function refreshActiveFocus() {
    const res = await getActiveFocus()
    if (res.data.code === 0) {
      activeFocus.value = res.data.data ?? null
    }
  }

  async function bootstrap(createThemeLists = true) {
    loading.value = true
    forbidden.value = false
    try {
      const res = await initWorkspace({ createThemeLists })
      if (res.data.code === 40101) {
        forbidden.value = true
        return
      }
      if (res.data.code !== 0) {
        message.error(res.data.message || '初始化学习工作区失败')
        return
      }
      const data = res.data.data
      if (data) {
        inboxListId.value = data.inboxListId
        lists.value = data.lists ?? []
        todayStats.value = data.todayStats ?? null
        activeFocus.value = data.activeFocus ?? null
      }
      await Promise.all([refreshLists(), refreshTodayStats(), refreshActiveFocus()])
    } catch {
      message.error('无法连接学习服务，请确认后端已启动')
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    forbidden,
    inboxListId,
    lists,
    todayStats,
    activeFocus,
    refreshLists,
    refreshTodayStats,
    refreshActiveFocus,
    bootstrap,
  }
}
