<script setup lang="ts">
/**
 * 领域知识树 — 左侧目录面板
 * L1 支持折叠/展开 L2；编辑模式悬停显示操作按钮；空枝有独立补学入口
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import {
  FolderTree,
  GitBranch,
  Leaf,
  Pencil,
  Trash2,
  Combine,
  Plus,
  Search,
  ChevronRight,
  GripVertical,
} from 'lucide-vue-next'
import type { LearningBranchTreeNode } from '@/api/learning.types'
import InlineEdit from './InlineEdit.vue'

type Props = {
  loading?: boolean
  domainName: string
  branches: LearningBranchTreeNode[]
  selectedBranchId: number | string | null
  snapshotTruncated?: boolean
  snapshotMessage?: string
  editMode?: boolean
  createL1Requested?: boolean
}

type Emits = {
  'update:selected-branch-id': [branchId: number | string | null]
  'learn-empty': [payload: { branchId: number | string; branchTitle: string }]
  'rename-branch': [branchId: number | string, title: string]
  'delete-branch': [branchId: number | string]
  'merge-branch': [sourceBranchId: number | string]
  'create-l1-branch': [title: string]
  'create-l2-branch': [parentBranchId: number | string, title: string]
  'update:createL1Requested': [value: boolean]
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  selectedBranchId: null,
  snapshotTruncated: false,
  editMode: false,
  createL1Requested: false,
})

const emit = defineEmits<Emits>()

const l1Branches = computed(() => props.branches.filter((b) => b.depth === 1))

function childrenOf(parentId: number | string) {
  return props.branches.filter(
    (b) => b.depth === 2 && String(b.parentBranchId) === String(parentId),
  )
}

// ── expand / collapse ──
const expandedIds = reactive(new Set<string>())

function toggleExpand(branchId: number | string) {
  const key = String(branchId)
  if (expandedIds.has(key)) {
    expandedIds.delete(key)
  } else {
    expandedIds.add(key)
  }
}

function isExpanded(branchId: number | string) {
  return expandedIds.has(String(branchId))
}

// 首次加载时展开第一个有子枝的 L1
watch(
  () => props.branches,
  (list) => {
    if (list.length > 0) {
      const firstL1 = list.find((b) => b.depth === 1 && childrenOf(b.id).length > 0) ||
        list.find((b) => b.depth === 1)
      if (firstL1 && !expandedIds.size) expandedIds.add(String(firstL1.id))
    }
  },
  { immediate: true },
)

// ── selection ──
function onSelect(branch: LearningBranchTreeNode) {
  emit('update:selected-branch-id', branch.id)
  // auto-expand when selecting a branch that has children
  if (childrenOf(branch.id).length > 0) {
    expandedIds.add(String(branch.id))
  }
}

function onLearnEmpty(branch: LearningBranchTreeNode) {
  emit('learn-empty', { branchId: branch.id, branchTitle: branch.title })
  emit('update:selected-branch-id', branch.id)
}

// ── inline rename ──
const renamingId = ref<string | null>(null)
const renamingTitle = ref('')

function startRename(branch: LearningBranchTreeNode) {
  renamingId.value = String(branch.id)
  renamingTitle.value = branch.title
}

function confirmRename(title: string) {
  if (renamingId.value == null) return
  const branch = props.branches.find((b) => String(b.id) === renamingId.value)
  const parentId = branch?.parentBranchId ?? 0
  if (isSiblingDuplicate(title, parentId, renamingId.value)) {
    message.warning('同级已存在同名枝')
    return
  }
  emit('rename-branch', renamingId.value, title)
  renamingId.value = null
  renamingTitle.value = ''
}

function cancelRename() {
  renamingId.value = null
  renamingTitle.value = ''
}

/** 检查同级枝名是否冲突（trim + 忽略大小写） */
function isSiblingDuplicate(title: string, parentBranchId: number | string, excludeId?: number | string): boolean {
  const norm = title.trim().toLowerCase()
  return props.branches.some(
    (b) =>
      String(b.parentBranchId) === String(parentBranchId) &&
      b.title.trim().toLowerCase() === norm &&
      (excludeId == null || String(b.id) !== String(excludeId)),
  )
}

// ── inline create L1 ──
const creatingL1 = ref(false)

function startCreateL1() {
  creatingL1.value = true
}

function confirmCreateL1(title: string) {
  if (isSiblingDuplicate(title, 0)) {
    message.warning('同级已存在同名枝')
    return
  }
  creatingL1.value = false
  emit('update:createL1Requested', false)
  emit('create-l1-branch', title)
}

function cancelCreateL1() {
  creatingL1.value = false
  emit('update:createL1Requested', false)
}

watch(
  () => props.createL1Requested,
  (v) => {
    if (v) startCreateL1()
  },
)

// ── keyboard nav ──
function onTreeKeydown(e: KeyboardEvent) {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
  e.preventDefault()
  const rows = Array.from(
    (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('.tree-row[tabindex]'),
  )
  const idx = rows.indexOf(e.target as HTMLElement)
  const nextIdx = e.key === 'ArrowDown' ? idx + 1 : idx - 1
  const nextRow = rows[nextIdx]
  if (nextRow) {
    nextRow.focus()
    nextRow.click()
  }
}

// ── inline create L2 ──
const creatingL2Parent = ref<string | null>(null)

function startCreateL2(parentId: number | string) {
  creatingL2Parent.value = String(parentId)
  expandedIds.add(String(parentId))
}

function confirmCreateL2(title: string) {
  if (creatingL2Parent.value == null) return
  if (isSiblingDuplicate(title, creatingL2Parent.value)) {
    message.warning('同级已存在同名枝')
    return
  }
  emit('create-l2-branch', creatingL2Parent.value, title)
  creatingL2Parent.value = null
}

function cancelCreateL2() {
  creatingL2Parent.value = null
}

// ── context menu ──
interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  branch: LearningBranchTreeNode | null
}

const ctxMenu = reactive<ContextMenuState>({
  visible: false,
  x: 0,
  y: 0,
  branch: null,
})

function onContextMenu(e: MouseEvent, branch: LearningBranchTreeNode) {
  e.preventDefault()
  e.stopPropagation()
  // clamp position within viewport
  const menuW = 160
  const menuH = 180
  ctxMenu.x = Math.min(e.clientX, window.innerWidth - menuW - 8)
  ctxMenu.y = Math.min(e.clientY, window.innerHeight - menuH - 8)
  ctxMenu.branch = branch
  ctxMenu.visible = true
}

function closeContextMenu() {
  ctxMenu.visible = false
  ctxMenu.branch = null
}

function ctxAction(action: 'rename' | 'add-child' | 'merge' | 'delete') {
  if (!ctxMenu.branch) return
  const b = ctxMenu.branch
  closeContextMenu()
  switch (action) {
    case 'rename':
      startRename(b)
      break
    case 'add-child':
      if (b.depth === 1) startCreateL2(b.id)
      break
    case 'merge':
      emit('merge-branch', b.id)
      break
    case 'delete':
      if (b.leafCount === 0) emit('delete-branch', b.id)
      break
  }
}

function onGlobalClick() {
  if (ctxMenu.visible) closeContextMenu()
}

function onGlobalKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && ctxMenu.visible) closeContextMenu()
}

onMounted(() => {
  document.addEventListener('click', onGlobalClick, true)
  document.addEventListener('keydown', onGlobalKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onGlobalClick, true)
  document.removeEventListener('keydown', onGlobalKeydown)
})
</script>

<template>
  <div class="domain-tree" :class="{ 'domain-tree--editing': editMode }">
    <!-- header -->
    <div class="domain-tree__header">
      <h2 class="domain-tree__domain-name">
        <FolderTree :size="18" class="domain-tree__root-icon" :stroke-width="1.5" />
        {{ domainName || '领域' }}
      </h2>
      <span
        v-if="branches.length"
        class="domain-tree__summary"
      >{{ l1Branches.length }} 主题</span>
    </div>

    <!-- snapshot warning -->
    <div v-if="snapshotTruncated" class="domain-tree__snapshot-warn" :title="snapshotMessage">
      ⚠ 枝过多，建议整理
    </div>

    <!-- loading -->
    <div v-if="loading" class="domain-tree__list" aria-label="加载中">
      <div v-for="i in (branches.length || 4)" :key="i" class="u-skeleton-shimmer" style="height: 32px" />
    </div>

    <!-- empty tree -->
    <div v-else-if="!branches.length && !editMode" class="domain-tree__empty">
      <FolderTree :size="28" :stroke-width="1" style="opacity: 0.3" />
      <p>还没有枝</p>
      <p class="domain-tree__empty-hint">编辑树 或 通过提问来创建第一个主题</p>
    </div>

    <div v-else class="domain-tree__list" aria-label="领域树" @keydown="onTreeKeydown">
      <!-- inline create L1 -->
      <div v-if="editMode && creatingL1" class="domain-tree__inline-create domain-tree__inline-create--l1">
        <InlineEdit
          model-value=""
          placeholder="新建 L1 枝标题"
          @confirm="confirmCreateL1"
          @cancel="cancelCreateL1"
        />
      </div>

      <template v-for="l1 in l1Branches" :key="l1.id">
        <!-- ====== L1 row ====== -->
        <div
          v-if="String(l1.id) !== renamingId"
          class="tree-row tree-row--l1"
          :class="{
            'tree-row--active': String(l1.id) === String(selectedBranchId),
            'tree-row--empty': l1.leafCount === 0,
          }"
          role="treeitem"
          :aria-selected="String(l1.id) === String(selectedBranchId)"
          tabindex="0"
          @click="onSelect(l1)"
          @keydown.enter.prevent="onSelect(l1)"
          @dblclick="editMode && startRename(l1)"
          @contextmenu="onContextMenu($event, l1)"
        >
          <!-- chevron -->
          <button
            v-if="childrenOf(l1.id).length > 0"
            class="tree-chevron"
            :class="{ 'tree-chevron--open': isExpanded(l1.id) }"
            type="button"
            :aria-label="isExpanded(l1.id) ? '折叠子枝' : '展开子枝'"
            @click.stop="toggleExpand(l1.id)"
          >
            <ChevronRight :size="15" :stroke-width="2" />
          </button>
          <span v-else class="tree-chevron tree-chevron--spacer" aria-hidden="true" />

          <!-- icon -->
          <span class="tree-node-icon" :class="{ 'tree-node-icon--dim': l1.leafCount === 0 }">
            <Leaf v-if="l1.leafCount > 0" :size="16" />
            <GitBranch v-else :size="16" />
          </span>

          <!-- title + meta -->
          <div class="tree-row__body">
            <span class="tree-row__title">{{ l1.title }}</span>
            <span v-if="l1.leafCount > 0" class="tree-row__badge">{{ l1.leafCount }}</span>
            <span v-else class="tree-row__tag tree-row__tag--empty">空</span>
          </div>

          <!-- edit actions (hover visible) -->
          <div v-if="editMode" class="tree-actions" @click.stop>
            <button type="button" class="tree-action-btn" title="添加子枝" @click="startCreateL2(l1.id)">
              <Plus :size="13" />
            </button>
            <button type="button" class="tree-action-btn" title="改名" @click="startRename(l1)">
              <Pencil :size="13" />
            </button>
            <button
              v-if="l1.leafCount === 0"
              type="button"
              class="tree-action-btn tree-action-btn--danger"
              title="删除"
              @click="emit('delete-branch', l1.id)"
            >
              <Trash2 :size="13" />
            </button>
            <button type="button" class="tree-action-btn" title="合并" @click="emit('merge-branch', l1.id)">
              <Combine :size="13" />
            </button>
          </div>
        </div>

        <!-- L1 rename inline -->
        <div v-else class="domain-tree__inline-rename domain-tree__inline-rename--l1">
          <InlineEdit
            :model-value="renamingTitle"
            @confirm="confirmRename"
            @cancel="cancelRename"
          />
        </div>

        <!-- Empty L1 CTA (shown when expanded and leafCount is 0) -->
        <div
          v-if="isExpanded(l1.id) && l1.leafCount === 0"
          class="tree-empty-cta"
          role="button"
          tabindex="0"
          @click="onLearnEmpty(l1)"
          @keydown.enter.prevent="onLearnEmpty(l1)"
        >
          <Search :size="12" />
          还没学 · 去搜一篇
        </div>

        <!-- ====== L2 children ====== -->
        <Transition name="tree-slide">
          <div v-if="isExpanded(l1.id) && childrenOf(l1.id).length > 0" class="tree-l2-group">
            <template v-for="l2 in childrenOf(l1.id)" :key="l2.id">
              <div
                v-if="String(l2.id) !== renamingId"
                class="tree-row tree-row--l2"
                :class="{
                  'tree-row--active': String(l2.id) === String(selectedBranchId),
                }"
                role="treeitem"
                :aria-selected="String(l2.id) === String(selectedBranchId)"
                tabindex="0"
                @click="onSelect(l2)"
                @keydown.enter.prevent="onSelect(l2)"
                @dblclick="editMode && startRename(l2)"
                @contextmenu="onContextMenu($event, l2)"
              >
                <span class="tree-chevron tree-chevron--spacer" aria-hidden="true" />
                <span class="tree-node-icon tree-node-icon--l2">
                  <Leaf :size="14" />
                </span>
                <div class="tree-row__body">
                  <span class="tree-row__title">{{ l2.title }}</span>
                  <span v-if="l2.leafCount > 0" class="tree-row__badge tree-row__badge--l2">{{ l2.leafCount }}</span>
                </div>
                <div v-if="editMode" class="tree-actions" @click.stop>
                  <button type="button" class="tree-action-btn" title="改名" @click="startRename(l2)">
                    <Pencil :size="13" />
                  </button>
                  <button
                    v-if="l2.leafCount === 0"
                    type="button"
                    class="tree-action-btn tree-action-btn--danger"
                    title="删除"
                    @click="emit('delete-branch', l2.id)"
                  >
                    <Trash2 :size="13" />
                  </button>
                  <button type="button" class="tree-action-btn" title="合并" @click="emit('merge-branch', l2.id)">
                    <Combine :size="13" />
                  </button>
                </div>
              </div>
              <div v-else class="domain-tree__inline-rename domain-tree__inline-rename--l2">
                <InlineEdit
                  :model-value="renamingTitle"
                  @confirm="confirmRename"
                  @cancel="cancelRename"
                />
              </div>
            </template>

            <!-- inline create L2 -->
            <div
              v-if="editMode && creatingL2Parent === String(l1.id)"
              class="domain-tree__inline-create domain-tree__inline-create--l2"
            >
              <InlineEdit
                model-value=""
                placeholder="新建子枝标题"
                @confirm="confirmCreateL2"
                @cancel="cancelCreateL2"
              />
            </div>
          </div>
        </Transition>
      </template>
    </div>

    <!-- context menu -->
    <Teleport to="body">
      <Transition name="ctx-fade">
        <div
          v-if="ctxMenu.visible"
          class="tree-ctx-menu"
          :style="{ left: ctxMenu.x + 'px', top: ctxMenu.y + 'px' }"
          role="menu"
          @click.stop
        >
          <button class="tree-ctx-menu__item" type="button" @click="ctxAction('rename')">
            <Pencil :size="13" /> 改名
          </button>
          <button
            v-if="ctxMenu.branch?.depth === 1"
            class="tree-ctx-menu__item"
            type="button"
            @click="ctxAction('add-child')"
          >
            <Plus :size="13" /> 添加子枝
          </button>
          <button class="tree-ctx-menu__item" type="button" @click="ctxAction('merge')">
            <Combine :size="13" /> 合并到…
          </button>
          <button
            v-if="ctxMenu.branch?.leafCount === 0"
            class="tree-ctx-menu__item tree-ctx-menu__item--danger"
            type="button"
            @click="ctxAction('delete')"
          >
            <Trash2 :size="13" /> 删除空枝
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* ========== root ========== */
.domain-tree {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.domain-tree--editing {
  border: 1px dashed var(--ld-color-primary-muted, rgba(184, 164, 201, 0.35));
  border-radius: var(--ld-radius-md, 10px);
  background: var(--ld-color-primary-subtle, rgba(184, 164, 201, 0.04));
  padding: 6px;
}

/* ========== header ========== */
.domain-tree__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--ld-color-border, rgba(255, 255, 255, 0.08));
}

.domain-tree__domain-name {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.4;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.domain-tree__root-icon {
  color: var(--ld-color-primary, #e879a9);
  flex-shrink: 0;
}

.domain-tree__summary {
  font-size: 0.75rem;
  color: var(--ld-color-text-tertiary, #8a7d9a);
  font-variant-numeric: tabular-nums;
}

/* ========== snapshot warning ========== */
.domain-tree__snapshot-warn {
  margin-top: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.2);
  font-size: 0.75rem;
  color: #fbbf24;
}

/* ========== list ========== */
.domain-tree__list {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow: auto;
  flex: 1;
  min-height: 0;
}

/* ========== empty tree ========== */
.domain-tree__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--ld-color-text-tertiary, #8a7d9a);
  font-size: 0.875rem;
  text-align: center;
  padding: 20px;
}

.domain-tree__empty-hint {
  font-size: 0.75rem;
  opacity: 0.7;
}

/* ========== tree row (shared) ========== */
.tree-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 10px 9px 6px;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
  user-select: none;
}

.tree-row:hover {
  background: var(--ld-color-surface-hover, rgba(255, 255, 255, 0.06));
}

.tree-row:focus-visible {
  outline: 2px solid var(--ld-color-primary-35, rgba(232, 121, 169, 0.35));
  outline-offset: -2px;
}

.tree-row--active {
  background: var(--ld-color-primary-08, rgba(184, 164, 201, 0.1));
  border-color: var(--ld-color-primary-12, rgba(184, 164, 201, 0.15));
}

.tree-row--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 3px;
  bottom: 3px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--ld-color-primary, #a04a2a);
}

/* L1 specific */
.tree-row--l1 {
  font-weight: 650;
  min-height: 40px;
}

.tree-row--l1 .tree-row__title {
  font-size: 0.9rem;
  color: var(--ld-color-text-primary, #f5f0f8);
}

/* L2 specific */
.tree-row--l2 {
  font-weight: 400;
  margin-left: 8px;
}

.tree-row--l2 .tree-row__title {
  font-size: 0.8125rem;
  color: var(--ld-color-text-tertiary, #8a7d9a);
}

/* L2 connecting line */
.tree-row--l2::after {
  content: '';
  position: absolute;
  left: -6px;
  top: 0;
  bottom: 50%;
  width: 1px;
  background: rgba(255, 255, 255, 0.06);
}

.tree-row--l2::before {
  content: '';
  position: absolute;
  left: -6px;
  top: 50%;
  width: 10px;
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
}

.tree-l2-group > .tree-row--l2:last-child::after {
  bottom: 50%;
  height: 50%;
}

/* Empty branch */
.tree-row--empty .tree-row__title {
  color: var(--ld-color-text-tertiary, #8a7d9a);
}

/* ========== chevron ========== */
.tree-chevron {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  color: var(--ld-color-text-tertiary, #8a7d9a);
  cursor: pointer;
  border-radius: 4px;
  flex-shrink: 0;
  padding: 0;
  transition: color 0.15s ease, background 0.15s ease;
}

.tree-chevron:hover {
  color: var(--ld-color-text-primary, #f5f0f8);
  background: var(--ld-color-surface-hover, rgba(255, 255, 255, 0.05));
}

.tree-chevron--open :deep(svg) {
  transform: rotate(90deg);
}

.tree-chevron--spacer {
  visibility: hidden;
}

/* ========== node icon ========== */
.tree-node-icon {
  display: inline-flex;
  flex-shrink: 0;
  color: var(--ld-color-primary, #e879a9);
}

.tree-node-icon--dim {
  color: var(--ld-color-text-tertiary, #8a7d9a);
}

.tree-node-icon--l2 {
  color: var(--ld-color-ai, #7c9ce0);
}

/* ========== body: title + badge ========== */
.tree-row__body {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 6px;
  overflow: hidden;
}

.tree-row__title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tree-row__badge {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--ld-color-primary, #e879a9);
  background: var(--ld-color-primary-08, rgba(232, 121, 169, 0.08));
  border-radius: 999px;
  padding: 1px 7px;
  line-height: 1.5;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.tree-row__badge--l2 {
  color: var(--ld-color-ai, #7c9ce0);
  background: var(--ld-color-ai-20, rgba(124, 156, 224, 0.2));
}

.tree-row__tag {
  font-size: 0.62rem;
  font-weight: 600;
  border-radius: 999px;
  padding: 1px 6px;
  line-height: 1.5;
  flex-shrink: 0;
  letter-spacing: 0.04em;
}

.tree-row__tag--empty {
  color: var(--ld-color-text-tertiary, #8a7d9a);
  background: rgba(255, 255, 255, 0.04);
}

/* ========== edit actions (hover) ========== */
.tree-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.tree-row:hover .tree-actions,
.tree-row:focus-within .tree-actions,
.domain-tree--editing .tree-actions {
  opacity: 1;
}

.tree-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  background: transparent;
  color: var(--ld-color-text-tertiary, #8a7d9a);
  border-radius: 5px;
  cursor: pointer;
  padding: 0;
  transition: background 0.12s ease, color 0.12s ease;
}

.tree-action-btn:hover {
  background: var(--ld-color-surface-hover, rgba(255, 255, 255, 0.08));
  color: var(--ld-color-text-primary, #f5f0f8);
}

.tree-action-btn--danger:hover {
  color: var(--ld-color-danger, #ef4444);
  background: rgba(239, 68, 68, 0.12);
}

/* ========== empty branch CTA ========== */
.tree-empty-cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: 48px;
  padding: 5px 10px;
  font-size: 0.78rem;
  color: var(--ld-color-ai, #7c9ce0);
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.15s ease;
  align-self: flex-start;
}

.tree-empty-cta:hover {
  background: var(--ld-color-ai-20, rgba(124, 156, 224, 0.2));
}

/* ========== L2 children group ========== */
.tree-l2-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-left: 16px;
}

/* ========== inline edit/create ========== */
.domain-tree__inline-rename,
.domain-tree__inline-create {
  padding: 4px 8px;
}

.domain-tree__inline-rename--l2,
.domain-tree__inline-create--l2 {
  padding-left: 40px;
}

.domain-tree__inline-create--l1 {
  padding-left: 4px;
}

/* ========== slide transition ========== */
.tree-slide-enter-active,
.tree-slide-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.tree-slide-enter-from,
.tree-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
  max-height: 0;
}

.tree-slide-enter-to,
.tree-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 800px;
}

/* ========== context menu ========== */
.tree-ctx-menu {
  position: fixed;
  z-index: 9999;
  min-width: 150px;
  background: var(--ld-color-bg-elevated, rgba(30, 24, 40, 0.98));
  border: 1px solid var(--ld-color-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--ld-radius-md, 10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 1px;
  backdrop-filter: blur(12px);
}

.tree-ctx-menu__item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  border: none;
  background: transparent;
  color: var(--ld-color-text-secondary, #c4b8d0);
  font-family: inherit;
  font-size: 0.8125rem;
  padding: 7px 12px;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s ease, color 0.1s ease;
}

.tree-ctx-menu__item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--ld-color-text-primary, #f5f0f8);
}

.tree-ctx-menu__item--danger:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
}

.ctx-fade-enter-active,
.ctx-fade-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}

.ctx-fade-enter-from,
.ctx-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
