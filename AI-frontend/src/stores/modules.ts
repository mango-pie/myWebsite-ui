import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getAppModules } from '@/api/appController'

export const useModuleStore = defineStore('modules', () => {
  const modules = ref<Record<string, boolean>>({})
  const loaded = ref(false)

  async function fetchModules() {
    try {
      const res = await getAppModules()
      if (res.data?.code === 0 && res.data?.data?.modules) {
        modules.value = res.data.data.modules
      }
    } catch {
      // modules endpoint may not exist; treat all as off
    } finally {
      loaded.value = true
    }
  }

  function isEnabled(key: string): boolean {
    return modules.value[key] === true
  }

  return { modules, loaded, fetchModules, isEnabled }
})
