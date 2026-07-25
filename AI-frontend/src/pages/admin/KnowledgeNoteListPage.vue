<script setup lang="ts">
import { onMounted, onBeforeUnmount, reactive, ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import {
  deleteKnowledgeNote,
  listKnowledgeNotes,
  redistillKnowledgeNote,
} from '@/api/knowledge'
import {
  canIndexKb,
  canPublishBlog,
  canReindexKb,
  canSyncBlog,
  indexStatusColor,
  indexStatusLabel,
  publishStatusColor,
  publishStatusLabel,
  sourceTypeLabel,
} from '@/utils/knowledgeNoteStatus'
import { loadReadingUxSettings } from '@/utils/readingSettings'
import '@/assets/admin-theme.css'
import { LayoutGrid, List as ListIcon, Plus, Settings, StickyNote } from 'lucide-vue-next'
import IconAction from '@/components/ui/IconAction.vue'
import KnowledgeStatBar from '@/components/knowledge/KnowledgeStatBar.vue'
import KnowledgeNoteCard from '@/components/knowledge/KnowledgeNoteCard.vue'
import {
  extractPageTotal,
  useKnowledgeNoteStats,
} from '@/composables/useKnowledgeNoteStats'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const dataSource = ref<API.KnowledgeNoteVO[]>([])
const total = ref(0)

const {
  total: statsTotal,
  published: statsPublished,
  indexed: statsIndexed,
  running: statsRunning,
  loading: statsLoading,
  refresh: refreshStats,
  refreshRunning,
  syncTotalFromPage,
} = useKnowledgeNoteStats()

const hasActiveFilters = computed(
  () =>
    !!(
      query.keyword ||
      query.sourceType ||
      query.publishStatus ||
      query.indexStatus
    ),
)

const VIEW_KEY = 'kb-note-view'
const viewMode = ref<'card' | 'list'>(
  (typeof localStorage !== 'undefined' && localStorage.getItem(VIEW_KEY)) === 'list'
    ? 'list'
    : 'card',
)
const setViewMode = (mode: 'card' | 'list') => {
  viewMode.value = mode
  try {
    localStorage.setItem(VIEW_KEY, mode)
  } catch {
    /* ignore */
  }
}

const onStatFilter = (kind: 'published' | 'indexed' | 'total') => {
  if (kind === 'total') {
    query.keyword = undefined
    query.sourceType = undefined
    query.publishStatus = undefined
    query.indexStatus = undefined
  } else if (kind === 'published') {
    query.publishStatus = 'PUBLISHED'
    query.indexStatus = undefined
  } else {
    query.indexStatus = 'INDEXED'
    query.publishStatus = undefined
  }
  query.pageNum = 1
  fetchData()
}

const query = reactive<API.KnowledgeNoteQueryRequest>({
  pageNum: 1,
  pageSize: 10,
  keyword: undefined,
  sourceType: undefined,
  publishStatus: undefined,
  indexStatus: undefined,
})

function applyRouteSourceFilter() {
  const st = route.query.sourceType
  if (typeof st === 'string' && st.trim()) {
    query.sourceType = st.trim().toUpperCase()
  }
}

const columns = [
  { title: '标题', dataIndex: 'title', ellipsis: true },
  { title: '来源', dataIndex: 'sourceType', width: 90 },
  { title: '标签', dataIndex: 'tags', width: 140, ellipsis: true },
  { title: '博客状态', dataIndex: 'publishStatus', width: 110 },
  { title: '知识库状态', dataIndex: 'indexStatus', width: 110 },
  { title: '更新时间', dataIndex: 'updateTime', width: 180 },
  { title: '操作', key: 'action', width: 200, fixed: 'right' as const },
]

const fetchData = async () => {
  loading.value = true
  try {
    const res = await listKnowledgeNotes({ ...query })
    if (res.data.code === 0 && res.data.data) {
      dataSource.value = res.data.data.records ?? []
      const pageTotal = extractPageTotal(res.data.data)
      total.value = pageTotal
      // 无筛选时 KPI「总精读」与列表分页总数同源，避免两套数字
      if (!hasActiveFilters.value) {
        syncTotalFromPage(pageTotal)
      }
    } else {
      message.error(res.data.message || '加载失败')
    }
  } finally {
    loading.value = false
  }
}

const onSearch = () => {
  query.pageNum = 1
  fetchData()
}

const onReset = () => {
  query.keyword = undefined
  query.sourceType = undefined
  query.publishStatus = undefined
  query.indexStatus = undefined
  query.pageNum = 1
  fetchData()
}

const onTableChange = (pagination: { current?: number; pageSize?: number }) => {
  query.pageNum = pagination.current ?? 1
  query.pageSize = pagination.pageSize ?? 10
  fetchData()
}

const onCardPageChange = (page: number, pageSize: number) => {
  query.pageNum = page
  query.pageSize = pageSize
  fetchData()
}

const openDetail = (id?: number | string, action?: string) => {
  if (id == null) return
  const q = action ? `?action=${action}` : ''
  router.push(`/admin/knowledge/notes/${id}${q}`)
}

const runRedistill = async (row: API.KnowledgeNoteVO) => {
  if (row.id == null) return
  const res = await redistillKnowledgeNote(row.id)
  if (res.data.code === 0 && res.data.data?.note?.id != null) {
    message.success('重新蒸馏完成')
    void refreshStats()
    openDetail(res.data.data.note.id)
  } else {
    message.error(res.data.message || '重新蒸馏失败')
  }
}

const handleRedistill = async (row: API.KnowledgeNoteVO) => {
  const ux = await loadReadingUxSettings()
  if (!ux.redistillConfirmRequired) {
    await runRedistill(row)
    return
  }
  Modal.confirm({
    title: '重新蒸馏',
    content: '重新蒸馏会覆盖当前 Markdown 内容。如果你已手动修改，修改内容会丢失。是否继续？',
    onOk: () => runRedistill(row),
  })
}

const handleDelete = (row: API.KnowledgeNoteVO) => {
  Modal.confirm({
    title: '删除精读',
    content:
      `确认删除「${row.title || row.id}」？将同时从领域树摘叶；若已发布为博客，关联博客也会一并删除。精读笔记本身不可恢复。`,
    okType: 'danger',
    onOk: async () => {
      if (row.id == null) return
      const res = await deleteKnowledgeNote(row.id)
      if (res.data.code === 0) {
        message.success('已删除')
        fetchData()
        void refreshStats()
      } else {
        message.error(res.data.message || '删除失败')
      }
    },
  })
}

let runningTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  applyRouteSourceFilter()
  void fetchData()
  void refreshStats()
  runningTimer = setInterval(() => {
    void refreshRunning(true)
  }, 5000)
})

onBeforeUnmount(() => {
  if (runningTimer) {
    clearInterval(runningTimer)
    runningTimer = null
  }
})

watch(
  () => route.query.sourceType,
  () => {
    applyRouteSourceFilter()
    query.pageNum = 1
    void fetchData()
  },
)
</script>

<template>
  <div class="kb-note-list-page admin-theme-page">
    <!-- 面包屑 -->
    <a-breadcrumb class="admin-breadcrumb">
      <a-breadcrumb-item>管理</a-breadcrumb-item>
      <a-breadcrumb-item>AI 精读</a-breadcrumb-item>
      <a-breadcrumb-item>精读列表</a-breadcrumb-item>
    </a-breadcrumb>

    <!-- 页面头部 -->
    <div class="admin-page-hero">
      <div class="hero-left">
        <div class="hero-title"><StickyNote :size="22" /> 精读列表</div>
        <div class="hero-subtitle">
          <template v-if="hasActiveFilters">当前筛选 {{ total }} 条</template>
          <template v-else>共 {{ total }} 条精读笔记</template>
          · 管理你的 AI 精读成果
        </div>
      </div>
      <div class="hero-extra">
        <a-space>
          <IconAction
            :icon="Settings"
            label="精读设置"
            variant="soft"
            motion="spin"
            @click="router.push('/admin/settings/reading')"
          />
          <IconAction
            :icon="Plus"
            label="内容采集"
            variant="primary"
            size="lg"
            motion="pop"
            @click="router.push('/admin/knowledge/ingest')"
          />
        </a-space>
      </div>
    </div>

    <!-- KPI 概览 -->
    <KnowledgeStatBar
      :total="statsTotal"
      :published="statsPublished"
      :indexed="statsIndexed"
      :running="statsRunning"
      :loading="statsLoading"
      @filter="onStatFilter"
      @jobs="router.push('/admin/knowledge/jobs')"
    />

    <!-- 筛选栏 -->
    <div class="admin-filter-bar">
      <a-input
        v-model:value="query.keyword"
        allow-clear
        placeholder="搜索标题 / URL / 标签…"
        style="width: 220px"
        @pressEnter="onSearch"
      />
      <a-select
        v-model:value="query.sourceType"
        allow-clear
        placeholder="来源类型"
        style="width: 130px"
      >
        <a-select-option value="URL">URL</a-select-option>
        <a-select-option value="FILE">文件</a-select-option>
        <a-select-option value="AGENT">AI 搜索</a-select-option>
      </a-select>
      <a-select
        v-model:value="query.publishStatus"
        allow-clear
        placeholder="博客状态"
        style="width: 140px"
      >
        <a-select-option value="NOT_PUBLISHED">未发布</a-select-option>
        <a-select-option value="DRAFT_CREATED">草稿</a-select-option>
        <a-select-option value="PUBLISHED">已发布</a-select-option>
        <a-select-option value="SYNC_REQUIRED">需同步</a-select-option>
        <a-select-option value="SYNC_FAILED">同步失败</a-select-option>
      </a-select>
      <a-select
        v-model:value="query.indexStatus"
        allow-clear
        placeholder="知识库状态"
        style="width: 140px"
      >
        <a-select-option value="NOT_INDEXED">未入库</a-select-option>
        <a-select-option value="INDEXED">已入库</a-select-option>
        <a-select-option value="REINDEX_REQUIRED">需重建</a-select-option>
        <a-select-option value="INDEX_FAILED">入库失败</a-select-option>
      </a-select>
      <a-button type="primary" @click="onSearch">搜索</a-button>
      <a-button @click="onReset">重置</a-button>

      <div class="kb-view-toggle">
        <button
          type="button"
          class="kb-view-toggle__btn"
          :class="{ 'is-active': viewMode === 'card' }"
          title="卡片视图"
          @click="setViewMode('card')"
        >
          <LayoutGrid :size="18" :stroke-width="2" />
        </button>
        <button
          type="button"
          class="kb-view-toggle__btn"
          :class="{ 'is-active': viewMode === 'list' }"
          title="列表视图"
          @click="setViewMode('list')"
        >
          <ListIcon :size="18" :stroke-width="2" />
        </button>
      </div>
    </div>

    <!-- 加载骨架屏 -->
    <div v-if="loading" class="kb-card-grid">
      <div v-for="n in 6" :key="n" class="kb-skeleton kb-skeleton-card" />
    </div>

    <!-- 卡片视图 -->
    <template v-else-if="viewMode === 'card'">
      <div v-if="dataSource.length" class="kb-card-grid kb-stagger">
        <KnowledgeNoteCard
          v-for="note in dataSource"
          :key="note.id"
          :note="note"
          @open="openDetail"
          @redistill="handleRedistill"
          @delete="handleDelete"
        />
      </div>
      <div v-else class="kb-empty-state">
        <a-empty description="还没有精读笔记">
          <template #children>
            <IconAction
              :icon="Plus"
              label="去采集第一篇"
              variant="primary"
              motion="pop"
              @click="router.push('/admin/knowledge/ingest')"
            />
          </template>
        </a-empty>
      </div>
      <div v-if="dataSource.length" class="kb-card-pager">
        <a-pagination
          :current="query.pageNum"
          :page-size="query.pageSize"
          :total="total"
          show-size-changer
          :show-total="(t: number) => `共 ${t} 条`"
          @change="onCardPageChange"
        />
      </div>
    </template>

    <!-- 列表视图 -->
    <a-card v-else :bordered="false" style="margin-bottom: 0">
      <a-table
        row-key="id"
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :scroll="{ x: 1050 }"
        :pagination="{
          current: query.pageNum,
          pageSize: query.pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t: number) => `共 ${t} 条`,
        }"
        @change="onTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'title'">
            <a style="cursor: pointer" @click="openDetail(record.id)">{{ record.title || '（无标题）' }}</a>
          </template>
          <template v-else-if="column.dataIndex === 'sourceType'">
            <a-tag>{{ sourceTypeLabel(record.sourceType) }}</a-tag>
          </template>
          <template v-else-if="column.dataIndex === 'publishStatus'">
            <a-tag :color="publishStatusColor(record.publishStatus)">
              {{ publishStatusLabel(record.publishStatus) }}
            </a-tag>
          </template>
          <template v-else-if="column.dataIndex === 'indexStatus'">
            <a-tag :color="indexStatusColor(record.indexStatus)">
              {{ indexStatusLabel(record.indexStatus) }}
            </a-tag>
          </template>
          <template v-else-if="column.dataIndex === 'tags'">
            {{ record.tags || '-' }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space :size="4">
              <a-button type="link" size="small" @click="openDetail(record.id)">预览</a-button>
              <a-dropdown :trigger="['click']" placement="bottomRight">
                <button class="admin-action-trigger" title="更多操作">···</button>
                <template #overlay>
                  <a-menu @click="({ key }: { key: string }) => {
                    const actions: Record<string, () => void> = {
                      publish: () => openDetail(record.id, 'publish'),
                      sync: () => openDetail(record.id, 'sync'),
                      index: () => openDetail(record.id, 'index'),
                      reindex: () => openDetail(record.id, 'reindex'),
                      redistill: () => handleRedistill(record),
                      delete: () => handleDelete(record),
                    }
                    actions[key]?.()
                  }">
                    <a-menu-item v-if="canPublishBlog(record.publishStatus)" key="publish">
                      发布博客
                    </a-menu-item>
                    <a-menu-item v-if="canSyncBlog(record.publishStatus)" key="sync">
                      同步博客
                    </a-menu-item>
                    <a-menu-item v-if="canIndexKb(record.indexStatus)" key="index">
                      加入知识库
                    </a-menu-item>
                    <a-menu-item v-if="canReindexKb(record.indexStatus)" key="reindex">
                      重建索引
                    </a-menu-item>
                    <a-menu-item v-if="record.status === 'FAILED'" key="redistill">
                      重新蒸馏
                    </a-menu-item>
                    <a-menu-divider />
                    <a-menu-item key="delete" danger>
                      <span style="color: var(--color-error)">删除</span>
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </a-space>
          </template>
        </template>

        <!-- 空状态 -->
        <template #emptyText>
          <a-empty description="还没有精读笔记">
            <template #children>
              <a-button type="primary" @click="router.push('/admin/knowledge/ingest')">
                去采集第一篇
              </a-button>
            </template>
          </a-empty>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<style scoped>
/* 标题链接 hover 效果 */
.kb-note-list-page a:hover {
  color: var(--color-primary-light) !important;
}

/* 表格行入场动画 */
.kb-note-list-page :deep(.ant-table-tbody > tr) {
  transition: background var(--transition-fast);
}

/* 空状态样式 */
.kb-note-list-page :deep(.ant-empty) {
  padding: 40px 0;
}

/* 视图切换 */
.kb-view-toggle {
  display: inline-flex;
  margin-left: auto;
  padding: 3px;
  gap: 2px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-surface);
}
.kb-view-toggle__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 30px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition:
    background var(--transition-fast),
    color var(--transition-fast);
}
.kb-view-toggle__btn:hover {
  color: var(--color-text-primary);
}
.kb-view-toggle__btn.is-active {
  background: var(--color-primary-12);
  color: var(--color-primary-light);
}

/* 卡片分页与空态 */
.kb-card-pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
.kb-empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-surface);
}
</style>
