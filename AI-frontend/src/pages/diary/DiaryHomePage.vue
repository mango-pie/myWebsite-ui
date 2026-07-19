<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { NotebookPen, PenLine, ChevronRight, Calendar } from 'lucide-vue-next'
import { queryDiaryPage } from '@/integrations/diaryController'
import { siteConfig } from '@/config/site'
import { formatDiaryDate, todayDateString } from '@/utils/diaryFormat'
import IconAction from '@/components/ui/IconAction.vue'

const router = useRouter()
const loading = ref(false)
const entries = ref<API.DiaryEntryVO[]>([])

const fetchList = async () => {
  loading.value = true
  try {
    const res = await queryDiaryPage({ pageNum: 1, pageSize: 20, sortField: 'diary_date', sortOrder: 'descend' })
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

onMounted(fetchList)
</script>

<template>
  <div class="diary-home">
    <header class="diary-home__hero">
      <div class="diary-home__titles">
        <div class="diary-home__icon">
          <NotebookPen :size="28" :stroke-width="1.75" />
        </div>
        <div>
          <h1>{{ siteConfig.diaryTitle }}</h1>
          <p>{{ siteConfig.diarySubtitle }}</p>
        </div>
      </div>
      <IconAction :icon="PenLine" label="写今日" variant="primary" size="lg" motion="pop" @click="writeToday" />
    </header>

    <a-spin :spinning="loading">
      <div v-if="!entries.length && !loading" class="diary-home__empty">
        <NotebookPen :size="40" :stroke-width="1.5" />
        <p>还没有日记，写下今天的第一笔</p>
        <IconAction :icon="PenLine" label="开始写" variant="primary" motion="pop" @click="writeToday" />
      </div>

      <ul v-else class="diary-home__list">
        <li
          v-for="entry in entries"
          :key="entry.id ?? entry.diaryDate"
          class="diary-entry"
          @click="openEntry(entry)"
        >
          <div class="diary-entry__date">
            <Calendar :size="14" class="diary-entry__date-icon" />
            <span>{{ formatDiaryDate(entry.diaryDate) }}</span>
          </div>
          <div class="diary-entry__body">
            <div class="diary-entry__title">{{ entry.title || '无标题' }}</div>
            <div class="diary-entry__preview">{{ entry.content?.slice(0, 80) || '（空白）' }}</div>
          </div>
          <ChevronRight :size="18" class="diary-entry__chevron" />
        </li>
      </ul>
    </a-spin>
  </div>
</template>

<style scoped>
.diary-home {
  max-width: 720px;
  margin: 0 auto;
  width: 100%;
}

.diary-home__hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 28px;
  padding: 20px 22px;
  border: 1px solid var(--color-border);
  border-radius: var(--room-radius, 8px);
  background: rgba(201, 160, 220, 0.06);
}

.diary-home__titles {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.diary-home__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  color: #c9a0dc;
  background: rgba(201, 160, 220, 0.16);
  flex-shrink: 0;
}

.diary-home__titles h1 {
  margin: 0 0 4px;
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.diary-home__titles p {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.diary-home__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 64px 20px;
  color: var(--color-text-muted);
  border: 1px dashed var(--color-border);
  border-radius: var(--room-radius, 8px);
}

.diary-home__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.diary-entry {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border: 1px solid var(--color-border);
  border-radius: var(--room-radius, 8px);
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.diary-entry:hover {
  background: rgba(201, 160, 220, 0.08);
  border-color: rgba(201, 160, 220, 0.35);
}

.diary-entry__date {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  width: 116px;
  font-size: 13px;
  color: var(--color-text-muted);
}

.diary-entry__date-icon {
  flex-shrink: 0;
  color: #c9a0dc;
}

.diary-entry__body {
  flex: 1;
  min-width: 0;
}

.diary-entry__title {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.diary-entry__preview {
  font-size: 13px;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.diary-entry__chevron {
  color: var(--color-text-muted);
  flex-shrink: 0;
  transition: transform 0.2s ease, color 0.2s ease;
}

.diary-entry:hover .diary-entry__chevron {
  transform: translateX(4px);
  color: #c9a0dc;
}

@media (prefers-reduced-motion: reduce) {
  .diary-entry__chevron {
    transition: none;
  }

  .diary-entry:hover .diary-entry__chevron {
    transform: none;
  }
}

@media (max-width: 640px) {
  .diary-home__hero {
    flex-direction: column;
    align-items: stretch;
  }

  .diary-entry__date {
    width: 72px;
    font-size: 12px;
  }
}
</style>
