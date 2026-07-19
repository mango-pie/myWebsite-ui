<script setup lang="ts">
import { computed } from 'vue'
import { FileText, Newspaper, LibraryBig, Loader } from 'lucide-vue-next'
import { useCountUp } from '@/composables/useCountUp'

const props = withDefaults(
  defineProps<{
    total?: number
    published?: number
    indexed?: number
    running?: number
    loading?: boolean
  }>(),
  { total: 0, published: 0, indexed: 0, running: 0, loading: false },
)

const emit = defineEmits<{
  (e: 'filter', kind: 'published' | 'indexed'): void
  (e: 'jobs'): void
}>()

const totalDisplay = useCountUp(computed(() => props.total))
const publishedDisplay = useCountUp(computed(() => props.published))
const indexedDisplay = useCountUp(computed(() => props.indexed))
const runningDisplay = useCountUp(computed(() => props.running))
</script>

<template>
  <div class="kb-stat-bar kb-stagger">
    <div class="kb-stat" :class="{ 'is-loading': loading }">
      <span class="kb-stat__icon"><FileText :size="20" :stroke-width="2" /></span>
      <div class="kb-stat__body">
        <div class="kb-stat__num">{{ totalDisplay }}</div>
        <div class="kb-stat__label">总精读</div>
      </div>
    </div>

    <button
      type="button"
      class="kb-stat kb-stat--clickable"
      :class="{ 'is-loading': loading }"
      @click="emit('filter', 'published')"
    >
      <span class="kb-stat__icon kb-stat__icon--success"><Newspaper :size="20" :stroke-width="2" /></span>
      <div class="kb-stat__body">
        <div class="kb-stat__num">{{ publishedDisplay }}</div>
        <div class="kb-stat__label">已发布</div>
      </div>
    </button>

    <button
      type="button"
      class="kb-stat kb-stat--clickable"
      :class="{ 'is-loading': loading }"
      @click="emit('filter', 'indexed')"
    >
      <span class="kb-stat__icon kb-stat__icon--info"><LibraryBig :size="20" :stroke-width="2" /></span>
      <div class="kb-stat__body">
        <div class="kb-stat__num">{{ indexedDisplay }}</div>
        <div class="kb-stat__label">已入库</div>
      </div>
    </button>

    <button
      type="button"
      class="kb-stat kb-stat--clickable"
      :class="{ 'is-running': running > 0 }"
      @click="emit('jobs')"
    >
      <span class="kb-stat__icon kb-stat__icon--running">
        <Loader :size="20" :stroke-width="2" :class="{ 'kb-spin': running > 0 }" />
      </span>
      <div class="kb-stat__body">
        <div class="kb-stat__num">{{ runningDisplay }}</div>
        <div class="kb-stat__label">进行中</div>
      </div>
    </button>
  </div>
</template>

<style scoped>
.kb-stat-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}

.kb-stat {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-card);
  backdrop-filter: blur(16px);
  box-shadow: var(--shadow-sm);
  text-align: left;
  font-family: inherit;
  color: var(--color-text-primary);
  transition:
    transform var(--transition-fast),
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.kb-stat--clickable {
  cursor: pointer;
}
.kb-stat--clickable:hover {
  transform: translateY(-2px);
  border-color: var(--color-border-hover);
  box-shadow: var(--shadow-glow);
}

.kb-stat.is-loading {
  opacity: 0.6;
}

.kb-stat__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  background: var(--color-primary-12);
  color: var(--color-primary-light);
}
.kb-stat__icon--success {
  background: rgba(16, 185, 129, 0.14);
  color: #34d399;
}
.kb-stat__icon--info {
  background: rgba(124, 156, 224, 0.16);
  color: #93b4f5;
}
.kb-stat__icon--running {
  background: rgba(245, 158, 11, 0.14);
  color: #fbbf24;
}

.kb-stat__num {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}
.kb-stat__label {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.kb-spin {
  animation: kbStatSpin 1.1s linear infinite;
}
@keyframes kbStatSpin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .kb-stat-bar {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (prefers-reduced-motion: reduce) {
  .kb-spin {
    animation: none;
  }
}
</style>
