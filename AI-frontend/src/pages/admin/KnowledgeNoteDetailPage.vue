<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import {
  getKnowledgeNoteDetail,
  indexKnowledgeNote,
  listKnowledgeBases,
  publishKnowledgeNoteBlog,
  redistillKnowledgeNote,
  reindexKnowledgeNote,
  syncKnowledgeNoteBlog,
  updateKnowledgeNote,
} from '@/api/knowledge'
import { getAllCategories } from '@/api/blogCategoryController'
import { getAllTags } from '@/api/blogTagController'
import { renderBlogMarkdown } from '@/utils/blogMarkdown'
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
import { loadReadingUxSettings, type ReadingUxSettings } from '@/utils/readingSettings'
import '@/assets/blog-prose.css'
import '@/assets/admin-theme.css'
import { FileEdit, Save, RefreshCw, Newspaper, Link2, LibraryBig, Wrench, Type, Bold, Italic, Code2, Quote, Heading1, Heading2, Heading3, Minus, Braces } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const noteId = computed(() => String(route.params.noteId ?? ''))

const loading = ref(false)
const saving = ref(false)
const detail = ref<API.KnowledgeNoteDetailVO | null>(null)

const form = reactive({
  title: '',
  tags: '',
  distilledMd: '',
})

const previewHtml = computed(() => renderBlogMarkdown(form.distilledMd || ''))

const note = computed(() => detail.value?.note)
const kbId = computed(() => detail.value?.knowledgeDocument?.knowledgeBaseId)

const rawOpen = ref(false)

const publishOpen = ref(false)
const publishLoading = ref(false)
const categoryOptions = ref<API.BlogCategoryVO[]>([])
const tagOptions = ref<API.BlogTagVO[]>([])

const publishForm = reactive({
  categoryId: undefined as number | string | undefined,
  tagIds: [] as (number | string)[],
  status: 0,
})

const readingUx = ref<ReadingUxSettings>({
  defaultAsDraft: true,
  askOpenEditor: true,
  redistillConfirmRequired: true,
})

const indexOpen = ref(false)
const indexLoading = ref(false)
const kbMode = ref<'existing' | 'create'>('existing')
const kbOptions = ref<{ label: string; value: string | number }[]>([])
const indexForm = reactive({
  knowledgeBaseId: undefined as number | string | undefined,
  knowledgeBaseName: '',
  knowledgeBaseDescription: '',
})

/* ---- Markdown 编辑器 ---- */
const editorTextarea = ref<HTMLTextAreaElement | null>(null)
const editorTab = ref<'edit' | 'preview'>('edit')

const wordCount = computed(() => {
  const text = form.distilledMd || ''
  const chineseChars = (text.match(/[一-鿿]/g) || []).length
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
  return chineseChars + englishWords
})

function insertMarkdown(before: string, after = '') {
  const el = editorTextarea.value
  if (!el) return
  const start = el.selectionStart
  const end = el.selectionEnd
  const selected = form.distilledMd.substring(start, end)
  const replacement = before + selected + after
  form.distilledMd = form.distilledMd.substring(0, start) + replacement + form.distilledMd.substring(end)
  nextTick(() => {
    el.focus()
    const newPos = start + before.length + selected.length + after.length
    el.setSelectionRange(newPos, newPos)
  })
}

/* ---- 数据加载 ---- */

const loadDetail = async () => {
  if (!noteId.value) return
  loading.value = true
  try {
    const res = await getKnowledgeNoteDetail(noteId.value)
    if (res.data.code === 0 && res.data.data) {
      detail.value = res.data.data
      form.title = res.data.data.note?.title || ''
      form.tags = res.data.data.note?.tags || ''
      form.distilledMd = res.data.data.distilledMd || ''
    } else {
      message.error(res.data.message || '精读不存在')
      router.replace('/admin/knowledge/notes')
    }
  } finally {
    loading.value = false
  }
}

const runRouteAction = async () => {
  const action = String(route.query.action || '')
  if (!action) return
  await nextTick()
  if (action === 'publish' && canPublishBlog(note.value?.publishStatus)) {
    openPublish()
  } else if (action === 'sync' && canSyncBlog(note.value?.publishStatus)) {
    handleSync()
  } else if (action === 'index' && canIndexKb(note.value?.indexStatus)) {
    openIndex()
  } else if (action === 'reindex' && canReindexKb(note.value?.indexStatus)) {
    handleReindex()
  }
  router.replace({ path: route.path, query: {} })
}

const handleSave = async () => {
  saving.value = true
  try {
    const res = await updateKnowledgeNote(noteId.value, {
      title: form.title.trim(),
      tags: form.tags.trim() || undefined,
      distilledMd: form.distilledMd,
    })
    if (res.data.code === 0 && res.data.data) {
      message.success('内容已保存')
      if (res.data.data.publishStatus === 'SYNC_REQUIRED') {
        message.info('如果该精读已发布博客，需要同步博客')
      }
      if (res.data.data.indexStatus === 'REINDEX_REQUIRED') {
        message.info('如果该精读已加入知识库，需要重建索引')
      }
      await loadDetail()
    } else {
      message.error(res.data.message || '保存失败')
    }
  } finally {
    saving.value = false
  }
}

const runRedistill = async () => {
  const res = await redistillKnowledgeNote(noteId.value)
  if (res.data.code === 0 && res.data.data) {
    message.success('重新蒸馏完成')
    detail.value = res.data.data
    form.title = res.data.data.note?.title || ''
    form.tags = res.data.data.note?.tags || ''
    form.distilledMd = res.data.data.distilledMd || ''
  } else {
    message.error(res.data.message || '重新蒸馏失败')
  }
}

const handleRedistill = async () => {
  const ux = await loadReadingUxSettings()
  readingUx.value = ux
  if (!ux.redistillConfirmRequired) {
    await runRedistill()
    return
  }
  Modal.confirm({
    title: '重新蒸馏',
    content:
      '重新蒸馏会覆盖当前 Markdown 内容。如果你已手动修改，修改内容会丢失。是否继续？',
    onOk: runRedistill,
  })
}

const loadBlogMeta = async () => {
  const [catRes, tagRes] = await Promise.all([getAllCategories(), getAllTags()])
  if (catRes.data.code === 0) {
    categoryOptions.value = (catRes.data.data ?? []) as API.BlogCategoryVO[]
  }
  if (tagRes.data.code === 0) {
    tagOptions.value = (tagRes.data.data ?? []) as API.BlogTagVO[]
  }
}

const openPublish = async () => {
  const [ux] = await Promise.all([loadReadingUxSettings(), loadBlogMeta()])
  readingUx.value = ux
  publishForm.categoryId = undefined
  publishForm.tagIds = []
  publishForm.status = ux.defaultAsDraft ? 0 : 1
  publishOpen.value = true
}

const submitPublish = async () => {
  publishLoading.value = true
  try {
    const res = await publishKnowledgeNoteBlog(noteId.value, {
      categoryId: publishForm.categoryId,
      tagIds: publishForm.tagIds,
      status: publishForm.status,
    })
    if (res.data.code === 0 && res.data.data) {
      publishOpen.value = false
      const postId = res.data.data.id
      if (readingUx.value.askOpenEditor) {
        Modal.confirm({
          title: '博客已创建',
          content: '是否跳转到博客编辑器？',
          okText: '打开博客编辑器',
          cancelText: '留在当前页',
          onOk: () => {
            if (postId != null) router.push(`/blog/edit/${postId}`)
          },
          onCancel: () => loadDetail(),
        })
      } else {
        message.success('博客已创建')
      }
      await loadDetail()
    } else {
      message.error(res.data.message || '发布失败，若已关联博客请使用同步')
    }
  } finally {
    publishLoading.value = false
  }
}

const handleSync = () => {
  Modal.confirm({
    title: '同步博客',
    content: '同步会覆盖博客文章的标题和正文。是否继续？',
    onOk: async () => {
      const res = await syncKnowledgeNoteBlog(noteId.value)
      if (res.data.code === 0) {
        message.success('同步成功')
        await loadDetail()
      } else {
        message.error(res.data.message || '同步失败')
      }
    },
  })
}

const loadKbOptions = async () => {
  const res = await listKnowledgeBases({ pageNum: 1, pageSize: 100 })
  if (res.data.code === 0 && res.data.data?.records) {
    kbOptions.value = res.data.data.records
      .filter((k) => k.id != null)
      .map((k) => ({ label: k.name || String(k.id), value: k.id! }))
  }
}

const openIndex = async () => {
  await loadKbOptions()
  kbMode.value = 'existing'
  indexForm.knowledgeBaseId = undefined
  indexForm.knowledgeBaseName = ''
  indexForm.knowledgeBaseDescription = ''
  indexOpen.value = true
}

const submitIndex = async () => {
  if (kbMode.value === 'existing' && indexForm.knowledgeBaseId == null) {
    message.warning('请选择知识库')
    return
  }
  if (kbMode.value === 'create' && !indexForm.knowledgeBaseName.trim()) {
    message.warning('请填写知识库名称')
    return
  }
  indexLoading.value = true
  try {
    const body: API.KnowledgeNoteIndexRequest =
      kbMode.value === 'existing'
        ? { knowledgeBaseId: indexForm.knowledgeBaseId }
        : {
            knowledgeBaseName: indexForm.knowledgeBaseName.trim(),
            knowledgeBaseDescription: indexForm.knowledgeBaseDescription.trim() || undefined,
          }
    const res = await indexKnowledgeNote(noteId.value, body)
    if (res.data.code === 0 && res.data.data) {
      indexOpen.value = false
      message.success('已加入知识库')
      await loadDetail()
    } else {
      message.error(res.data.message || '入库失败')
    }
  } finally {
    indexLoading.value = false
  }
}

const handleReindex = () => {
  Modal.confirm({
    title: '重建索引',
    content: '重建索引会删除旧切块并重新向量化当前 Markdown。是否继续？',
    onOk: async () => {
      const res = await reindexKnowledgeNote(noteId.value)
      if (res.data.code === 0) {
        message.success('重建完成')
        await loadDetail()
      } else {
        message.error(res.data.message || '重建失败')
      }
    },
  })
}

const openKb = () => {
  if (kbId.value != null) router.push(`/knowledge/${kbId.value}`)
}

watch(
  () => route.params.noteId,
  async () => {
    await loadDetail()
    await runRouteAction()
  },
)

onMounted(async () => {
  readingUx.value = await loadReadingUxSettings()
  await loadDetail()
  await runRouteAction()
})
</script>

<template>
  <div class="kb-note-detail-page admin-theme-page">
    <!-- 面包屑 -->
    <a-breadcrumb class="admin-breadcrumb">
      <a-breadcrumb-item>
        <router-link to="/admin/knowledge/notes">AI 精读工作台</router-link>
      </a-breadcrumb-item>
      <a-breadcrumb-item>精读详情</a-breadcrumb-item>
    </a-breadcrumb>

    <a-spin :spinning="loading">
      <!-- 顶部信息栏 -->
      <div class="admin-page-hero" style="padding: 16px 24px">
        <div class="hero-left">
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap">
            <a-button type="link" style="padding: 0" @click="router.push('/admin/knowledge/notes')">
              ← 返回列表
            </a-button>
            <FileEdit :size="20" style="flex-shrink: 0; color: var(--color-primary)" />
            <span style="font-size: 20px; font-weight: 600; color: var(--color-text-primary)">
              {{ form.title || '精读详情' }}
            </span>
            <a-tag>{{ sourceTypeLabel(note?.sourceType) }}</a-tag>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px; flex-wrap: wrap">
            <a-tag :color="publishStatusColor(note?.publishStatus)">
              {{ publishStatusLabel(note?.publishStatus) }}
            </a-tag>
            <a-tag :color="indexStatusColor(note?.indexStatus)">
              {{ indexStatusLabel(note?.indexStatus) }}
            </a-tag>
            <span v-if="note?.sourceUrl" style="font-size: 12px; color: var(--color-text-muted)">
              来源：
              <a
                :href="note.sourceUrl"
                target="_blank"
                rel="noopener"
                style="color: var(--color-text-secondary)"
              >{{ note.sourceUrl }}</a>
            </span>
          </div>
        </div>
        <div class="hero-extra">
          <a-space>
            <a-button size="small" @click="router.push('/admin/settings/reading')">
              精读设置
            </a-button>
            <a-tag v-if="note?.blogPostId" color="purple">
              博客 #{{ note.blogPostId }}
              <a-button
                type="link"
                size="small"
                style="color: inherit; margin-left: 4px"
                @click="router.push(`/blog/edit/${note.blogPostId}`)"
              >
                编辑
              </a-button>
            </a-tag>
            <a-tag v-if="note?.knowledgeDocumentId" color="blue">
              文档 #{{ note.knowledgeDocumentId }}
              <a-button
                v-if="kbId != null"
                type="link"
                size="small"
                style="color: inherit; margin-left: 4px"
                @click="openKb"
              >
                打开
              </a-button>
            </a-tag>
          </a-space>
        </div>
      </div>

      <!-- 主内容区：两栏布局 -->
      <div class="detail-layout">
        <!-- 左栏：编辑区 -->
        <div class="detail-main">
          <!-- 标题和标签输入 -->
          <div class="admin-form-card" style="padding: 20px 24px; margin-bottom: 16px">
            <a-form layout="vertical">
              <a-row :gutter="16">
                <a-col :xs="24" :md="14">
                  <a-form-item label="标题" style="margin-bottom: 0">
                    <a-input
                      v-model:value="form.title"
                      size="large"
                      placeholder="输入标题..."
                      style="font-size: 16px"
                    />
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :md="10">
                  <a-form-item label="标签" style="margin-bottom: 0">
                    <a-input
                      v-model:value="form.tags"
                      size="large"
                      placeholder="逗号分隔，如 Spring,Java"
                    />
                  </a-form-item>
                </a-col>
              </a-row>
            </a-form>
          </div>

          <!-- Markdown 编辑器 -->
          <div class="editor-container">
            <!-- 工具栏 -->
            <div class="markdown-toolbar">
              <button title="一级标题" @click="insertMarkdown('# ', '')">H1</button>
              <button title="二级标题" @click="insertMarkdown('## ', '')">H2</button>
              <button title="三级标题" @click="insertMarkdown('### ', '')">H3</button>
              <span class="toolbar-divider"></span>
              <button title="粗体" @click="insertMarkdown('**', '**')"><b>B</b></button>
              <button title="斜体" @click="insertMarkdown('*', '*')"><i>I</i></button>
              <button title="行内代码" @click="insertMarkdown('`', '`')">&lt;/&gt;</button>
              <button title="引用" @click="insertMarkdown('> ', '')">›</button>
              <button title="链接" @click="insertMarkdown('[', '](url)')">Link</button>
              <span class="toolbar-divider"></span>
              <button title="代码块" @click="insertMarkdown('```\n', '\n```')">{ }</button>
              <button title="分割线" @click="insertMarkdown('\n---\n', '')">—</button>
              <span style="flex: 1"></span>
              <span class="toolbar-divider"></span>
              <button
                :style="editorTab === 'edit' ? { background: 'var(--color-primary-12)', color: 'var(--color-primary)', borderColor: 'var(--color-primary-20)' } : {}"
                @click="editorTab = 'edit'"
              >
                编辑
              </button>
              <button
                :style="editorTab === 'preview' ? { background: 'var(--color-primary-12)', color: 'var(--color-primary)', borderColor: 'var(--color-primary-20)' } : {}"
                @click="editorTab = 'preview'"
              >
                预览
              </button>
            </div>

            <!-- 编辑区 -->
            <a-textarea
              v-show="editorTab === 'edit'"
              ref="editorTextarea"
              v-model:value="form.distilledMd"
              :rows="22"
              class="md-editor"
              placeholder="在此编辑 Markdown 内容…"
            />

            <!-- 预览区 -->
            <div
              v-show="editorTab === 'preview'"
              class="md-preview blog-prose"
              v-html="previewHtml"
            />

            <!-- 状态栏 -->
            <div class="editor-status-bar">
              <span>{{ wordCount.toLocaleString() }} 字</span>
              <span>Markdown</span>
            </div>
          </div>

          <!-- 并排模式（桌面端默认） -->
          <a-row v-if="false" :gutter="16" style="margin-top: 0">
            <a-col :xs="24" :lg="12">
              <a-textarea v-model:value="form.distilledMd" :rows="22" class="md-editor" />
            </a-col>
            <a-col :xs="24" :lg="12">
              <div class="md-preview blog-prose" v-html="previewHtml" />
            </a-col>
          </a-row>
        </div>

        <!-- 右栏：信息侧栏 -->
        <div class="detail-sidebar">
          <!-- 博客关联 -->
          <div class="admin-info-card">
            <div class="info-card-title">博客关联</div>
            <div class="info-card-body">
              <template v-if="note?.blogPostId">
                <div style="margin-bottom: 8px">已关联博客 #{{ note.blogPostId }}</div>
                <a-tag :color="publishStatusColor(note?.publishStatus)">
                  {{ publishStatusLabel(note?.publishStatus) }}
                </a-tag>
                <div style="margin-top: 8px">
                  <a-button type="link" size="small" @click="router.push(`/blog/edit/${note.blogPostId}`)">
                    打开博客编辑器 →
                  </a-button>
                </div>
              </template>
              <template v-else>
                <div style="color: var(--color-text-muted); margin-bottom: 8px">尚未发布为博客</div>
                <a-button
                  v-if="canPublishBlog(note?.publishStatus)"
                  type="primary"
                  size="small"
                  @click="openPublish"
                >
                  发布博客
                </a-button>
              </template>
            </div>
          </div>

          <!-- 知识库文档 -->
          <div class="admin-info-card">
            <div class="info-card-title">知识库文档</div>
            <div class="info-card-body">
              <template v-if="note?.knowledgeDocumentId">
                <div style="margin-bottom: 8px">已入库，文档 #{{ note.knowledgeDocumentId }}</div>
                <a-tag :color="indexStatusColor(note?.indexStatus)">
                  {{ indexStatusLabel(note?.indexStatus) }}
                </a-tag>
                <div style="margin-top: 8px">
                  <a-button v-if="kbId != null" type="link" size="small" @click="openKb">
                    打开知识库 →
                  </a-button>
                </div>
              </template>
              <template v-else>
                <div style="color: var(--color-text-muted); margin-bottom: 8px">尚未加入知识库</div>
                <a-button
                  v-if="canIndexKb(note?.indexStatus)"
                  type="primary"
                  size="small"
                  @click="openIndex"
                >
                  加入知识库
                </a-button>
              </template>
            </div>
          </div>

          <!-- 原文摘要 -->
          <div class="admin-info-card">
            <div class="info-card-title">原文摘要</div>
            <div class="info-card-body">
              <p
                style="
                margin: 0 0 8px;
                white-space: pre-wrap;
                font-size: 13px;
                line-height: 1.7;
                max-height: 160px;
                overflow: hidden;
              "
              >{{ detail?.rawTextSummary || '（无摘要）' }}</p>
              <a-button type="link" size="small" @click="rawOpen = true">
                查看完整原文 →
              </a-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="admin-action-bar">
        <a-button type="primary" size="large" :loading="saving" @click="handleSave">
          保存修改
        </a-button>
        <a-button size="large" @click="handleRedistill">
          重新蒸馏
        </a-button>
        <a-button
          v-if="canPublishBlog(note?.publishStatus)"
          size="large"
          @click="openPublish"
        >
          发布博客
        </a-button>
        <a-button
          v-if="canSyncBlog(note?.publishStatus)"
          size="large"
          @click="handleSync"
        >
          同步博客
        </a-button>
        <a-button
          v-if="canIndexKb(note?.indexStatus)"
          size="large"
          @click="openIndex"
        >
          加入知识库
        </a-button>
        <a-button
          v-if="canReindexKb(note?.indexStatus)"
          size="large"
          @click="handleReindex"
        >
          重建索引
        </a-button>
      </div>
    </a-spin>

    <!-- 原文弹窗 -->
    <a-modal v-model:open="rawOpen" title="完整原文" width="800px" :footer="null">
      <pre class="raw-full">{{ detail?.rawText || '（无内容）' }}</pre>
    </a-modal>

    <!-- 发布博客弹窗 -->
    <a-modal
      v-model:open="publishOpen"
      title="发布博客"
      :confirm-loading="publishLoading"
      ok-text="确认发布"
      @ok="submitPublish"
    >
      <a-form layout="vertical">
        <a-form-item label="分类">
          <a-select
            v-model:value="publishForm.categoryId"
            allow-clear
            placeholder="选择分类"
            style="width: 100%"
            :options="categoryOptions.map((c) => ({ label: c.name, value: c.id! }))"
          />
        </a-form-item>
        <a-form-item label="标签">
          <a-select
            v-model:value="publishForm.tagIds"
            mode="multiple"
            allow-clear
            placeholder="选择标签"
            style="width: 100%"
            :options="tagOptions.map((t) => ({ label: t.name, value: t.id! }))"
          />
        </a-form-item>
        <a-form-item label="发布状态">
          <a-radio-group v-model:value="publishForm.status">
            <a-radio :value="0">草稿</a-radio>
            <a-radio :value="1">直接发布</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 加入知识库弹窗 -->
    <a-modal
      v-model:open="indexOpen"
      title="加入知识库"
      :confirm-loading="indexLoading"
      ok-text="确认入库"
      @ok="submitIndex"
    >
      <a-radio-group v-model:value="kbMode" style="margin-bottom: 16px">
        <a-radio-button value="existing">选择已有</a-radio-button>
        <a-radio-button value="create">新建知识库</a-radio-button>
      </a-radio-group>
      <a-form layout="vertical">
        <a-form-item v-if="kbMode === 'existing'" label="知识库" required>
          <a-select
            v-model:value="indexForm.knowledgeBaseId"
            allow-clear
            placeholder="选择知识库"
            style="width: 100%"
            :options="kbOptions"
          />
        </a-form-item>
        <template v-else>
          <a-form-item label="名称" required>
            <a-input v-model:value="indexForm.knowledgeBaseName" />
          </a-form-item>
          <a-form-item label="描述">
            <a-textarea v-model:value="indexForm.knowledgeBaseDescription" :rows="3" />
          </a-form-item>
        </template>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
/* ---- 两栏布局 ---- */
.detail-layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}
.detail-main {
  flex: 1;
  min-width: 0;
}
.detail-sidebar {
  width: 280px;
  flex-shrink: 0;
}

/* ---- 编辑器容器 ---- */
.editor-container {
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.02);
}

/* ---- Markdown 编辑器 ---- */
.md-editor {
  font-family: 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace !important;
  font-size: 14px !important;
  line-height: 1.75 !important;
}

.kb-note-detail-page :deep(.md-editor.ant-input),
.kb-note-detail-page :deep(textarea.md-editor) {
  background: transparent !important;
  border: none !important;
  color: var(--color-text-primary) !important;
  border-radius: 0 !important;
  resize: vertical;
  padding: 16px 20px !important;
}
.kb-note-detail-page :deep(textarea.md-editor:focus) {
  box-shadow: none !important;
  outline: none !important;
}

/* ---- 预览区 ---- */
.md-preview {
  min-height: 420px;
  max-height: 640px;
  overflow: auto;
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.02);
  color: var(--color-text-primary);
}

/* ---- 原文弹窗 ---- */
.raw-full {
  max-height: 60vh;
  overflow: auto;
  white-space: pre-wrap;
  font-size: 13px;
  padding: 12px;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
}

/* ---- 深色主题覆盖 ---- */
.kb-note-detail-page :deep(.ant-modal-content),
.kb-note-detail-page :deep(.ant-modal-header) {
  background: var(--color-bg-secondary);
  border-color: var(--color-border);
}
.kb-note-detail-page :deep(.ant-modal-title),
.kb-note-detail-page :deep(.ant-modal-close) {
  color: var(--color-text-primary);
}

/* ---- 响应式 ---- */
@media (max-width: 960px) {
  .detail-layout {
    flex-direction: column;
  }
  .detail-sidebar {
    width: 100%;
  }
  .detail-sidebar {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 12px;
  }
}
@media (max-width: 768px) {
  .detail-sidebar {
    display: flex;
    flex-direction: column;
  }
}
</style>
