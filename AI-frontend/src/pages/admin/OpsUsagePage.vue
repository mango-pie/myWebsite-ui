<script setup lang="ts">
/**
 * 运维中心 · AI 用量
 * 路由：/admin/ops/usage
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { getSiteSettingValues } from '@/api/siteSettings'
import { getOpsUsageSummary, pageOpsUsageLogs } from '@/api/opsObservability'
import OpsCenterNav from '@/components/admin/OpsCenterNav.vue'
import {
  formatOpsUsageScene,
  isOpsSwitchOn,
  OPS_USAGE_SCENE_OPTIONS,
} from '@/utils/opsLabels'
import '@/assets/admin-theme.css'

type UsageRow = API.OpsUsageLogVO

const switchLoading = ref(false)
const summaryLoading = ref(false)
const tableLoading = ref(false)
const usageLogEnabled = ref(false)

const dateRange = ref<[Dayjs, Dayjs]>([dayjs().subtract(6, 'day'), dayjs()])
const summary = ref<API.OpsUsageSummaryVO | null>(null)

const searchParams = reactive<{
  scene?: string
  userId?: string
  pageNum: number
  pageSize: number
}>({
  scene: undefined,
  userId: undefined,
  pageNum: 1,
  pageSize: 20,
})

const dataSource = ref<UsageRow[]>([])
const total = ref(0)

const fromStr = computed(() => dateRange.value[0]?.format('YYYY-MM-DD'))
const toStr = computed(() => dateRange.value[1]?.format('YYYY-MM-DD'))

const bySceneEntries = computed(() =>
  Object.entries(summary.value?.byScene || {}).sort((a, b) => b[1] - a[1]),
)
const byModelEntries = computed(() =>
  Object.entries(summary.value?.byModel || {}).sort((a, b) => b[1] - a[1]),
)

const columns = [
  { title: '时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
  { title: '场景', dataIndex: 'scene', key: 'scene', width: 120 },
  { title: '模型', dataIndex: 'modelName', key: 'modelName', width: 140, ellipsis: true },
  { title: 'Tokens', key: 'tokens', width: 100 },
  { title: '耗时', key: 'latency', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 90 },
  { title: '用户', dataIndex: 'userId', key: 'userId', width: 90 },
  { title: '摘要 / 错误', key: 'detail', ellipsis: true },
]

function formatTime(str: string | undefined): string {
  if (!str) return '-'
  try {
    return new Date(str).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return str
  }
}

function formatNullableNumber(v: number | null | undefined, suffix = ''): string {
  if (v == null || Number.isNaN(v)) return '—'
  if (typeof v === 'number' && !Number.isInteger(v)) {
    return `${v.toFixed(1)}${suffix}`
  }
  return `${v}${suffix}`
}

function statusColor(status?: string): string {
  if (status === 'success') return 'green'
  if (status === 'error') return 'red'
  return 'default'
}

function truncate(text: string | null | undefined, max = 80): string {
  if (!text) return '-'
  return text.length > max ? `${text.slice(0, max)}…` : text
}

async function loadSwitch() {
  switchLoading.value = true
  try {
    const res = await getSiteSettingValues('ops')
    if (res.data.code === 0 && res.data.data) {
      usageLogEnabled.value = isOpsSwitchOn(res.data.data.values?.usage_log_enabled)
    }
  } catch {
    /* 开关探测失败不阻断看板 */
  } finally {
    switchLoading.value = false
  }
}

async function fetchSummary() {
  summaryLoading.value = true
  try {
    const res = await getOpsUsageSummary({ from: fromStr.value, to: toStr.value })
    if (res.data.code === 0 && res.data.data) {
      summary.value = res.data.data
    } else {
      message.error(res.data.message || '加载用量汇总失败')
    }
  } catch {
    message.error('加载用量汇总失败')
  } finally {
    summaryLoading.value = false
  }
}

async function fetchLogs() {
  tableLoading.value = true
  try {
    const userIdRaw = searchParams.userId?.trim()
    const res = await pageOpsUsageLogs({
      scene: searchParams.scene || undefined,
      userId: userIdRaw ? userIdRaw : undefined,
      from: fromStr.value,
      to: toStr.value,
      pageNum: searchParams.pageNum,
      pageSize: Math.min(searchParams.pageSize, 100),
    })
    if (res.data.code === 0 && res.data.data) {
      dataSource.value = res.data.data.records ?? []
      total.value = res.data.data.totalRow ?? 0
    } else {
      message.error(res.data.message || '加载用量明细失败')
    }
  } catch {
    message.error('加载用量明细失败')
  } finally {
    tableLoading.value = false
  }
}

async function reloadAll() {
  await Promise.all([fetchSummary(), fetchLogs()])
}

function doSearch() {
  searchParams.pageNum = 1
  reloadAll()
}

function onTableChange(pag: { current?: number; pageSize?: number }) {
  if (pag.current != null) searchParams.pageNum = pag.current
  if (pag.pageSize != null) searchParams.pageSize = Math.min(pag.pageSize, 100)
  fetchLogs()
}

onMounted(async () => {
  await loadSwitch()
  await reloadAll()
})
</script>

<template>
  <div class="ops-center-page admin-theme-page">
    <a-breadcrumb class="admin-breadcrumb">
      <a-breadcrumb-item>
        <router-link to="/">首页</router-link>
      </a-breadcrumb-item>
      <a-breadcrumb-item>
        <router-link to="/admin/ops">运维中心</router-link>
      </a-breadcrumb-item>
      <a-breadcrumb-item>AI 用量</a-breadcrumb-item>
    </a-breadcrumb>

    <div class="admin-page-hero">
      <div class="hero-left">
        <div class="hero-title">AI 用量与调用</div>
        <div class="hero-subtitle">查看 Token、耗时与场景分布（不含 Prompt 全文）</div>
      </div>
    </div>

    <div class="ops-layout">
      <OpsCenterNav active-key="usage" />

      <section class="ops-main">
        <a-alert
          v-if="!switchLoading && !usageLogEnabled"
          type="warning"
          show-icon
          class="ops-alert"
          message="当前未记录用量"
        >
          <template #description>
            请在
            <router-link to="/admin/settings/ops">站点设置 → 运维开关</router-link>
            开启
            <code>usage_log_enabled</code>
            ，再发起知识库问答或蒸馏后查看。
          </template>
        </a-alert>

        <a-card :bordered="false" title="筛选">
          <div class="filter-row">
            <a-range-picker v-model:value="dateRange" :allow-clear="false" />
            <a-select
              v-model:value="searchParams.scene"
              allow-clear
              placeholder="全部场景"
              style="width: 180px"
              :options="OPS_USAGE_SCENE_OPTIONS"
            />
            <a-input
              v-model:value="searchParams.userId"
              allow-clear
              placeholder="用户 ID"
              style="width: 140px"
            />
            <a-button type="primary" @click="doSearch">查询</a-button>
          </div>
        </a-card>

        <a-spin :spinning="summaryLoading">
          <div class="summary-grid">
            <a-card :bordered="false" class="stat-card">
              <a-statistic title="调用次数" :value="summary?.requestCount ?? 0" />
            </a-card>
            <a-card :bordered="false" class="stat-card">
              <a-statistic title="成功" :value="summary?.successCount ?? 0" />
            </a-card>
            <a-card :bordered="false" class="stat-card">
              <a-statistic title="失败" :value="summary?.errorCount ?? 0" />
            </a-card>
            <a-card :bordered="false" class="stat-card">
              <div class="stat-label">总 Tokens</div>
              <div class="stat-value">{{ formatNullableNumber(summary?.totalTokens) }}</div>
            </a-card>
            <a-card :bordered="false" class="stat-card">
              <div class="stat-label">平均耗时</div>
              <div class="stat-value">{{ formatNullableNumber(summary?.avgLatencyMs, ' ms') }}</div>
            </a-card>
          </div>

          <div class="breakdown-row">
            <a-card :bordered="false" title="按场景" class="breakdown-card">
              <div v-if="bySceneEntries.length === 0" class="empty-hint">暂无数据</div>
              <div v-else class="tag-list">
                <a-tag v-for="[scene, count] in bySceneEntries" :key="scene">
                  {{ formatOpsUsageScene(scene) }} · {{ count }}
                </a-tag>
              </div>
            </a-card>
            <a-card :bordered="false" title="按模型" class="breakdown-card">
              <div v-if="byModelEntries.length === 0" class="empty-hint">暂无数据</div>
              <div v-else class="tag-list">
                <a-tag v-for="[model, count] in byModelEntries" :key="model">
                  {{ model }} · {{ count }}
                </a-tag>
              </div>
            </a-card>
          </div>
        </a-spin>

        <a-card :bordered="false" title="调用明细">
          <a-table
            row-key="id"
            :loading="tableLoading"
            :columns="columns"
            :data-source="dataSource"
            :pagination="{
              current: searchParams.pageNum,
              pageSize: searchParams.pageSize,
              total,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (t: number) => `共 ${t} 条`,
            }"
            @change="onTableChange"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'createTime'">
                {{ formatTime(record.createTime) }}
              </template>
              <template v-else-if="column.key === 'scene'">
                {{ formatOpsUsageScene(record.scene) }}
              </template>
              <template v-else-if="column.key === 'tokens'">
                {{ formatNullableNumber(record.totalTokens) }}
              </template>
              <template v-else-if="column.key === 'latency'">
                {{ formatNullableNumber(record.responseTimeMs, ' ms') }}
              </template>
              <template v-else-if="column.key === 'status'">
                <a-tag :color="statusColor(record.status)">{{ record.status || '-' }}</a-tag>
              </template>
              <template v-else-if="column.key === 'userId'">
                {{ record.userId ?? '-' }}
              </template>
              <template v-else-if="column.key === 'detail'">
                <span
                  v-if="record.status === 'error' && record.errorMessage"
                  class="err-text"
                  :title="record.errorMessage"
                >
                  {{ truncate(record.errorMessage) }}
                </span>
                <span v-else class="muted" :title="record.requestSummary || undefined">
                  {{ truncate(record.requestSummary) }}
                </span>
              </template>
            </template>
          </a-table>
        </a-card>
      </section>
    </div>
  </div>
</template>

<style scoped>
.ops-center-page {
  max-width: 1280px;
}

.ops-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 16px;
  align-items: start;
}

.ops-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ops-alert {
  margin-bottom: 0;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.stat-card {
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.3;
}

.breakdown-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 4px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.empty-hint {
  color: var(--color-text-muted);
  font-size: 13px;
}

.muted {
  color: var(--color-text-secondary);
  font-size: 13px;
}

.err-text {
  color: #cf1322;
  font-size: 13px;
}

@media (max-width: 1100px) {
  .summary-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .ops-layout {
    grid-template-columns: 1fr;
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .breakdown-row {
    grid-template-columns: 1fr;
  }
}
</style>
