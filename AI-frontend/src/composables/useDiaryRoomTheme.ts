import { computed, ref } from 'vue'
import { themeByHour, type HomeTheme } from '@/composables/useHomeTheme'
import { DIARY_PERIOD } from '@/utils/diaryCraft'

const theme = ref<HomeTheme>(themeByHour(new Date().getHours()))
const autoTheme = ref(true)

export function useDiaryRoomTheme() {
  const period = computed(() => DIARY_PERIOD[theme.value] ?? DIARY_PERIOD.morning)

  const applyTheme = (name: HomeTheme) => {
    theme.value = name
    document.documentElement.dataset.theme = name
  }

  const setTheme = (name: HomeTheme) => {
    applyTheme(name)
  }

  const setAutoTheme = (on: boolean) => {
    autoTheme.value = on
    if (on) applyTheme(themeByHour(new Date().getHours()))
  }

  const syncFromClock = () => {
    if (autoTheme.value) applyTheme(themeByHour(new Date().getHours()))
  }

  return {
    theme,
    autoTheme,
    period,
    setTheme,
    setAutoTheme,
    syncFromClock,
    applyTheme,
  }
}
