import { ref } from 'vue'
import { listDiaryByMonth } from '@/integrations/diaryController'

export function useDiaryCalendar() {
  const year = ref(new Date().getFullYear())
  const month = ref(new Date().getMonth() + 1)
  const monthItems = ref<API.DiaryEntryMonthItemVO[]>([])
  const loading = ref(false)

  const itemByDate = () => {
    const map = new Map<string, API.DiaryEntryMonthItemVO>()
    for (const item of monthItems.value) {
      if (item.diaryDate) {
        map.set(item.diaryDate, item)
      }
    }
    return map
  }

  async function loadMonth(y?: number, m?: number) {
    if (y != null) year.value = y
    if (m != null) month.value = m
    loading.value = true
    try {
      const res = await listDiaryByMonth({ year: year.value, month: month.value })
      if (res.data.code === 0 && res.data.data) {
        monthItems.value = res.data.data
      } else {
        monthItems.value = []
      }
    } catch {
      monthItems.value = []
    } finally {
      loading.value = false
    }
  }

  function prevMonth() {
    if (month.value === 1) {
      month.value = 12
      year.value -= 1
    } else {
      month.value -= 1
    }
    return loadMonth()
  }

  function nextMonth() {
    if (month.value === 12) {
      month.value = 1
      year.value += 1
    } else {
      month.value += 1
    }
    return loadMonth()
  }

  return {
    year,
    month,
    monthItems,
    loading,
    itemByDate,
    loadMonth,
    prevMonth,
    nextMonth,
  }
}
