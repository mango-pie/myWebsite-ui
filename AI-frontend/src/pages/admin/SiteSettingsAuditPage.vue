<script setup lang="ts">
/**
 * 全站设置 · 变更审计
 * 路由：/admin/settings/audit
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { bootstrapSiteSettings, pageSiteSettingAudit } from '@/api/siteSettings'
import SiteSettingsNav from '@/components/admin/SiteSettingsNav.vue'
import '@/assets/admin-theme.css'

type AuditRow = API.SiteSettingAuditVO

const bootLoading = ref(false)
const loading = ref(false)
const bootstrap = ref<API.SiteSettingsBootstrapVO | null>(null)
const dataSource = ref<AuditRow[]>([])
const total = ref(0)

const searchParams = reactive<API.SiteSettingAuditQueryRequest>({
  module: undefined,
  pageNum: 1,
  pageSize: 20,
})

const sidebarModules = computed(() => bootstrap.value?.modules ?? [])

const moduleOptions = computed(() =>
  (bootstrap.value?.modules || [])
    .filter((m) => m.code)
    .map((m) => ({
      label: m.displayName || m.code!,
      value: m.code!,
    })),
)

const columns = [
  { title: '时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
  { title: '模块', dataIndex: 'module', key: 'module', width: 120 },
  { title: 'Key', dataIndex: 'settingKey', key: 'settingKey', width: 200, ellipsis: true },
  { title: '操作', dataIndex: 'action', key: 'action', width: 100 },
  { title: '变更', key: 'diff', ellipsis: true },
  { title: '操作人', dataIndex: 'operatorId', key: 'operatorId', width: 100 },
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

function formatDiff(row: AuditRow): string {
  const oldV = row.oldValue ?? ''
  const newV = row.newValue ?? ''
  if (!oldV && !newV) return '-'
  return `${oldV || '(空)'} → ${newV || '(空)'}`
}

function actionColor(action?: string): string {
  if (action === 'RESET') return 'orange'
  if (action === 'UPDATE') return 'blue'
  return 'default'
}

async function loadBootstrap() {
  bootLoading.value = true
  try {
    const res = await bootstrapSiteSettings()
    if (res.data.code === 0 && res.data.data) {
      bootstrap.value = res.data.data
    } else {
      message.error(res.data.message || '加载设置引导失败')
    }
  } catch {
    message.error('加载设置引导失败')
  } finally {
    bootLoading.value = false
  }
}

async function fetchData() {
  loading.value = true
  try {
    const res = await pageSiteSettingAudit({
      module: searchParams.module || undefined,
      pageNum: searchParams.pageNum,
      pageSize: searchParams.pageSize,
    })
    if (res.data.code === 0 && res.data.data) {
      dataSource.value = res.data.data.records ?? []
      total.value = res.data.data.totalRow ?? 0
    } else {
      message.error(res.data.message || '加载审计记录失败')
    }
  } catch {
    message.error('加载审计记录失败')
  } finally {
    loading.value = false
  }
}

function doSearch() {
  searchParams.pageNum = 1
  fetchData()
}

function onTableChange(pag: { current?: number; pageSize?: number }) {
  if (pag.current != null) searchParams.pageNum = pag.current
  if (pag.pageSize != null) searchParams.pageSize = pag.pageSize
  fetchData()
}

onMounted(async () => {
  await loadBootstrap()
  await fetchData()
})
</script>

<template>
  <div class="site-settings-page admin-theme-page">
    <a-breadcrumb class="admin-breadcrumb">
      <a-breadcrumb-item>
        <router-link to="/">首页</router-link>
      </a-breadcrumb-item>
      <a-breadcrumb-item>管理</a-breadcrumb-item>
      <a-breadcrumb-item>
        <router-link to="/admin/settings">站点设置</router-link>
      </a-breadcrumb-item>
      <a-breadcrumb-item>变更审计</a-breadcrumb-item>
    </a-breadcrumb>

    <div class="admin-page-hero">
      <div class="hero-left">
        <div class="hero-title">变更审计</div>
        <div class="hero-subtitle">查看全站设置的保存与重置记录（敏感值已由后端打码）</div>
      </div>
    </div>

    <a-spin :spinning="bootLoading">
      <div class="settings-layout">
        <SiteSettingsNav :modules="sidebarModules" active-key="audit" />

        <section class="settings-main">
          <a-card :bordered="false" title="审计记录">
            <div class="filter-row">
              <a-select
                v-model:value="searchParams.module"
                allow-clear
                placeholder="全部模块"
                style="width: 220px"
                :options="moduleOptions"
              />
              <a-button type="primary" @click="doSearch">查询</a-button>
            </div>

            <a-table
              row-key="id"
              :loading="loading"
              :columns="columns"
              :data-source="dataSource"
              :pagination="{
                current: searchParams.pageNum,
                pageSize: searchParams.pageSize,
                total,
                showSizeChanger: true,
                showTotal: (t: number) => `共 ${t} 条`,
              }"
              @change="onTableChange"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'createTime'">
                  {{ formatTime(record.createTime) }}
                </template>
                <template v-else-if="column.key === 'action'">
                  <a-tag :color="actionColor(record.action)">{{ record.action || '-' }}</a-tag>
                </template>
                <template v-else-if="column.key === 'diff'">
                  <span class="diff-text" :title="formatDiff(record)">{{ formatDiff(record) }}</span>
                </template>
                <template v-else-if="column.key === 'operatorId'">
                  {{ record.operatorId ?? '-' }}
                </template>
              </template>
            </a-table>
          </a-card>
        </section>
      </div>
    </a-spin>
  </div>
</template>

<style scoped>
.site-settings-page {
  max-width: 1280px;
}

.settings-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 16px;
  align-items: start;
}

.settings-main {
  min-width: 0;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.diff-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  color: var(--color-text-secondary);
  word-break: break-all;
}

@media (max-width: 900px) {
  .settings-layout {
    grid-template-columns: 1fr;
  }
}
</style>
