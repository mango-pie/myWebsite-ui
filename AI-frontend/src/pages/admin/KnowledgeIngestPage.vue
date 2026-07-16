<script setup lang="ts">
/**
 * AI 精读 · 内容采集（V2：DeepSeek 搜索 + 合蒸一篇）
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import type { UploadProps } from 'ant-design-vue'
import {
  ingestKnowledgeBatchUrl,
  ingestKnowledgeFile,
  ingestKnowledgeUrl,
  searchKnowledgePreview,
} from '@/api/knowledge'
import {
  clearKnowledgeSearchDraft,
  loadKnowledgeSearchDraft,
  saveKnowledgeSearchDraft,
} from '@/composables/useKnowledgeSearchDraft'
import { isAllowedKbUploadFile, KB_UPLOAD_ACCEPT } from '@/utils/knowledgeFormat'
import {
  candidateHasRisk,
  formatIngestFailReason,
  formatSearchRiskFlag,
} from '@/utils/knowledgeSearchLabels'
import '@/assets/admin-theme.css'
import { Sparkles, Link2, Upload, Globe } from 'lucide-vue-next'

const BATCH_MAX = 8
const SELECT_HINT_MIN = 2
const SELECT_HINT_MAX = 5

const router = useRouter()
const activeTab = ref('url')
const submitting = ref(false)
const searchLoading = ref(false)
const batchLoading = ref(false)
/** 挂载恢复草稿期间跳过 watch 写回 */
const hydratingDraft = ref(true)
/** 本轮是否从 sessionStorage 恢复（用于提示） */
const draftRestored = ref(false)

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
const batchResult = ref<API.KnowledgeIngestBatchResultVO | null>(null)

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

function resetAgentDraftLocal() {
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
})

onBeforeUnmount(() => {
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
  batchLoading.value = true
  const hide = message.loading(
    `正在读取网页并重构精读（${unique.length} 个来源），可能需要数分钟…`,
    0,
  )
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
      batchResult.value = data
      draftRestored.value = false

      const used = data.usedCount ?? 0
      const fail = data.failCount ?? 0
      if (data.warning) {
        message.warning(data.warning, 5)
      }
      if (data.success && data.noteId != null) {
        if (fail > 0) {
          message.warning(`已合并生成 1 篇精读（采用 ${used} 源，失败 ${fail} 源）`, 4)
        } else {
          message.success(`已合并生成 1 篇精读（${used} 个来源）`)
        }
        for (const src of data.failedSources || []) {
          const code = src.reasonCode ? `[${formatIngestFailReason(src.reasonCode)}] ` : ''
          message.error(`来源失败：${src.url} — ${code}${src.errorMessage || '未知错误'}`, 4)
        }
        goDetail(data.noteId)
      } else {
        message.error(res.data.message || '合并精炼失败（全部来源失败）')
      }
    } else {
      message.error(res.data.message || '合并精炼失败')
    }
  } catch (e) {
    message.error(apiErrorMessage(e, '合并精炼超时或失败'))
  } finally {
    hide()
    batchLoading.value = false
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
        <router-link to="/admin/knowledge/notes">AI 精读工作台</router-link>
      </a-breadcrumb-item>
      <a-breadcrumb-item>内容采集</a-breadcrumb-item>
    </a-breadcrumb>

    <div class="admin-page-hero">
      <div class="hero-left">
        <div class="hero-title"><Sparkles :size="22" /> AI 精读工作台</div>
        <div class="hero-subtitle">
          学什么 → DeepSeek 找页 → 勾选合蒸成 <strong>1 篇</strong> → 预览后发博客 / 入库
        </div>
      </div>
      <div class="hero-extra">
        <a-space>
          <a-button @click="router.push('/admin/settings/reading')">精读设置</a-button>
          <a-button @click="router.push('/admin/settings/integration')">集成与密钥</a-button>
          <a-button type="primary" ghost @click="router.push('/admin/knowledge/notes')">
            查看精读列表 →
          </a-button>
        </a-space>
      </div>
    </div>

    <div class="ingest-tabs-wrapper">
      <a-card :bordered="false">
        <a-tabs v-model:activeKey="activeTab" class="admin-tabs-clean" size="large">
          <a-tab-pane key="url">
            <template #tab>URL 采集</template>
            <p class="tab-guide">粘贴网页文章链接，AI 抓取正文并生成结构化精读笔记</p>
            <div class="admin-form-card" style="max-width: 600px">
              <a-form :model="urlForm" layout="vertical" @submit.prevent>
                <a-form-item
                  label="文章 URL"
                  name="url"
                  :rules="[{ required: true, message: '请填写文章 URL' }]"
                >
                  <a-input
                    v-model:value="urlForm.url"
                    placeholder="https://example.com/article"
                    size="large"
                    allow-clear
                    @pressEnter="submitUrl('URL')"
                  />
                </a-form-item>
                <a-form-item label="标题（可选）" name="title">
                  <a-input
                    v-model:value="urlForm.title"
                    size="large"
                    placeholder="留空则自动提取"
                    allow-clear
                  />
                </a-form-item>
                <a-form-item label="标签（可选）" name="tags">
                  <a-input
                    v-model:value="urlForm.tags"
                    size="large"
                    placeholder="Spring, Java, 微服务"
                    allow-clear
                  />
                </a-form-item>
                <a-form-item style="margin-bottom: 0">
                  <a-button
                    type="primary"
                    size="large"
                    :loading="submitting"
                    block
                    @click="submitUrl('URL')"
                  >
                    开始精炼
                  </a-button>
                </a-form-item>
              </a-form>
            </div>
          </a-tab-pane>

          <a-tab-pane key="file">
            <template #tab>文件上传</template>
            <p class="tab-guide">上传 PDF / Word / TXT / Markdown，提取文本并生成精读笔记</p>
            <div class="admin-form-card" style="max-width: 600px">
              <a-form :model="fileForm" layout="vertical" @submit.prevent>
                <a-form-item label="选择本地文件" required>
                  <a-upload-dragger
                    :accept="KB_UPLOAD_ACCEPT"
                    :before-upload="beforeUpload"
                    :file-list="fileList"
                    :max-count="1"
                    class="admin-upload-dragger"
                    @remove="removeFile"
                  >
                    <div style="padding: 16px 0">
                      <p style="color: var(--color-text-secondary); margin: 0">
                        点击或拖拽文件到此处上传
                      </p>
                      <p class="hint" style="margin-top: 6px">
                        支持 PDF / DOCX / TXT / Markdown，单文件不超过 50MB
                      </p>
                    </div>
                  </a-upload-dragger>
                </a-form-item>
                <a-form-item label="标题（可选）" name="title">
                  <a-input
                    v-model:value="fileForm.title"
                    size="large"
                    placeholder="默认使用文件名"
                    allow-clear
                  />
                </a-form-item>
                <a-form-item label="标签（可选）" name="tags">
                  <a-input
                    v-model:value="fileForm.tags"
                    size="large"
                    placeholder="逗号分隔"
                    allow-clear
                  />
                </a-form-item>
                <a-form-item style="margin-bottom: 0">
                  <a-button
                    type="primary"
                    size="large"
                    :loading="submitting"
                    block
                    :disabled="!selectedFile"
                    @click="submitFile"
                  >
                    上传并精炼
                  </a-button>
                </a-form-item>
              </a-form>
            </div>
          </a-tab-pane>

          <a-tab-pane key="agent">
            <template #tab>AI 搜索</template>
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
                <a-form-item label="学习目标" required>
                  <a-input
                    v-model:value="agentForm.goal"
                    size="large"
                    placeholder="例如：我想学 Spring Security 6"
                    allow-clear
                    @pressEnter="searchCandidates"
                  />
                </a-form-item>
                <a-form-item label="偏好说明（可选）">
                  <a-input
                    v-model:value="agentForm.preference"
                    size="large"
                    placeholder="官方文档优先 / 偏实践 / 入门"
                    allow-clear
                  />
                </a-form-item>
                <a-form-item label="标签（可选，写入笔记）">
                  <a-input
                    v-model:value="agentForm.tags"
                    size="large"
                    placeholder="security, spring"
                    allow-clear
                  />
                </a-form-item>
                <a-form-item label="本次精读 Prompt（可选）">
                  <a-textarea
                    v-model:value="agentForm.distillPrompt"
                    :rows="4"
                    placeholder="留空则使用站点 reading.distill.system_prompt；填写后仅本次合蒸覆盖该结构提示"
                    allow-clear
                  />
                </a-form-item>
                <a-form-item style="margin-bottom: 0">
                  <a-space wrap>
                    <a-button
                      type="primary"
                      size="large"
                      :loading="searchLoading"
                      @click="searchCandidates"
                    >
                      搜索候选
                    </a-button>
                    <a-button
                      size="large"
                      :disabled="!selectedCount"
                      :loading="batchLoading"
                      @click="submitBatch"
                    >
                      合蒸一篇（已选 {{ selectedCount }} → 1 篇）
                    </a-button>
                    <a-button
                      v-if="searchDone || batchResult"
                      size="large"
                      @click="clearAgentDraft"
                    >
                      清空草稿
                    </a-button>
                  </a-space>
                </a-form-item>
              </a-form>
            </div>

            <a-card
              v-if="outline"
              title="学习大纲（不落库）"
              :bordered="false"
              size="small"
              style="max-width: 900px; margin-bottom: 16px"
            >
              <pre class="outline-box">{{ outline }}</pre>
            </a-card>

            <a-card
              v-if="searchDone"
              title="搜索候选"
              :bordered="false"
              size="small"
              style="max-width: 1100px; margin-bottom: 16px"
            >
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
                      <a-tag
                        v-for="flag in record.riskFlags"
                        :key="flag"
                        color="orange"
                        style="margin-bottom: 2px"
                      >
                        {{ formatSearchRiskFlag(flag) }}
                      </a-tag>
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
                <a-button style="margin-top: 8px" @click="appendManualCandidates">
                  追加到候选并勾选
                </a-button>
              </div>
            </a-card>

            <a-card
              v-if="batchResult"
              title="合蒸结果"
              :bordered="false"
              size="small"
              style="max-width: 1100px"
            >
              <p class="batch-summary">
                <template v-if="batchResult.success && batchResult.noteId != null">
                  已生成：{{ batchResult.title || `笔记 #${batchResult.noteId}` }}
                  · 请求 {{ batchResult.total ?? 0 }} 源 · 采用
                  {{ batchResult.usedCount ?? 0 }} · 失败 {{ batchResult.failCount ?? 0 }}
                </template>
                <template v-else>
                  合蒸失败 · 请求 {{ batchResult.total ?? 0 }} 源 · 失败
                  {{ batchResult.failCount ?? 0 }}
                </template>
              </p>

              <a-alert
                v-if="batchResult.warning"
                type="warning"
                show-icon
                style="margin-bottom: 12px"
                :message="batchResult.warning"
              />

              <a-space style="margin-bottom: 12px" wrap>
                <a-button
                  v-if="batchResult.success && batchResult.noteId != null"
                  type="primary"
                  @click="goDetail(batchResult.noteId)"
                >
                  打开精读笔记
                </a-button>
                <a-button
                  v-if="batchResult.success && batchResult.noteId != null"
                  @click="router.push(`/admin/knowledge/notes/${batchResult.noteId}?action=publish`)"
                >
                  去发博客
                </a-button>
                <a-button
                  v-if="batchResult.success && batchResult.noteId != null"
                  @click="router.push(`/admin/knowledge/notes/${batchResult.noteId}?action=index`)"
                >
                  去入知识库
                </a-button>
                <a-button
                  v-if="(batchResult.failedSources || []).length"
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

.hint {
  color: var(--color-text-muted);
  font-size: 12px;
}

.outline-box {
  max-height: 240px;
  overflow: auto;
  padding: 16px;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  white-space: pre-wrap;
  font-size: 14px;
  line-height: 1.7;
  margin: 0;
}

.manual-block {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

.result-section {
  margin-top: 12px;
}

.row-risk {
  /* ant table 行 class；风险候选略标橙底由 deep 样式兜底 */
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

:deep(.row-risk) > td {
  background: rgba(250, 173, 20, 0.08);
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
