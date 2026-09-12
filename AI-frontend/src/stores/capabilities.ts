/**
 * 后端模块能力（Pinia）
 * - 调用 GET /app/modules（Axios baseURL 已含 /api）
 * - 探测成功：响应里缺省的 key 视为关闭
 * - 探测失败（旧后端无此接口 / 网络错误）：fail-open，避免把现有入口全部藏掉
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getAppModules } from '@/api/modulesController'
import {
  isModuleEnabled,
  parseModulesPayload,
} from '@/config/modules'
import type { CapabilityGate } from '@/utils/moduleGate'
import { syncCapabilitySnapshot } from '@/utils/capabilitySnapshot'

function extractModulesMap(data: unknown): unknown {
  if (!data || typeof data !== 'object') return undefined
  const rec = data as Record<string, unknown>
  if ('modules' in rec) return rec.modules && typeof rec.modules === 'object' ? rec.modules : {}
  const values = Object.values(rec)
  if (values.length && values.every((value) => typeof value === 'boolean')) return rec
  return undefined
}

export const useCapabilitiesStore = defineStore('capabilities', () => {
  const modules = ref<Record<string, boolean>>({})
  const loaded = ref(false)
  const probeFailed = ref(false)
  let inflight: Promise<void> | null = null

  function enabled(name: string): boolean {
    if (probeFailed.value) return true
    if (!loaded.value) return false
    return isModuleEnabled(modules.value, name)
  }

  function asGate(): CapabilityGate {
    return { loaded: loaded.value, enabled }
  }

  function persistSnapshot() {
    syncCapabilitySnapshot(loaded.value, modules.value, probeFailed.value)
  }

  async function load() {
    if (inflight) return inflight
    inflight = (async () => {
      try {
        const res = await getAppModules()
        const raw = extractModulesMap(res.data.data)
        if (res.data.code === 0 && raw && typeof raw === 'object') {
          modules.value = parseModulesPayload(raw)
          probeFailed.value = false
        } else {
          probeFailed.value = true
          modules.value = {}
        }
      } catch {
        probeFailed.value = true
        modules.value = {}
      } finally {
        loaded.value = true
        persistSnapshot()
        inflight = null
      }
    })()
    return inflight
  }

  async function ensureLoaded() {
    if (loaded.value) return
    await load()
  }

  return {
    modules,
    loaded,
    probeFailed,
    enabled,
    asGate,
    load,
    ensureLoaded,
    isEnabled: enabled,
    fetchModules: load,
  }
})
