import type { InjectionKey, Ref } from 'vue'
import type { SmartViewKey } from '@/constants/study'

export interface StudySelection {
  view: SmartViewKey
  listId?: number
  listName?: string
}

export interface StudyContext {
  loading: Ref<boolean>
  forbidden: Ref<boolean>
  inboxListId: Ref<number | undefined>
  lists: Ref<API.StudyListVO[]>
  todayStats: Ref<API.StudyTodayStatsVO | null>
  activeFocus: Ref<API.StudyFocusSessionVO | null>
  tasks: Ref<API.StudyTaskVO[]>
  tasksLoading: Ref<boolean>
  selection: Ref<StudySelection>
  selectedTask: Ref<API.StudyTaskVO | null>
  selectedTaskId: Ref<number | undefined>
  habits: Ref<API.StudyHabitVO[]>
  habitsLoading: Ref<boolean>
  rangeStats: Ref<API.StudyRangeStatsVO | null>
  focusHistory: Ref<API.StudyFocusSessionVO[]>
  remainingSeconds: Ref<number>
  mobileTab: Ref<'tasks' | 'focus' | 'habits' | 'stats'>
  bootstrap: (createThemeLists?: boolean) => Promise<void>
  refreshLists: () => Promise<void>
  refreshTasks: () => Promise<void>
  refreshTodayStats: () => Promise<void>
  refreshActiveFocus: () => Promise<void>
  refreshHabits: () => Promise<void>
  refreshRangeStats: (days?: number) => Promise<void>
  refreshFocusHistory: () => Promise<void>
  setSelection: (sel: StudySelection) => void
  openTaskDetail: (task: API.StudyTaskVO) => Promise<void>
  closeTaskDetail: () => void
  addTaskQuick: (title: string) => Promise<boolean>
  toggleTaskDone: (task: API.StudyTaskVO, done: boolean) => Promise<boolean>
  deleteTaskById: (id: number) => Promise<boolean>
  updateTaskFields: (payload: API.StudyTaskUpdateRequest) => Promise<boolean>
  syncBlogDrafts: () => Promise<number>
  addList: (name: string, color?: string) => Promise<boolean>
  updateListFields: (payload: API.StudyListUpdateRequest) => Promise<boolean>
  deleteListById: (id: number) => Promise<boolean>
  addChecklistItem: (taskId: number, title: string) => Promise<boolean>
  toggleChecklistItem: (item: API.StudyTaskChecklistVO, done: boolean) => Promise<boolean>
  deleteChecklistItem: (id: number) => Promise<boolean>
  startFocusSession: (taskId?: number, plannedMinutes?: number) => Promise<boolean>
  pauseFocusSession: () => Promise<boolean>
  resumeFocusSession: () => Promise<boolean>
  completeFocusSession: () => Promise<boolean>
  abandonFocusSession: () => Promise<boolean>
  addHabitItem: (title: string, color?: string) => Promise<boolean>
  updateHabitFields: (payload: API.StudyHabitUpdateRequest) => Promise<boolean>
  deleteHabitById: (id: number) => Promise<boolean>
  toggleHabitCheck: (habit: API.StudyHabitVO) => Promise<boolean>
  getHabitCalendarDates: (habitId: number, year: number, month: number) => Promise<string[]>
  afterMutation: () => Promise<void>
}

export const studyContextKey: InjectionKey<StudyContext> = Symbol('studyContext')
