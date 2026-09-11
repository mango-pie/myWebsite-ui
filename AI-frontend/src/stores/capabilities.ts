/**
 * 模块能力全局状态（Pinia Store）
 * - modules：后端 GET /app/modules 返回的各业务模块开关（缺省视为关闭）
 * - loaded：是否已成功拉取（用于「未加载时不隐藏」的容错，避免首屏误伤）
 * - enabled(name)：模块是否启用
 * - load()：拉取模块开关；失败时仍标记 loaded，按缺省关闭处理
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getAppModules } from '@/api/appController'
import type { CapabilityGate } from '@/utils/moduleGate'
import { syncCapabilitySnapshot } from '@/utils/capabilitySnapshot'

export const useCapabilitiesStore = defineStore('capabilities', () => {
  const modules = ref<Record<string, boolean>>({})
  const loaded = ref(false)

  function enabled(name: string): boolean {
    return modules.value[name] === true
  }

  /** 供菜单 / 入口过滤使用，避免组件直接依赖 store 形状 */
  function asGate(): CapabilityGate {
    return { loaded: loaded.value, enabled }
  }

  async function load() {
    try {
      const res = await getAppModules()
      if (res.data?.code === 0 && res.data?.data?.modules) {
        modules.value = res.data.data.modules
      }
    } catch (error) {
      console.log('模块能力拉取失败:', error)
    } finally {
      loaded.value = true
      syncCapabilitySnapshot(true, modules.value)
    }
  }

  return {
    modules,
    loaded,
    enabled,
    asGate,
    load,
    /** 兼容 overhaul 期间的 useModuleStore 命名 */
    isEnabled: enabled,
    fetchModules: load,
  }
})
