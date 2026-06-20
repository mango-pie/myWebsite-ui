<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PlusOutlined, EditOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { queryDiaryPage } from '@/integrations/diaryController'
import { useDiaryCalendar } from '@/composables/useDiaryCalendar'
import { siteConfig } from '@/config/site'
import {
  contentExcerpt,
  diaryDisplayTitle,
  formatDiaryDate,
  getMoodEmoji,
  todayDateString,
} from '@/utils/diaryFormat'

const router = useRouter()
const viewMode = ref<'calendar' | 'list'>('calendar')
const listLoading = ref(false)
const entries = ref<API.DiaryEntryVO[]>([])
const pagination = ref({ current: 1, pageSize: 10, total: 0 })

const { year, month, loading: calendarLoading, itemByDate, loadMonth, prevMonth, nextMonth } =
  useDiaryCalendar()

const weekLabels = ['日', '一', '二', '三', '四', '五', '六']

const calendarCells = computed(() => {
  const map = itemByDate()
  const first = new Date(year.value, month.value - 1, 1)
  const lastDay = new Date(year.value, month.value, 0).getDate()
  const startPad = first.getDay()
  const result: {
    day: number | null
    dateKey: string | null
    item: API.DiaryEntryMonthItemVO | null
  }[] = []

  for (let i = 0; i < startPad; i++) {
    result.push({ day: null, dateKey: null, item: null })
  }
  for (let d = 1; d <= lastDay; d++) {
    const dateKey = `${year.value}-${String(month.value).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    result.push({ day: d, dateKey, item: map.get(dateKey) ?? null })
  }
  return result
})

const todayKey = todayDateString()
const todayItem = computed(() => itemByDate().get(todayKey) ?? null)

async function fetchList() {
  listLoading.value = true
  try {
    const res = await queryDiaryPage({
      pageNum: pagination.value.current,
      pageSize: pagination.value.pageSize,
    })
    if (res.data.code === 0 && res.data.data) {
      entries.value = res.data.data.records ?? []
      pagination.value.total = res.data.data.totalRow ?? 0
    }
  } catch {
    message.error('加载日记列表失败')
  } finally {
    listLoading.value = false
  }
}

function handleDateClick(dateKey: string, item: API.DiaryEntryMonthItemVO | null) {
  if (item?.id) {
    router.push(`/diary/${item.id}`)
  } else {
    router.push(`/diary/write?date=${dateKey}`)
  }
}

function handleWriteToday() {
  if (todayItem.value?.id) {
    router.push(`/diary/write?date=${todayKey}`)
  } else {
    router.push('/diary/write')
  }
}

function handleListItemClick(entry: API.DiaryEntryVO) {
  if (entry.id) {
    router.push(`/diary/${entry.id}`)
  }
}

function handlePageChange(page: number) {
  pagination.value.current = page
  fetchList()
}

onMounted(async () => {
  await loadMonth()
  await fetchList()
})
</script>

<template>
  <div id="diaryHomePage" class="blog-shell-page">
    <header class="blog-header">
      <div class="blog-header__content">
        <div class="blog-header__top">
          <div>
            <h1 class="blog-header__title">{{ siteConfig.diaryTitle }}</h1>
            <p class="blog-header__desc">{{ siteConfig.diarySubtitle }}</p>
          </div>
          <div class="blog-header__actions">
            <a-segmented
              v-model:value="viewMode"
              :options="[
                { label: '日历', value: 'calendar' },
                { label: '列表', value: 'list' },
              ]"
            />
            <a-button type="primary" size="large" @click="handleWriteToday">
              <template #icon><EditOutlined v-if="todayItem" /><PlusOutlined v-else /></template>
              {{ todayItem ? '编辑今日' : '写今日' }}
            </a-button>
          </div>
        </div>
      </div>
    </header>

    <div class="blog-container blog-container--card">
      <main class="blog-main">
        <a-spin :spinning="viewMode === 'calendar' ? calendarLoading : listLoading">
          <div v-if="viewMode === 'calendar'" class="diary-calendar-panel">
            <div class="diary-calendar-nav">
              <a-button type="text" @click="prevMonth">‹ 上月</a-button>
              <span class="diary-calendar-nav__title">{{ year }}年{{ month }}月</span>
              <a-button type="text" @click="nextMonth">下月 ›</a-button>
            </div>
            <div class="diary-calendar">
              <div
                v-for="w in weekLabels"
                :key="w"
                class="diary-calendar__cell diary-calendar__cell--head"
              >
                {{ w }}
              </div>
              <button
                v-for="(cell, idx) in calendarCells"
                :key="idx"
                type="button"
                class="diary-calendar__cell"
                :class="{
                  'diary-calendar__cell--empty': !cell.day,
                  'diary-calendar__cell--today': cell.dateKey === todayKey,
                  'diary-calendar__cell--done': cell.item?.status === 1,
                  'diary-calendar__cell--draft': cell.item && cell.item.status !== 1,
                }"
                :disabled="!cell.day"
                @click="cell.dateKey && handleDateClick(cell.dateKey, cell.item)"
              >
                <span v-if="cell.day" class="diary-calendar__day">{{ cell.day }}</span>
                <span v-if="cell.item" class="diary-calendar__dot" />
              </button>
            </div>
            <div class="diary-calendar-legend">
              <span><i class="dot dot--done" /> 已完成</span>
              <span><i class="dot dot--draft" /> 草稿</span>
            </div>
          </div>

          <div v-else class="diary-list">
            <div
              v-for="entry in entries"
              :key="entry.id"
              class="post-card diary-list-item"
              @click="handleListItemClick(entry)"
            >
              <div class="diary-list-item__head">
                <span class="diary-list-item__date">{{ formatDiaryDate(entry.diaryDate) }}</span>
                <span v-if="entry.mood" class="diary-list-item__mood">{{ getMoodEmoji(entry.mood) }}</span>
                <a-tag v-if="entry.status === 1" color="green">完成</a-tag>
                <a-tag v-else color="default">草稿</a-tag>
              </div>
              <h3 class="diary-list-item__title">{{ diaryDisplayTitle(entry) }}</h3>
              <p class="diary-list-item__excerpt">{{ contentExcerpt(entry.content) }}</p>
            </div>
            <a-empty v-if="!entries.length && !listLoading" description="还没有日记，写第一篇吧" />
            <div v-if="pagination.total > pagination.pageSize" class="pagination">
              <a-pagination
                v-model:current="pagination.current"
                :total="pagination.total"
                :page-size="pagination.pageSize"
                show-less-items
                @change="handlePageChange"
              />
            </div>
          </div>
        </a-spin>
      </main>
    </div>
  </div>
</template>

<style scoped>
.diary-calendar-panel {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
}

.diary-calendar-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.diary-calendar-nav__title {
  font-size: 1.1rem;
  font-weight: 600;
}

.diary-calendar {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.diary-calendar__cell {
  aspect-ratio: 1;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.03);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  position: relative;
  color: inherit;
  font: inherit;
}

.diary-calendar__cell:hover:not(:disabled) {
  border-color: var(--color-primary);
  background: rgba(232, 121, 169, 0.08);
}

.diary-calendar__cell--empty {
  border: none;
  background: transparent;
  cursor: default;
}

.diary-calendar__cell--head {
  aspect-ratio: auto;
  padding: 8px 0;
  border: none;
  background: transparent;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  cursor: default;
}

.diary-calendar__cell--today {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px rgba(232, 121, 169, 0.35);
}

.diary-calendar__cell--done .diary-calendar__dot {
  background: #52c41a;
}

.diary-calendar__cell--draft .diary-calendar__dot {
  background: #faad14;
}

.diary-calendar__day {
  font-size: 0.95rem;
}

.diary-calendar__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-primary);
}

.diary-calendar-legend {
  display: flex;
  gap: 16px;
  margin-top: 16px;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
  vertical-align: middle;
}

.dot--done {
  background: #52c41a;
}

.dot--draft {
  background: #faad14;
}

.diary-list-item {
  cursor: pointer;
  margin-bottom: 16px;
}

.diary-list-item__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.diary-list-item__title {
  margin: 0 0 8px;
  font-size: 1.1rem;
}

.diary-list-item__excerpt {
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.6;
}
</style>
