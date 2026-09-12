import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

export type HomeTheme = 'morning' | 'noon' | 'dusk' | 'night'
export type HomeSeason = 'spring' | 'summer' | 'autumn' | 'winter'

export const HOME_GREET: Record<
  HomeTheme,
  { text: string; bg: string; icon: string }
> = {
  morning: {
    text: '早上好，今天也要元气满满',
    bg: 'linear-gradient(140deg,#ffcf6e,#ffdf9e)',
    icon: `<svg class="spin" viewBox="0 0 24 24" fill="none"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" stroke="#b8860b" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  },
  noon: {
    text: '正午阳光正好，记得喝水',
    bg: 'linear-gradient(140deg,#7cc4f5,#aedcfb)',
    icon: `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4.5" stroke="#2c7fb8" stroke-width="2.2"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" stroke="#2c7fb8" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  },
  dusk: {
    text: '黄昏正好，适合散步发呆',
    bg: 'linear-gradient(140deg,#ffb45e,#ff9e8e)',
    icon: `<svg viewBox="0 0 24 24" fill="none"><path d="M6 16a6 6 0 0 1 12 0" stroke="#a3542c" stroke-width="2.2" stroke-linecap="round"/><path d="M12 5v3M3 16h2M19 16h2M5.6 8.6l1.5 1.5M18.4 8.6l-1.5 1.5M2 20h20" stroke="#a3542c" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  },
  night: {
    text: '夜深了，早点休息',
    bg: 'linear-gradient(140deg,#9b8ce8,#c5bbf0)',
    icon: `<svg viewBox="0 0 24 24" fill="none"><path d="M20 13.5A8 8 0 1 1 10.5 4 6.5 6.5 0 0 0 20 13.5z" stroke="#5a4fa0" stroke-width="2.2" stroke-linejoin="round"/></svg>`,
  },
}

export const SEASON_CAPS: Record<HomeSeason, [string, string]> = {
  spring: ['春日散步 ♪', '云的标本'],
  summer: ['夏日祭 ♪', '蝉鸣午后'],
  autumn: ['红叶狩 ♪', '银杏大道'],
  winter: ['初雪 ♪', '呼出的白气'],
}

export function themeByHour(h: number): HomeTheme {
  if (h >= 5 && h < 10) return 'morning'
  if (h >= 10 && h < 16) return 'noon'
  if (h >= 16 && h < 19) return 'dusk'
  return 'night'
}

export function seasonByMonth(m: number): HomeSeason {
  if (m >= 3 && m <= 5) return 'spring'
  if (m >= 6 && m <= 8) return 'summer'
  if (m >= 9 && m <= 11) return 'autumn'
  return 'winter'
}

export function useHomeTheme() {
  const theme = ref<HomeTheme>('morning')
  const season = ref<HomeSeason>('spring')
  const autoTheme = ref(false)
  const petalsOn = ref(true)
  const cloudsOn = ref(true)
  const parallaxOn = ref(true)
  let autoTimer: ReturnType<typeof setInterval> | null = null

  const greeting = computed(() => HOME_GREET[theme.value])
  const seasonCaps = computed(() => SEASON_CAPS[season.value])

  const applyThemeToDom = (name: HomeTheme) => {
    document.documentElement.dataset.theme = name
  }

  const setTheme = (name: HomeTheme) => {
    theme.value = name
    applyThemeToDom(name)
  }

  const setSeason = (name: HomeSeason) => {
    season.value = name
  }

  const setAutoTheme = (on: boolean) => {
    autoTheme.value = on
    if (autoTimer) {
      clearInterval(autoTimer)
      autoTimer = null
    }
    if (on) {
      const apply = () => setTheme(themeByHour(new Date().getHours()))
      apply()
      autoTimer = setInterval(apply, 60_000)
    }
  }

  onMounted(() => {
    setSeason(seasonByMonth(new Date().getMonth() + 1))
    setTheme(themeByHour(new Date().getHours()))
  })

  onUnmounted(() => {
    if (autoTimer) clearInterval(autoTimer)
    delete document.documentElement.dataset.theme
  })

  watch(theme, (t) => applyThemeToDom(t), { immediate: true })

  return {
    theme,
    season,
    autoTheme,
    petalsOn,
    cloudsOn,
    parallaxOn,
    greeting,
    seasonCaps,
    setTheme,
    setSeason,
    setAutoTheme,
  }
}
