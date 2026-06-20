import { ref } from 'vue'
import { message } from 'ant-design-vue'
import {
  listAllHabits,
  addHabit as addHabitApi,
  updateHabit as updateHabitApi,
  deleteHabit as deleteHabitApi,
  checkHabit,
  uncheckHabit,
  getCheckCalendar,
} from '@/api/studyHabitController'

export function useStudyHabitsState(refreshTodayStats: () => Promise<void>) {
  const habits = ref<API.StudyHabitVO[]>([])
  const habitsLoading = ref(false)

  async function refreshHabits() {
    habitsLoading.value = true
    try {
      const res = await listAllHabits()
      if (res.data.code === 0 && res.data.data) {
        habits.value = res.data.data
      }
    } finally {
      habitsLoading.value = false
    }
  }

  async function addHabitItem(title: string, color?: string) {
    const res = await addHabitApi({ title, color: color || '#e879a9' })
    if (res.data.code === 0) {
      message.success('习惯已创建')
      await refreshHabits()
      await refreshTodayStats()
      return true
    }
    message.error(res.data.message || '创建失败')
    return false
  }

  async function updateHabitFields(payload: API.StudyHabitUpdateRequest) {
    const res = await updateHabitApi(payload)
    if (res.data.code === 0) {
      message.success('已保存')
      await refreshHabits()
      return true
    }
    message.error(res.data.message || '保存失败')
    return false
  }

  async function deleteHabitById(id: number) {
    const res = await deleteHabitApi({ id })
    if (res.data.code === 0) {
      message.success('已删除')
      await refreshHabits()
      await refreshTodayStats()
      return true
    }
    message.error(res.data.message || '删除失败')
    return false
  }

  async function toggleHabitCheck(habit: API.StudyHabitVO) {
    if (!habit.id) return false
    const fn = habit.checkedToday ? uncheckHabit : checkHabit
    const res = await fn({ habitId: habit.id })
    if (res.data.code === 0) {
      await refreshHabits()
      await refreshTodayStats()
      return true
    }
    message.error(res.data.message || '操作失败')
    return false
  }

  async function getHabitCalendarDates(habitId: number, year: number, month: number) {
    const res = await getCheckCalendar({ habitId, year, month })
    if (res.data.code === 0 && res.data.data) {
      return res.data.data
    }
    return []
  }

  return {
    habits,
    habitsLoading,
    refreshHabits,
    addHabitItem,
    updateHabitFields,
    deleteHabitById,
    toggleHabitCheck,
    getHabitCalendarDates,
  }
}

export function useStudyStatsState() {
  const rangeStats = ref<API.StudyRangeStatsVO | null>(null)

  function formatDate(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  async function refreshRangeStats(days = 7) {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - (days - 1))
    const { getRangeStats } = await import('@/api/studyStatsController')
    const res = await getRangeStats({
      startDate: formatDate(start),
      endDate: formatDate(end),
    })
    if (res.data.code === 0 && res.data.data) {
      rangeStats.value = res.data.data
    }
  }

  return { rangeStats, refreshRangeStats }
}
