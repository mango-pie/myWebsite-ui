/**
 * 模块能力全局状态（Pinia Store）
 * - modules：后端 GET /app/modules 返回的各业务模块开关（缺省视为关闭）
 * - loaded：是否已成功拉取（用于「未加载时不隐藏」的容错，避免首屏误伤）
 * - enabled(name)：模块是否启用；未加载或缺省均返回 false，但调用方应结合 loaded 判断
 * - load()：拉取模块开关，失败时保持 loaded=false 不阻断
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getAppModules } from '@/api/appController'

export const useCapabilitiesStore = defineStore('capabilities', () => {
  const modules = ref<Record<string, boolean>>({})
  const loaded = ref(false)

  /** 缺省视为关闭，避免误显示（用普通函数，避免 computed 返回函数在 Pinia 下难用） */
  function enabled(name: string): boolean {
    return modules.value[name] === true
  }

  async function load() {
    try {
      const res = await getAppModules()
      if (res.data.code === 0 && res.data.data) {
        modules.value = res.data.data.modules ?? {}
        loaded.value = true
      }
    } catch (error) {
      // 拉取失败：保持 loaded=false，菜单/守卫按「未加载不隐藏」容错
      console.log('模块能力拉取失败:', error)
    }
  }

  return { modules, loaded, enabled, load }
})
