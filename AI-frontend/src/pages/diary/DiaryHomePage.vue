<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { NotebookPen, PenLine } from 'lucide-vue-next'
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

onMounted(fetchList)
</script>

<template>
  <div class="folio-chapter">
    <header class="folio-chapter__head">
      <div>
        <p class="folio-chapter__kicker">手记卷</p>
        <h1 class="folio-chapter__title">{{ siteConfig.diaryTitle }}</h1>
        <p class="folio-chapter__sub">{{ siteConfig.diarySubtitle }}</p>
      </div>
      <IconAction :icon="PenLine" label="写今日" variant="primary" size="md" @click="writeToday" />
    </header>

    <a-spin :spinning="loading">
      <div v-if="!entries.length && !loading" class="folio-chapter__empty">
        <NotebookPen :size="32" :stroke-width="1.5" />
        <p>这一卷还是空白。写下今天的第一笔。</p>
        <IconAction :icon="PenLine" label="开始写" variant="primary" @click="writeToday" />
      </div>

      <nav v-else class="folio-toc" aria-label="日记目录">
        <button
          v-for="(entry, index) in entries"
          :key="entry.id ?? entry.diaryDate"
          type="button"
          class="folio-toc__row"
          :style="{ '--i': index }"
          @click="openEntry(entry)"
        >
          <span class="folio-toc__num">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="folio-toc__body">
            <span class="folio-toc__name">{{ entry.title || '无标题' }}</span>
            <span class="folio-toc__desc">{{ entry.content?.slice(0, 72) || '（空白）' }}</span>
          </span>
          <span class="folio-toc__leaders" aria-hidden="true" />
          <span class="folio-toc__folio">{{ formatDiaryDate(entry.diaryDate) }}</span>
        </button>
      </nav>
    </a-spin>

    <p class="folio-chapter__note">页码以日期为序。翻到想回看的那一天即可。</p>
  </div>
</template>

<style scoped>
.folio-chapter {
  max-width: 42em;
  margin: 0 auto;
  padding: 0.5em 0.5em 3em;
}

.folio-chapter__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1em;
  margin-bottom: 1.75em;
  padding-bottom: 1.25em;
  border-bottom: 1px solid var(--color-border);
}

.folio-chapter__kicker {
  margin: 0 0 0.45em;
  font-family: var(--font-sans);
  font-size: 0.72em;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.folio-chapter__title {
  margin: 0 0 0.35em;
  font-family: var(--font-serif);
  font-size: clamp(2rem, 5vw, 2.6rem);
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--color-text-primary);
}

.folio-chapter__sub {
  margin: 0;
  font-size: 0.95em;
  color: var(--color-text-secondary);
}

.folio-chapter__empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.85em;
  padding: 2.5em 0.25em;
  color: var(--color-text-muted);
  border-top: 1px dashed var(--color-border);
  font-family: var(--font-serif);
}

.folio-toc {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--color-border);
}

.folio-toc__row {
  display: grid;
  grid-template-columns: 2.4em minmax(0, auto) minmax(1.5em, 1fr) auto;
  gap: 0.45em 0.65em;
  align-items: baseline;
  width: 100%;
  padding: 1em 0.25em;
  border: none;
  border-bottom: 1px dashed rgba(169, 144, 112, 0.5);
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  animation: folioRise 0.55s ease both;
  animation-delay: calc(0.05s + var(--i, 0) * 0.05s);
  transition:
    background 0.28s ease,
    padding-left 0.28s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.folio-toc__row:hover {
  background: rgba(160, 120, 70, 0.1);
  padding-left: 0.5em;
}

.folio-toc__num {
  font-family: var(--font-sans);
  font-size: 0.75em;
  color: var(--color-text-muted);
}

.folio-toc__body {
  display: flex;
  flex-direction: column;
  gap: 0.15em;
  min-width: 0;
}

.folio-toc__name {
  font-family: var(--font-serif);
  font-size: clamp(1.1rem, 2.4vw, 1.35rem);
  font-weight: 600;
  color: var(--color-text-primary);
  transition: color 0.28s ease;
}

.folio-toc__row:hover .folio-toc__name {
  color: var(--color-primary);
}

.folio-toc__desc {
  font-family: var(--font-sans);
  font-size: 0.8em;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 28em;
}

.folio-toc__leaders {
  height: 0;
  border-bottom: 1px dotted rgba(138, 115, 85, 0.55);
  align-self: center;
}

.folio-toc__folio {
  font-family: var(--font-serif);
  font-size: 0.88em;
  font-style: italic;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.folio-chapter__note {
  margin: 1.75em 0 0;
  padding-top: 0.85em;
  border-top: 1px solid var(--color-border);
  font-family: var(--font-sans);
  font-size: 0.75em;
  color: var(--color-text-muted);
  text-align: center;
}

@keyframes folioRise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .folio-toc__row {
    animation: none;
  }
}

@media (max-width: 640px) {
  .folio-chapter__head {
    flex-direction: column;
    align-items: stretch;
  }

  .folio-toc__row {
    grid-template-columns: 2em minmax(0, 1fr);
  }

  .folio-toc__leaders {
    display: none;
  }

  .folio-toc__folio {
    grid-column: 2;
  }
}
</style>
