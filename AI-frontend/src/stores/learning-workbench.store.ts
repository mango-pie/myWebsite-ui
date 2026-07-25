/**
 * 领域知识树工作台状态（Pinia Store）
 * 管理领域列表、树快照、选中枝、门闩结果、V2 链路阶段、挂叶确认等
 */
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type {
  LearningDomain,
  LearningBranchTreeNode,
  LearningLeafVO,
  GateResponse,
  AttachRequest,
} from '@/api/learning.types'
import * as learningApi from '@/api/learning'

const DOMAIN_STORAGE_KEY = 'ld-current-domain-id'
const BRANCH_STORAGE_KEY = 'ld-branch-selections'

function loadSavedDomainId(): string | null {
  try {
    return localStorage.getItem(DOMAIN_STORAGE_KEY)
  } catch {
    return null
  }
}

function saveDomainId(id: number | string | null) {
  try {
    if (id != null) localStorage.setItem(DOMAIN_STORAGE_KEY, String(id))
    else localStorage.removeItem(DOMAIN_STORAGE_KEY)
  } catch { /* private mode */ }
}

function loadSavedBranchId(domainId: number | string): string | null {
  try {
    const raw = localStorage.getItem(BRANCH_STORAGE_KEY)
    if (!raw) return null
    const map = JSON.parse(raw)
    return map[String(domainId)] ?? null
  } catch {
    return null
  }
}

function saveBranchId(domainId: number | string, branchId: number | string | null) {
  try {
    const raw = localStorage.getItem(BRANCH_STORAGE_KEY)
    const map = raw ? JSON.parse(raw) : {}
    if (branchId != null) map[String(domainId)] = String(branchId)
    else delete map[String(domainId)]
    localStorage.setItem(BRANCH_STORAGE_KEY, JSON.stringify(map))
  } catch { /* private mode */ }
}

// V2 workflow state session persistence
const V2_SESSION_KEY = 'ld-v2-workflow'

export const useLearningWorkbenchStore = defineStore('learningWorkbench', () => {
  // ── State ──
  const domains = ref<LearningDomain[]>([])
  const currentDomainId = ref<number | string | null>(null)

  const treeLoading = ref(false)
  const branches = ref<LearningBranchTreeNode[]>([])
  const snapshotTruncated = ref(false)
  const snapshotMessage = ref('')

  const selectedBranchId = ref<number | string | null>(null)
  const leavesLoading = ref(false)
  const branchLeaves = ref<LearningLeafVO[]>([])

  const gateLoading = ref(false)
  const gateResult = ref<GateResponse | null>(null)
  const gateError = ref('')
  const gatePassId = ref('')
  const v2Phase = ref<'idle' | 'preview' | 'ingest' | 'job'>('idle')
  const skipGateContext = ref<{ branchId: number | string; branchTitle: string } | null>(null)

  const attachVisible = ref(false)
  const attachSubmitting = ref(false)
  const pendingAttach = ref<{ noteId: number | string; title: string; summary?: string }>({ noteId: 0, title: '' })

  // ── Getters ──
  const currentDomain = computed(() =>
    domains.value.find((d) => String(d.id) === String(currentDomainId.value)) || null,
  )
  const currentDomainName = computed(() => currentDomain.value?.name || '')

  const selectedBranch = computed(() =>
    branches.value.find((b) => String(b.id) === String(selectedBranchId.value)) || null,
  )
  const selectedBranchTitle = computed(() => selectedBranch.value?.title || '')

  const searchBlocked = computed(() => {
    // LEAF 路径：必须相关且 intent=LEAF
    if (gateResult.value) {
      if (!gateResult.value.related) return true
      return gateResult.value.intent !== 'LEAF'
    }
    // 空枝补学（skipGate）：gateResult 可能为空，但仍允许 V2
    if (skipGateContext.value && v2Phase.value === 'preview') return false
    return true
  })

  // ── Actions ──
  async function loadDomains() {
    const res = await learningApi.getDomains()
    if (res.data.code === 0 && res.data.data) {
      domains.value = res.data.data
      const saved = loadSavedDomainId()
      if (saved && domains.value.some((d) => String(d.id) === saved)) {
        currentDomainId.value = saved
      } else if (domains.value.length && !currentDomainId.value) {
        const first = domains.value[0]
        if (first) currentDomainId.value = first.id
      }
    }
  }

  /** 创建领域并自动选中；成功返回新 domain，失败抛错由调用方提示 */
  async function createDomain(name: string) {
    const trimmed = name.trim()
    if (!trimmed) throw new Error('请填写领域名称')
    if (domains.value.some((d) => d.name === trimmed)) {
      throw new Error('同名领域已存在')
    }
    const res = await learningApi.createDomain({ name: trimmed, sortOrder: domains.value.length })
    if (res.data.code !== 0 || !res.data.data) {
      throw new Error(res.data.message || '创建领域失败')
    }
    const created = res.data.data
    domains.value = [...domains.value, created]
    setCurrentDomainId(created.id)
    await loadTree(created.id)
    return created
  }

  async function loadTree(domainId: number | string) {
    treeLoading.value = true
    try {
      const res = await learningApi.getTree(domainId)
      if (res.data.code === 0 && res.data.data) {
        branches.value = res.data.data.branches || []
        snapshotTruncated.value = res.data.data.snapshotTruncated || false
        snapshotMessage.value = res.data.data.snapshotMessage || ''
        // 恢复该 domain 下上次选中的枝
        const savedBid = loadSavedBranchId(domainId)
        if (savedBid && branches.value.some((b) => String(b.id) === savedBid)) {
          selectedBranchId.value = savedBid
        } else if (
          selectedBranchId.value &&
          !branches.value.some((b) => String(b.id) === String(selectedBranchId.value))
        ) {
          selectedBranchId.value = null
          branchLeaves.value = []
        }
      }
    } finally {
      treeLoading.value = false
    }
  }

  async function loadLeaves(branchId: number | string) {
    leavesLoading.value = true
    try {
      const res = await learningApi.getLeaves(branchId)
      if (res.data.code === 0 && res.data.data) {
        branchLeaves.value = res.data.data
      }
    } finally {
      leavesLoading.value = false
    }
  }

  async function submitGate(question: string) {
    if (!currentDomainId.value) return
    gateLoading.value = true
    gateResult.value = null
    gateError.value = ''
    gatePassId.value = ''
    v2Phase.value = 'idle'
    try {
      const res = await learningApi.postGate({
        domainId: currentDomainId.value,
        question,
      })
      if (res.data.code === 0 && res.data.data) {
        gateResult.value = res.data.data
        if (res.data.data.related && res.data.data.gatePassId) {
          gatePassId.value = res.data.data.gatePassId
        }
        if (res.data.data.related && res.data.data.intent === 'LEAF') {
          v2Phase.value = 'preview'
        }
      } else {
        gateError.value = res.data.message || '门闩判定失败，请稍后重试'
      }
    } catch (e) {
      gateError.value = 'AI 门闩服务暂时不可用'
    } finally {
      gateLoading.value = false
    }
  }

  async function confirmBranch(payload: { title: string; parentBranchId: number | string }) {
    if (!currentDomainId.value) return
    const res = await learningApi.createBranch(currentDomainId.value, {
      title: payload.title,
      parentBranchId: payload.parentBranchId,
    })
    if (res.data.code !== 0) throw new Error(res.data.message || '建枝失败')
    await loadTree(currentDomainId.value)
    gateResult.value = null
  }

  async function attachLeaf(payload: AttachRequest) {
    attachSubmitting.value = true
    try {
      const res = await learningApi.attachLeaf(payload)
      if (res.data.code === 0) {
        attachVisible.value = false
        if (currentDomainId.value) {
          await loadTree(currentDomainId.value)
          if (selectedBranchId.value) {
            await loadLeaves(selectedBranchId.value)
          }
        }
        pendingAttach.value = { noteId: 0, title: '' }
      } else {
        throw new Error(res.data.message || '挂叶失败')
      }
    } finally {
      attachSubmitting.value = false
    }
  }

  async function detachLeaf(noteId: number | string) {
    const res = await learningApi.detachLeaf(noteId)
    if (res.data.code !== 0) throw new Error(res.data.message || '取消挂载失败')
    if (currentDomainId.value) {
      await loadTree(currentDomainId.value)
      if (selectedBranchId.value) await loadLeaves(selectedBranchId.value)
      else branchLeaves.value = []
    }
  }

  async function moveLeaf(noteId: number | string, targetBranchId: number | string) {
    const res = await learningApi.moveLeaf({ noteId, targetBranchId })
    if (res.data.code !== 0) throw new Error(res.data.message || '移叶失败')
    if (currentDomainId.value) {
      await loadTree(currentDomainId.value)
      if (selectedBranchId.value) await loadLeaves(selectedBranchId.value)
    }
  }

  async function renameBranch(branchId: number | string, title: string) {
    const trimmed = title.trim()
    if (!trimmed) throw new Error('枝名不能为空')
    const res = await learningApi.updateBranch(branchId, { title: trimmed })
    if (res.data.code !== 0) throw new Error(res.data.message || '改名失败')
    if (currentDomainId.value) await loadTree(currentDomainId.value)
  }

  async function deleteBranch(branchId: number | string) {
    const res = await learningApi.deleteBranch(branchId)
    if (res.data.code !== 0) throw new Error(res.data.message || '删除失败（有叶枝不可删）')
    if (String(selectedBranchId.value) === String(branchId)) {
      selectedBranchId.value = null
      branchLeaves.value = []
    }
    if (currentDomainId.value) await loadTree(currentDomainId.value)
  }

  async function mergeBranch(sourceId: number | string, targetBranchId: number | string) {
    const res = await learningApi.mergeBranch(sourceId, { targetBranchId })
    if (res.data.code !== 0) throw new Error(res.data.message || '合并失败')
    if (String(selectedBranchId.value) === String(sourceId)) {
      selectedBranchId.value = targetBranchId
    }
    if (currentDomainId.value) {
      await loadTree(currentDomainId.value)
      if (selectedBranchId.value) await loadLeaves(selectedBranchId.value)
    }
  }

  function openAttachConfirm(noteId: number | string, title: string, summary?: string) {
    pendingAttach.value = { noteId, title, summary }
    attachVisible.value = true
  }

  function resetGate() {
    gateResult.value = null
    gateError.value = ''
    gatePassId.value = ''
    v2Phase.value = 'idle'
    skipGateContext.value = null
  }

  function setSkipGateContext(branchId: number | string, branchTitle: string) {
    skipGateContext.value = { branchId, branchTitle }
    v2Phase.value = 'preview'
    gateResult.value = null
  }

  function setCurrentDomainId(id: number | string | null) {
    currentDomainId.value = id
    saveDomainId(id)
  }

  // V2 workflow state session persistence
  function saveV2Workflow() {
    try {
      if (currentDomainId.value && gatePassId.value) {
        sessionStorage.setItem(V2_SESSION_KEY, JSON.stringify({
          domainId: String(currentDomainId.value),
          gatePassId: gatePassId.value,
          v2Phase: v2Phase.value,
          savedAt: Date.now(),
        }))
      }
    } catch { /* private mode */ }
  }

  function loadV2Workflow(): boolean {
    try {
      const raw = sessionStorage.getItem(V2_SESSION_KEY)
      if (!raw) return false
      const data = JSON.parse(raw)
      if (Date.now() - data.savedAt > 25 * 60 * 1000) {
        sessionStorage.removeItem(V2_SESSION_KEY)
        return false
      }
      if (data.domainId === String(currentDomainId.value) && data.gatePassId) {
        gatePassId.value = data.gatePassId
        v2Phase.value = data.v2Phase || 'preview'
        return true
      }
    } catch { /* ignore */ }
    return false
  }

  // 自动保存选中枝 per domain
  watch(selectedBranchId, (next) => {
    if (currentDomainId.value != null) {
      saveBranchId(currentDomainId.value, next)
    }
  })

  // 自动保存 V2 workflow 状态（刷新恢复）
  watch([gatePassId, v2Phase], () => {
    if (gatePassId.value) saveV2Workflow()
  })

  // 域切换时尝试恢复 V2 workflow
  watch(currentDomainId, (next) => {
    if (next != null) {
      const restored = loadV2Workflow()
      if (restored && v2Phase.value === 'preview') {
        // preview 阶段已恢复，ContentPanel 的 watch 会自动触发 runPreview
      }
    }
  })

  return {
    domains,
    currentDomainId,
    treeLoading,
    branches,
    snapshotTruncated,
    snapshotMessage,
    selectedBranchId,
    leavesLoading,
    branchLeaves,
    gateLoading,
    gateResult,
    gateError,
    gatePassId,
    v2Phase,
    skipGateContext,
    attachVisible,
    attachSubmitting,
    pendingAttach,
    currentDomain,
    currentDomainName,
    selectedBranch,
    selectedBranchTitle,
    searchBlocked,
    loadDomains,
    createDomain,
    loadTree,
    loadLeaves,
    submitGate,
    confirmBranch,
    attachLeaf,
    detachLeaf,
    moveLeaf,
    renameBranch,
    deleteBranch,
    mergeBranch,
    openAttachConfirm,
    resetGate,
    setSkipGateContext,
    setCurrentDomainId,
  }
})
