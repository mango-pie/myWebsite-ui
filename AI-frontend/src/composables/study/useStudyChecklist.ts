import { message } from 'ant-design-vue'
import {
  addChecklist as addChecklistApi,
  updateChecklist as updateChecklistApi,
  deleteChecklist as deleteChecklistApi,
} from '@/api/studyChecklistController'
import { getTaskVo } from '@/api/studyTaskController'

export function useStudyChecklistActions(
  selectedTask: { value: API.StudyTaskVO | null },
  refreshTasks: () => Promise<void>,
) {
  async function reloadSelectedTask() {
    const id = selectedTask.value?.id
    if (!id) return
    const res = await getTaskVo({ id })
    if (res.data.code === 0 && res.data.data) {
      selectedTask.value = res.data.data
    }
  }

  async function addChecklistItem(taskId: number, title: string) {
    const res = await addChecklistApi({ taskId, title })
    if (res.data.code === 0) {
      await reloadSelectedTask()
      await refreshTasks()
      return true
    }
    message.error(res.data.message || '添加失败')
    return false
  }

  async function toggleChecklistItem(item: API.StudyTaskChecklistVO, done: boolean) {
    if (!item.id) return false
    const res = await updateChecklistApi({ id: item.id, done: done ? 1 : 0 })
    if (res.data.code === 0) {
      await reloadSelectedTask()
      return true
    }
    message.error(res.data.message || '操作失败')
    return false
  }

  async function deleteChecklistItem(id: number) {
    const res = await deleteChecklistApi({ id })
    if (res.data.code === 0) {
      await reloadSelectedTask()
      return true
    }
    message.error(res.data.message || '删除失败')
    return false
  }

  return { addChecklistItem, toggleChecklistItem, deleteChecklistItem }
}
