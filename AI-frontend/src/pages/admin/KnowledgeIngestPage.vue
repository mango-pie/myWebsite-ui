<script setup lang="ts">
/**
 * AI 精读 · 内容采集（V2：DeepSeek 搜索 + 合蒸一篇）
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import type { UploadProps } from 'ant-design-vue'
import {
  getKnowledgeReadingJob,
  ingestKnowledgeBatchUrl,
  ingestKnowledgeFile,
  ingestKnowledgeUrl,
  searchKnowledgePreview,
} from '@/api/knowledge'
import {
  clearKnowledgeSearchDraft,
  isReadingJobInProgress,
  loadKnowledgeSearchDraft,
  readingJobProgressLabel,
  saveKnowledgeSearchDraft,
} from '@/composables/useKnowledgeSearchDraft'
import { recordReadingJob, updateReadingJob } from '@/composables/useReadingJobTracker'
import { isAllowedKbUploadFile, KB_UPLOAD_ACCEPT } from '@/utils/knowledgeFormat'
import {
  candidateHasRisk,
  formatIngestFailReason,
  formatSearchRiskFlag,
} from '@/utils/knowledgeSearchLabels'
import '@/assets/admin-theme.css'
import {
  Sparkles,
  Link2,
  Upload,
  UploadCloud,
  Globe,
  AlertTriangle,
  Settings,
  KeyRound,
  ListChecks,
  Search,
  Combine,
  Trash2,
  Plus,
  ListTree,
  Type,
  Tags,
  Target,
  SlidersHorizontal,
  FileText,
} from 'lucide-vue-next'
import IconAction from '@/components/ui/IconAction.vue'
import ReadingJobProgress from '@/components/knowledge/ReadingJobProgress.vue'

const BATCH_MAX = 8
const SELECT_HINT_MIN = 2
const SELECT_HINT_MAX = 5
const JOB_POLL_MS = 2000

const router = useRouter()
const activeTab = ref('url')
const submitting = ref(false)
const searchLoading = ref(false)
const batchLoading = ref(false)
/** 挂载恢复草稿期间跳过 watch 写回 */
const hydratingDraft = ref(true)
/** 本轮是否从 sessionStorage 恢复（用于提示） */
const draftRestored = ref(false)
/** 合蒸异步任务轮询 timer */
let jobPollTimer: ReturnType<typeof setInterval> | null = null

const urlForm = reactive({
  url: '',
  title: '',
  tags: '',
})

const fileForm = reactive({
  title: '',
  tags: '',
})
const fileList = ref<UploadProps['fileList']>([])
const selectedFile = ref<File | null>(null)

const agentForm = reactive({
  goal: '',
  preference: '',
  tags: '',
  manualUrls: '',
  distillPrompt: '',
})
const outline = ref('')
const candidates = ref<API.KnowledgeSearchCandidate[]>([])
const selectedUrls = ref<string[]>([])
const searchDone = ref(false)
const batchResult = ref<API.KnowledgeReadingJobVO | null>(null)

const batchJobInProgress = computed(() => isReadingJobInProgress(batchResult.value))
const batchProgressLabel = computed(() =>
  readingJobProgressLabel(batchResult.value?.progress),
)
const batchJobSucceeded = computed(() => {
  const data = batchResult.value
  if (!data || data.noteId == null) return false
  return (
    data.success === true || String(data.status || '').toUpperCase() === 'SUCCESS'
  )
})

function snapshotDraft() {
  return {
    goal: agentForm.goal,
    preference: agentForm.preference,
    tags: agentForm.tags,
    manualUrls: agentForm.manualUrls,
    distillPrompt: agentForm.distillPrompt,
    outline: outline.value,
    candidates: candidates.value,
    selectedUrls: selectedUrls.value,
    searchDone: searchDone.value,
    batchResult: batchResult.value,
    activeTab: activeTab.value,
  }
}

function persistDraftNow() {
  if (hydratingDraft.value) return
  saveKnowledgeSearchDraft(snapshotDraft())
}

function stopJobPoll() {
  if (jobPollTimer) {
    clearInterval(jobPollTimer)
    jobPollTimer = null
  }
}

function resetAgentDraftLocal() {
  stopJobPoll()
  agentForm.goal = ''
  agentForm.preference = ''
  agentForm.tags = ''
  agentForm.manualUrls = ''
  agentForm.distillPrompt = ''
  outline.value = ''
  candidates.value = []
  selectedUrls.value = []
  searchDone.value = false
  batchResult.value = null
  batchLoading.value = false
}

function clearAgentDraft() {
  clearKnowledgeSearchDraft()
  resetAgentDraftLocal()
  draftRestored.value = false
  message.success('已清空搜索草稿')
}

let persistTimer: ReturnType<typeof setTimeout> | null = null
function schedulePersistDraft() {
  if (hydratingDraft.value) return
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    persistDraftNow()
  }, 300)
}

watch(
  [
    () => agentForm.goal,
    () => agentForm.preference,
    () => agentForm.tags,
    () => agentForm.manualUrls,
    () => agentForm.distillPrompt,
    outline,
    candidates,
    selectedUrls,
    searchDone,
    batchResult,
    activeTab,
  ],
  () => {
    if (!searchDone.value && batchResult.value == null) return
    schedulePersistDraft()
  },
  { deep: true },
)

onMounted(() => {
  const draft = loadKnowledgeSearchDraft()
  if (draft) {
    agentForm.goal = draft.goal
    agentForm.preference = draft.preference
    agentForm.tags = draft.tags
    agentForm.manualUrls = draft.manualUrls
    agentForm.distillPrompt = draft.distillPrompt
    outline.value = draft.outline
    candidates.value = draft.candidates
    selectedUrls.value = draft.selectedUrls
    searchDone.value = draft.searchDone
    batchResult.value = draft.batchResult
    activeTab.value = 'agent'
    draftRestored.value = true
  }
  hydratingDraft.value = false
  if (isReadingJobInProgress(batchResult.value) && batchResult.value?.jobId != null) {
    startJobPoll(batchResult.value.jobId, { navigateOnSuccess: false })
  }
})

onBeforeUnmount(() => {
  stopJobPoll()
  if (persistTimer) {
    clearTimeout(persistTimer)
    persistTimer = null
  }
  if (!hydratingDraft.value) {
    persistDraftNow()
  }
})

const selectedCount = computed(() => selectedUrls.value.length)

const candidateRowSelection = computed(() => ({
  selectedRowKeys: selectedUrls.value,
  onChange: (keys: (string | number)[]) => {
    const urls = keys.map(String)
    if (urls.length > BATCH_MAX) {
      message.warning(`最多勾选 ${BATCH_MAX} 条（去重后上限）`)
      selectedUrls.value = urls.slice(0, BATCH_MAX)
      return
    }
    selectedUrls.value = urls
  },
  getCheckboxProps: (record: API.KnowledgeSearchCandidate) => ({
    disabled: !record.url,
  }),
}))

const candidateColumns = [
  { title: '标题', dataIndex: 'title', key: 'title', width: 180, ellipsis: true },
  { title: 'URL', dataIndex: 'url', key: 'url', ellipsis: true },
  { title: '摘要', dataIndex: 'summary', key: 'summary', ellipsis: true },
  { title: '来源', dataIndex: 'source', key: 'source', width: 90 },
  { title: '风险', key: 'risk', width: 140 },
  { title: '推荐理由', dataIndex: 'recommendReason', key: 'recommendReason', ellipsis: true },
]

const failedSourceColumns = [
  { title: '失败 URL', dataIndex: 'url', key: 'url', ellipsis: true },
  { title: '原因码', key: 'reasonCode', width: 120 },
  { title: '说明', dataIndex: 'errorMessage', key: 'errorMessage', ellipsis: true },
]

const usedSourceColumns = [
  { title: '采用标题', dataIndex: 'title', key: 'title', width: 220, ellipsis: true },
  { title: 'URL', dataIndex: 'url', key: 'url', ellipsis: true },
  { title: '材料字数', key: 'bodyChars', width: 100 },
]

const apiErrorMessage = (e: unknown, fallback: string) => {
  const err = e as {
    message?: string
    response?: { data?: { message?: string; code?: number } }
  }
  return err?.response?.data?.message || err?.message || fallback
}

const goDetail = (noteId?: number | string | null) => {
  if (noteId == null) {
    message.error('未返回精读 ID')
    return
  }
  router.push(`/admin/knowledge/notes/${noteId}`)
}

const submitUrl = async (sourceType: 'URL' | 'AGENT' = 'URL') => {
  if (!urlForm.url.trim()) {
    message.warning('请填写文章 URL')
    return
  }
  if (submitting.value) return
  submitting.value = true
  const hide = message.loading('正在抓取并精炼，可能需要一两分钟…', 0)
  try {
    const res = await ingestKnowledgeUrl({
      url: urlForm.url.trim(),
      title: urlForm.title.trim() || undefined,
      tags: urlForm.tags.trim() || undefined,
      sourceType,
    })
    if (res.data.code === 0 && res.data.data?.note?.id != null) {
      message.success('精炼完成')
      goDetail(res.data.data.note.id)
    } else {
      message.error(res.data.message || '精炼失败')
    }
  } catch (e) {
    message.error(apiErrorMessage(e, '精炼超时或失败'))
  } finally {
    hide()
    submitting.value = false
  }
}

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const check = isAllowedKbUploadFile(file as File)
  if (!check.ok) {
    message.error(check.message || '文件不符合要求')
    return false
  }
  selectedFile.value = file as File
  fileList.value = [
    {
      uid: String(Date.now()),
      name: file.name,
      status: 'done',
    },
  ]
  if (!fileForm.title) fileForm.title = file.name
  return false
}

const removeFile = () => {
  selectedFile.value = null
  fileList.value = []
}

const submitFile = async () => {
  if (!selectedFile.value) {
    message.warning('请先选择本地文件（PDF / DOCX / TXT / Markdown）')
    return
  }
  if (submitting.value) return
  submitting.value = true
  const hide = message.loading('正在上传并精炼，可能需要一两分钟…', 0)
  try {
    const res = await ingestKnowledgeFile(selectedFile.value, {
      title: fileForm.title.trim() || undefined,
      tags: fileForm.tags.trim() || undefined,
    })
    if (res.data.code === 0 && res.data.data?.note?.id != null) {
      message.success('精炼完成')
      goDetail(res.data.data.note.id)
    } else {
      message.error(res.data.message || '上传精炼失败')
    }
  } catch (e) {
    message.error(apiErrorMessage(e, '上传精炼超时或失败'))
  } finally {
    hide()
    submitting.value = false
  }
}

const selectedRiskyCount = computed(
  () =>
    candidates.value.filter(
      (c) => c.url && selectedUrls.value.includes(c.url) && candidateHasRisk(c),
    ).length,
)

/** 搜索候选（DeepSeek 联网默认；Tavily 备用） */
const searchCandidates = async () => {
  if (!agentForm.goal.trim()) {
    message.warning('请填写学习目标')
    return
  }
  searchLoading.value = true
  batchResult.value = null
  draftRestored.value = false
  try {
    const res = await searchKnowledgePreview({
      goal: agentForm.goal.trim(),
      preference: agentForm.preference.trim() || undefined,
    })
    if (res.data.code === 0 && res.data.data) {
      outline.value = res.data.data.outline || ''
      const list = (res.data.data.candidates || []).filter((c) => !!c.url)
      candidates.value = list
      // 默认勾选无风险标记的前若干条，避免一上来勾到课程/登录墙
      const safe = list.filter((c) => !candidateHasRisk(c)).map((c) => c.url!)
      selectedUrls.value = safe.slice(0, SELECT_HINT_MAX)
      searchDone.value = true
      if (!list.length) {
        message.warning(
          '未返回候选。请在集成设置配置 DeepSeek 官方 Key，并将 reading.search.provider 设为 deepseek；或改用手动粘贴 URL。',
        )
      } else {
        const risky = list.filter((c) => candidateHasRisk(c)).length
        message.success(
          `已找到 ${list.length} 条候选` +
            (risky ? `（其中 ${risky} 条带风险标记，默认未勾选）` : '') +
            '，请确认后合蒸',
        )
      }
    } else {
      message.error(res.data.message || '搜索候选失败')
    }
  } catch (e) {
    message.error(apiErrorMessage(e, '搜索候选失败（请检查 DeepSeek Key / 精读 search.provider）'))
  } finally {
    searchLoading.value = false
  }
}

/** 将手动粘贴 URL 追加进候选并勾选 */
const appendManualCandidates = () => {
  const lines = agentForm.manualUrls
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  if (!lines.length) {
    message.warning('请先粘贴至少一个 URL（每行一个）')
    return
  }
  const existing = new Set(candidates.value.map((c) => c.url).filter(Boolean) as string[])
  const added: API.KnowledgeSearchCandidate[] = []
  for (const url of lines) {
    if (existing.has(url)) continue
    existing.add(url)
    added.push({
      url,
      title: url,
      summary: '手动添加',
      source: 'manual',
      recommendReason: '手动粘贴',
    })
  }
  if (!added.length) {
    message.info('这些 URL 已在候选列表中')
    return
  }
  candidates.value = [...candidates.value, ...added]
  const nextKeys = [...selectedUrls.value]
  for (const c of added) {
    if (c.url && nextKeys.length < BATCH_MAX) nextKeys.push(c.url)
  }
  selectedUrls.value = nextKeys
  searchDone.value = true
  message.success(`已追加 ${added.length} 条`)
}

const applyJobSuccess = (data: API.KnowledgeReadingJobVO, navigate: boolean) => {
  batchResult.value = data
  draftRestored.value = false
  const used = data.usedCount ?? 0
  const fail = data.failCount ?? 0
  if (data.warning) {
    message.warning(data.warning, 5)
  }
  const ok =
    data.noteId != null &&
    (data.success === true || String(data.status || '').toUpperCase() === 'SUCCESS')
  if (ok) {
    if (fail > 0) {
      message.warning(`已合并生成 1 篇精读（采用 ${used} 源，失败 ${fail} 源）`, 4)
    } else {
      message.success(`已合并生成 1 篇精读（${used} 个来源）`)
    }
    for (const src of data.failedSources || []) {
      const code = src.reasonCode ? `[${formatIngestFailReason(src.reasonCode)}] ` : ''
      message.error(`来源失败：${src.url} — ${code}${src.errorMessage || '未知错误'}`, 4)
    }
    if (navigate) goDetail(data.noteId)
  } else {
    message.error(data.errorMsg || '合并精炼失败（全部来源失败）')
  }
}

const applyJobFailure = (data: API.KnowledgeReadingJobVO) => {
  batchResult.value = data
  draftRestored.value = false
  message.error(data.errorMsg || '合蒸任务失败')
}

/** 处理一次 job 快照：终态停轮询；进行中继续 */
const handleJobSnapshot = (
  data: API.KnowledgeReadingJobVO,
  opts: { navigateOnSuccess: boolean },
): 'continue' | 'done' => {
  batchResult.value = data
  if (data.jobId != null) {
    updateReadingJob(data.jobId, {
      status: data.status,
      progress: data.progress,
      noteId: data.noteId,
      success: data.success,
      errorMsg: data.errorMsg,
      title: data.title || undefined,
      total: data.total,
    })
  }
  const status = String(data.status || '').toUpperCase()

  if (status === 'SUCCESS' || (data.success && data.noteId != null && status !== 'FAILED')) {
    stopJobPoll()
    batchLoading.value = false
    applyJobSuccess(data, opts.navigateOnSuccess)
    return 'done'
  }
  if (status === 'FAILED') {
    stopJobPoll()
    batchLoading.value = false
    applyJobFailure(data)
    return 'done'
  }
  if (status === 'PENDING' || status === 'RUNNING' || isReadingJobInProgress(data)) {
    batchLoading.value = true
    return 'continue'
  }
  // 无明确 status 但已有 noteId（sync 兼容）
  if (data.noteId != null && data.success) {
    stopJobPoll()
    batchLoading.value = false
    applyJobSuccess(data, opts.navigateOnSuccess)
    return 'done'
  }
  return 'continue'
}

const pollJobOnce = async (jobId: number | string, opts: { navigateOnSuccess: boolean }) => {
  try {
    const res = await getKnowledgeReadingJob(jobId)
    if (res.data.code === 0 && res.data.data) {
      handleJobSnapshot(res.data.data, opts)
    } else {
      message.error(res.data.message || '查询合蒸任务失败')
    }
  } catch (e) {
    // 单次轮询失败不立刻终止，下一次再试；连续失败由用户看进度区
    console.warn(apiErrorMessage(e, '轮询合蒸任务失败'))
  }
}

const startJobPoll = (jobId: number | string, opts: { navigateOnSuccess: boolean }) => {
  stopJobPoll()
  batchLoading.value = true
  void pollJobOnce(jobId, opts)
  jobPollTimer = setInterval(() => {
    void pollJobOnce(jobId, opts)
  }, JOB_POLL_MS)
}

const runBatchIngest = async (urls: string[]) => {
  const unique = [...new Set(urls.map((u) => u.trim()).filter(Boolean))]
  if (!unique.length) {
    message.warning('请至少勾选一条候选')
    return
  }
  if (unique.length > BATCH_MAX) {
    message.warning(`最多 ${BATCH_MAX} 条，请减少勾选`)
    return
  }
  if (unique.length < SELECT_HINT_MIN || unique.length > SELECT_HINT_MAX) {
    message.info(`建议勾选 ${SELECT_HINT_MIN}～${SELECT_HINT_MAX} 条；当前 ${unique.length} 条，将合蒸为 1 篇精读`)
  }
  if (selectedRiskyCount.value > 0) {
    message.warning(
      `当前勾选含 ${selectedRiskyCount.value} 条风险来源（课程页/登录墙等），合蒸时可能被质量门拒绝`,
      4,
    )
  }
  stopJobPoll()
  batchLoading.value = true
  batchResult.value = null
  try {
    const res = await ingestKnowledgeBatchUrl({
      urls: unique,
      sourceType: 'AGENT',
      agentQuery: agentForm.goal.trim() || undefined,
      distillPrompt: agentForm.distillPrompt.trim() || undefined,
      tags: agentForm.tags.trim() || undefined,
    })
    if (res.data.code === 0 && res.data.data) {
      const data = res.data.data
      if (data.jobId != null) {
        recordReadingJob({
          jobId: data.jobId,
          title: agentForm.goal.trim() || data.title || `任务 #${data.jobId}`,
          total: data.total ?? unique.length,
          status: data.status,
          progress: data.progress,
          noteId: data.noteId,
          success: data.success,
        })
      }
      const outcome = handleJobSnapshot(data, { navigateOnSuccess: true })
      if (outcome === 'continue' && data.jobId != null) {
        startJobPoll(data.jobId, { navigateOnSuccess: true })
      } else if (outcome === 'continue' && data.jobId == null) {
        batchLoading.value = false
        message.error('未返回任务 ID，无法跟踪合蒸进度')
      }
    } else {
      batchLoading.value = false
      message.error(res.data.message || '合并精炼失败')
    }
  } catch (e) {
    batchLoading.value = false
    message.error(apiErrorMessage(e, '合并精炼超时或失败'))
  }
}

const submitBatch = () => runBatchIngest(selectedUrls.value)

/** 去掉失败源后按当前勾选重新合并 */
const retryMergeWithoutFailed = () => {
  const failed = new Set(
    (batchResult.value?.failedSources || []).map((s) => s.url).filter(Boolean) as string[],
  )
  const next = selectedUrls.value.filter((u) => !failed.has(u))
  if (!next.length) {
    message.warning('没有可合并的成功候选，请重新勾选')
    return
  }
  selectedUrls.value = next
  runBatchIngest(next)
}
</script>

<template>
  <div class="kb-ingest-page admin-theme-page">
    <a-breadcrumb class="admin-breadcrumb">
      <a-breadcrumb-item>
        <router-link to="/admin/knowledge/notes">AI 精读</router-link>
      </a-breadcrumb-item>
      <a-breadcrumb-item>内容采集</a-breadcrumb-item>
    </a-breadcrumb>

    <div class="admin-page-hero">
      <div class="hero-left">
        <div class="hero-title"><Sparkles :size="22" /> AI 精读</div>
        <div class="hero-subtitle">
          学什么 → DeepSeek 找页 → 勾选合蒸成 <strong>1 篇</strong> → 预览后发博客 / 入库
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
            :icon="KeyRound"
            label="集成与密钥"
            variant="soft"
            @click="router.push('/admin/settings/integration')"
          />
          <IconAction
            :icon="ListChecks"
            label="查看精读列表"
            variant="primary"
            motion="slide"
            @click="router.push('/admin/knowledge/notes')"
          />
        </a-space>
      </div>
    </div>

    <div class="ingest-tabs-wrapper">
      <a-card :bordered="false">
        <a-tabs v-model:activeKey="activeTab" class="admin-tabs-clean" size="large">
          <a-tab-pane key="url">
            <template #tab><span class="tab-label"><Link2 :size="16" /> URL 采集</span></template>
            <p class="tab-guide">粘贴网页文章链接，AI 抓取正文并生成结构化精读笔记</p>
            <div class="admin-form-card" style="max-width: 720px">
              <a-form :model="urlForm" layout="vertical" @submit.prevent>
                <a-form-item
                  name="url"
                  class="ingest-focal"
                  :rules="[{ required: true, message: '请填写文章 URL' }]"
                >
                  <template #label>
                    <span class="icon-label"><Link2 :size="15" /> 文章 URL</span>
                  </template>
                  <a-input
                    v-model:value="urlForm.url"
                    placeholder="https://example.com/article"
                    size="large"
                    allow-clear
                    @pressEnter="submitUrl('URL')"
                  >
                    <template #prefix>
                      <Globe :size="16" class="input-prefix-icon" />
                    </template>
                  </a-input>
                </a-form-item>
                <div class="field-grid">
                  <a-form-item name="title">
                    <template #label>
                      <span class="icon-label"><Type :size="15" /> 标题（可选）</span>
                    </template>
                    <a-input
                      v-model:value="urlForm.title"
                      size="large"
                      placeholder="留空则自动提取"
                      allow-clear
                    >
                      <template #prefix>
                        <Type :size="16" class="input-prefix-icon" />
                      </template>
                    </a-input>
                  </a-form-item>
                  <a-form-item name="tags">
                    <template #label>
                      <span class="icon-label"><Tags :size="15" /> 标签（可选）</span>
                    </template>
                    <a-input
                      v-model:value="urlForm.tags"
                      size="large"
                      placeholder="Spring, Java, 微服务"
                      allow-clear
                    >
                      <template #prefix>
                        <Tags :size="16" class="input-prefix-icon" />
                      </template>
                    </a-input>
                  </a-form-item>
                </div>
                <a-form-item style="margin-bottom: 0">
                  <IconAction
                    :icon="Sparkles"
                    label="开始精炼"
                    variant="primary"
                    size="lg"
                    block
                    motion="send"
                    :loading="submitting"
                    @click="submitUrl('URL')"
                  />
                </a-form-item>
              </a-form>
            </div>
          </a-tab-pane>

          <a-tab-pane key="file">
            <template #tab><span class="tab-label"><Upload :size="16" /> 文件上传</span></template>
            <p class="tab-guide">上传 PDF / Word / TXT / Markdown，提取文本并生成精读笔记</p>
            <div class="admin-form-card" style="max-width: 720px">
              <a-form :model="fileForm" layout="vertical" @submit.prevent>
                <a-form-item required>
                  <template #label>
                    <span class="icon-label"><UploadCloud :size="15" /> 选择本地文件</span>
                  </template>
                  <a-upload-dragger
                    :accept="KB_UPLOAD_ACCEPT"
                    :before-upload="beforeUpload"
                    :file-list="fileList"
                    :max-count="1"
                    class="admin-upload-dragger kb-dragger"
                    @remove="removeFile"
                  >
                    <div class="kb-dragger__inner">
                      <span class="kb-dragger__icon"><UploadCloud :size="30" :stroke-width="1.8" /></span>
                      <p class="kb-dragger__title">点击或拖拽文件到此处上传</p>
                      <p class="kb-dragger__hint">
                        支持 PDF / DOCX / TXT / Markdown，单文件不超过 50MB
                      </p>
                    </div>
                  </a-upload-dragger>
                </a-form-item>
                <div class="field-grid">
                  <a-form-item name="title">
                    <template #label>
                      <span class="icon-label"><Type :size="15" /> 标题（可选）</span>
                    </template>
                    <a-input
                      v-model:value="fileForm.title"
                      size="large"
                      placeholder="默认使用文件名"
                      allow-clear
                    >
                      <template #prefix>
                        <Type :size="16" class="input-prefix-icon" />
                      </template>
                    </a-input>
                  </a-form-item>
                  <a-form-item name="tags">
                    <template #label>
                      <span class="icon-label"><Tags :size="15" /> 标签（可选）</span>
                    </template>
                    <a-input
                      v-model:value="fileForm.tags"
                      size="large"
                      placeholder="逗号分隔"
                      allow-clear
                    >
                      <template #prefix>
                        <Tags :size="16" class="input-prefix-icon" />
                      </template>
                    </a-input>
                  </a-form-item>
                </div>
                <a-form-item style="margin-bottom: 0">
                  <IconAction
                    :icon="Upload"
                    label="上传并精炼"
                    variant="primary"
                    size="lg"
                    block
                    motion="pop"
                    :loading="submitting"
                    :disabled="!selectedFile"
                    @click="submitFile"
                  />
                </a-form-item>
              </a-form>
            </div>
          </a-tab-pane>

          <a-tab-pane key="agent">
            <template #tab><span class="tab-label"><Sparkles :size="16" /> AI 搜索</span></template>
            <p class="tab-guide">
              告诉 AI 学什么 → DeepSeek 联网找页 → 勾选 → 合蒸成 <strong>1 篇</strong> → 预览后发博客/入库
            </p>

            <a-alert
              v-if="draftRestored"
              type="success"
              show-icon
              style="margin-bottom: 16px; max-width: 900px"
              message="已恢复本标签页的搜索草稿"
              description="切换页面不会丢失候选与勾选；完成后可点「清空草稿」。关闭标签页后草稿会清除。"
            />

            <a-alert
              type="info"
              show-icon
              style="margin-bottom: 16px; max-width: 900px"
              message="V2：DeepSeek 联网搜索 + 合蒸一篇"
            >
              <template #description>
                默认
                <code>reading.search.provider=deepseek</code>
                ，需在
                <router-link to="/admin/settings/integration">集成与密钥</router-link>
                配置 <strong>DeepSeek 官方 Key</strong>（与知识库 DashScope/AI Key 分开）。
                搜索阶段用 search-model（默认 flash）只找 URL；勾选后读页/重构用 reading-model 与 distill-model（默认 pro，由后端 YAML 配置）。
                带风险标记的候选默认不勾选。最终精读结构可用下方「本次精读 Prompt」覆盖，或改
                <router-link to="/admin/settings/reading">精读设置</router-link>
                的
                <code>distill.system_prompt</code>
                。
              </template>
            </a-alert>

            <div class="admin-form-card" style="max-width: 720px; margin-bottom: 16px">
              <a-form layout="vertical" @submit.prevent>
                <a-form-item required class="ingest-focal">
                  <template #label>
                    <span class="icon-label"><Target :size="15" /> 学习目标</span>
                  </template>
                  <a-input
                    v-model:value="agentForm.goal"
                    size="large"
                    placeholder="例如：我想学 Spring Security 6"
                    allow-clear
                    @pressEnter="searchCandidates"
                  >
                    <template #prefix>
                      <Target :size="16" class="input-prefix-icon" />
                    </template>
                  </a-input>
                </a-form-item>
                <div class="field-grid">
                  <a-form-item>
                    <template #label>
                      <span class="icon-label"><SlidersHorizontal :size="15" /> 偏好说明（可选）</span>
                    </template>
                    <a-input
                      v-model:value="agentForm.preference"
                      size="large"
                      placeholder="官方文档优先 / 偏实践 / 入门"
                      allow-clear
                    >
                      <template #prefix>
                        <SlidersHorizontal :size="16" class="input-prefix-icon" />
                      </template>
                    </a-input>
                  </a-form-item>
                  <a-form-item>
                    <template #label>
                      <span class="icon-label"><Tags :size="15" /> 标签（可选，写入笔记）</span>
                    </template>
                    <a-input
                      v-model:value="agentForm.tags"
                      size="large"
                      placeholder="security, spring"
                      allow-clear
                    >
                      <template #prefix>
                        <Tags :size="16" class="input-prefix-icon" />
                      </template>
                    </a-input>
                  </a-form-item>
                </div>
                <a-form-item>
                  <template #label>
                    <span class="icon-label"><FileText :size="15" /> 本次精读 Prompt（可选）</span>
                  </template>
                  <a-textarea
                    v-model:value="agentForm.distillPrompt"
                    :rows="4"
                    placeholder="留空则使用站点 reading.distill.system_prompt；填写后仅本次合蒸覆盖该结构提示"
                    allow-clear
                  />
                </a-form-item>
                <a-form-item style="margin-bottom: 0">
                  <a-space wrap>
                    <IconAction
                      :icon="Search"
                      label="搜索候选"
                      variant="primary"
                      size="lg"
                      motion="slide"
                      :loading="searchLoading"
                      @click="searchCandidates"
                    />
                    <IconAction
                      :icon="Combine"
                      :label="`合蒸一篇（已选 ${selectedCount} → 1 篇）`"
                      variant="soft"
                      size="lg"
                      motion="pop"
                      :disabled="!selectedCount || batchJobInProgress"
                      :loading="batchLoading"
                      @click="submitBatch"
                    />
                    <IconAction
                      v-if="searchDone || batchResult"
                      :icon="Trash2"
                      label="清空草稿"
                      variant="ghost"
                      size="lg"
                      motion="shake"
                      @click="clearAgentDraft"
                    />
                  </a-space>
                </a-form-item>
              </a-form>
            </div>

            <a-card
              v-if="outline"
              :bordered="false"
              size="small"
              class="kb-result-card"
              style="max-width: 900px; margin-bottom: 16px"
            >
              <template #title>
                <span class="kb-card-title"><ListTree :size="16" /> 学习大纲（不落库）</span>
              </template>
              <pre class="outline-box">{{ outline }}</pre>
            </a-card>

            <a-card
              v-if="searchDone"
              :bordered="false"
              size="small"
              class="kb-result-card"
              style="max-width: 1100px; margin-bottom: 16px"
            >
              <template #title>
                <span class="kb-card-title"><Search :size="16" /> 搜索候选</span>
              </template>
              <template #extra>
                <span class="hint">最多勾选 {{ BATCH_MAX }} 条；建议 {{ SELECT_HINT_MIN }}～{{ SELECT_HINT_MAX }} 条</span>
              </template>

              <a-empty
                v-if="!candidates.length"
                description="暂无候选，请配置 DeepSeek Key 或在下方手动粘贴 URL"
              />
              <a-table
                v-else
                row-key="url"
                size="small"
                :pagination="false"
                :data-source="candidates"
                :columns="candidateColumns"
                :row-selection="candidateRowSelection"
                :row-class-name="(record: API.KnowledgeSearchCandidate) => (candidateHasRisk(record) ? 'row-risk' : '')"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'source'">
                    {{ record.source || '—' }}
                  </template>
                  <template v-else-if="column.key === 'risk'">
                    <template v-if="record.riskFlags?.length">
                      <span class="risk-flags">
                        <AlertTriangle :size="14" class="risk-flags__icon" />
                        <a-tag
                          v-for="flag in record.riskFlags"
                          :key="flag"
                          color="orange"
                          style="margin-bottom: 2px"
                        >
                          {{ formatSearchRiskFlag(flag) }}
                        </a-tag>
                      </span>
                    </template>
                    <span v-else class="hint">—</span>
                  </template>
                  <template v-else-if="column.key === 'url'">
                    <a :href="record.url" target="_blank" rel="noopener noreferrer">
                      {{ record.url }}
                    </a>
                  </template>
                </template>
              </a-table>

              <div class="manual-block">
                <div class="manual-title">手动追加 URL（每行一个）</div>
                <a-textarea
                  v-model:value="agentForm.manualUrls"
                  :rows="3"
                  placeholder="https://docs.spring.io/...&#10;https://..."
                />
                <IconAction
                  :icon="Plus"
                  label="追加到候选并勾选"
                  variant="soft"
                  motion="pop"
                  style="margin-top: 8px"
                  @click="appendManualCandidates"
                />
              </div>
            </a-card>

            <a-card
              v-if="batchResult || batchLoading"
              title="合蒸结果"
              :bordered="false"
              size="small"
              style="max-width: 1100px"
            >
              <div
                v-if="batchJobInProgress || (batchLoading && !batchResult?.status)"
                class="ingest-progress"
              >
                <ReadingJobProgress
                  :status="batchResult?.status"
                  :progress="batchResult?.progress"
                  :size="76"
                />
                <div class="ingest-progress__info">
                  <div class="ingest-progress__label">{{ batchProgressLabel }}</div>
                  <div class="ingest-progress__sub">
                    <template v-if="batchResult?.jobId != null">
                      任务 #{{ batchResult.jobId }} · 每 2 秒刷新进度，可离开本页后回来继续查看
                    </template>
                    <template v-else>正在提交合蒸任务…</template>
                  </div>
                </div>
              </div>

              <template v-if="batchResult">
                <p class="batch-summary">
                  <template v-if="batchJobInProgress">
                    {{ batchProgressLabel }}
                    · 请求 {{ batchResult.total ?? 0 }} 源
                    <template v-if="batchResult.jobId != null"> · 任务 #{{ batchResult.jobId }}</template>
                  </template>
                  <template v-else-if="batchJobSucceeded">
                    已生成：{{ batchResult.title || `笔记 #${batchResult.noteId}` }}
                    · 请求 {{ batchResult.total ?? 0 }} 源 · 采用
                    {{ batchResult.usedCount ?? 0 }} · 失败 {{ batchResult.failCount ?? 0 }}
                  </template>
                  <template v-else-if="String(batchResult.status || '').toUpperCase() === 'FAILED'">
                    合蒸失败
                    <template v-if="batchResult.errorMsg">：{{ batchResult.errorMsg }}</template>
                    · 请求 {{ batchResult.total ?? 0 }} 源
                  </template>
                  <template v-else>
                    合蒸失败 · 请求 {{ batchResult.total ?? 0 }} 源 · 失败
                    {{ batchResult.failCount ?? 0 }}
                    <template v-if="batchResult.errorMsg"> · {{ batchResult.errorMsg }}</template>
                  </template>
                </p>

                <a-alert
                  v-if="batchResult.warning"
                  type="warning"
                  show-icon
                  style="margin-bottom: 12px"
                  :message="batchResult.warning"
                />

                <a-alert
                  v-if="
                    !batchJobInProgress &&
                    String(batchResult.status || '').toUpperCase() === 'FAILED' &&
                    batchResult.errorMsg
                  "
                  type="error"
                  show-icon
                  style="margin-bottom: 12px"
                  :message="batchResult.errorMsg"
                />

                <a-space style="margin-bottom: 12px" wrap>
                  <a-button
                    v-if="batchJobSucceeded"
                    type="primary"
                    @click="goDetail(batchResult.noteId)"
                  >
                    打开精读笔记
                  </a-button>
                  <a-button
                    v-if="batchJobSucceeded"
                    @click="router.push(`/admin/knowledge/notes/${batchResult.noteId}?action=publish`)"
                  >
                    去发博客
                  </a-button>
                  <a-button
                    v-if="batchJobSucceeded"
                    @click="router.push(`/admin/knowledge/notes/${batchResult.noteId}?action=index`)"
                  >
                    去入知识库
                  </a-button>
                  <a-button
                    v-if="(batchResult.failedSources || []).length && !batchJobInProgress"
                    :loading="batchLoading"
                    @click="retryMergeWithoutFailed"
                  >
                    去掉失败源后重新合蒸
                  </a-button>
                  <a-button
                    type="link"
                    @click="router.push('/admin/knowledge/notes?sourceType=AGENT')"
                  >
                    查看 AI 搜索来源列表
                  </a-button>
                </a-space>

                <div
                  v-if="(batchResult.usedSources || []).length"
                  class="result-section"
                >
                  <div class="manual-title">采用来源</div>
                  <a-table
                    row-key="url"
                    size="small"
                    :pagination="false"
                    :data-source="batchResult.usedSources || []"
                    :columns="usedSourceColumns"
                  >
                    <template #bodyCell="{ column, record }">
                      <template v-if="column.key === 'bodyChars'">
                        {{ record.bodyChars != null ? record.bodyChars : '—' }}
                      </template>
                    </template>
                  </a-table>
                </div>

                <div
                  v-if="(batchResult.failedSources || []).length"
                  class="result-section"
                >
                  <div class="manual-title">失败来源（质量门 / 抓取）</div>
                  <a-table
                    row-key="url"
                    size="small"
                    :pagination="false"
                    :data-source="batchResult.failedSources || []"
                    :columns="failedSourceColumns"
                  >
                    <template #bodyCell="{ column, record }">
                      <template v-if="column.key === 'reasonCode'">
                        <a-tag color="red">{{ formatIngestFailReason(record.reasonCode) }}</a-tag>
                      </template>
                      <template v-else-if="column.key === 'errorMessage'">
                        <span class="err">{{ record.errorMessage || '未知错误' }}</span>
                      </template>
                    </template>
                  </a-table>
                </div>
              </template>
            </a-card>
          </a-tab-pane>
        </a-tabs>
      </a-card>
    </div>
  </div>
</template>

<style scoped>
.tab-guide {
  color: var(--color-text-secondary);
  font-size: 14px;
  margin: 0 0 20px;
  line-height: 1.6;
}

/* 副字段两列并排（窄屏回落单列） */
.field-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 20px;
}
@media (max-width: 640px) {
  .field-grid {
    grid-template-columns: 1fr;
  }
}

/* 主输入焦点框：轻 tint 背景 + 圆角，聚焦时高亮 */
.ingest-focal {
  padding: 14px 16px 4px;
  margin-bottom: 20px;
  background: var(--color-primary-08);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}
.ingest-focal:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-12);
}

/* 字段标签图标 */
.icon-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.icon-label :deep(svg) {
  color: var(--color-text-muted);
}
@media (prefers-reduced-motion: reduce) {
  .ingest-focal {
    transition: none;
  }
}

.hint {
  color: var(--color-text-muted);
  font-size: 12px;
}

.outline-box {
  position: relative;
  max-height: 240px;
  overflow: auto;
  padding: 16px 16px 16px 20px;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--color-primary);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  white-space: pre-wrap;
  font-size: 14px;
  line-height: 1.7;
  margin: 0;
}

/* Tab 标签图标 */
.tab-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* 输入框前缀图标 */
.input-prefix-icon {
  color: var(--color-text-muted);
}

/* 上传拖拽区 */
.kb-dragger__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 0;
}
.kb-dragger__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  margin-bottom: 4px;
  border-radius: 50%;
  background: var(--color-primary-12);
  color: var(--color-primary-light);
  transition:
    transform var(--transition-fast),
    background var(--transition-fast);
}
.kb-dragger__title {
  margin: 0;
  font-size: 15px;
  color: var(--color-text-primary);
}
.kb-dragger__hint {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-muted);
}
.kb-ingest-page :deep(.kb-dragger .ant-upload-drag) {
  transition:
    border-color var(--transition-fast),
    background var(--transition-fast);
}
.kb-ingest-page :deep(.kb-dragger .ant-upload-drag:hover) {
  border-color: var(--color-primary) !important;
  background: var(--color-primary-08);
}
.kb-ingest-page :deep(.kb-dragger .ant-upload-drag:hover) .kb-dragger__icon {
  transform: translateY(-2px) scale(1.05);
  background: var(--color-primary-20);
}

/* 结果卡片 */
.kb-card-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.kb-result-card {
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}
.kb-result-card:hover {
  box-shadow: var(--shadow-glow);
}

@media (prefers-reduced-motion: reduce) {
  .kb-dragger__icon,
  .kb-ingest-page :deep(.kb-dragger .ant-upload-drag:hover) .kb-dragger__icon {
    transform: none !important;
    transition: none;
  }
}

.manual-block {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

.result-section {
  margin-top: 12px;
}

.manual-title {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.batch-summary {
  margin: 0 0 12px;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.err {
  color: #cf1322;
  font-size: 13px;
}

/* 风险行：左侧色带 + 极浅底，比整行橙底更清晰 */
:deep(.row-risk) > td {
  background: rgba(245, 158, 11, 0.05);
}
:deep(.row-risk) > td:first-child {
  box-shadow: inset 3px 0 0 var(--color-warning);
}

.risk-flags {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}
.risk-flags__icon {
  color: var(--color-warning);
  flex-shrink: 0;
}

.ingest-progress {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 16px;
  padding: 16px 18px;
  border: 1px solid var(--color-primary-20);
  border-radius: var(--radius-md);
  background: linear-gradient(
    100deg,
    var(--color-primary-08) 0%,
    var(--color-bg-surface) 70%
  );
}
.ingest-progress__label {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}
.ingest-progress__sub {
  font-size: 12px;
  color: var(--color-text-muted);
}

.ingest-tabs-wrapper :deep(.ant-tabs-content-holder) {
  animation: tabFadeIn var(--transition-normal);
}

@keyframes tabFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
