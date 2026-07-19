<script setup lang="ts">
/**
 * 精读任务进度：环形进度 + 步骤时间线（QUEUED → READING → DISTILLING → DONE）。
 * 纯 SVG/CSS，零依赖。失败态标红。
 */
import { computed } from 'vue'
import { Check, X } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    status?: string | null
    progress?: string | null
    /** 环直径 */
    size?: number
    /** 是否展示右侧步骤时间线 */
    showSteps?: boolean
  }>(),
  { status: '', progress: '', size: 64, showSteps: true },
)

const STEPS = [
  { key: 'QUEUED', label: '排队' },
  { key: 'READING', label: '读取' },
  { key: 'DISTILLING', label: '蒸馏' },
  { key: 'DONE', label: '完成' },
]

const statusUpper = computed(() => String(props.status || '').toUpperCase())
const progressUpper = computed(() => String(props.progress || '').toUpperCase())

const isError = computed(() => progressUpper.value === 'ERROR' || statusUpper.value === 'FAILED')
const isDone = computed(
  () => progressUpper.value === 'DONE' || statusUpper.value === 'SUCCESS',
)

const currentIndex = computed(() => {
  if (isDone.value) return 3
  const idx = STEPS.findIndex((s) => s.key === progressUpper.value)
  if (idx >= 0) return idx
  if (statusUpper.value === 'RUNNING') return 1
  return 0
})

const percent = computed(() => {
  if (isDone.value) return 100
  const map: Record<string, number> = { QUEUED: 15, READING: 50, DISTILLING: 85 }
  return map[progressUpper.value] ?? (statusUpper.value === 'RUNNING' ? 50 : 8)
})

const radius = computed(() => props.size / 2 - 5)
const circumference = computed(() => 2 * Math.PI * radius.value)
const dashOffset = computed(() => circumference.value * (1 - percent.value / 100))

const stepState = (idx: number): 'done' | 'active' | 'todo' | 'error' => {
  if (isError.value && idx === currentIndex.value) return 'error'
  if (isDone.value) return 'done'
  if (idx < currentIndex.value) return 'done'
  if (idx === currentIndex.value) return 'active'
  return 'todo'
}
</script>

<template>
  <div class="rjp" :class="{ 'rjp--error': isError, 'rjp--done': isDone }">
    <div class="rjp__ring" :style="{ width: `${size}px`, height: `${size}px` }">
      <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
        <circle
          class="rjp__track"
          :cx="size / 2"
          :cy="size / 2"
          :r="radius"
          fill="none"
          stroke-width="5"
        />
        <circle
          class="rjp__bar"
          :cx="size / 2"
          :cy="size / 2"
          :r="radius"
          fill="none"
          stroke-width="5"
          stroke-linecap="round"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="dashOffset"
          :transform="`rotate(-90 ${size / 2} ${size / 2})`"
        />
      </svg>
      <span class="rjp__center">
        <Check v-if="isDone" :size="size * 0.34" :stroke-width="2.4" />
        <X v-else-if="isError" :size="size * 0.34" :stroke-width="2.4" />
        <template v-else>{{ percent }}<small>%</small></template>
      </span>
    </div>

    <ol v-if="showSteps" class="rjp__steps">
      <li
        v-for="(step, idx) in STEPS"
        :key="step.key"
        class="rjp__step"
        :class="`is-${stepState(idx)}`"
      >
        <span class="rjp__dot" />
        <span class="rjp__step-label">{{ step.label }}</span>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.rjp {
  display: flex;
  align-items: center;
  gap: 16px;
}

.rjp__ring {
  position: relative;
  flex-shrink: 0;
}

.rjp__track {
  stroke: rgba(255, 255, 255, 0.1);
}

.rjp__bar {
  stroke: var(--color-primary);
  transition: stroke-dashoffset 0.6s var(--transition-normal);
}
.rjp--done .rjp__bar {
  stroke: #34d399;
}
.rjp--error .rjp__bar {
  stroke: #f87171;
}

.rjp__center {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--color-text-primary);
}
.rjp__center small {
  font-size: 0.62em;
  margin-left: 1px;
  color: var(--color-text-muted);
}
.rjp--done .rjp__center {
  color: #34d399;
}
.rjp--error .rjp__center {
  color: #f87171;
}

.rjp__steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rjp__step {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.rjp__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
  flex-shrink: 0;
  transition: background var(--transition-fast), box-shadow var(--transition-fast);
}

.rjp__step.is-done .rjp__dot {
  background: #34d399;
}
.rjp__step.is-done .rjp__step-label {
  color: var(--color-text-secondary);
}

.rjp__step.is-active .rjp__dot {
  background: var(--color-primary);
  box-shadow: 0 0 0 4px var(--color-primary-20);
  animation: rjpPulse 1.4s ease-in-out infinite;
}
.rjp__step.is-active .rjp__step-label {
  color: var(--color-primary-light);
}

.rjp__step.is-error .rjp__dot {
  background: #f87171;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2);
}
.rjp__step.is-error .rjp__step-label {
  color: #f87171;
}

@keyframes rjpPulse {
  0%,
  100% {
    box-shadow: 0 0 0 3px var(--color-primary-20);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(232, 121, 169, 0.12);
  }
}

@media (prefers-reduced-motion: reduce) {
  .rjp__bar {
    transition: none;
  }
  .rjp__step.is-active .rjp__dot {
    animation: none;
  }
}
</style>
