<script setup lang="ts">
/**
 * 全站设置中心
 * 路由：/admin/settings/:module
 * Tab 列表：SettingModuleRegistry（bootstrap / modules）∩ GET /app/modules
 * MODULE_GROUPS 仅用于模块内字段分组，不是 Tab 源。
 */
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import {
  bootstrapSiteSettings,
  getSiteSettingSchema,
  getSiteSettingValues,
  listSiteSettingModules,
  resetSiteSettingModule,
  testIntegrationConnection,
  updateSiteSettingValues,
} from '@/api/siteSettings'
import SiteSettingsNav from '@/components/admin/SiteSettingsNav.vue'
import SettingFieldControl from '@/components/admin/SettingFieldControl.vue'
import { useModuleStore } from '@/stores/modules'
import {
  filterSettingModules,
  resolveSettingsModuleRoute,
} from '@/utils/settingModules'

type FormValue = string | number | boolean | null | undefined

interface SettingGroup {
  key: string
  title: string
  /** 前缀匹配（foo. / default_）或精确 key */
  prefixes: string[]
  testTarget?: string
  tip?: string
  /** reading 高级组使用折叠 */
  collapsible?: boolean
  defaultCollapsed?: boolean
}

/** 模块内字段分组（不是 Tab 列表，勿删） */
const MODULE_GROUPS: Record<string, SettingGroup[]> = {
  integration: [
    { key: 'knowledge_ai', title: '知识库 AI', prefixes: ['knowledge.ai.'], testTarget: 'knowledge_ai' },
    { key: 'jina', title: 'Jina', prefixes: ['knowledge.jina.'], testTarget: 'jina' },
    {
      key: 'chat',
      title: '聊天 / Agent / 图片转述 / 分段',
      prefixes: ['chat.'],
      testTarget: 'agent',
    },
    { key: 'codegen', title: '代码生成', prefixes: ['codegen.'], testTarget: 'codegen' },
    { key: 'astrbot', title: 'AstrBot', prefixes: ['astrbot.'], testTarget: 'astrbot' },
    {
      key: 'tts',
      title: 'GPT-SoVITS / TTS',
      prefixes: ['tts.'],
      testTarget: 'tts',
    },
    {
      key: 'upload_deploy',
      title: '上传与部署路径',
      prefixes: ['upload.', 'app.deploy.'],
      tip: '变更 upload.path 后静态资源映射可能仍用启动时路径，需重启生效',
    },
    { key: 'minio', title: 'MinIO', prefixes: ['knowledge.minio.'], testTarget: 'minio' },
  ],
  chat: [
    { key: 'agent', title: 'Agent', prefixes: ['agent.'] },
    { key: 'image_caption', title: '图片转述', prefixes: ['image_caption.'] },
    { key: 'segmentation', title: '朗读分段', prefixes: ['segmentation.'] },
    { key: 'attachment', title: '附件', prefixes: ['attachment_cache_ttl_minutes'] },
  ],
  tts: [
    {
      key: 'general',
      title: '总开关与语言',
      prefixes: ['enabled', 'default_'],
    },
    { key: 'seed', title: 'Seed 音色', prefixes: ['seed_voice.'] },
    {
      key: 'limits',
      title: '超时与上传限制',
      prefixes: ['connect_', 'read_', 'ref_audio.'],
    },
  ],
  knowledge: [
    { key: 'ai', title: '模型运行参数', prefixes: ['ai.'] },
    { key: 'rag', title: 'RAG', prefixes: ['rag.'] },
    { key: 'jina', title: 'Jina', prefixes: ['jina.'] },
  ],
  reading: [
    { key: 'distill', title: '蒸馏', prefixes: ['distill.'] },
    { key: 'publish', title: '发布与确认', prefixes: ['publish.', 'redistill.'] },
    {
      key: 'advanced',
      title: '高级',
      prefixes: ['search.', 'ingest.'],
      collapsible: true,
      defaultCollapsed: true,
    },
  ],
  blog: [
    { key: 'list', title: '列表', prefixes: ['list.'] },
    { key: 'post', title: '文章', prefixes: ['post.'] },
    { key: 'editor', title: '编辑器', prefixes: ['editor.'] },
  ],
  study: [
    { key: 'focus', title: '专注', prefixes: ['focus.'] },
    { key: 'habit', title: '习惯', prefixes: ['habit.'] },
    { key: 'stats_workspace', title: '统计与界面', prefixes: ['stats.', 'workspace.'] },
  ],
  diary: [
    { key: 'privacy_export', title: '隐私与导出', prefixes: ['privacy.', 'export.'] },
    { key: 'list', title: '列表', prefixes: ['list.'] },
  ],
  app: [
    { key: 'codegen', title: '代码生成', prefixes: ['codegen.'] },
    { key: 'deploy', title: '部署', prefixes: ['deploy.'] },
  ],
  ops: [
    {
      key: 'switches',
      title: '运维开关',
      prefixes: ['debug_expose_error_detail', 'usage_log_enabled', 'usage_log_retain_days'],
    },
  ],
}

const CREDENTIAL_TIP_MODULES = new Set(['chat', 'tts', 'knowledge', 'reading', 'app'])

const SIDE_EFFECT_FALLBACK: Record<string, string> = {
  'ai.embedding_dimension': '变更后需对已有文档手动重建索引，不会自动重建',
  'rag.chunk_size': '变更后需对已有文档手动重建索引，不会自动重建',
  'rag.chunk_overlap': '变更后需对已有文档手动重建索引，不会自动重建',
}

const route = useRoute()
const router = useRouter()
const moduleStore = useModuleStore()

const bootLoading = ref(false)
const formLoading = ref(false)
const saving = ref(false)
const testingTarget = ref('')
const unavailableHint = ref('')

const bootstrap = ref<API.SiteSettingsBootstrapVO | null>(null)
const registryModules = ref<API.SettingModuleVO[]>([])
const schema = ref<API.SettingModuleSchemaVO | null>(null)
const meta = ref<Record<string, API.SettingFieldMetaVO>>({})
const sensitiveHints = ref<Record<string, string>>({})
const initialSnapshot = ref<Record<string, FormValue>>({})
const formState = reactive<Record<string, FormValue>>({})

const currentModule = computed(() => String(route.params.module || '').trim())

const visibleModules = computed(() =>
  filterSettingModules(registryModules.value, moduleStore.modules, moduleStore.loaded),
)

const isWritable = computed(() => {
  const mod = visibleModules.value.find((m) => m.code === currentModule.value)
  return !!mod?.writable
})

const displayName = computed(
  () =>
    schema.value?.displayName
    || visibleModules.value.find((m) => m.code === currentModule.value)?.displayName
    || currentModule.value,
)

const isIntegration = computed(() => currentModule.value === 'integration')
const showCredentialTip = computed(() => CREDENTIAL_TIP_MODULES.has(currentModule.value))

const fields = computed(() => schema.value?.fields ?? [])

const currentGroups = computed(() => MODULE_GROUPS[currentModule.value] || [])

const hasGroups = computed(() => currentGroups.value.length > 0)

function isSensitiveValue(v: unknown): v is API.SettingSensitiveValue {
  return !!v && typeof v === 'object' && 'configured' in (v as object)
}

function fieldSource(key: string): string {
  return meta.value[key]?.source || 'default'
}

function fieldSideEffect(field: API.SettingFieldSchemaVO): string {
  const key = field.key || ''
  return field.sideEffect || SIDE_EFFECT_FALLBACK[key] || ''
}

function matchGroup(fieldKey: string, prefixes: string[]): boolean {
  return prefixes.some((p) => {
    if (p.endsWith('.') || p.endsWith('_')) return fieldKey.startsWith(p)
    return fieldKey === p || fieldKey.startsWith(`${p}.`)
  })
}

function fieldsOfGroup(group: SettingGroup): API.SettingFieldSchemaVO[] {
  return fields.value.filter((f) => f.key && matchGroup(f.key, group.prefixes))
}

const visibleGroups = computed(() =>
  currentGroups.value.filter((g) => !g.collapsible && fieldsOfGroup(g).length > 0),
)

const collapsibleGroups = computed(() =>
  currentGroups.value.filter((g) => g.collapsible && fieldsOfGroup(g).length > 0),
)

const ungroupedFields = computed(() => {
  if (!hasGroups.value) return fields.value
  return fields.value.filter((f) => {
    if (!f.key) return true
    return !currentGroups.value.some((g) => matchGroup(f.key!, g.prefixes))
  })
})

function clearFormState() {
  Object.keys(formState).forEach((k) => {
    delete formState[k]
  })
  meta.value = {}
  sensitiveHints.value = {}
  initialSnapshot.value = {}
}

function applyTemplateValues(
  fieldList: API.SettingFieldSchemaVO[],
  values: Record<string, unknown> | undefined,
  metaMap: Record<string, API.SettingFieldMetaVO> | undefined,
) {
  clearFormState()
  meta.value = metaMap || {}
  const hints: Record<string, string> = {}

  for (const field of fieldList) {
    const key = field.key
    if (!key) continue
    const raw = values?.[key]
    if (field.sensitive) {
      formState[key] = ''
      if (isSensitiveValue(raw) && raw.configured && raw.hint) {
        hints[key] = raw.hint
      }
      continue
    }
    if (field.valueType === 'bool') {
      formState[key] = Boolean(raw)
    } else if (field.valueType === 'int' || field.valueType === 'long' || field.valueType === 'double') {
      formState[key] = raw == null || raw === '' ? undefined : Number(raw)
    } else {
      formState[key] = raw == null ? '' : String(raw)
    }
  }
  sensitiveHints.value = hints
  initialSnapshot.value = { ...formState }
}

function firstVisibleCode(): string | undefined {
  return resolveSettingsModuleRoute(undefined, visibleModules.value).target
}

async function syncRouteToVisibleModules(options?: { silent?: boolean }) {
  const resolved = resolveSettingsModuleRoute(currentModule.value, visibleModules.value)

  if (resolved.status === 'empty') {
    schema.value = null
    clearFormState()
    return
  }

  if (resolved.status === 'redirect' && resolved.target) {
    if (currentModule.value) {
      unavailableHint.value = `「${currentModule.value}」未启用或没有对应设置，已跳转到可用模块`
      if (!options?.silent) {
        message.warning(unavailableHint.value)
      }
    }
    await router.replace(`/admin/settings/${resolved.target}`)
  }
}

async function loadRegistry() {
  bootLoading.value = true
  unavailableHint.value = ''
  try {
    if (!moduleStore.loaded) {
      await moduleStore.fetchModules()
    }

    const res = await bootstrapSiteSettings()
    if (res.data.code === 0 && res.data.data) {
      bootstrap.value = res.data.data
      registryModules.value = res.data.data.modules || []
    } else {
      const listRes = await listSiteSettingModules()
      if (listRes.data.code === 0 && listRes.data.data) {
        registryModules.value = listRes.data.data
      } else {
        message.error(res.data.message || listRes.data.message || '加载设置模块失败')
        registryModules.value = []
      }
    }
    await syncRouteToVisibleModules()
  } catch (e) {
    try {
      const listRes = await listSiteSettingModules()
      if (listRes.data.code === 0 && listRes.data.data) {
        registryModules.value = listRes.data.data
        await syncRouteToVisibleModules()
        return
      }
    } catch {
      // fall through
    }
    message.error(apiErrorMessage(e, '加载设置引导失败'))
  } finally {
    bootLoading.value = false
  }
}

async function loadModule(moduleCode: string) {
  const exist = visibleModules.value.find((m) => m.code === moduleCode)
  if (!exist) {
    schema.value = null
    clearFormState()
    return
  }
  if (!exist.writable) {
    schema.value = { module: exist.code, displayName: exist.displayName, fields: [] }
    clearFormState()
    return
  }
  formLoading.value = true
  try {
    const [schemaRes, valuesRes] = await Promise.all([
      getSiteSettingSchema(moduleCode),
      getSiteSettingValues(moduleCode),
    ])
    if (schemaRes.data.code !== 0 || !schemaRes.data.data) {
      message.error(schemaRes.data.message || '加载 schema 失败')
      return
    }
    if (valuesRes.data.code !== 0 || !valuesRes.data.data) {
      message.error(valuesRes.data.message || '加载配置失败')
      return
    }
    schema.value = schemaRes.data.data
    applyTemplateValues(
      schemaRes.data.data.fields || [],
      valuesRes.data.data.values,
      valuesRes.data.data.meta,
    )
  } catch (e) {
    message.error(apiErrorMessage(e, '加载模块配置失败'))
  } finally {
    formLoading.value = false
  }
}

function buildItems(): Record<string, unknown> {
  const items: Record<string, unknown> = {}
  for (const field of fields.value) {
    const key = field.key
    if (!key) continue
    const value = formState[key]
    if (field.sensitive) {
      const text = value == null ? '' : String(value)
      items[key] = text.trim() ? text : ''
      continue
    }
    if (field.valueType === 'bool') {
      items[key] = Boolean(value)
    } else if (field.valueType === 'int' || field.valueType === 'long') {
      items[key] = value === '' || value == null ? null : Number(value)
    } else if (field.valueType === 'double') {
      items[key] = value === '' || value == null ? null : Number(value)
    } else {
      items[key] = value == null ? '' : value
    }
  }
  return items
}

function valueChanged(key: string, next: unknown): boolean {
  const prev = initialSnapshot.value[key]
  if (typeof next === 'boolean' || typeof prev === 'boolean') {
    return Boolean(next) !== Boolean(prev)
  }
  const a = next == null ? '' : String(next)
  const b = prev == null ? '' : String(prev)
  return a !== b
}

function collectDangerInfo(items: Record<string, unknown>): { labels: string[]; effects: string[] } {
  const labels: string[] = []
  const effects: string[] = []
  for (const field of fields.value) {
    const key = field.key
    if (!key || !field.danger) continue
    if (!(key in items)) continue
    if (field.sensitive && !String(items[key] ?? '').trim()) continue
    if (!valueChanged(key, items[key])) continue
    labels.push(field.label || key)
    const effect = fieldSideEffect(field)
    if (effect && !effects.includes(effect)) effects.push(effect)
  }
  return { labels, effects }
}

async function doSave() {
  if (!isWritable.value || saving.value) return
  const items = buildItems()
  const { labels: dangerLabels, effects } = collectDangerInfo(items)

  const run = async () => {
    saving.value = true
    try {
      const res = await updateSiteSettingValues(currentModule.value, { items })
      if (res.data.code === 0) {
        message.success('已保存，对新请求生效')
        await loadModule(currentModule.value)
        if (currentModule.value === 'site') {
          await loadRegistry()
        }
      } else {
        message.error(res.data.message || '保存失败')
      }
    } catch (e) {
      message.error(apiErrorMessage(e, '保存失败'))
    } finally {
      saving.value = false
    }
  }

  if (dangerLabels.length) {
    const effectText = effects.length ? `\n\n${effects.join('\n')}` : ''
    Modal.confirm({
      title: '确认保存高风险项？',
      content: `以下配置属于高风险项：${dangerLabels.join('、')}。请确认后继续。${effectText}`,
      okText: '确认保存',
      okType: 'danger',
      onOk: run,
    })
    return
  }
  await run()
}

function doReset() {
  if (!isWritable.value) return
  Modal.confirm({
    title: '恢复默认配置？',
    content: isIntegration.value
      ? '将清除本模块在数据库中的覆盖（含密钥），回落到 YAML / 环境变量默认值。'
      : '将清除本模块在数据库中的覆盖，回落到默认值。',
    okText: '恢复默认',
    okType: 'danger',
    onOk: async () => {
      try {
        const res = await resetSiteSettingModule(currentModule.value)
        if (res.data.code === 0) {
          message.success('已恢复默认')
          await loadModule(currentModule.value)
          if (currentModule.value === 'site') {
            await loadRegistry()
          }
        } else {
          message.error(res.data.message || '恢复失败')
        }
      } catch (e) {
        message.error(apiErrorMessage(e, '恢复失败'))
      }
    },
  })
}

async function doTest(target?: string) {
  if (!target || testingTarget.value) return
  testingTarget.value = target
  try {
    const res = await testIntegrationConnection({ target })
    if (res.data.code === 0 && res.data.data) {
      const data = res.data.data
      if (data.ok) {
        message.success(`${data.message || '连通成功'}（${data.latencyMs ?? 0}ms）`)
      } else {
        message.warning(`${data.message || '连通失败'}（${data.latencyMs ?? 0}ms）`)
      }
    } else {
      message.error(res.data.message || '测试连接失败')
    }
  } catch (e) {
    message.error(apiErrorMessage(e, '测试连接失败'))
  } finally {
    testingTarget.value = ''
  }
}

function apiErrorMessage(e: unknown, fallback: string) {
  const err = e as {
    message?: string
    response?: { data?: { message?: string } }
  }
  return err?.response?.data?.message || err?.message || fallback
}

onMounted(async () => {
  await loadRegistry()
  if (visibleModules.value.some((m) => m.code === currentModule.value)) {
    await loadModule(currentModule.value)
  }
})

watch(
  () => currentModule.value,
  async (code, prev) => {
    if (code === prev) return
    if (!registryModules.value.length && !bootstrap.value) return
    if (visibleModules.value.some((m) => m.code === code)) {
      unavailableHint.value = ''
      await loadModule(code)
    } else if (firstVisibleCode()) {
      await syncRouteToVisibleModules()
    } else {
      schema.value = null
      clearFormState()
    }
  },
)

watch(
  () => [moduleStore.loaded, moduleStore.modules] as const,
  async () => {
    if (!moduleStore.loaded) return
    if (!registryModules.value.length) return
    await syncRouteToVisibleModules({ silent: true })
  },
  { deep: true },
)
</script>

<template>
  <div class="site-settings-page">
    <div class="page-header">
      <div>
        <h1>站点设置</h1>
        <p class="subtitle">
          {{ bootstrap?.siteName || '纸间' }}
          <template v-if="bootstrap?.siteSlogan"> · {{ bootstrap.siteSlogan }}</template>
          — 按后端模块清单管理可运营参数
        </p>
      </div>
    </div>

    <p v-if="unavailableHint" class="unavailable">{{ unavailableHint }}</p>

    <div v-if="bootLoading" class="hint">加载设置模块…</div>

    <div v-else class="settings-layout">
      <SiteSettingsNav :modules="visibleModules" :active-key="currentModule" />

      <section class="settings-main">
        <div class="module-card">
          <div class="module-title-row">
            <h2>{{ displayName || '选择模块' }}</h2>
            <span v-if="currentModule && isWritable" class="pill" data-tone="sky">可编辑</span>
            <span v-else-if="currentModule" class="pill" data-tone="outline">未接入</span>
          </div>

          <div v-if="!visibleModules.length" class="empty-box">暂无可用设置模块</div>

          <div v-else-if="!currentModule || !visibleModules.some((m) => m.code === currentModule)" class="empty-box">
            正在跳转到可用设置…
          </div>

          <div v-else-if="!isWritable" class="empty-box">该模块尚未接入，请等待后续阶段开放</div>

          <div v-else-if="formLoading" class="hint">加载配置…</div>

          <template v-else>
            <p v-if="isIntegration" class="tip-banner">
              密钥类字段留空表示不修改；已配置项仅显示后四位掩码。
            </p>
            <p v-else-if="showCredentialTip" class="tip-banner">
              连接地址与 API Key 请到
              <RouterLink to="/admin/settings/integration">集成与密钥</RouterLink>
              配置，本页仅管理行为参数。
            </p>

            <template v-if="hasGroups">
              <div v-for="group in visibleGroups" :key="group.key" class="settings-group">
                <div class="group-head">
                  <div>
                    <div class="group-title">{{ group.title }}</div>
                    <div v-if="group.tip" class="group-tip">{{ group.tip }}</div>
                  </div>
                  <button
                    v-if="group.testTarget"
                    type="button"
                    class="btn ghost sm"
                    :disabled="testingTarget === group.testTarget"
                    @click="doTest(group.testTarget)"
                  >
                    {{ testingTarget === group.testTarget ? '测试中…' : '测试连接' }}
                  </button>
                </div>

                <div
                  v-for="field in fieldsOfGroup(group)"
                  :key="field.key"
                  class="form-field"
                >
                  <label>{{ field.label || field.key }}</label>
                  <div class="field-extra">
                    <span v-if="field.description">{{ field.description }}</span>
                    <span v-if="fieldSource(field.key!) === 'db'" class="chip chip-custom">已自定义</span>
                    <span v-if="field.danger" class="chip chip-danger">高风险</span>
                    <span v-if="field.sensitive && sensitiveHints[field.key!]" class="sensitive-hint">
                      已配置 · {{ sensitiveHints[field.key!] }}
                    </span>
                    <span v-if="fieldSideEffect(field)" class="side-effect-hint">
                      {{ fieldSideEffect(field) }}
                    </span>
                  </div>
                  <SettingFieldControl
                    :field="field"
                    :model-value="formState[field.key!]"
                    @update:model-value="formState[field.key!] = $event"
                  />
                </div>
              </div>

              <details
                v-for="group in collapsibleGroups"
                :key="group.key"
                class="settings-group settings-advanced"
                :open="!group.defaultCollapsed"
              >
                <summary class="group-title">{{ group.title }}</summary>
                <div
                  v-for="field in fieldsOfGroup(group)"
                  :key="field.key"
                  class="form-field"
                >
                  <label>{{ field.label || field.key }}</label>
                  <div class="field-extra">
                    <span v-if="field.description">{{ field.description }}</span>
                    <span v-if="fieldSource(field.key!) === 'db'" class="chip chip-custom">已自定义</span>
                  </div>
                  <SettingFieldControl
                    :field="field"
                    :model-value="formState[field.key!]"
                    @update:model-value="formState[field.key!] = $event"
                  />
                </div>
              </details>

              <div v-if="ungroupedFields.length" class="settings-group">
                <div
                  v-for="field in ungroupedFields"
                  :key="field.key"
                  class="form-field"
                >
                  <label>{{ field.label || field.key }}</label>
                  <SettingFieldControl
                    :field="field"
                    :model-value="formState[field.key!]"
                    @update:model-value="formState[field.key!] = $event"
                  />
                </div>
              </div>
            </template>

            <div v-else class="settings-group">
              <div
                v-for="field in fields"
                :key="field.key"
                class="form-field"
              >
                <label>{{ field.label || field.key }}</label>
                <div class="field-extra">
                  <span v-if="field.description">{{ field.description }}</span>
                  <span v-if="fieldSource(field.key!) === 'db'" class="chip chip-custom">已自定义</span>
                  <span v-if="field.danger" class="chip chip-danger">高风险</span>
                </div>
                <SettingFieldControl
                  :field="field"
                  :model-value="formState[field.key!]"
                  @update:model-value="formState[field.key!] = $event"
                />
              </div>
            </div>

            <div v-if="isWritable" class="admin-action-bar">
              <button type="button" class="btn" :disabled="saving" @click="doSave">
                {{ saving ? '保存中…' : '保存' }}
              </button>
              <button type="button" class="btn ghost" :disabled="saving" @click="doReset">
                恢复默认
              </button>
            </div>
          </template>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1.5px dashed var(--hairline);
}

.page-header h1 {
  margin: 0 0 8px;
  font-size: 40px;
}

.subtitle {
  margin: 0;
  color: var(--ink-soft);
  font-size: 15px;
}

.hint {
  color: var(--ink-soft);
  font: 13px var(--fd);
}

.unavailable {
  margin: 0 0 16px;
  padding: 10px 14px;
  border: 1.5px dashed var(--hairline);
  border-radius: 10px;
  background: var(--paper-surface);
  color: var(--ink);
  font: 13px var(--fb);
}

.settings-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 20px;
  align-items: start;
}

.settings-main {
  min-width: 0;
}

.module-card {
  background: #fffdf8;
  border: 1.5px dashed var(--hairline);
  border-radius: var(--radius-card);
  padding: 22px 24px 28px;
  box-shadow: var(--shadow-day);
}

.module-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}

.module-title-row h2 {
  margin: 0;
  font-size: 26px;
}

.empty-box {
  padding: 32px 12px;
  text-align: center;
  color: var(--ink-soft);
  font: 14px var(--fb);
}

.tip-banner {
  margin: 0 0 16px;
  padding: 10px 14px;
  border-radius: 10px;
  background: var(--paper-surface);
  color: var(--ink);
  font: 13px var(--fb);
}

.settings-group {
  border: 1.5px dashed var(--hairline);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  background: rgba(245, 237, 219, 0.35);
}

.group-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.group-title {
  font: 15px var(--fd);
  color: var(--ink);
  letter-spacing: 0.04em;
}

.group-tip {
  margin-top: 4px;
  font-size: 12px;
  color: var(--ink-soft);
  line-height: 1.5;
}

.settings-advanced summary {
  cursor: pointer;
  margin-bottom: 12px;
}

.form-field {
  margin-bottom: 16px;
}

.form-field label {
  display: block;
  font: 14px var(--fd);
  color: var(--ink);
  margin-bottom: 6px;
}

.field-extra {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  line-height: 1.5;
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--ink-soft);
}

.chip {
  display: inline-flex;
  padding: 1px 8px;
  border-radius: 999px;
  font: 11px var(--fd);
  letter-spacing: 0.04em;
}

.chip-custom {
  background: var(--st-cream);
}

.chip-danger {
  background: #f5c6c6;
}

.sensitive-hint,
.side-effect-hint {
  color: var(--ink-soft);
  font-size: 12px;
}

.side-effect-hint {
  width: 100%;
  color: #b7791f;
}

.admin-action-bar {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.btn.sm {
  padding: 6px 14px;
  font-size: 13px;
}

@media (max-width: 900px) {
  .settings-layout {
    grid-template-columns: 1fr;
  }

  .page-header h1 {
    font-size: 32px;
  }
}
</style>
