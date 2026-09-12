<script setup lang="ts">
/**
 * 站点设置 · 业务模块开关可视化
 * 路由：/admin/settings/modules
 *
 * 三层对照：
 * - schema / DB 期望：GET /admin/site-settings/modules/{code}
 * - 运行时生效：GET /app/modules
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { message, Modal } from 'ant-design-vue'
import {
  listSiteSettingModules,
  getSiteSettingSchema,
  getSiteSettingValues,
  updateSiteSettingValues,
  resetSiteSettingModule,
  bootstrapSiteSettings,
} from '@/api/siteSettings'
import { getAppModules } from '@/api/modulesController'
import { useCapabilitiesStore } from '@/stores/capabilities'
import { MODULE_KEYS, MODULE_LABELS, normalizeModuleKey, parseModulesPayload } from '@/config/modules'
import SiteSettingsNav from '@/components/admin/SiteSettingsNav.vue'
import StationRoomShell from '@/components/shared/StationRoomShell.vue'
import '@/assets/admin-theme.css'

interface ModuleRow {
  key: string
  label: string
  description?: string
  dbValue: boolean
  effective: boolean
  defaultValue: boolean
}

const MODULES_SETTING_CODE = 'modules'

const FALLBACK_LABELS: Record<string, string> = {
  ...MODULE_LABELS,
  worklog: '工作日志',
}

const caps = useCapabilitiesStore()
const bootLoading = ref(false)
const loading = ref(false)
const saving = ref(false)
const backendReady = ref(false)
const bootstrap = ref<API.SiteSettingsBootstrapVO | null>(null)
const rows = ref<ModuleRow[]>([])
const pendingValues = reactive<Record<string, boolean>>({})

const sidebarModules = computed(() => bootstrap.value?.modules ?? [])
const dirtyCount = computed(
  () => rows.value.filter((row) => (pendingValues[row.key] ?? row.dbValue) !== row.dbValue).length,
)

function apiErrorMessage(e: unknown, fallback: string) {
  const err = e as { message?: string; response?: { data?: { message?: string } } }
  return err?.response?.data?.message || err?.message || fallback
}

async function loadEffective(): Promise<Record<string, boolean>> {
  const res = await getAppModules()
  const payload = res.data?.data
  const raw = payload?.modules ?? payload
  return parseModulesPayload(raw)
}

function asBool(raw: unknown, fallback: boolean): boolean {
  if (typeof raw === 'boolean') return raw
  if (raw === 'true' || raw === 1 || raw === '1') return true
  if (raw === 'false' || raw === 0 || raw === '0') return false
  return fallback
}

function fillPending(next: ModuleRow[]) {
  for (const key of Object.keys(pendingValues)) {
    delete pendingValues[key]
  }
  for (const row of next) {
    pendingValues[row.key] = row.dbValue
  }
}

function rowsFromEffective(effective: Record<string, boolean>): ModuleRow[] {
  const keys = Object.keys(effective).length ? Object.keys(effective) : [...MODULE_KEYS]
  return keys.map((key) => {
    const on = effective[key] === true
    return {
      key,
      label: FALLBACK_LABELS[key] ?? key,
      dbValue: on,
      effective: on,
      defaultValue: on,
    }
  })
}

async function loadBootstrap() {
  bootLoading.value = true
  try {
    const res = await bootstrapSiteSettings()
    if (res.data.code === 0 && res.data.data) {
      bootstrap.value = res.data.data
    }
  } catch (e) {
    message.error(apiErrorMessage(e, '加载设置引导失败'))
  } finally {
    bootLoading.value = false
  }
}

async function load() {
  loading.value = true
  try {
    const [moduleListRes, effective] = await Promise.all([listSiteSettingModules(), loadEffective()])
    const settingModules = moduleListRes.data?.data ?? []
    const modulesSetting = settingModules.find((m) => m.code === MODULES_SETTING_CODE)

    if (!modulesSetting || modulesSetting.writable === false) {
      backendReady.value = false
      const next = rowsFromEffective(effective)
      rows.value = next
      fillPending(next)
      return
    }

    backendReady.value = true
    const [schemaRes, valuesRes] = await Promise.all([
      getSiteSettingSchema(MODULES_SETTING_CODE),
      getSiteSettingValues(MODULES_SETTING_CODE),
    ])
    const fields = schemaRes.data?.data?.fields ?? []
    const values = valuesRes.data?.data?.values ?? {}

    const next = fields
      .filter((field) => typeof field.key === 'string' && field.key)
      .map((field) => {
        const key = normalizeModuleKey(field.key as string)
        const defaultValue = field.defaultValue !== false
        const raw = values[field.key as string]
        const dbValue = asBool(raw, defaultValue)
        return {
          key,
          label: field.label ?? FALLBACK_LABELS[key] ?? key,
          description: field.description,
          dbValue,
          effective: effective[key] === true,
          defaultValue,
        }
      })
    rows.value = next
    fillPending(next)
  } catch (e) {
    message.error(apiErrorMessage(e, '站点设置加载失败'))
  } finally {
    loading.value = false
  }
}

function pendingOf(row: ModuleRow): boolean {
  return pendingValues[row.key] ?? row.dbValue
}

function isDirty(row: ModuleRow): boolean {
  return pendingOf(row) !== row.dbValue
}

function discardChanges() {
  for (const row of rows.value) {
    pendingValues[row.key] = row.dbValue
  }
}

async function refreshAfterWrite() {
  await caps.load()
  await load()
}

function saveChanges() {
  const changes = rows.value.filter(isDirty)
  if (!changes.length) return
  const changeLines = changes
    .map((row) => `「${row.label}」→ ${pendingOf(row) ? '开启' : '关闭'}`)
    .join('；')
  Modal.confirm({
    title: '确认修改模块开关？',
    content: `本次变更：${changeLines}。关闭的模块将对全站用户隐藏入口。对应后端 Bean 的物理卸载需要重启应用。`,
    okText: '确认保存',
    cancelText: '再想想',
    async onOk() {
      saving.value = true
      try {
        const items = Object.fromEntries(changes.map((row) => [row.key, pendingOf(row)]))
        const res = await updateSiteSettingValues(MODULES_SETTING_CODE, { items })
        if (res.data?.code === 0) {
          message.success('模块开关已保存')
          await refreshAfterWrite()
        } else {
          message.error(res.data?.message || '保存失败')
        }
      } catch (e) {
        message.error(apiErrorMessage(e, '保存失败，请重试'))
      } finally {
        saving.value = false
      }
    },
  })
}

function resetToDefaults() {
  Modal.confirm({
    title: '恢复默认模块开关？',
    content: '将清除所有模块开关的站点级覆盖，回到部署默认值。',
    okText: '确认重置',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      saving.value = true
      try {
        const res = await resetSiteSettingModule(MODULES_SETTING_CODE)
        if (res.data?.code === 0) {
          message.success('已恢复默认')
          await refreshAfterWrite()
        } else {
          message.error(res.data?.message || '重置失败')
        }
      } catch (e) {
        message.error(apiErrorMessage(e, '重置失败'))
      } finally {
        saving.value = false
      }
    },
  })
}

onMounted(async () => {
  await loadBootstrap()
  await load()
})
</script>

<template>
  <StationRoomShell brand-path="/" note-label="Station · 业务模块" room="settings">
    <div class="site-settings-page admin-theme-page">
      <a-breadcrumb class="admin-breadcrumb">
        <a-breadcrumb-item>
          <router-link to="/">首页</router-link>
        </a-breadcrumb-item>
        <a-breadcrumb-item>管理</a-breadcrumb-item>
        <a-breadcrumb-item>
          <router-link to="/admin/settings">站点设置</router-link>
        </a-breadcrumb-item>
        <a-breadcrumb-item>业务模块</a-breadcrumb-item>
      </a-breadcrumb>

      <div class="admin-page-hero">
        <div class="hero-left">
          <div class="hero-title">业务模块</div>
          <div class="hero-subtitle">
            对照数据库期望开关与后端运行时生效状态。关闭后前台入口立即隐藏。
          </div>
        </div>
        <div v-if="backendReady" class="hero-right">
          <a-button size="small" :disabled="!dirtyCount || saving" @click="discardChanges">
            撤销变更
          </a-button>
          <a-button size="small" :disabled="saving" danger @click="resetToDefaults">恢复默认</a-button>
          <a-button type="primary" size="small" :disabled="!dirtyCount" :loading="saving" @click="saveChanges">
            保存{{ dirtyCount ? `（${dirtyCount} 项）` : '' }}
          </a-button>
        </div>
      </div>

      <a-spin :spinning="bootLoading || loading">
        <div class="settings-layout">
          <SiteSettingsNav :modules="sidebarModules" active-key="modules" />

          <section class="settings-main">
            <a-alert
              v-if="backendReady"
              type="info"
              show-icon
              style="margin-bottom: 16px"
              message="保存后导航与路由门禁即时刷新。「生效」列来自 GET /app/modules。"
            />
            <a-alert
              v-else
              type="warning"
              show-icon
              style="margin-bottom: 16px"
              message="后端尚未接入可写的 modules 设置模块，当前仅只读展示运行时开关。"
            />

            <a-empty v-if="!rows.length && !loading" description="没有模块状态可展示" />
            <ul v-else class="module-list">
              <li v-for="row in rows" :key="row.key" class="module-row">
                <div class="module-main">
                  <div class="module-info">
                    <span class="module-label">{{ row.label }}</span>
                    <code class="module-key">{{ row.key }}</code>
                    <span
                      v-if="backendReady && row.dbValue !== row.effective"
                      class="mismatch"
                      title="数据库配置与后端运行时状态不一致：运行时覆盖尚未生效，或配置缓存尚未刷新"
                    >
                      未生效
                    </span>
                  </div>
                  <p v-if="backendReady && row.description" class="module-desc">{{ row.description }}</p>
                </div>
                <div class="module-controls">
                  <span class="effective-tag" :class="{ off: !row.effective }">
                    生效：{{ row.effective ? '开' : '关' }}
                  </span>
                  <a-switch
                    v-if="backendReady"
                    v-model:checked="pendingValues[row.key]"
                    :disabled="saving"
                    checked-children="开"
                    un-checked-children="关"
                  />
                </div>
              </li>
            </ul>
          </section>
        </div>
      </a-spin>
    </div>
  </StationRoomShell>
</template>

<style scoped>
.site-settings-page {
  max-width: 1280px;
}

.admin-page-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.hero-right {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.settings-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 16px;
  align-items: start;
}

.settings-main {
  min-width: 0;
  background: rgba(255, 255, 255, 0.82);
  border: 1.5px solid rgba(255, 255, 255, 0.95);
  border-radius: 18px;
  padding: 18px 20px;
  backdrop-filter: blur(16px);
}

.module-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.module-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 4px;
  border-bottom: 1px dashed var(--color-border);
}

.module-row:last-child {
  border-bottom: none;
}

.module-main {
  flex: 1;
  min-width: 0;
}

.module-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.module-label {
  font-size: 14px;
  color: var(--color-text-primary);
}

.module-key {
  font-size: 11px;
  color: var(--color-text-muted);
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 1px 6px;
}

.module-desc {
  margin: 3px 4px 0;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.module-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.effective-tag {
  font-size: 11px;
  color: #2e7d32;
  background: rgba(46, 125, 50, 0.08);
  border-radius: 6px;
  padding: 2px 8px;
  white-space: nowrap;
}

.effective-tag.off {
  color: #9e5b00;
  background: rgba(158, 91, 0, 0.08);
}

.mismatch {
  font-size: 11px;
  color: #b35900;
  border: 1px dashed #d19b5a;
  border-radius: 6px;
  padding: 1px 6px;
  cursor: help;
}

@media (max-width: 900px) {
  .settings-layout {
    grid-template-columns: 1fr;
  }

  .module-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
