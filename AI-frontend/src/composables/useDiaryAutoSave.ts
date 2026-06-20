import { ref, watch, type Ref } from 'vue'
import { saveDiaryEntry } from '@/integrations/diaryController'
import type { DiarySavePayload } from './useDiaryTypes'

export type DiarySaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function useDiaryAutoSave(
  getPayload: () => DiarySavePayload,
  options?: { debounceMs?: number; enabled?: Ref<boolean> },
) {
  const saveStatus = ref<DiarySaveStatus>('idle')
  const entryId = ref<number | null>(null)
  let timer: ReturnType<typeof setTimeout> | null = null
  const debounceMs = options?.debounceMs ?? 2000

  async function saveNow(statusOverride?: number) {
    const payload = getPayload()
    if (!payload.diaryDate) return false

    saveStatus.value = 'saving'
    try {
      const res = await saveDiaryEntry({
        ...payload,
        status: statusOverride ?? payload.status,
      })
      if (res.data.code === 0 && res.data.data) {
        entryId.value = Number(res.data.data)
        saveStatus.value = 'saved'
        return true
      }
      saveStatus.value = 'error'
      return false
    } catch {
      saveStatus.value = 'error'
      return false
    }
  }

  function scheduleSave() {
    if (options?.enabled && !options.enabled.value) return
    if (timer) clearTimeout(timer)
    saveStatus.value = 'idle'
    timer = setTimeout(() => {
      saveNow()
    }, debounceMs)
  }

  function markDirty() {
    scheduleSave()
  }

  watch(
    () => options?.enabled?.value,
    (enabled) => {
      if (enabled === false && timer) {
        clearTimeout(timer)
        timer = null
      }
    },
  )

  return {
    saveStatus,
    entryId,
    markDirty,
    saveNow,
  }
}
