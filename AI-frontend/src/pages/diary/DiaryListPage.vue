<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { PenLine, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { queryDiaryPage } from '@/integrations/diaryController'
import { useDiaryCalendar } from '@/composables/useDiaryCalendar'
import { formatDiaryDate, getMoodEmoji, todayDateString } from '@/utils/diaryFormat'

const router = useRouter()
const loading = ref(false)
const entries = ref<API.DiaryEntryVO[]>([])

const { year, month, monthItems, itemByDate, loadMonth, prevMonth, nextMonth } = useDiaryCalendar()

const fetchList = async () => {
  loading.value = true
  try {
    const res = await queryDiaryPage({
      pageNum: 1,
      pageSize: 20,
      sortField: 'diary_date',
      sortOrder: 'descend',
    })
    if (res.data.code === 0 && res.data.data) {
      entries.value = res.data.data.records || []
    } else {
      message.error(res.data.message || '加载日记失败')
    }
  } catch {
    message.error('加载日记失败')
  } finally {
    loading.value = false
  }
}

const writeToday = () => {
  router.push({ path: '/diary/write', query: { date: todayDateString() } })
}

const openEntry = (entry: API.DiaryEntryVO) => {
  if (entry.id != null) {
    router.push(`/diary/${entry.id}`)
    return
  }
  if (entry.diaryDate) {
    router.push({ path: '/diary/write', query: { date: entry.diaryDate } })
  }
}

const hasDiary = (date: string) => {
  return itemByDate().has(date)
}

const getDiaryForDate = (date: string) => {
  return itemByDate().get(date)
}

const formatDateKey = (y: number, m: number, d: number) => {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

const daysInMonth = (y: number, m: number) => {
  return new Date(y, m, 0).getDate()
}

const firstDayOfMonth = (y: number, m: number) => {
  return new Date(y, m - 1, 1).getDay()
}

onMounted(async () => {
  await fetchList()
  await loadMonth()
})
</script>

<template>
  <div class="container">
    <div class="diary-layout">
      <div class="diary-main">
        <header class="page-header">
          <div>
            <h1>日记</h1>
            <p class="subtitle">记录每一天的心情与故事</p>
          </div>
          <button class="btn" @click="writeToday">
            <PenLine :size="16" />
            写今天
          </button>
        </header>

        <div v-if="loading" class="loading-state">
          <div class="sticker" style="padding: 40px; text-align: center;">
            <p>加载中...</p>
          </div>
        </div>

        <div v-else-if="!entries.length" class="empty-state">
          <div class="sticker" style="padding: 60px 40px; text-align: center;">
            <div class="empty-icon">📖</div>
            <h3>还没有日记</h3>
            <p>写下今天的第一笔吧</p>
            <button class="btn" @click="writeToday" style="margin-top: 16px;">
              <PenLine :size="16" />
              开始写
            </button>
          </div>
        </div>

        <div v-else class="diary-list">
          <div
            v-for="(entry, index) in entries"
            :key="entry.id ?? entry.diaryDate"
            class="sticker diary-entry"
            :style="{ '--rot': (index % 2 === 0 ? -1 : 1) * 2 + 'deg' }"
            @click="openEntry(entry)"
          >
            <div class="tape" :style="{ '--tc': index % 3 === 0 ? 'var(--st-sakura)' : index % 3 === 1 ? 'var(--st-mint)' : 'var(--st-sky)', '--tilt': (index % 2 === 0 ? -4 : 4) + 'deg' }" />
            <div class="entry-header">
              <div class="stamp" :style="{ '--accent': index % 2 === 0 ? 'var(--st-sakura)' : 'var(--st-mint)' }">
                <span class="d">{{ entry.diaryDate?.split('-')[2] || '--' }}</span>
                <span class="m">{{ entry.diaryDate?.split('-')[1] || '---' }}</span>
              </div>
              <div class="entry-meta">
                <h3>{{ entry.title || '无标题' }}</h3>
                <div class="meta-row">
                  <span class="date-text">{{ formatDiaryDate(entry.diaryDate) }}</span>
                  <span v-if="entry.mood" class="mood-badge" :data-tone="entry.mood">
                    {{ getMoodEmoji(entry.mood) }} {{ entry.mood }}
                  </span>
                </div>
              </div>
            </div>
            <p class="entry-content">{{ entry.content?.slice(0, 150) || '（空白）' }}{{ entry.content && entry.content.length > 150 ? '…' : '' }}</p>
          </div>
        </div>
      </div>

      <aside class="diary-sidebar">
        <div class="sticker calendar-card">
          <div class="calendar-header">
            <button class="cal-nav" @click="prevMonth">
              <ChevronLeft :size="18" />
            </button>
            <h3>{{ year }}年{{ month }}月</h3>
            <button class="cal-nav" @click="nextMonth">
              <ChevronRight :size="18" />
            </button>
          </div>
          <div class="calendar-grid">
            <div class="cal-day-name">日</div>
            <div class="cal-day-name">一</div>
            <div class="cal-day-name">二</div>
            <div class="cal-day-name">三</div>
            <div class="cal-day-name">四</div>
            <div class="cal-day-name">五</div>
            <div class="cal-day-name">六</div>
            <div
              v-for="n in firstDayOfMonth(year, month)"
              :key="'empty-' + n"
              class="cal-day empty"
            />
            <div
              v-for="d in daysInMonth(year, month)"
              :key="d"
              class="cal-day"
              :class="{ 'has-diary': hasDiary(formatDateKey(year, month, d)), 'today': formatDateKey(year, month, d) === todayDateString() }"
              @click="hasDiary(formatDateKey(year, month, d)) && openEntry(getDiaryForDate(formatDateKey(year, month, d))!)"
            >
              {{ d }}
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.diary-layout {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 32px;
}

.diary-main {
  min-width: 0;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1.5px dashed var(--hairline);
}

.page-header h1 {
  margin: 0 0 8px;
  font-size: 48px;
}

.subtitle {
  margin: 0;
  color: var(--ink-soft);
  font-size: 15px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px;
  font-size: 24px;
}

.empty-state p {
  margin: 0;
  color: var(--ink-soft);
}

.diary-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.diary-entry {
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  transform: rotate(var(--rot, 0deg));
}

.diary-entry:hover {
  transform: rotate(0deg) translateY(-4px);
}

.entry-header {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 16px;
}

.entry-meta {
  flex: 1;
}

.entry-meta h3 {
  margin: 0 0 8px;
  font-size: 22px;
  line-height: 1.3;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.date-text {
  font-size: 13px;
  color: var(--ink-soft);
}

.mood-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  background: var(--st-cream);
  border: 1.5px solid var(--hairline);
}

.entry-content {
  margin: 0;
  font-size: 15px;
  line-height: 1.7;
  color: var(--ink);
}

.calendar-card {
  position: sticky;
  top: 80px;
  padding: 20px;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.calendar-header h3 {
  margin: 0;
  font-size: 18px;
}

.cal-nav {
  background: none;
  border: none;
  color: var(--ink-soft);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s;
}

.cal-nav:hover {
  background: var(--paper-surface);
  color: var(--ink);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.cal-day-name {
  text-align: center;
  font-size: 11px;
  color: var(--ink-soft);
  padding: 4px 0;
  font-family: var(--fd);
}

.cal-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  border-radius: 6px;
  cursor: default;
  transition: all 0.2s;
  position: relative;
}

.cal-day.empty {
  visibility: hidden;
}

.cal-day.has-diary {
  cursor: pointer;
  background: var(--paper-surface);
  font-weight: 600;
}

.cal-day.has-diary::after {
  content: '';
  position: absolute;
  bottom: 3px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--accent);
}

.cal-day.has-diary:hover {
  background: var(--st-sky);
}

.cal-day.today {
  background: var(--st-sakura);
  color: var(--ink);
  font-weight: 700;
}

@media (max-width: 960px) {
  .diary-layout {
    grid-template-columns: 1fr;
  }

  .diary-sidebar {
    display: none;
  }
}
</style>
