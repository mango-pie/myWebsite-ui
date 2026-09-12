<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Sparkles, Loader2 } from 'lucide-vue-next'
import type { LearningBranchTreeNode, LearningLeafVO } from '@/api/learning.types'
import { getKnowledgeNoteDetail } from '@/api/knowledge/knowledgeNote'
import { marked } from 'marked'
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

const searchQuery = ref('')
const statusFilter = ref<'all' | 'published' | 'indexed'>('all')

const filteredLeaves = computed(() => {
  let list = props.leaves
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(
      (l) => leafTitle(l).toLowerCase().includes(q) || (l.summary || '').toLowerCase().includes(q),
    )
  }
  if (statusFilter.value === 'published') {
    list = list.filter((l) => l.publishStatus && l.publishStatus !== 'NOT_PUBLISHED')
  } else if (statusFilter.value === 'indexed') {
    list = list.filter((l) => l.indexStatus && l.indexStatus !== 'NOT_INDEXED')
  }
  return list
})

function leafTitle(leaf: LearningLeafVO): string {
  return leaf.title || leaf.noteTitle || ''
}

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
      const detail = res.data.data as API.KnowledgeNoteDetailVO
      expandedContent.value = detail.distilledMd || ''
    } else {
      expandedError.value = res.data.message || '加载失败'
    }
  } catch {
    expandedError.value = '加载笔记内容失败'
  } finally {
    expandedLoading.value = false
  }
}

function goToDetail(noteId: number | string) {
  router.push(`/admin/knowledge/notes/${noteId}`)
}

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

function reviewChip(leaf: LearningLeafVO) {
  const s = String(leaf.reviewStatus || 'NEW').toUpperCase()
  if (s === 'MASTERED') return { text: '已掌握', cls: 'rev done' }
  if (s === 'REVIEWING') return { text: '复习中', cls: 'rev' }
  return { text: '待复习', cls: 'rev' }
}
</script>

<template>
  <div class="note-list">
    <div class="leaf-head">
      <h2 class="font-display">{{ branchTitle || '请先选择枝' }}</h2>
      <span v-if="leaves.length" class="meta">{{ filteredLeaves.length }} 篇 · 已挂载</span>
    </div>

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

    <div v-if="loading" class="leaf-grid" aria-label="加载中">
      <div v-for="i in (leaves.length || 4)" :key="i" class="leaf-card" style="min-height: 72px; opacity: 0.55" />
    </div>

    <div v-else-if="branchId != null && leaves?.length" class="leaf-grid">
      <div
        v-for="leaf in filteredLeaves"
        :key="leaf.noteId"
        class="leaf-card"
        :class="{ 'leaf-card--expanded': expandedId === leaf.noteId }"
        @click="goToDetail(leaf.noteId)"
        @dblclick="goToDetail(leaf.noteId)"
      >
        <div class="lc-title">{{ leafTitle(leaf) }}</div>
        <div class="lc-meta">
          <span class="chip src mono">#N{{ String(leaf.noteId).slice(-4).padStart(4, '0') }}</span>
          <span class="chip" :class="reviewChip(leaf).cls">{{ reviewChip(leaf).text }}</span>
          <span
            v-if="leaf.publishStatus && leaf.publishStatus !== 'NOT_PUBLISHED'"
            class="chip pub"
          >已发博客</span>
          <span
            v-if="leaf.indexStatus && leaf.indexStatus !== 'NOT_INDEXED'"
            class="chip idx"
          >已入库</span>
        </div>

        <div v-if="expandedId === leaf.noteId" class="leaf-card__expand" @click.stop>
          <div v-if="expandedLoading" class="leaf-card__muted">
            <Loader2 :size="14" class="ld-spin" /> 加载中…
          </div>
          <div v-else-if="expandedError" class="leaf-card__error">{{ expandedError }}</div>
          <div v-else class="leaf-card__md" v-html="renderMd(expandedContent.slice(0, 2000))" />
        </div>

        <div v-if="movingNoteId === leaf.noteId" class="leaf-card__move" @click.stop>
          <a-select
            v-model:value="moveTargetId"
            :options="branchOptions"
            placeholder="目标枝"
            size="small"
            style="flex: 1"
          />
          <button type="button" class="chip-btn sm primary" @click="confirmMove">移动</button>
          <button type="button" class="chip-btn sm" @click="cancelMove">取消</button>
        </div>

        <div class="lc-actions" @click.stop>
          <button type="button" class="chip-btn sm" @click="toggleExpand(leaf.noteId)">
            {{ expandedId === leaf.noteId ? '收起' : '预览' }}
          </button>
          <button type="button" class="chip-btn sm" @click="startMove(leaf.noteId)">移叶</button>
          <button type="button" class="chip-btn sm" @click="emit('detach', leaf.noteId)">取消挂载</button>
          <button type="button" class="chip-btn sm primary" @click="goToDetail(leaf.noteId)">详情页</button>
        </div>
      </div>
    </div>

    <EmptyState
      v-else-if="branchId != null && leaves.length > 0 && filteredLeaves.length === 0"
      title="没有匹配的笔记"
      description="换个关键词或清除筛选试试"
    />

    <EmptyState
      v-else-if="branchId != null && leaves.length === 0"
      title="此主题下还没有笔记"
      description="让 AI 帮你搜索相关文章来学习"
      :primary-icon="Sparkles"
      primary-label="AI 搜索文章"
      @primary="$emit('go-search')"
    />

    <EmptyState
      v-else
      title="选择一个主题枝"
      description="在左侧知识树中选择一个枝，查看已学笔记"
    />
  </div>
</template>

<style scoped>
.note-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  height: 100%;
}

.note-list__toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  flex: none;
}

.note-list__search-wrap {
  flex: 1;
  min-width: 140px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.75);
  border: 1.5px solid rgba(165, 172, 196, 0.35);
}

.note-list__search-wrap:focus-within {
  border-color: color-mix(in srgb, var(--room, #9b8ce8) 45%, #fff);
}

.note-list__search-icon {
  flex: none;
  color: var(--ink-faint, #a5acc4);
}

.note-list__search-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 12px;
}

.note-list__filters {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.note-list__filter-chip {
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 1px;
  color: var(--ink-soft, #7a83a0);
  background: rgba(255, 255, 255, 0.8);
  border: 1.5px solid rgba(255, 255, 255, 0.95);
  cursor: pointer;
}

.note-list__filter-chip.is-active {
  background: var(--room-soft, #e4dffd);
  color: var(--room, #9b8ce8);
}

.leaf-card--expanded {
  grid-column: 1 / -1;
}

.leaf-card__expand {
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px dashed rgba(165, 172, 196, 0.35);
  max-height: 220px;
  overflow: auto;
}

.leaf-card__md {
  font-size: 12px;
  line-height: 1.75;
  color: var(--ink-soft, #7a83a0);
}

.leaf-card__muted,
.leaf-card__error {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--ink-faint, #a5acc4);
}

.leaf-card__error {
  color: var(--c-sakura, #f490ad);
}

.leaf-card__move {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

.lc-actions {
  opacity: 0;
  transition: opacity 0.2s;
}

.leaf-card:hover .lc-actions,
.leaf-card:focus-within .lc-actions,
.leaf-card--expanded .lc-actions {
  opacity: 1;
}

@keyframes ld-spin {
  to { transform: rotate(360deg); }
}

.ld-spin {
  animation: ld-spin 0.8s linear infinite;
}

@media (max-width: 1200px) {
  :deep(.leaf-grid) {
    grid-template-columns: 1fr;
  }
}
</style>
