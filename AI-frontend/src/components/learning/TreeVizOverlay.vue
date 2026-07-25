<script setup lang="ts">
/**
 * 树图全屏浮层 — 包裹 DomainTreeViz，提供关闭与缩放控制
 */
import { ref } from 'vue'
import { X, ZoomIn, ZoomOut } from 'lucide-vue-next'
import type { LearningBranchTreeNode } from '@/api/learning.types'
import DomainTreeViz from './DomainTreeViz.vue'

defineProps<{
  open: boolean
  domainName: string
  branches: LearningBranchTreeNode[]
  selectedBranchId: number | string | null
}>()

const emit = defineEmits<{
  close: []
  'update:selected-branch-id': [branchId: number | string | null]
  'learn-empty': [payload: { branchId: number | string; branchTitle: string }]
}>()

const scale = ref(1)

function zoomIn() {
  scale.value = Math.min(1.5, +(scale.value + 0.1).toFixed(2))
}

function zoomOut() {
  scale.value = Math.max(0.6, +(scale.value - 0.1).toFixed(2))
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="viz-fade">
      <div
        v-if="open"
        class="viz-overlay learning-domain"
        role="dialog"
        aria-modal="true"
        aria-label="知识树图全屏"
        @keydown="onKeydown"
      >
        <!-- backdrop -->
        <div class="viz-overlay__backdrop" @click="$emit('close')" />

        <!-- panel -->
        <div class="viz-overlay__panel">
          <div class="viz-overlay__toolbar">
            <div class="viz-overlay__zoom">
              <button
                type="button"
                class="viz-overlay__zoom-btn"
                title="缩小"
                @click="zoomOut"
              >
                <ZoomOut :size="16" />
              </button>
              <span class="viz-overlay__zoom-label">{{ Math.round(scale * 100) }}%</span>
              <button
                type="button"
                class="viz-overlay__zoom-btn"
                title="放大"
                @click="zoomIn"
              >
                <ZoomIn :size="16" />
              </button>
            </div>
            <button
              type="button"
              class="viz-overlay__close"
              title="关闭"
              @click="$emit('close')"
            >
              <X :size="18" />
            </button>
          </div>

          <div class="viz-overlay__stage" :style="{ transform: `scale(${scale})` }">
            <DomainTreeViz
              :domain-name="domainName"
              :branches="branches"
              :selected-branch-id="selectedBranchId"
              @update:selected-branch-id="(id) => $emit('update:selected-branch-id', id)"
              @learn-empty="(p) => $emit('learn-empty', p)"
            />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.viz-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--ld-z-modal, 300);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--ld-space-5, 20px);
}

.viz-overlay__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
}

.viz-overlay__panel {
  position: relative;
  width: min(960px, 100%);
  height: min(680px, calc(100vh - 80px));
  background: var(--ld-color-bg-elevated, rgba(35, 28, 46, 0.96));
  border: 1px solid var(--ld-color-border, rgba(255, 255, 255, 0.08));
  border-radius: var(--ld-radius-xl, 16px);
  box-shadow: var(--ld-shadow-overlay, 0 24px 64px rgba(0, 0, 0, 0.55));
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.viz-overlay__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--ld-space-4, 16px) var(--ld-space-5, 20px);
  border-bottom: 1px solid var(--ld-color-border, rgba(255, 255, 255, 0.08));
  flex-shrink: 0;
}

.viz-overlay__zoom {
  display: flex;
  align-items: center;
  gap: 8px;
}

.viz-overlay__zoom-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--ld-color-border, rgba(255, 255, 255, 0.08));
  border-radius: var(--ld-radius-md, 8px);
  background: transparent;
  color: var(--ld-color-text-secondary, #c4b8d0);
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s ease, color 0.15s ease;
}

.viz-overlay__zoom-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--ld-color-text-primary, #f5f0f8);
}

.viz-overlay__zoom-label {
  font-size: var(--ld-font-size-xs, 0.75rem);
  color: var(--ld-color-text-secondary, #c4b8d0);
  min-width: 40px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.viz-overlay__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--ld-color-border, rgba(255, 255, 255, 0.08));
  border-radius: var(--ld-radius-md, 8px);
  background: transparent;
  color: var(--ld-color-text-secondary, #c4b8d0);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.viz-overlay__close:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--ld-color-text-primary, #f5f0f8);
}

.viz-overlay__stage {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  transform-origin: center center;
  transition: transform 0.2s var(--ld-ease-out, cubic-bezier(0.22, 1, 0.36, 1));
  overflow: hidden;
}

/* transition */
.viz-fade-enter-active,
.viz-fade-leave-active {
  transition: opacity 0.2s ease;
}

.viz-fade-enter-active .viz-overlay__panel,
.viz-fade-leave-active .viz-overlay__panel {
  transition: transform 0.25s var(--ld-ease-out, cubic-bezier(0.22, 1, 0.36, 1)),
    opacity 0.2s ease;
}

.viz-fade-enter-from,
.viz-fade-leave-to {
  opacity: 0;
}

.viz-fade-enter-from .viz-overlay__panel,
.viz-fade-leave-to .viz-overlay__panel {
  transform: scale(0.95);
  opacity: 0;
}
</style>
