<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, Modal, Spin } from 'ant-design-vue'
import { ArrowLeft, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import IconAction from '@/components/ui/IconAction.vue'
import { deleteDiaryEntry, getDiaryEntryVo, getDiaryPrevNext } from '@/integrations/diaryController'
import { renderBlogMarkdown } from '@/utils/blogMarkdown'
import { diaryDisplayTitle, formatDiaryDate, getMoodEmoji } from '@/utils/diaryFormat'

const router = useRouter()
const route = useRoute()

const entry = ref<API.DiaryEntryVO | null>(null)
const prevNext = ref<API.DiaryEntryPrevNextVO | null>(null)
const loading = ref(true)

const renderedContent = computed(() => {
  if (!entry.value?.content) return ''
  return renderBlogMarkdown(entry.value.content)
})

async function fetchEntry() {
  const id = Number(route.params.id)
  if (!id) return

  loading.value = true
  try {
    const [detailRes, navRes] = await Promise.all([
      getDiaryEntryVo({ id }),
      getDiaryPrevNext({ id }),
    ])
    if (detailRes.data.code === 0 && detailRes.data.data) {
      entry.value = detailRes.data.data
    } else {
      entry.value = null
      message.error(detailRes.data.message || '日记不存在')
    }
    if (navRes.data.code === 0) {
      prevNext.value = navRes.data.data ?? null
    }
  } catch {
    message.error('加载日记失败')
  } finally {
    loading.value = false
  }
}

function handleBack() {
  router.push('/diary')
}

function handleEdit() {
  if (entry.value?.diaryDate) {
    router.push(`/diary/write?date=${entry.value.diaryDate}`)
  }
}

function handleDelete() {
  if (!entry.value?.id) return
  Modal.confirm({
    title: '删除这篇日记？',
    content: '删除后可在回收站功能上线前无法恢复。',
    okType: 'danger',
    onOk: async () => {
      const res = await deleteDiaryEntry({ id: entry.value!.id! })
      if (res.data.code === 0) {
        message.success('已删除')
        router.push('/diary')
      } else {
        message.error(res.data.message || '删除失败')
      }
    },
  })
}

function goPrev() {
  if (prevNext.value?.prevId) {
    router.push(`/diary/${prevNext.value.prevId}`)
  }
}

function goNext() {
  if (prevNext.value?.nextId) {
    router.push(`/diary/${prevNext.value.nextId}`)
  }
}

watch(
  () => route.params.id,
  () => fetchEntry(),
)

onMounted(() => fetchEntry())
</script>

<template>
  <div class="diary-detail-page">
    <a-spin :spinning="loading">
      <div v-if="entry" class="diary-detail-container">
        <div class="diary-detail-toolbar">
          <IconAction :icon="ArrowLeft" label="返回" variant="ghost" motion="slide" @click="handleBack" />
          <div class="diary-detail-toolbar__actions">
            <IconAction :icon="Pencil" label="编辑" variant="soft" motion="pop" @click="handleEdit" />
            <IconAction :icon="Trash2" label="删除" variant="danger" motion="shake" @click="handleDelete" />
          </div>
        </div>

        <header class="diary-detail-header">
          <div class="diary-detail-header__meta">
            <span class="diary-detail-header__date">{{ formatDiaryDate(entry.diaryDate) }}</span>
            <span v-if="entry.mood" class="diary-detail-header__mood">{{ getMoodEmoji(entry.mood) }}</span>
            <span
              class="wax-seal"
              :class="entry.status === 1 ? 'wax-seal--read' : 'wax-seal--pending'"
            >
              {{ entry.status === 1 ? '已录' : '草稿' }}
            </span>
            <span v-if="entry.wordCount" class="diary-detail-header__words">{{ entry.wordCount }} 字</span>
          </div>
          <h1 class="diary-detail-header__title">{{ diaryDisplayTitle(entry) }}</h1>
          <p class="diary-detail-header__ornament" aria-hidden="true">❧</p>
        </header>

        <article class="post-body blog-prose" v-html="renderedContent" />

        <nav class="diary-detail-nav">
          <button
            type="button"
            class="diary-detail-nav__btn"
            :disabled="!prevNext?.prevId"
            @click="goPrev"
          >
            <ChevronLeft :size="18" class="diary-nav-icon diary-nav-icon--prev" />
            <span v-if="prevNext?.prevDate">上一篇 · {{ prevNext.prevDate }}</span>
            <span v-else>没有更早的日记</span>
          </button>
          <button
            type="button"
            class="diary-detail-nav__btn diary-detail-nav__btn--next"
            :disabled="!prevNext?.nextId"
            @click="goNext"
          >
            <span v-if="prevNext?.nextDate">下一篇 · {{ prevNext.nextDate }}</span>
            <span v-else>没有更新的日记</span>
            <ChevronRight :size="18" class="diary-nav-icon diary-nav-icon--next" />
          </button>
        </nav>
      </div>

      <div v-else-if="!loading" class="diary-detail-empty">
        <p>日记不存在或无权访问</p>
        <IconAction :icon="ArrowLeft" label="返回日记主页" variant="primary" motion="slide" @click="handleBack" />
      </div>
    </a-spin>
  </div>
</template>

<style scoped>
.diary-detail-page {
  min-height: calc(100vh - 160px);
}

.diary-detail-container {
  max-width: 40em;
  margin: 0 auto;
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 0.5em 0.5em 3em;
}

.diary-detail-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5em;
  flex-wrap: wrap;
  gap: 0.75em;
}

.diary-detail-toolbar__actions {
  display: flex;
  gap: 0.5em;
}

.diary-detail-header {
  margin-bottom: 2em;
  padding-bottom: 1.25em;
  border-bottom: 1px solid var(--color-border);
  text-align: center;
}

.diary-detail-header__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.65em;
  color: var(--color-text-secondary);
  font-family: var(--font-sans);
  font-size: 0.85em;
  margin-bottom: 0.85em;
}

.diary-detail-header__date {
  font-family: var(--font-serif);
  font-style: italic;
  letter-spacing: 0.04em;
}

.diary-detail-header__mood {
  font-size: 1.1em;
}

.diary-detail-header__words {
  color: var(--color-text-muted);
}

.diary-detail-header__title {
  margin: 0;
  font-family: var(--font-serif);
  font-size: clamp(1.75rem, 4vw, 2.35rem);
  line-height: 1.35;
  letter-spacing: 0.04em;
  color: var(--color-text-primary);
}

.diary-detail-header__ornament {
  margin: 1em 0 0;
  color: var(--color-text-muted);
  font-size: 0.9em;
  letter-spacing: 0.2em;
}

.diary-detail-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75em;
  margin-top: 2.5em;
  padding-top: 1.25em;
  border-top: 1px dashed var(--color-border);
}

.diary-detail-nav__btn {
  display: flex;
  align-items: center;
  gap: 0.5em;
  padding: 0.75em 0;
  border: none;
  border-radius: 0;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-family: var(--font-serif);
  font-size: 0.92em;
  text-align: left;
  transition: color 0.28s ease;
}

.diary-detail-nav__btn:hover:not(:disabled) {
  color: var(--color-primary);
}

.diary-detail-nav__btn--next {
  justify-content: flex-end;
  text-align: right;
}

.diary-detail-nav__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.diary-detail-empty {
  text-align: center;
  padding: 80px 24px;
  color: var(--color-text-secondary);
}

.diary-detail-empty :deep(.icon-action) {
  margin: 0 auto;
}

.diary-nav-icon {
  transition: transform var(--transition-fast);
}
.diary-detail-nav__btn:hover:not(:disabled) .diary-nav-icon--prev {
  transform: translateX(-4px);
}
.diary-detail-nav__btn:hover:not(:disabled) .diary-nav-icon--next {
  transform: translateX(4px);
}
@media (prefers-reduced-motion: reduce) {
  .diary-nav-icon {
    transition: none;
  }
  .diary-detail-nav__btn:hover:not(:disabled) .diary-nav-icon {
    transform: none;
  }
}
</style>
