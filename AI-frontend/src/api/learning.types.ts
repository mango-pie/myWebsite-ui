/**
 * V3 领域知识树 — 类型定义
 * 对应后端 LearningAdminController + LearningTreeServiceImpl
 */

export interface LearningDomain {
  id: number | string
  userId?: number | string
  name: string
  sortOrder: number
  createTime?: string
  updateTime?: string
}

export interface LearningBranchTreeNode {
  id: number | string
  domainId: number | string
  parentBranchId: number | string
  depth: 1 | 2
  title: string
  /** 路径展示，如 "Java > 集合" */
  path: string
  leafCount: number
  sortOrder: number
}

export interface LearningTreeVO {
  domain: LearningDomain
  branches: LearningBranchTreeNode[]
  snapshotTruncated?: boolean
  snapshotMessage?: string
}

export interface LearningLeafVO {
  noteId: number | string
  title: string
  summary?: string
  publishStatus?: string
  indexStatus?: string
  attachedAt?: string
  sortOrder?: number
}

export interface GateRequest {
  domainId: number | string
  question: string
}

export type GateIntent = 'CHAT_ONLY' | 'BRANCH' | 'LEAF'

export interface GateResponse {
  related: boolean
  reason?: string
  intent: GateIntent
  gatePassId?: string
  suggestedBranchId?: number | string | null
  suggestedBranchTitle?: string | null
  answer?: string
  hints?: string[]
}

export interface AttachRequest {
  domainId: number | string
  noteId: number | string
  branchId?: number | string
  newBranchTitle?: string
  parentBranchId?: number | string
}

export interface AttachResponse {
  leafId: number | string
  branchId: number | string
}

export interface BatchSuggestItem {
  noteId: number | string
  suggestedBranchId?: number | string
  suggestedBranchTitle?: string
}
