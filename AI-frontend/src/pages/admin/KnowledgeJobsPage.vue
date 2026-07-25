<script setup lang="ts">
/**
 * AI 精读 · 任务中心
 * 列出本浏览器提交过的异步合蒸任务（localStorage 跟踪），
 * 对进行中的任务轮询 getKnowledgeReadingJob 刷新进度/结果。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { RefreshCw, Sparkles, Trash2, FileText, Inbox } from 'lucide-vue-next'
import { getKnowledgeReadingJob } from '@/api/knowledge'
import {
  isReadingJobInProgress,
  readingJobProgressLabel,
} from '@/composables/useKnowledgeSearchDraft'
import {
  clearAllReadingJobs,
  clearFinishedReadingJobs,
  listReadingJobs,
  removeReadingJob,
  updateReadingJob,
  type ReadingJobRecord,
} from '@/composables/useReadingJobTracker'
import IconAction from '@/components/ui/IconAction.vue'
import KnowledgeStatBar from '@/components/knowledge/KnowledgeStatBar.vue'
import ReadingJobProgress from '@/components/knowledge/ReadingJobProgress.vue'
import { useKnowledgeNoteStats } from '@/composables/useKnowledgeNoteStats'
import '@/assets/admin-theme.css'

const POLL_MS = 3000

const router = useRouter()
const jobs = ref<ReadingJobRecord[]>([])
const refreshing = ref(false)
const {
  total: statsTotal,
  published: statsPublished,
  indexed: statsIndexed,
  loading: statsLoading,
  refresh: refreshStats,
} = useKnowledgeNoteStats()
let timer: ReturnType<typeof setInterval> | null = null

const reload = () => {
  jobs.value = listReadingJobs()
}

const isTerminal = (rec: ReadingJobRecord): boolean => {
  const s = String(rec.status || '').toUpperCase()
  return s === 'SUCCESS' || s === 'FAILED'
}

const activeCount = computed(() => jobs.value.filter((j) => !isTerminal(j)).length)

const statusInfo = (rec: ReadingJobRecord): { text: string; color: string } => {
  const s = String(rec.status || '').toUpperCase()
  if (s === 'SUCCESS' || (rec.success && rec.noteId != null)) {
    return { text: '已完成', color: 'success' }
  }
  if (s === 'FAILED') return { text: '失败', color: 'error' }
  if (isReadingJobInProgress(rec) || s === 'PENDING' || s === 'RUNNING') {
    return { text: readingJobProgressLabel(rec.progress) || '进行中', color: 'processing' }
  }
  return { text: readingJobProgressLabel(rec.progress) || '未知', color: 'default' }
}

const fmtTime = (ts?: number): string => {
  if (!ts) return '—'
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes(),
  ).padStart(2, '0')}`
}

const pollActive = async () => {
  const active = jobs.value.filter((j) => !isTerminal(j))
  if (!active.length) return
  await Promise.all(
    active.map(async (job) => {
      try {
        const res = await getKnowledgeReadingJob(job.jobId)
        if (res.data.code === 0 && res.data.data) {
          const d = res.data.data
          updateReadingJob(job.jobId, {
            status: d.status,
            progress: d.progress,
            noteId: d.noteId,
            success: d.success,
            errorMsg: d.errorMsg,
            title: d.title || undefined,
            total: d.total,
          })
        }
      } catch {
        /* 单次轮询失败忽略，下次再试 */
      }
    }),
  )
  reload()
}

const manualRefresh = async () => {
  refreshing.value = true
  try {
    await pollActive()
  } finally {
    refreshing.value = false
  }
}

const openNote = (rec: ReadingJobRecord) => {
  if (rec.noteId == null) {
    message.info('该任务尚未生成精读笔记')
    return
  }
  router.push(`/admin/knowledge/notes/${rec.noteId}`)
}

const removeJob = (rec: ReadingJobRecord) => {
  removeReadingJob(rec.jobId)
  reload()
}

const clearFinished = () => {
  clearFinishedReadingJobs()
  reload()
  message.success('已清除完成/失败的任务记录')
}

const clearAll = () => {
  clearAllReadingJobs()
  reload()
  message.success('已清空任务记录')
}

onMounted(() => {
  reload()
  void pollActive()
  void refreshStats()
  timer = setInterval(() => {
    void pollActive()
  }, POLL_MS)
})

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<template>
  <div class="kb-jobs-page admin-theme-page">
    <a-breadcrumb class="admin-breadcrumb">
      <a-breadcrumb-item>
        <router-link to="/admin/knowledge/notes">AI 精读</router-link>
      </a-breadcrumb-item>
      <a-breadcrumb-item>任务中心</a-breadcrumb-item>
    </a-breadcrumb>

    <div class="admin-page-hero">
      <div class="hero-left">
        <div class="hero-title"><Sparkles :size="22" /> 精读任务中心</div>
        <div class="hero-subtitle">
          跟踪本机提交的异步合蒸任务
          <template v-if="activeCount">· 进行中 {{ activeCount }} 个（每 3 秒自动刷新）</template>
        </div>
      </div>
      <div class="hero-extra">
        <a-space>
          <IconAction
            :icon="RefreshCw"
            label="刷新"
            variant="soft"
            size="sm"
            motion="spin"
            :loading="refreshing"
            @click="manualRefresh"
          />
          <IconAction
            :icon="Sparkles"
            label="去采集"
            variant="primary"
            size="sm"
            motion="pop"
            @click="router.push('/admin/knowledge/ingest')"
          />
        </a-space>
      </div>
    </div>

    <!-- KPI 概览 -->
    <KnowledgeStatBar
      :total="statsTotal"
      :published="statsPublished"
      :indexed="statsIndexed"
      :running="activeCount"
      :loading="statsLoading"
      @filter="() => router.push('/admin/knowledge/notes')"
      @jobs="manualRefresh"
    />

    <a-card :bordered="false">
      <div v-if="!jobs.length" class="kb-jobs-empty">
        <Inbox :size="44" :stroke-width="1.5" />
        <p>还没有本机任务记录</p>
        <span class="hint">
          「进行中」只统计当前浏览器提交过的合蒸任务，不是全站队列。
          <br />
          请到「内容采集 → AI 搜索」勾选候选并合并精炼后，任务会出现在这里。
        </span>
        <IconAction
          :icon="Sparkles"
          label="去内容采集"
          variant="primary"
          motion="pop"
          style="margin-top: 8px"
          @click="router.push('/admin/knowledge/ingest')"
        />
      </div>

      <ul v-else class="kb-jobs-list kb-stagger">
        <li
          v-for="job in jobs"
          :key="job.jobId"
          class="kb-job"
          :class="{ 'kb-job--running': !isTerminal(job) }"
        >
          <div class="kb-job__progress">
            <ReadingJobProgress :status="job.status" :progress="job.progress" :size="60" />
          </div>
          <div class="kb-job__main">
            <div class="kb-job__title">
              <FileText :size="16" class="kb-job__title-icon" />
              <span>{{ job.title }}</span>
            </div>
            <div class="kb-job__meta">
              <span class="status-chip" :class="`status-chip--${statusInfo(job).color}`">
                <span class="status-chip__dot" />{{ statusInfo(job).text }}
              </span>
              <span class="kb-job__sub">任务 #{{ job.jobId }}</span>
              <span v-if="job.total != null" class="kb-job__sub">· {{ job.total }} 源</span>
              <span class="kb-job__sub">· {{ fmtTime(job.submittedAt) }}</span>
              <span v-if="job.errorMsg" class="kb-job__err">· {{ job.errorMsg }}</span>
            </div>
          </div>
          <div class="kb-job__actions">
            <IconAction
              v-if="job.noteId != null"
              :icon="FileText"
              label="打开精读"
              variant="ghost"
              size="sm"
              @click="openNote(job)"
            />
            <IconAction
              :icon="Trash2"
              variant="ghost"
              size="sm"
              motion="shake"
              ariaLabel="删除记录"
              @click="removeJob(job)"
            />
          </div>
        </li>
      </ul>

      <div v-if="jobs.length" class="kb-jobs-footer">
        <a-button size="small" @click="clearFinished">清除已完成</a-button>
        <a-popconfirm title="确定清空全部任务记录？" ok-text="清空" cancel-text="取消" @confirm="clearAll">
          <a-button size="small" danger>清空全部</a-button>
        </a-popconfirm>
      </div>
    </a-card>
  </div>
</template>

<style scoped>
.hint {
  color: var(--color-text-muted);
  font-size: 12px;
}

.kb-jobs-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 64px 20px;
  color: var(--color-text-muted);
}

.kb-jobs-empty p {
  margin: 0;
  font-size: 15px;
  color: var(--color-text-secondary);
}

.kb-jobs-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.kb-job {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-surface);
  transition: border-color 0.2s ease, background 0.2s ease;
}

.kb-job:hover {
  border-color: var(--color-border-hover);
  background: var(--color-surface-hover);
}

.kb-job--running {
  border-color: var(--color-primary-20);
  background: linear-gradient(
    100deg,
    var(--color-primary-08) 0%,
    var(--color-bg-surface) 60%
  );
  animation: kbJobBreath 2.6s ease-in-out infinite;
}

@keyframes kbJobBreath {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(232, 121, 169, 0);
  }
  50% {
    box-shadow: 0 0 22px 0 rgba(232, 121, 169, 0.12);
  }
}

.kb-job__progress {
  flex-shrink: 0;
}

.kb-job__main {
  min-width: 0;
  flex: 1;
}

.kb-job__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 6px;
}

.kb-job__title-icon {
  flex-shrink: 0;
  color: var(--color-primary-light);
}

.kb-job__title span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kb-job__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.kb-job__sub {
  font-size: 12px;
  color: var(--color-text-muted);
}

.kb-job__err {
  font-size: 12px;
  color: #cf6679;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 320px;
}

.kb-job__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.kb-jobs-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

@media (max-width: 768px) {
  .kb-job {
    flex-wrap: wrap;
  }
  .kb-job__actions {
    width: 100%;
    justify-content: flex-end;
  }
}

@media (prefers-reduced-motion: reduce) {
  .kb-job--running {
    animation: none;
  }
}
</style>
