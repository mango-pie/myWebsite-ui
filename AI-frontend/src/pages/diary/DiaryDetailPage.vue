<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, Modal, Spin } from 'ant-design-vue'
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons-vue'
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
          <a-button type="text" @click="handleBack">
            <template #icon><ArrowLeftOutlined /></template>
            返回
          </a-button>
          <div class="diary-detail-toolbar__actions">
            <a-button @click="handleEdit">
              <template #icon><EditOutlined /></template>
              编辑
            </a-button>
            <a-button danger @click="handleDelete">
              <template #icon><DeleteOutlined /></template>
              删除
            </a-button>
          </div>
        </div>

        <header class="diary-detail-header">
          <div class="diary-detail-header__meta">
            <span>{{ formatDiaryDate(entry.diaryDate) }}</span>
            <span v-if="entry.mood" class="diary-detail-header__mood">{{ getMoodEmoji(entry.mood) }}</span>
            <a-tag v-if="entry.status === 1" color="green">完成</a-tag>
            <a-tag v-else color="default">草稿</a-tag>
            <span v-if="entry.wordCount" class="diary-detail-header__words">{{ entry.wordCount }} 字</span>
          </div>
          <h1 class="diary-detail-header__title">{{ diaryDisplayTitle(entry) }}</h1>
        </header>

        <article class="post-body blog-prose" v-html="renderedContent" />

        <nav class="diary-detail-nav">
          <button
            type="button"
            class="diary-detail-nav__btn"
            :disabled="!prevNext?.prevId"
            @click="goPrev"
          >
            <LeftOutlined />
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
            <RightOutlined />
          </button>
        </nav>
      </div>

      <div v-else-if="!loading" class="diary-detail-empty">
        <p>日记不存在或无权访问</p>
        <a-button type="primary" @click="handleBack">返回日记主页</a-button>
      </div>
    </a-spin>
  </div>
</template>

<style scoped>
.diary-detail-page {
  min-height: calc(100vh - 160px);
}

.diary-detail-container {
  max-width: 820px;
  margin: 0 auto;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 32px;
}

.diary-detail-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.diary-detail-toolbar__actions {
  display: flex;
  gap: 8px;
}

.diary-detail-header {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--color-border);
}

.diary-detail-header__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  margin-bottom: 12px;
}

.diary-detail-header__mood {
  font-size: 1.2rem;
}

.diary-detail-header__title {
  margin: 0;
  font-size: 1.75rem;
  line-height: 1.35;
}

.diary-detail-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1px solid var(--color-border);
}

.diary-detail-nav__btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.03);
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.diary-detail-nav__btn--next {
  justify-content: flex-end;
  text-align: right;
}

.diary-detail-nav__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.diary-detail-empty {
  text-align: center;
  padding: 80px 24px;
  color: var(--color-text-secondary);
}
</style>
