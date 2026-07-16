import { computed, provide, ref } from 'vue'
import type { SmartViewKey } from '@/constants/study'
import {
  buildFocusPresets,
  loadStudySettings,
  type StudyUxSettings,
} from '@/utils/studySettings'
import { useStudyWorkspaceState } from './useStudyWorkspace'
import { useStudyListsActions } from './useStudyLists'
import { useStudyTasksState } from './useStudyTasks'
import { useStudyChecklistActions } from './useStudyChecklist'
import { useStudyFocusState } from './useStudyFocus'
import { useStudyHabitsState, useStudyStatsState } from './useStudyHabits'
import { studyContextKey, type StudyContext, type StudySelection } from './types'

export function useStudyContext(): StudyContext {
  const workspace = useStudyWorkspaceState()
  const selection = ref<StudySelection>({ view: 'today' as SmartViewKey })
  const mobileTab = ref<'tasks' | 'focus' | 'habits' | 'stats'>('tasks')
  const studySettings = ref<StudyUxSettings>({
    focusDefaultMinutes: 25,
    focusBreakMinutes: 5,
    habitReminderDefault: true,
    statsDefaultRangeDays: 7,
    showChecklist: true,
  })
  const focusPresets = computed(() => buildFocusPresets(studySettings.value))
  const showChecklist = computed(() => {
    if (typeof workspace.workspaceShowChecklist.value === 'boolean') {
      return workspace.workspaceShowChecklist.value
    }
    return studySettings.value.showChecklist
  })

  const tasksState = useStudyTasksState(
    selection,
    workspace.inboxListId,
    workspace.refreshTodayStats,
    workspace.refreshLists,
  )

  const listActions = useStudyListsActions(workspace.refreshLists)

  const checklistActions = useStudyChecklistActions(
    tasksState.selectedTask,
    tasksState.refreshTasks,
  )

  const focusState = useStudyFocusState(
    workspace.activeFocus,
    workspace.refreshActiveFocus,
    workspace.refreshTodayStats,
  )

  const habitsState = useStudyHabitsState(workspace.refreshTodayStats)
  const statsState = useStudyStatsState()

  async function bootstrap(createThemeLists = true) {
    studySettings.value = await loadStudySettings()
    await workspace.bootstrap(createThemeLists)
    if (!workspace.forbidden.value) {
      focusState.syncRemainingFromSession(workspace.activeFocus.value)
      await tasksState.refreshTasks()
      await habitsState.refreshHabits()
      await focusState.refreshFocusHistory()
      await statsState.refreshRangeStats(studySettings.value.statsDefaultRangeDays)
    }
  }

  async function setSelection(sel: StudySelection) {
    tasksState.setSelection(sel)
    await tasksState.refreshTasks()
  }

  const ctx: StudyContext = {
    loading: workspace.loading,
    forbidden: workspace.forbidden,
    inboxListId: workspace.inboxListId,
    lists: workspace.lists,
    todayStats: workspace.todayStats,
    activeFocus: workspace.activeFocus,
    tasks: tasksState.tasks,
    tasksLoading: tasksState.tasksLoading,
    selection,
    selectedTask: tasksState.selectedTask,
    selectedTaskId: tasksState.selectedTaskId,
    habits: habitsState.habits,
    habitsLoading: habitsState.habitsLoading,
    rangeStats: statsState.rangeStats,
    focusHistory: focusState.focusHistory,
    remainingSeconds: focusState.remainingSeconds,
    mobileTab,
    studySettings,
    focusPresets,
    showChecklist,
    bootstrap,
    refreshLists: workspace.refreshLists,
    refreshTasks: tasksState.refreshTasks,
    refreshTodayStats: workspace.refreshTodayStats,
    refreshActiveFocus: workspace.refreshActiveFocus,
    refreshHabits: habitsState.refreshHabits,
    refreshRangeStats: statsState.refreshRangeStats,
    refreshFocusHistory: focusState.refreshFocusHistory,
    setSelection,
    openTaskDetail: tasksState.openTaskDetail,
    closeTaskDetail: tasksState.closeTaskDetail,
    addTaskQuick: tasksState.addTaskQuick,
    toggleTaskDone: tasksState.toggleTaskDone,
    deleteTaskById: tasksState.deleteTaskById,
    updateTaskFields: tasksState.updateTaskFields,
    syncBlogDrafts: tasksState.syncBlogDrafts,
    addList: listActions.addList,
    updateListFields: listActions.updateListFields,
    deleteListById: (id) => {
      const list = workspace.lists.value.find((l) => l.id === id)
      return listActions.deleteListById(id, list?.listType)
    },
    addChecklistItem: checklistActions.addChecklistItem,
    toggleChecklistItem: checklistActions.toggleChecklistItem,
    deleteChecklistItem: checklistActions.deleteChecklistItem,
    startFocusSession: focusState.startFocusSession,
    pauseFocusSession: focusState.pauseFocusSession,
    resumeFocusSession: focusState.resumeFocusSession,
    completeFocusSession: focusState.completeFocusSession,
    abandonFocusSession: focusState.abandonFocusSession,
    addHabitItem: habitsState.addHabitItem,
    updateHabitFields: habitsState.updateHabitFields,
    deleteHabitById: habitsState.deleteHabitById,
    toggleHabitCheck: habitsState.toggleHabitCheck,
    getHabitCalendarDates: habitsState.getHabitCalendarDates,
    afterMutation: tasksState.afterMutation,
  }

  provide(studyContextKey, ctx)
  return ctx
}

export { studyContextKey } from './types'
