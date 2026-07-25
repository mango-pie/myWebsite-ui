<script setup lang="ts">
/**
 * 回挂向导 — 三步：选择笔记 → AI建议挂枝 → 确认挂载
 */
import { computed, ref, watch } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { Check, Lightbulb, List, Sparkles } from 'lucide-vue-next'
import type { LearningBranchTreeNode, LearningLeafVO, BatchSuggestItem } from '@/api/learning.types'
import * as learningApi from '@/api/learning'

const STEPS = [
  { key: 'select', title: '选择笔记', icon: List },
  { key: 'suggest', title: 'AI 建议挂枝', icon: Lightbulb },
  { key: 'confirm', title: '确认挂载', icon: Check },
] as const

const props = defineProps<{
  open: boolean
  domainId: number | string | null
  branches: LearningBranchTreeNode[]
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  done: []
}>()

const currentStep = ref(0)

const loading = ref(false)
const suggesting = ref(false)
const applying = ref(false)
const notes = ref<LearningLeafVO[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = 20
const selectedIds = ref<(number | string)[]>([])

/** noteId -> branchId 建议映射 */
const suggestMap = ref<Record<string, number | string>>({})

/** 逐条挂载进度 */
const attachProgress = ref({ done: 0, total: 0 })

const branchOptions = computed(() =>
  props.branches.map((b) => ({ value: b.id, label: b.path || b.title })),
)

const selectedNotes = computed(() =>
  notes.value.filter((n) => selectedIds.value.some((id) => String(id) === String(n.noteId))),
)

const canSuggest = computed(() => selectedIds.value.length > 0)
const hasSuggestions = computed(() => Object.keys(suggestMap.value).length > 0)

watch(
  () => props.open,
  async (v) => {
    if (!v) return
    currentStep.value = 0
    selectedIds.value = []
    suggestMap.value = {}
    pageNum.value = 1
    attachProgress.value = { done: 0, total: 0 }
    await loadNotes()
  },
)

async function loadNotes() {
  if (props.domainId == null) return
  loading.value = true
  try {
    const res = await learningApi.getUnattachedNotes(props.domainId, pageNum.value, pageSize)
    if (res.data.code === 0 && res.data.data) {
      notes.value = res.data.data.list || []
      total.value = res.data.data.total || 0
    } else {
      message.error(res.data.message || '加载未入树笔记失败')
    }
  } catch (e) {
    message.error(String((e as Error)?.message || '加载失败'))
  } finally {
    loading.value = false
  }
}

async function goToSuggest() {
  if (!canSuggest.value) {
    message.warning('请先勾选笔记')
    return
  }
  currentStep.value = 1
  await runSuggest()
}

async function runSuggest() {
  if (props.domainId == null) return
  suggesting.value = true
  try {
    const res = await learningApi.batchSuggest(
      props.domainId,
      selectedNotes.value.map((n) => ({
        noteId: n.noteId,
        title: n.title,
        summary: n.summary,
      })),
    )
    if (res.data.code !== 0 || !res.data.data) {
      message.error(res.data.message || '生成挂枝建议失败')
      return
    }
    const map: Record<string, number | string> = {}
    for (const s of (res.data.data.suggestions || []) as BatchSuggestItem[]) {
      if (s.noteId != null && s.suggestedBranchId != null) {
        map[String(s.noteId)] = s.suggestedBranchId
      }
    }
    const fallback = props.branches[0]?.id
    for (const n of selectedNotes.value) {
      const key = String(n.noteId)
      if (map[key] == null && fallback != null) map[key] = fallback
    }
    suggestMap.value = map
  } catch (e) {
    message.error(String((e as Error)?.message || '生成挂枝建议失败'))
  } finally {
    suggesting.value = false
  }
}

function goToConfirm() {
  if (!hasSuggestions.value) {
    message.warning('请先生成挂枝建议')
    return
  }
  currentStep.value = 2
}

async function applyAttach() {
  if (props.domainId == null) return
  const entries = Object.entries(suggestMap.value).filter(([, bid]) => bid != null)
  if (!entries.length) {
    message.warning('没有有效的挂载映射')
    return
  }
  applying.value = true
  attachProgress.value = { done: 0, total: entries.length }
  let ok = 0
  try {
    for (const [noteId, branchId] of entries) {
      const res = await learningApi.attachLeaf({
        domainId: props.domainId,
        noteId,
        branchId,
      })
      if (res.data.code === 0) ok++
      else message.warning(`笔记 ${noteId}：${res.data.message || '挂载失败'}`)
      attachProgress.value = { done: attachProgress.value.done + 1, total: entries.length }
    }
    if (ok > 0) message.success(`已挂载 ${ok} 篇（共 ${entries.length} 篇）`)
    emit('done')
    emit('update:open', false)
  } catch (e) {
    message.error(String((e as Error)?.message || '批量挂叶失败'))
  } finally {
    applying.value = false
  }
}

function setSuggestBranch(noteId: number | string, branchId: number | string) {
  suggestMap.value = { ...suggestMap.value, [String(noteId)]: branchId }
}

function onSelectionChange(keys: (string | number)[]) {
  selectedIds.value = keys
}

function onPageChange(p: number) {
  pageNum.value = p
  void loadNotes()
}

function onClose() {
  if (selectedIds.value.length > 0) {
    Modal.confirm({
      title: '关闭回挂向导',
      content: `已选择 ${selectedIds.value.length} 篇笔记，关闭将丢失当前选择。确定关闭？`,
      okText: '关闭',
      cancelText: '继续操作',
      onOk: () => emit('update:open', false),
    })
  } else {
    emit('update:open', false)
  }
}
</script>

<template>
  <a-modal
    :open="open"
    title="回挂历史笔记"
    width="760px"
    :footer="null"
    destroy-on-close
    @cancel="onClose"
  >
    <!-- Steps indicator -->
    <div class="reattach-steps">
      <div
        v-for="(step, idx) in STEPS"
        :key="step.key"
        class="reattach-steps__item"
        :class="{
          'is-active': currentStep === idx,
          'is-done': currentStep > idx,
        }"
      >
        <span class="reattach-steps__dot">
          <Check v-if="currentStep > idx" :size="14" />
          <component :is="step.icon" v-else :size="14" />
        </span>
        <span class="reattach-steps__label">{{ step.title }}</span>
        <span v-if="idx < STEPS.length - 1" class="reattach-steps__line" />
      </div>
    </div>

    <!-- Step 0: Select notes -->
    <div v-if="currentStep === 0" class="reattach-step-body">
      <p class="reattach-step-desc">
        选择未入当前领域树的精读笔记，AI 将一次性给出挂枝建议。不会重复蒸馏。
      </p>
      <a-spin :spinning="loading">
        <a-table
          size="small"
          row-key="noteId"
          :data-source="notes"
          :pagination="{
            current: pageNum,
            pageSize,
            total,
            onChange: onPageChange,
          }"
          :row-selection="{
            selectedRowKeys: selectedIds,
            onChange: onSelectionChange,
          }"
          :columns="[
            { title: '标题', dataIndex: 'title', ellipsis: true },
            { title: '摘要', dataIndex: 'summary', ellipsis: true },
          ]"
        />
      </a-spin>
    </div>

    <!-- Step 1: AI suggest -->
    <div v-if="currentStep === 1" class="reattach-step-body">
      <a-spin :spinning="suggesting" tip="AI 正在分析挂枝位置…">
        <div v-if="!hasSuggestions && !suggesting" style="text-align: center; padding: 40px 0; color: var(--ld-color-text-secondary, #c4b8d0)">
          暂未生成建议，请返回上一步或刷新
        </div>
        <div v-else class="reattach-suggest-list">
          <div
            v-for="n in selectedNotes"
            :key="n.noteId"
            class="reattach-suggest-row"
          >
            <span class="reattach-suggest-row__title">{{ n.title }}</span>
            <a-select
              style="width: 220px"
              :options="branchOptions"
              :value="suggestMap[String(n.noteId)]"
              placeholder="选择枝"
              @update:value="(v: number | string) => setSuggestBranch(n.noteId, v)"
            />
          </div>
        </div>
      </a-spin>
    </div>

    <!-- Step 2: Confirm & apply -->
    <div v-if="currentStep === 2" class="reattach-step-body">
      <a-spin :spinning="applying">
        <div v-if="applying" style="text-align: center; padding: 32px 0">
          <p style="color: var(--ld-color-text-secondary, #c4b8d0)">
            挂载进度：{{ attachProgress.done }} / {{ attachProgress.total }}
          </p>
          <div class="reattach-progress-bar">
            <div
              class="reattach-progress-bar__fill"
              :style="{
                width: attachProgress.total
                  ? `${Math.round((attachProgress.done / attachProgress.total) * 100)}%`
                  : '0%',
              }"
            />
          </div>
        </div>
        <div v-else class="reattach-summary">
          <p style="margin: 0 0 12px; color: var(--ld-color-text-secondary, #c4b8d0)">
            即将挂载 {{ Object.keys(suggestMap).length }} 篇笔记到对应枝，点击"确认挂载"执行。
          </p>
          <div
            v-for="n in selectedNotes"
            :key="n.noteId"
            class="reattach-summary-row"
          >
            <span class="reattach-summary-row__note">{{ n.title }}</span>
            <Sparkles :size="14" style="color: var(--ld-color-ai, #7c9ce0); flex-shrink: 0" />
            <span class="reattach-summary-row__branch">
              {{
                branchOptions.find(
                  (o) => String(o.value) === String(suggestMap[String(n.noteId)]),
                )?.label || '—'
              }}
            </span>
          </div>
        </div>
      </a-spin>
    </div>

    <!-- Footer actions -->
    <div class="reattach-footer">
      <a-button @click="onClose">取消</a-button>

      <template v-if="currentStep === 0">
        <a-button type="primary" :disabled="!canSuggest" @click="goToSuggest">
          下一步：AI 建议
        </a-button>
      </template>

      <template v-if="currentStep === 1">
        <a-button @click="currentStep = 0">上一步</a-button>
        <a-button type="primary" :disabled="!hasSuggestions" @click="goToConfirm">
          下一步：确认
        </a-button>
      </template>

      <template v-if="currentStep === 2">
        <a-button @click="currentStep = 1" :disabled="applying">上一步</a-button>
        <a-button type="primary" :loading="applying" @click="applyAttach">
          确认挂载
        </a-button>
      </template>
    </div>
  </a-modal>
</template>

<style scoped>
/* Steps indicator */
.reattach-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-bottom: 20px;
  padding: 12px 0;
}

.reattach-steps__item {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.reattach-steps__dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.06);
  color: var(--ld-color-text-tertiary, #8a7d9a);
  border: 1px solid var(--ld-color-border, rgba(255, 255, 255, 0.08));
  flex-shrink: 0;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.reattach-steps__item.is-active .reattach-steps__dot {
  background: var(--ld-color-primary-subtle, rgba(184, 164, 201, 0.16));
  color: var(--ld-color-primary, #b8a4c9);
  border-color: var(--ld-color-primary-muted, rgba(184, 164, 201, 0.28));
}

.reattach-steps__item.is-done .reattach-steps__dot {
  background: rgba(110, 231, 183, 0.16);
  color: #6ee7b7;
  border-color: rgba(110, 231, 183, 0.28);
}

.reattach-steps__label {
  font-size: var(--ld-font-size-sm, 0.875rem);
  color: var(--ld-color-text-tertiary, #8a7d9a);
  font-weight: var(--ld-font-weight-semibold, 600);
  white-space: nowrap;
  transition: color 0.2s ease;
}

.reattach-steps__item.is-active .reattach-steps__label {
  color: var(--ld-color-text-primary, #f5f0f8);
}

.reattach-steps__item.is-done .reattach-steps__label {
  color: var(--ld-color-text-secondary, #c4b8d0);
}

.reattach-steps__line {
  width: 48px;
  height: 1px;
  background: var(--ld-color-border, rgba(255, 255, 255, 0.08));
  margin: 0 12px;
  flex-shrink: 0;
}

/* Step body */
.reattach-step-body {
  min-height: 180px;
}

.reattach-step-desc {
  margin: 0 0 12px;
  color: var(--ld-color-text-secondary, #c4b8d0);
  font-size: var(--ld-font-size-sm, 0.875rem);
}

/* Suggest list */
.reattach-suggest-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reattach-suggest-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.reattach-suggest-row__title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--ld-font-size-sm, 0.875rem);
}

/* Summary */
.reattach-summary-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid var(--ld-color-border, rgba(255, 255, 255, 0.08));
}

.reattach-summary-row__note {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--ld-font-size-sm, 0.875rem);
  font-weight: var(--ld-font-weight-semibold, 600);
}

.reattach-summary-row__branch {
  color: var(--ld-color-primary, #b8a4c9);
  font-size: var(--ld-font-size-xs, 0.75rem);
  font-weight: var(--ld-font-weight-semibold, 600);
}

/* Progress bar */
.reattach-progress-bar {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.06);
  overflow: hidden;
  margin-top: 12px;
}

.reattach-progress-bar__fill {
  height: 100%;
  border-radius: 3px;
  background: var(--ld-color-primary, #b8a4c9);
  transition: width 0.3s ease;
}

/* Footer */
.reattach-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--ld-color-border, rgba(255, 255, 255, 0.08));
}
</style>
