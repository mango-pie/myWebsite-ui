<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import type { UploadProps } from 'ant-design-vue'
import { getKnowledgeBase } from '@/api/knowledge'
import {
  deleteKnowledgeDocument,
  getKnowledgeDocument,
  getKnowledgeDocumentDownloadUrl,
  listKnowledgeDocumentChunks,
  listKnowledgeDocuments,
  parseKnowledgeDocument,
  uploadKnowledgeDocument,
} from '@/api/knowledge'
import {
  KB_UPLOAD_ACCEPT,
  canParseDocument,
  formatFileSize,
  isAllowedKbUploadFile,
  isParsedDocument,
  isParsingDocument,
  kbParseStatusColor,
  kbParseStatusLabel,
} from '@/utils/knowledgeFormat'
import '@/assets/admin-theme.css'
import { FolderOpen, MessagesSquare, ArrowLeft, Search, RotateCcw, Sparkles, Boxes, Download, Trash2 } from 'lucide-vue-next'
import IconAction from '@/components/ui/IconAction.vue'

const route = useRoute()
const router = useRouter()
const kbId = computed(() => String(route.params.kbId ?? ''))

const kbLoading = ref(false)
const kb = ref<API.KnowledgeBaseVO | null>(null)

const loading = ref(false)
const dataSource = ref<API.KnowledgeDocumentVO[]>([])
const total = ref(0)
const uploadPercent = ref<number | null>(null)

const query = reactive<API.KnowledgeDocumentQueryRequest>({
  pageNum: 1,
  pageSize: 10,
  fileName: undefined,
  fileType: undefined,
  parseStatus: undefined,
})

const pollTimers = new Map<string, ReturnType<typeof setInterval>>()

const chunkOpen = ref(false)
const chunkLoading = ref(false)
const chunks = ref<API.KnowledgeChunkVO[]>([])
const chunkDocName = ref('')
const parsingIds = ref<Set<string>>(new Set())

const columns = [
  { title: '文件名', dataIndex: 'fileName', ellipsis: true },
  { title: '类型', dataIndex: 'fileType', width: 90 },
  { title: '大小', dataIndex: 'fileSize', width: 100 },
  { title: '解析状态', dataIndex: 'parseStatus', width: 120 },
  { title: 'Chunk', dataIndex: 'chunkCount', width: 80 },
  { title: '上传时间', dataIndex: 'createTime', width: 180 },
  { title: '操作', key: 'action', width: 220, fixed: 'right' as const },
]

/* 文件类型图标与颜色映射 */
const fileTypeMeta: Record<string, { icon: string; color: string }> = {
  pdf: { icon: 'PDF', color: 'error' },
  docx: { icon: 'DOCX', color: 'processing' },
  txt: { icon: 'TXT', color: 'default' },
  md: { icon: 'MD', color: 'purple' },
}

const stopPoll = (id: string) => {
  const t = pollTimers.get(id)
  if (t) {
    clearInterval(t)
    pollTimers.delete(id)
  }
}

const clearAllPolls = () => {
  for (const id of pollTimers.keys()) stopPoll(id)
}

const patchRow = (doc: API.KnowledgeDocumentVO) => {
  const idx = dataSource.value.findIndex((d) => String(d.id) === String(doc.id))
  if (idx >= 0) dataSource.value[idx] = { ...dataSource.value[idx], ...doc }
}

const startPoll = (id: number | string) => {
  const key = String(id)
  stopPoll(key)
  const timer = setInterval(async () => {
    try {
      const res = await getKnowledgeDocument(id)
      if (res.data.code === 0 && res.data.data) {
        const doc = res.data.data
        patchRow(doc)
        if (isParsedDocument(doc.parseStatus) || doc.parseStatus === 'FAILED') {
          stopPoll(key)
          if (doc.parseStatus === 'FAILED') {
            message.error(doc.errorMessage || '解析失败')
          } else if (doc.parseStatus === 'PARSED' || doc.parseStatus === 'SUCCESS') {
            message.success('解析完成')
            fetchKb()
          }
        }
      }
    } catch {
      stopPoll(key)
    }
  }, 2500)
  pollTimers.set(key, timer)
}

const fetchKb = async () => {
  kbLoading.value = true
  try {
    const res = await getKnowledgeBase(kbId.value)
    if (res.data.code === 0 && res.data.data) {
      kb.value = res.data.data
    } else {
      message.error(res.data.message || '知识库不存在')
      router.replace('/knowledge')
    }
  } finally {
    kbLoading.value = false
  }
}

const fetchDocs = async () => {
  loading.value = true
  try {
    const res = await listKnowledgeDocuments(kbId.value, { ...query })
    if (res.data.code === 0 && res.data.data) {
      dataSource.value = res.data.data.records ?? []
      total.value = res.data.data.totalRow ?? 0
      for (const row of dataSource.value) {
        if (row.id != null && isParsingDocument(row.parseStatus)) startPoll(row.id)
      }
    } else {
      message.error(res.data.message || '文档列表加载失败')
    }
  } finally {
    loading.value = false
  }
}

const refreshAll = async () => {
  await Promise.all([fetchKb(), fetchDocs()])
}

const onSearch = () => {
  query.pageNum = 1
  fetchDocs()
}

const onReset = () => {
  query.fileName = undefined
  query.fileType = undefined
  query.parseStatus = undefined
  query.pageNum = 1
  fetchDocs()
}

const onTableChange = (pag: { current?: number; pageSize?: number }) => {
  if (pag.current != null) query.pageNum = pag.current
  if (pag.pageSize != null) query.pageSize = pag.pageSize
  fetchDocs()
}

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const check = isAllowedKbUploadFile(file as File)
  if (!check.ok) {
    message.error(check.message)
    return false
  }
  return true
}

const customRequest: UploadProps['customRequest'] = async (options) => {
  const { file, onError, onSuccess, onProgress } = options
  const raw = file as File
  uploadPercent.value = 0
  try {
    const res = await uploadKnowledgeDocument(kbId.value, raw, (e) => {
      if (e.total) {
        const percent = Math.round((e.loaded / e.total) * 100)
        uploadPercent.value = percent
        onProgress?.({ percent })
      }
    })
    if (res.data.code === 0) {
      message.success(`${raw.name} 上传成功`)
      onSuccess?.(res.data)
      uploadPercent.value = null
      await refreshAll()
    } else {
      const err = new Error(res.data.message || '上传失败')
      message.error(err.message)
      onError?.(err)
      uploadPercent.value = null
    }
  } catch (e) {
    const err = e instanceof Error ? e : new Error('上传失败')
    message.error(err.message)
    onError?.(err)
    uploadPercent.value = null
  }
}

const handleParse = async (row: API.KnowledgeDocumentVO) => {
  if (row.id == null) return
  const id = String(row.id)
  parsingIds.value.add(id)
  try {
    const res = await parseKnowledgeDocument(row.id)
    if (res.data.code === 0 && res.data.data) {
      message.success('已开始解析')
      patchRow(res.data.data)
      if (isParsingDocument(res.data.data.parseStatus)) {
        startPoll(row.id)
      } else if (isParsedDocument(res.data.data.parseStatus)) {
        message.success('解析完成')
        await fetchKb()
      }
    } else {
      message.error(res.data.message || '触发解析失败')
    }
  } finally {
    parsingIds.value.delete(id)
  }
}

const isRowParsing = (row: API.KnowledgeDocumentVO) =>
  (row.id != null && parsingIds.value.has(String(row.id))) || isParsingDocument(row.parseStatus)

const handleDownload = async (row: API.KnowledgeDocumentVO) => {
  if (row.id == null) return
  const res = await getKnowledgeDocumentDownloadUrl(row.id)
  if (res.data.code === 0 && res.data.data?.url) {
    window.open(res.data.data.url, '_blank')
  } else {
    message.error(res.data.message || '获取下载链接失败')
  }
}

const handleDelete = (row: API.KnowledgeDocumentVO) => {
  Modal.confirm({
    title: '删除文档',
    content: `确认删除「${row.fileName}」？`,
    okType: 'danger',
    onOk: async () => {
      if (row.id == null) return
      stopPoll(String(row.id))
      const res = await deleteKnowledgeDocument(row.id)
      if (res.data.code === 0) {
        message.success('已删除')
        await refreshAll()
      } else {
        message.error(res.data.message || '删除失败')
      }
    },
  })
}

const openChunks = async (row: API.KnowledgeDocumentVO) => {
  if (row.id == null) return
  chunkDocName.value = row.fileName || ''
  chunkOpen.value = true
  chunkLoading.value = true
  try {
    const res = await listKnowledgeDocumentChunks(row.id, { pageNum: 1, pageSize: 50 })
    if (res.data.code === 0) {
      chunks.value = res.data.data ?? []
    } else {
      message.error(res.data.message || '加载切块失败')
      chunks.value = []
    }
  } finally {
    chunkLoading.value = false
  }
}

onMounted(refreshAll)
onBeforeUnmount(clearAllPolls)
</script>

<template>
  <div class="kb-detail-page admin-theme-page">
    <!-- 面包屑 -->
    <a-breadcrumb class="admin-breadcrumb">
      <a-breadcrumb-item>
        <router-link to="/">首页</router-link>
      </a-breadcrumb-item>
      <a-breadcrumb-item>
        <router-link to="/knowledge">知识库</router-link>
      </a-breadcrumb-item>
      <a-breadcrumb-item>{{ kb?.name || '详情' }}</a-breadcrumb-item>
    </a-breadcrumb>

    <!-- 页面头部 -->
    <div class="admin-page-hero">
      <div class="hero-left">
        <div class="hero-title"><FolderOpen :size="22" /> {{ kb?.name || '知识库详情' }}</div>
        <div class="hero-subtitle">
          <span v-if="kb">
            {{ kb.visibility === 'public' ? '公开' : '私有' }}
            &nbsp;·&nbsp;
            {{ kb.documentCount ?? 0 }} 个文档
            &nbsp;·&nbsp;
            {{ kb.description || '暂无描述' }}
          </span>
          <span v-else>加载中…</span>
        </div>
      </div>
      <div class="hero-extra">
        <a-space>
          <IconAction :icon="MessagesSquare" label="去问答" variant="primary" motion="pop" @click="router.push(`/knowledge/${kbId}/chat`)" />
          <IconAction :icon="ArrowLeft" label="返回列表" variant="soft" motion="slide" @click="router.push('/knowledge')" />
        </a-space>
      </div>
    </div>

    <!-- 上传文档 -->
    <a-card title="上传文档" :bordered="false" style="margin-bottom: 16px">
      <a-upload-dragger
        name="file"
        :multiple="false"
        :accept="KB_UPLOAD_ACCEPT"
        :show-upload-list="false"
        :before-upload="beforeUpload"
        :custom-request="customRequest"
        class="admin-upload-dragger"
      >
        <div style="padding: 16px 0">
          <div style="font-size: 40px; margin-bottom: 8px"></div>
          <p style="color: var(--color-text-secondary); margin: 0">
            将文件拖到此处，或点击选择
          </p>
          <p style="color: var(--color-text-muted); font-size: 12px; margin-top: 6px">
            支持 PDF / DOCX / TXT / Markdown，单文件不超过 50MB
          </p>
        </div>
      </a-upload-dragger>
      <a-progress v-if="uploadPercent != null" :percent="uploadPercent" style="margin-top: 12px" size="small" />
    </a-card>

    <!-- 文档列表 -->
    <a-card title="文档列表" :bordered="false">
      <!-- 筛选栏 -->
      <div class="admin-filter-bar" style="margin-bottom: 16px">
        <a-input
          v-model:value="query.fileName"
          allow-clear
          placeholder="搜索文件名…"
          style="width: 180px"
          @pressEnter="onSearch"
        />
        <a-select
          v-model:value="query.fileType"
          allow-clear
          placeholder="文件类型"
          style="width: 120px"
        >
          <a-select-option value="pdf">pdf</a-select-option>
          <a-select-option value="docx">docx</a-select-option>
          <a-select-option value="txt">txt</a-select-option>
          <a-select-option value="md">md</a-select-option>
        </a-select>
        <a-select
          v-model:value="query.parseStatus"
          allow-clear
          placeholder="解析状态"
          style="width: 130px"
        >
          <a-select-option value="UPLOADED">待解析</a-select-option>
          <a-select-option value="PENDING">待解析</a-select-option>
          <a-select-option value="PARSING">解析中</a-select-option>
          <a-select-option value="PARSED">已完成</a-select-option>
          <a-select-option value="FAILED">失败</a-select-option>
        </a-select>
        <a-button type="primary" class="kb-search-btn" @click="onSearch">
          <template #icon><Search :size="15" /></template>
          搜索
        </a-button>
        <a-button class="kb-reset-btn" @click="onReset">
          <template #icon><RotateCcw :size="15" /></template>
          重置
        </a-button>
      </div>

      <a-table
        row-key="id"
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="{
          current: query.pageNum,
          pageSize: query.pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t: number) => `共 ${t} 条`,
        }"
        :scroll="{ x: 1000 }"
        @change="onTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'fileName'">
            <span>
              {{ record.fileName }}
            </span>
          </template>
          <template v-else-if="column.dataIndex === 'fileType'">
            <a-tag :color="fileTypeMeta[record.fileType ?? '']?.color || 'default'">
              {{ fileTypeMeta[record.fileType ?? '']?.icon  }}
              {{ record.fileType?.toUpperCase() || '-' }}
            </a-tag>
          </template>
          <template v-else-if="column.dataIndex === 'fileSize'">
            {{ formatFileSize(record.fileSize) }}
          </template>
          <template v-else-if="column.dataIndex === 'parseStatus'">
            <a-tooltip v-if="record.parseStatus === 'FAILED' && record.errorMessage" :title="record.errorMessage">
              <a-tag :color="kbParseStatusColor(record.parseStatus)">
                {{ kbParseStatusLabel(record.parseStatus) }}
              </a-tag>
            </a-tooltip>
            <a-tag v-else :color="kbParseStatusColor(record.parseStatus)">
              {{ kbParseStatusLabel(record.parseStatus) }}
            </a-tag>
          </template>
          <template v-else-if="column.dataIndex === 'chunkCount'">
            <span style="font-weight: 500">{{ record.chunkCount ?? '-' }}</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space :size="4" wrap>
              <a-button
                v-if="canParseDocument(record.parseStatus)"
                type="link"
                size="small"
                class="kb-row-btn"
                :loading="isRowParsing(record)"
                :disabled="isRowParsing(record)"
                @click="handleParse(record)"
              >
                <template #icon><Sparkles :size="14" /></template>
                {{ record.parseStatus === 'FAILED' ? '重试' : '解析' }}
              </a-button>
              <a-button
                v-if="isParsedDocument(record.parseStatus)"
                type="link"
                size="small"
                class="kb-row-btn"
                @click="openChunks(record)"
              >
                <template #icon><Boxes :size="14" /></template>
                切块
              </a-button>
              <a-button type="link" size="small" class="kb-row-btn" @click="handleDownload(record)">
                <template #icon><Download :size="14" /></template>
                下载
              </a-button>
              <a-button type="link" danger size="small" class="kb-row-btn kb-row-btn--del" @click="handleDelete(record)">
                <template #icon><Trash2 :size="14" /></template>
                删除
              </a-button>
            </a-space>
          </template>
        </template>
        <template #emptyText>
          <a-empty description="还没有上传文档">
            <template #children>
              <span style="color: var(--color-text-muted)">拖拽文件到上方上传区开始构建知识库</span>
            </template>
          </a-empty>
        </template>
      </a-table>
    </a-card>

    <!-- 切块预览抽屉 -->
    <a-drawer
      v-model:open="chunkOpen"
      :title="`切块预览 · ${chunkDocName}`"
      width="560"
      :destroy-on-close="true"
    >
      <a-spin :spinning="chunkLoading">
        <a-empty v-if="!chunks.length" description="暂无切块" />
        <a-list v-else :data-source="chunks" item-layout="vertical">
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta
                :title="item.heading || `Chunk #${item.chunkIndex}`"
                :description="`token≈${item.tokenCount ?? '-'}`"
              />
              <div class="chunk-content">{{ item.content }}</div>
            </a-list-item>
          </template>
        </a-list>
      </a-spin>
    </a-drawer>
  </div>
</template>

<style scoped>
.chunk-content {
  white-space: pre-wrap;
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.hero-title :deep(svg) {
  vertical-align: -0.18em;
}
.kb-search-btn :deep(svg),
.kb-reset-btn :deep(svg),
.kb-row-btn :deep(svg) {
  transition: transform var(--transition-fast);
  vertical-align: -0.14em;
}
.kb-search-btn:hover :deep(svg) {
  transform: translateX(2px);
}
.kb-reset-btn:hover :deep(svg) {
  transform: rotate(-180deg);
}
.kb-row-btn:hover :deep(svg) {
  transform: scale(1.18);
}
.kb-row-btn--del:hover :deep(svg) {
  animation: kbRowShake 0.4s ease;
}
@keyframes kbRowShake {
  0%, 100% { transform: rotate(0); }
  25% { transform: rotate(-12deg); }
  75% { transform: rotate(12deg); }
}
@media (prefers-reduced-motion: reduce) {
  .kb-search-btn:hover :deep(svg),
  .kb-reset-btn:hover :deep(svg),
  .kb-row-btn:hover :deep(svg) {
    animation: none;
    transform: none;
  }
}
</style>
