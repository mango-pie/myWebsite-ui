<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Modal } from 'ant-design-vue'
import { message } from 'ant-design-vue'
import { Plus, FolderTree, Share2, Paperclip, Pencil } from 'lucide-vue-next'
import type { GateResponse } from '@/api/learning.types'
import type { LearningBranchTreeNode, LearningLeafVO, AttachRequest } from '@/api/learning.types'
import * as learningKnowledgeApi from '@/api/knowledge'
import DomainTree from './DomainTree.vue'
import ContentPanel from './ContentPanel.vue'
import AttachConfirm from './AttachConfirm.vue'
import ReattachNotesModal from './ReattachNotesModal.vue'
import TreeVizOverlay from './TreeVizOverlay.vue'
import IconAction from '@/components/ui/IconAction.vue'
import { useLearningWorkbenchStore } from '@/stores/learning-workbench.store'

import '@/assets/admin-theme.css'
import '@/assets/learning-tokens.css'
import './learning-view.css'

const router = useRouter()
const store = useLearningWorkbenchStore()

const createL1Trigger = ref(false)

// ── computed bindings ──
const currentDomainId = computed({
  get: () => store.currentDomainId,
  set: (v: number | string | null) => store.setCurrentDomainId(v),
})

const domainSelectOptions = computed(() =>
  store.domains.map((d) => ({ value: d.id, label: d.name })),
)

const currentDomainName = computed(() => store.currentDomainName)
const treeLoading = computed(() => store.treeLoading)
const branches = computed<LearningBranchTreeNode[]>(() => store.branches)
const snapshotTruncated = computed(() => store.snapshotTruncated)
const snapshotMessage = computed(() => store.snapshotMessage)

const selectedBranchId = computed(() => store.selectedBranchId)
const selectedBranchTitle = computed(() => store.selectedBranchTitle)

const selectedBranchPath = computed(() => {
  const b = store.selectedBranch
  return b?.path || b?.title || ''
})

const leavesLoading = computed(() => store.leavesLoading)
const branchLeaves = computed<LearningLeafVO[]>(() => store.branchLeaves)

const gateLoading = computed(() => store.gateLoading)
const gateResult = computed<GateResponse | null>(() => store.gateResult)
const gateError = computed(() => store.gateError)
const searchBlocked = computed(() => store.searchBlocked)
const v2Phase = computed(() => store.v2Phase)
const skipGateContext = computed(() => store.skipGateContext)

const attachVisible = computed(() => store.attachVisible)
const attachSubmitting = computed(() => store.attachSubmitting)
const pendingAttach = computed(() => store.pendingAttach)

// ── local modal state ──
const createDomainVisible = ref(false)
const createDomainName = ref('')
const createDomainSubmitting = ref(false)

const reattachOpen = ref(false)
const treeEditMode = ref(false)
const treeVizOpen = ref(false)

const mergeVisible = ref(false)
const mergeSourceId = ref<number | string | null>(null)
const mergeTargetId = ref<number | string | null>(null)
const mergeSubmitting = ref(false)

// ── handlers ──
function onSelectBranch(branchId: number | string | null) {
  store.selectedBranchId = branchId
}

function onLearnEmpty(payload: { branchId: number | string; branchTitle: string }) {
  store.setSkipGateContext(payload.branchId, payload.branchTitle)
  store.gateResult = null
}

async function onGateSubmit(question: string) {
  return store.submitGate(question)
}

async function onGateReSubmit(question: string) {
  return store.submitGate(question)
}

async function onConfirmBranch(payload: { title: string; parentBranchId: number | string }) {
  try {
    await store.confirmBranch(payload)
    message.success(`已创建枝「${payload.title}」`)
  } catch (e) {
    message.error(String((e as Error)?.message || '建枝失败'))
  }
}

function onOpenNote(noteId: number | string) {
  router.push(`/admin/knowledge/notes/${noteId}`)
}

async function onDetachLeaf(noteId: number | string) {
  Modal.confirm({
    title: '取消挂载',
    content: '仅解除树上挂载，不会删除精读笔记。确定？',
    okText: '取消挂载',
    cancelText: '返回',
    async onOk() {
      try {
        await store.detachLeaf(noteId)
        message.success('已取消挂载')
      } catch (e) {
        message.error(String((e as Error)?.message || '取消挂载失败'))
        return Promise.reject(e)
      }
    },
  })
}

async function onMoveLeaf(noteId: number | string, targetBranchId: number | string) {
  try {
    await store.moveLeaf(noteId, targetBranchId)
    message.success('已移叶')
  } catch (e) {
    message.error(String((e as Error)?.message || '移叶失败'))
  }
}

async function onRenameBranch(branchId: number | string, title: string) {
  try {
    await store.renameBranch(branchId, title)
    message.success('已改名')
  } catch (e) {
    message.error(String((e as Error)?.message || '改名失败'))
  }
}

async function onDeleteBranch(branchId: number | string) {
  const branch = store.branches.find((b) => String(b.id) === String(branchId))
  if (!branch) return
  if (branch.leafCount > 0) {
    message.warning('有叶枝不可删，请先移叶或取消挂载')
    return
  }
  Modal.confirm({
    title: '删除空枝',
    content: `确定删除枝「${branch.title}」？`,
    okText: '删除',
    okType: 'danger',
    async onOk() {
      try {
        await store.deleteBranch(branchId)
        message.success('已删除')
      } catch (e) {
        message.error(String((e as Error)?.message || '删除失败'))
        return Promise.reject(e)
      }
    },
  })
}

function onMergeBranch(sourceBranchId: number | string) {
  mergeSourceId.value = sourceBranchId
  mergeTargetId.value = branches.value.filter((b) => String(b.id) !== String(sourceBranchId))[0]?.id ?? null
  mergeVisible.value = true
}

async function submitMergeBranch() {
  if (mergeSourceId.value == null || mergeTargetId.value == null) {
    message.warning('请选择目标枝')
    return Promise.reject(new Error('no target'))
  }
  mergeSubmitting.value = true
  try {
    await store.mergeBranch(mergeSourceId.value, mergeTargetId.value)
    mergeVisible.value = false
    message.success('已合并')
  } catch (e) {
    message.error(String((e as Error)?.message || '合并失败'))
    return Promise.reject(e)
  } finally {
    mergeSubmitting.value = false
  }
}

async function onCreateL1Branch(title: string) {
  try {
    await store.confirmBranch({ title, parentBranchId: 0 })
    message.success(`已创建「${title}」`)
  } catch (e) {
    message.error(String((e as Error)?.message || '建枝失败'))
  }
}

async function onCreateL2Branch(parentBranchId: number | string, title: string) {
  try {
    await store.confirmBranch({ title, parentBranchId })
    message.success(`已创建「${title}」`)
  } catch (e) {
    message.error(String((e as Error)?.message || '建枝失败'))
  }
}

// ── domain CRUD ──
function onCreateDomain() {
  createDomainName.value = ''
  createDomainVisible.value = true
}

async function submitCreateDomain() {
  const name = createDomainName.value.trim()
  if (!name) {
    message.warning('请填写领域名称，例如 Java')
    return Promise.reject(new Error('empty name'))
  }
  createDomainSubmitting.value = true
  try {
    await store.createDomain(name)
    createDomainVisible.value = false
    createDomainName.value = ''
    message.success(`已创建领域「${name}」`)
  } catch (e) {
    message.error(String((e as Error)?.message || '创建领域失败'))
    return Promise.reject(e)
  } finally {
    createDomainSubmitting.value = false
  }
}

// ── reattach ──
function onOpenReattach() {
  if (!store.currentDomainId) {
    message.warning('请先选择领域')
    return
  }
  reattachOpen.value = true
}

async function onReattachDone() {
  if (store.currentDomainId) {
    await store.loadTree(store.currentDomainId)
    if (store.selectedBranchId) await store.loadLeaves(store.selectedBranchId)
  }
}

// ── V2 batch-url pipeline ──
const JOB_POLL_MS = 2000
let jobPollTimer: ReturnType<typeof setInterval> | null = null
let currentJobId: string | number | null = null

function stopJobPoll() {
  if (jobPollTimer) {
    clearInterval(jobPollTimer)
    jobPollTimer = null
  }
  currentJobId = null
}

function normalizeStatus(data: API.KnowledgeReadingJobVO) {
  return String(data.status || '').toUpperCase()
}

function isJobSuccess(data: API.KnowledgeReadingJobVO) {
  const status = normalizeStatus(data)
  return status === 'SUCCESS' || (data.success === true && data.noteId != null && status !== 'FAILED')
}

function isJobFailed(data: API.KnowledgeReadingJobVO) {
  const status = normalizeStatus(data)
  return status === 'FAILED' || data.success === false
}

async function pollJobOnce(jobId: number | string, goalTitle: string) {
  try {
    const res = await learningKnowledgeApi.getKnowledgeReadingJob(jobId)
    if (res.data.code !== 0 || !res.data.data) return
    const data = res.data.data as API.KnowledgeReadingJobVO

    if (isJobSuccess(data)) {
      stopJobPoll()
      store.v2Phase = 'idle'
      const noteId = data.noteId
      if (noteId == null) {
        message.error('合并成功但未返回 noteId')
        return
      }
      store.openAttachConfirm(noteId, data.title || goalTitle)
      return
    }

    if (isJobFailed(data)) {
      stopJobPoll()
      store.v2Phase = 'idle'
      message.error(data.errorMsg || '合并精炼失败')
      return
    }
  } catch (e) {
    console.warn(e)
  }
}

async function onBatchUrlSubmit(payload: { urls: string[]; goal: string }) {
  if (!store.currentDomainId) return
  stopJobPoll()

  store.v2Phase = 'ingest'

  const domainId = store.currentDomainId
  const goal = payload.goal
  const unique = [...new Set(payload.urls.map((u) => u.trim()).filter(Boolean))]
  if (!unique.length) {
    message.warning('请至少勾选一条候选')
    store.v2Phase = 'idle'
    return
  }

  try {
    const body: Record<string, unknown> = {
      urls: unique,
      sourceType: 'AGENT',
      agentQuery: goal,
      domainId,
    }
    if (store.skipGateContext?.branchId) {
      body.skipGate = true
      body.branchId = store.skipGateContext.branchId
    } else if (store.gatePassId) {
      body.gatePassId = store.gatePassId
    }

    const res = await learningKnowledgeApi.ingestKnowledgeBatchUrl(body as any)
    if (res.data.code !== 0 || !res.data.data) {
      store.v2Phase = 'idle'
      message.error(res.data.message || '合并精炼失败')
      return
    }

    const data = res.data.data as API.KnowledgeReadingJobVO

    if (isJobSuccess(data)) {
      store.v2Phase = 'idle'
      const noteId = data.noteId
      if (noteId == null) {
        message.error('合并成功但未返回 noteId')
        return
      }
      store.openAttachConfirm(noteId, data.title || goal)
      return
    }

    if (isJobFailed(data)) {
      store.v2Phase = 'idle'
      message.error(data.errorMsg || '合并精炼失败')
      return
    }

    if (data.jobId == null) {
      store.v2Phase = 'idle'
      message.error('未返回任务 ID，无法跟踪合蒸进度')
      return
    }

    currentJobId = data.jobId
    store.v2Phase = 'job'
    await pollJobOnce(data.jobId, goal)
    jobPollTimer = setInterval(() => {
      if (currentJobId != null) void pollJobOnce(currentJobId, goal)
    }, JOB_POLL_MS)
  } catch (e) {
    store.v2Phase = 'idle'
    message.error(String((e as any)?.message || '合并精炼超时或失败'))
  }
}

// ── attach ──
async function onAttachConfirm(
  payload: { branchId: number | string } | { newBranchTitle: string; parentBranchId: number | string },
) {
  if (!store.currentDomainId) return
  const domainId = store.currentDomainId
  const noteId = pendingAttach.value.noteId
  if (!noteId) {
    message.error('缺少 noteId')
    return
  }

  const req: AttachRequest = { domainId, noteId }
  if ('branchId' in payload) {
    req.branchId = payload.branchId
  } else {
    req.newBranchTitle = payload.newBranchTitle
    req.parentBranchId = payload.parentBranchId
  }

  await store.attachLeaf(req)
}

function onAttachCancel() {
  store.attachVisible = false
  store.pendingAttach = { noteId: 0, title: '' }
  store.v2Phase = 'idle'
}

// ── lifecycle ──
onMounted(async () => {
  try {
    await store.loadDomains()
    if (store.currentDomainId) {
      await store.loadTree(store.currentDomainId)
    }
  } catch (e) {
    message.error('加载领域失败')
  }
})

watch(
  () => store.currentDomainId,
  async (next) => {
    stopJobPoll()
    store.resetGate()
    store.attachVisible = false
    store.pendingAttach = { noteId: 0, title: '' }
    if (next != null) {
      await store.loadTree(next)
    } else {
      store.branches = []
      store.branchLeaves = []
      store.selectedBranchId = null
    }
  },
)

watch(
  () => store.selectedBranchId,
  async (next) => {
    if (next != null) await store.loadLeaves(next)
    else store.branchLeaves = []
  },
)

watch(skipGateContext, (ctx) => {
  if (ctx) { /* gate context set — ContentPanel will show skip banner */ }
})

onBeforeUnmount(() => {
  stopJobPoll()
})
</script>

<template>
  <div class="learning-domain admin-theme-page">
    <!-- ============== 1. 页面头部（面包屑 + 工具栏合并） ============== -->
    <div class="admin-page-hero">
      <div class="hero-left">
        <div class="hero-title">
          <router-link to="/admin/knowledge/ingest" class="ld-breadcrumb-link">AI 精读工作台</router-link>
          <span class="ld-breadcrumb-sep">/</span>
          <FolderTree :size="18" />
          领域知识树
          <span v-if="store.domains.length" class="hero-subtitle">· {{ store.domains.length }} 个领域</span>
        </div>
      </div>
      <div class="hero-extra">
        <a-space :size="8">
          <a-select
            :value="currentDomainId"
            :options="domainSelectOptions"
            allow-clear
            placeholder="选择领域"
            size="small"
            style="min-width: 180px"
            @update:value="(v: any) => (currentDomainId = v ?? null)"
          />
          <a-button size="small" type="text" @click="treeVizOpen = !treeVizOpen">
            <template #icon><Share2 :size="14" /></template>
            树图
          </a-button>
          <a-button size="small" type="primary" ghost @click="onCreateDomain">
            <template #icon><Plus :size="14" /></template>
            创建领域
          </a-button>
        </a-space>
      </div>
    </div>

    <!-- ============== 3. 工具栏 ============== -->
    <div v-if="currentDomainId" class="admin-filter-bar">
      <a-space>
        <a-button size="small" @click="onOpenReattach">
          <template #icon><Paperclip :size="14" /></template>
          回挂笔记
        </a-button>
        <a-button size="small" @click="treeEditMode = !treeEditMode">
          <template #icon><Pencil :size="14" /></template>
          {{ treeEditMode ? '完成编辑' : '编辑树' }}
        </a-button>
        <a-button size="small" @click="createL1Trigger = true">
          <template #icon><Plus :size="14" /></template>
          新建 L1 枝
        </a-button>
      </a-space>
      <span
        v-if="snapshotTruncated"
        class="snapshot-hint"
        :title="snapshotMessage"
      >⚠ {{ snapshotMessage }}</span>
    </div>

    <!-- ============== 4. 工作区：左树右文 ============== -->
    <div v-if="currentDomainId" class="learning-workspace">
      <aside class="learning-workspace__tree" aria-label="知识目录">
        <DomainTree
          :loading="treeLoading"
          :domain-name="currentDomainName"
          :branches="branches"
          :selected-branch-id="selectedBranchId"
          :snapshot-truncated="snapshotTruncated"
          :snapshot-message="snapshotMessage"
          :edit-mode="treeEditMode"
          :create-l1-requested="createL1Trigger"
          @update:create-l1-requested="(v: boolean) => (createL1Trigger = v)"
          @update:selected-branch-id="onSelectBranch"
          @learn-empty="onLearnEmpty"
          @rename-branch="onRenameBranch"
          @delete-branch="onDeleteBranch"
          @merge-branch="onMergeBranch"
          @create-l1-branch="onCreateL1Branch"
          @create-l2-branch="onCreateL2Branch"
        />
      </aside>

      <section class="learning-workspace__detail">
        <ContentPanel
          :domain-id="currentDomainId"
          :domain-name="currentDomainName"
          :branch-id="selectedBranchId"
          :branch-title="selectedBranchTitle"
          :branch-path="selectedBranchPath"
          :leaves="branchLeaves"
          :leaves-loading="leavesLoading"
          :branches="branches"
          :gate-loading="gateLoading"
          :gate-result="gateResult"
          :gate-error="gateError"
          :search-blocked="searchBlocked"
          :v2-phase="v2Phase"
          :skip-gate-context="skipGateContext"
          @open-note="onOpenNote"
          @move-leaf="onMoveLeaf"
          @detach-leaf="onDetachLeaf"
          @gate-submit="onGateSubmit"
          @gate-re-submit="onGateReSubmit"
          @confirm-branch="onConfirmBranch"
          @batch-url-submit="onBatchUrlSubmit"
          @skip-gate="(p) => onLearnEmpty(p)"
        />
      </section>
    </div>

    <!-- ============== 5. 空状态（无领域） ============== -->
    <div v-else class="learning-welcome">
      <div class="learning-welcome__card">
        <FolderTree :size="56" class="learning-welcome__icon" :stroke-width="1" />
        <h2 class="learning-welcome__title">创建你的第一个学习领域</h2>
        <p class="learning-welcome__desc">
          创建 Java、前端等领域后，就能使用 AI 门闩与知识树挂叶功能
        </p>
        <IconAction
          :icon="Plus"
          label="创建领域"
          variant="primary"
          size="lg"
          @click="onCreateDomain"
        />
      </div>
    </div>

    <!-- ============== 6. 滑出面板 / 弹窗 ============== -->
    <AttachConfirm
      v-if="attachVisible && currentDomainId != null"
      :visible="attachVisible"
      :domain-id="currentDomainId"
      :note-id="pendingAttach.noteId"
      :note-title="pendingAttach.title"
      :note-summary="pendingAttach.summary"
      :branches="branches"
      :suggested-branch-id="gateResult?.suggestedBranchId ?? null"
      :suggested-branch-title="gateResult?.suggestedBranchTitle ?? null"
      :submitting="attachSubmitting"
      @update:visible="(v) => (store.attachVisible = v)"
      @confirm="onAttachConfirm"
      @cancel="onAttachCancel"
    />

    <a-modal
      v-model:open="createDomainVisible"
      title="创建学习领域"
      ok-text="创建"
      cancel-text="取消"
      :confirm-loading="createDomainSubmitting"
      :destroy-on-close="true"
      @ok="submitCreateDomain"
    >
      <p style="margin: 0 0 12px; color: var(--ld-color-text-secondary)">
        领域由你手动创建，AI 不会自动建域。同一用户下领域名不可重复。
      </p>
      <a-input
        v-model:value="createDomainName"
        placeholder="例如：Java、前端、算法"
        :maxlength="128"
        allow-clear
        @pressEnter="submitCreateDomain"
      />
    </a-modal>

    <ReattachNotesModal
      v-model:open="reattachOpen"
      :domain-id="currentDomainId"
      :branches="branches"
      @done="onReattachDone"
    />

    <a-modal
      v-model:open="mergeVisible"
      title="合并枝"
      ok-text="确认合并"
      cancel-text="取消"
      :confirm-loading="mergeSubmitting"
      destroy-on-close
      @ok="submitMergeBranch"
    >
      <p style="margin: 0 0 12px; color: var(--ld-color-text-secondary)">
        源枝下的叶会改挂到目标枝，源枝随后删除。
      </p>
      <a-select
        v-model:value="mergeTargetId"
        style="width: 100%"
        :options="branches.filter((b) => String(b.id) !== String(mergeSourceId)).map((b) => ({ value: b.id, label: b.path || b.title }))"
        placeholder="选择目标枝"
      />
    </a-modal>

    <TreeVizOverlay
      v-if="currentDomainId"
      :open="treeVizOpen"
      :domain-name="currentDomainName"
      :branches="branches"
      :selected-branch-id="selectedBranchId"
      @close="treeVizOpen = false"
      @update:selected-branch-id="(id) => (store.selectedBranchId = id)"
      @learn-empty="onLearnEmpty"
    />
  </div>
</template>
