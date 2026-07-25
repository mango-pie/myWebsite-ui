<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { BookOpen, Search, MoveRight, Unlink, Eye, Sparkles, ChevronDown, ChevronUp, ExternalLink, Loader2, Filter } from 'lucide-vue-next'
import type { LearningBranchTreeNode, LearningLeafVO } from '@/api/learning.types'
import { getKnowledgeNoteDetail } from '@/api/knowledge/knowledgeNote'
import { marked } from 'marked'
import IconAction from '@/components/ui/IconAction.vue'
import EmptyState from './EmptyState.vue'

function renderMd(md: string): string {
  if (!md) return ''
  try {
    return marked.parse(md, { async: false }) as string
  } catch {
    return md.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
}

type Props = {
  loading?: boolean
  branchId: number | string | null
  branchTitle?: string
  leaves: LearningLeafVO[]
  branches?: LearningBranchTreeNode[]
}

type Emits = {
  open: [noteId: number | string]
  move: [noteId: number | string]
  'move-to': [payload: { noteId: number | string; targetBranchId: number | string }]
  detach: [noteId: number | string]
  'go-search': []
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  branchTitle: '',
})

const emit = defineEmits<Emits>()
const router = useRouter()

// ── search & filter ──
const searchQuery = ref('')
const statusFilter = ref<'all' | 'published' | 'indexed'>('all')

const filteredLeaves = computed(() => {
  let list = props.leaves
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter((l) => l.title.toLowerCase().includes(q) || (l.summary || '').toLowerCase().includes(q))
  }
  if (statusFilter.value === 'published') {
    list = list.filter((l) => l.publishStatus && l.publishStatus !== 'NOT_PUBLISHED')
  } else if (statusFilter.value === 'indexed') {
    list = list.filter((l) => l.indexStatus && l.indexStatus !== 'NOT_INDEXED')
  }
  return list
})

// ── inline expand ──
const expandedId = ref<number | string | null>(null)
const expandedLoading = ref(false)
const expandedContent = ref('')
const expandedError = ref('')

async function toggleExpand(noteId: number | string) {
  if (expandedId.value === noteId) {
    expandedId.value = null
    expandedContent.value = ''
    return
  }
  expandedId.value = noteId
  expandedContent.value = ''
  expandedError.value = ''
  expandedLoading.value = true
  try {
    const res = await getKnowledgeNoteDetail(noteId)
    if (res.data.code === 0 && res.data.data) {
      expandedContent.value = (res.data.data as any).distilledMd || (res.data.data as any).distilled_md || ''
    } else {
      expandedError.value = res.data.message || '加载失败'
    }
  } catch (e) {
    expandedError.value = '加载笔记内容失败'
  } finally {
    expandedLoading.value = false
  }
}

function goToDetail(noteId: number | string) {
  router.push(`/admin/knowledge/notes/${noteId}`)
}

// ── inline move ──
const movingNoteId = ref<number | string | null>(null)
const moveTargetId = ref<number | string | null>(null)

function startMove(noteId: number | string) {
  movingNoteId.value = noteId
  moveTargetId.value = (props.branches || [])[0]?.id ?? null
}

function cancelMove() {
  movingNoteId.value = null
  moveTargetId.value = null
}

function confirmMove() {
  if (movingNoteId.value != null && moveTargetId.value != null) {
    emit('move-to', { noteId: movingNoteId.value, targetBranchId: moveTargetId.value })
  }
  cancelMove()
}

const branchOptions = computed(() =>
  (props.branches || []).map((b) => ({ value: b.id, label: b.path || b.title })),
)
</script>

<template>
  <div class="note-list">
    <!-- 头部 -->
    <div class="note-list__header">
      <h3 class="note-list__title">
        <BookOpen :size="18" class="note-list__title-icon" />
        {{ branchTitle ? `已学：${branchTitle}` : '请先选择枝' }}
      </h3>
      <span v-if="leaves.length" class="note-list__count">{{ filteredLeaves.length }}/{{ leaves.length }}</span>
    </div>

    <!-- 搜索 + 筛选栏 -->
    <div v-if="branchId != null && leaves.length > 0" class="note-list__toolbar">
      <span class="note-list__search-wrap">
        <Search :size="14" class="note-list__search-icon" />
        <input
          v-model="searchQuery"
          class="note-list__search-input"
          placeholder="搜索笔记标题…"
          type="text"
        />
      </span>
      <span class="note-list__filters">
        <button
          type="button"
          class="note-list__filter-chip"
          :class="{ 'is-active': statusFilter === 'all' }"
          @click="statusFilter = 'all'"
        >全部</button>
        <button
          type="button"
          class="note-list__filter-chip"
          :class="{ 'is-active': statusFilter === 'published' }"
          @click="statusFilter = 'published'"
        >已发博客</button>
        <button
          type="button"
          class="note-list__filter-chip"
          :class="{ 'is-active': statusFilter === 'indexed' }"
          @click="statusFilter = 'indexed'"
        >已入库</button>
      </span>
    </div>

    <!-- 加载骨架 -->
    <div v-if="loading" class="note-list__grid" aria-label="加载中">
      <div v-for="i in (leaves.length || 4)" :key="i" class="note-card u-skeleton-shimmer" />
    </div>

    <!-- 有笔记 -->
    <div v-else-if="branchId != null && leaves?.length" class="note-list__grid">
      <div
        v-for="leaf in filteredLeaves"
        :key="leaf.noteId"
        class="note-card"
        :class="{ 'note-card--expanded': expandedId === leaf.noteId }"
      >
        <div class="note-card__main" @click="toggleExpand(leaf.noteId)">
          <div class="note-card__header-row">
            <h4 class="note-card__title">{{ leaf.title }}</h4>
            <component
              :is="expandedId === leaf.noteId ? ChevronUp : ChevronDown"
              :size="16"
              class="note-card__chevron"
            />
          </div>
          <p class="note-card__summary">{{ leaf.summary || '' }}</p>
          <div class="note-card__status-row">
            <span
              v-if="leaf.publishStatus && leaf.publishStatus !== 'NOT_PUBLISHED'"
              class="note-card__status-tag note-card__status-tag--published"
              title="已发博客"
            >
              <ExternalLink :size="10" />
              已发博客
            </span>
            <span
              v-if="leaf.indexStatus && leaf.indexStatus !== 'NOT_INDEXED'"
              class="note-card__status-tag note-card__status-tag--indexed"
              title="已入库"
            >
              已入库
            </span>
            <span
              v-if="(!leaf.publishStatus || leaf.publishStatus === 'NOT_PUBLISHED') && (!leaf.indexStatus || leaf.indexStatus === 'NOT_INDEXED')"
              class="note-card__status-tag note-card__status-tag--mounted"
            >
              已挂载
            </span>
          </div>
        </div>

        <!-- 内联展开内容 -->
        <div v-if="expandedId === leaf.noteId" class="note-card__expand">
          <div v-if="expandedLoading" class="note-card__expand-loading">
            <Loader2 :size="16" class="ld-spin" />
            加载中…
          </div>
          <div v-else-if="expandedError" class="note-card__expand-error">{{ expandedError }}</div>
          <div v-else class="note-card__expand-body">
            <div class="note-card__expand-md" v-html="renderMd(expandedContent.slice(0, 3000))" />
            <p v-if="expandedContent.length > 3000" class="note-card__expand-truncated">
              …内容已截断，点击下方查看完整笔记
            </p>
          </div>
          <div class="note-card__expand-actions">
            <a-button size="small" type="link" @click.stop="goToDetail(leaf.noteId)">
              <template #icon><ExternalLink :size="13" /></template>
              查看完整笔记
            </a-button>
          </div>
        </div>

        <!-- 内联移叶选择器 -->
        <div v-if="movingNoteId === leaf.noteId" class="note-card__move-inline" @click.stop>
          <a-select
            v-model:value="moveTargetId"
            :options="branchOptions"
            placeholder="目标枝"
            size="small"
            style="flex: 1"
          />
          <a-button size="small" type="primary" @click="confirmMove">移动</a-button>
          <a-button size="small" @click="cancelMove">取消</a-button>
        </div>

        <!-- 操作栏 -->
        <div class="note-card__actions">
          <IconAction
            :icon="MoveRight"
            label="移叶"
            size="sm"
            variant="ghost"
            @click.stop="startMove(leaf.noteId)"
          />
          <IconAction
            :icon="Unlink"
            label="取消挂载"
            size="sm"
            variant="danger"
            @click.stop="emit('detach', leaf.noteId)"
          />
          <IconAction
            :icon="ExternalLink"
            label="详情页"
            size="sm"
            variant="primary"
            @click.stop="goToDetail(leaf.noteId)"
          />
        </div>
      </div>
    </div>

    <!-- 搜索无结果 -->
    <EmptyState
      v-else-if="branchId != null && leaves.length > 0 && filteredLeaves.length === 0"
      title="没有匹配的笔记"
      description="换个关键词或清除筛选试试"
    />

    <!-- 空状态 -->
    <EmptyState
      v-else-if="branchId != null && leaves.length === 0"
      title="此主题下还没有笔记"
      description="让 AI 帮你搜索相关文章来学习"
      :primary-icon="Sparkles"
      primary-label="AI 搜索文章"
      @primary="$emit('go-search')"
    />

    <!-- 未选枝 -->
    <EmptyState
      v-else
      title="选择一个主题枝"
      description="在左侧知识树中选择一个枝，查看已学笔记"
    />
  </div>
</template>

<style scoped>
.note-list__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--ld-space-3);
  margin-bottom: var(--ld-space-4);
}

.note-list__title {
  margin: 0;
  font-size: var(--ld-font-size-base);
  font-weight: var(--ld-font-weight-semibold);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.note-list__title-icon {
  color: var(--ld-color-primary);
}

.note-list__count {
  font-size: var(--ld-font-size-xs);
  color: var(--ld-color-text-tertiary);
  font-variant-numeric: tabular-nums;
}

/* search bar */
.note-list__toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: var(--ld-space-4);
  flex-wrap: wrap;
}

.note-list__search-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 160px;
  padding: 5px 10px;
  border-radius: var(--ld-radius-sm, 8px);
  border: 1px solid var(--ld-color-border);
  background: rgba(255, 255, 255, 0.03);
  transition: border-color 0.15s ease;
}

.note-list__search-wrap:focus-within {
  border-color: var(--ld-color-primary-muted);
  background: rgba(255, 255, 255, 0.05);
}

.note-list__search-icon {
  flex-shrink: 0;
  color: var(--ld-color-text-muted);
}

.note-list__search-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--ld-color-text-primary);
  font-family: inherit;
  font-size: 0.8125rem;
  outline: none;
  min-width: 0;
}

.note-list__search-input::placeholder {
  color: var(--ld-color-text-muted);
}

.note-list__filters {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.note-list__filter-chip {
  border: 1px solid var(--ld-color-border);
  border-radius: 999px;
  background: transparent;
  color: var(--ld-color-text-muted);
  font-family: inherit;
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 3px 10px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.note-list__filter-chip:hover {
  color: var(--ld-color-text-secondary);
  border-color: var(--ld-color-border-strong);
}

.note-list__filter-chip.is-active {
  background: var(--ld-color-primary-subtle);
  border-color: var(--ld-color-primary-muted);
  color: var(--ld-color-primary);
}

.note-list__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ld-space-4);
}

.note-card {
  border: 1px solid var(--ld-color-border);
  border-radius: var(--ld-radius-md, 10px);
  background: var(--ld-color-bg-subtle, rgba(255, 255, 255, 0.04));
  padding: var(--ld-space-5, 20px);
  display: flex;
  flex-direction: column;
  gap: var(--ld-space-3);
  transition: background var(--ld-duration-fast) var(--ld-ease-out), border-color 0.15s ease, box-shadow 0.15s ease;
  cursor: pointer;
}

.note-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: var(--ld-color-primary-muted, rgba(184, 164, 201, 0.28));
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.note-card--expanded {
  border-color: var(--ld-color-primary-muted, rgba(184, 164, 201, 0.45));
  box-shadow: 0 0 0 3px var(--ld-color-primary-subtle, rgba(184, 164, 201, 0.08));
  grid-column: 1 / -1;
}

.note-card__main {
  display: flex;
  flex-direction: column;
  gap: var(--ld-space-2);
}

.note-card__header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.note-card__title {
  margin: 0;
  font-size: var(--ld-font-size-base);
  line-height: var(--ld-line-height-tight);
  font-weight: var(--ld-font-weight-semibold);
  flex: 1;
  min-width: 0;
}

.note-card__chevron {
  flex-shrink: 0;
  color: var(--ld-color-text-muted);
  transition: transform 0.2s ease;
}

.note-card__summary {
  margin: 0;
  color: var(--ld-color-text-secondary);
  font-size: var(--ld-font-size-sm);
  line-height: var(--ld-line-height-normal);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.note-card__status-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.note-card__status-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
}

.note-card__status-tag--published {
  background: rgba(16, 185, 129, 0.12);
  color: #6ee7b7;
  border: 1px solid rgba(16, 185, 129, 0.25);
  cursor: pointer;
}

.note-card__status-tag--published:hover {
  background: rgba(16, 185, 129, 0.2);
}

.note-card__status-tag--indexed {
  background: var(--ld-color-ai-subtle, rgba(124, 156, 224, 0.15));
  color: var(--ld-color-ai, #7c9ce0);
  border: 1px solid rgba(124, 156, 224, 0.2);
}

.note-card__status-tag--mounted {
  background: rgba(255, 255, 255, 0.04);
  color: var(--ld-color-text-muted);
  border: 1px solid var(--ld-color-border);
}

/* inline expand */
.note-card__expand {
  border-top: 1px solid var(--ld-color-border);
  padding-top: var(--ld-space-4);
  margin-top: var(--ld-space-1);
}

.note-card__expand-loading,
.note-card__expand-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: var(--ld-space-4) 0;
  font-size: var(--ld-font-size-sm);
  color: var(--ld-color-text-secondary);
}

.note-card__expand-error {
  color: var(--ld-color-error, #ef4444);
}

.note-card__expand-body {
  max-height: 360px;
  overflow-y: auto;
}

.note-card__expand-md {
  font-size: var(--ld-font-size-sm);
  line-height: 1.85;
  color: var(--ld-color-text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

.note-card__expand-truncated {
  margin: 8px 0 0;
  font-size: 0.75rem;
  color: var(--ld-color-text-muted);
  font-style: italic;
}

.note-card__expand-actions {
  padding-top: var(--ld-space-2);
}

.note-card__move-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: var(--ld-space-2) 0;
  border-top: 1px solid var(--ld-color-border);
}

.note-card__actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: var(--ld-space-1);
  padding-top: var(--ld-space-2);
  border-top: 1px solid var(--ld-color-border);
}

@keyframes ld-spin {
  to { transform: rotate(360deg); }
}

.ld-spin {
  animation: ld-spin 0.8s linear infinite;
}

@media (max-width: 1200px) {
  .note-list__grid {
    grid-template-columns: 1fr;
  }
}
</style>
