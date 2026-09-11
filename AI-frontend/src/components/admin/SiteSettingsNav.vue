<script setup lang="ts">
/**
 * 全站设置侧栏：Tab 完全由 props.modules 渲染（来自 SettingModuleRegistry 过滤结果）。
 * 禁止在此硬编码业务模块清单。
 */
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'

const props = defineProps<{
  modules: API.SettingModuleVO[]
  /** 当前激活的模块 code */
  activeKey: string
}>()

const router = useRouter()

const navModules = computed(() => (props.modules || []).filter((m) => m.code))

function selectModule(mod: API.SettingModuleVO) {
  if (!mod.code) return
  if (!mod.writable) {
    message.info(`${mod.displayName || mod.code}${mod.phase ? `（${mod.phase}）` : ''}尚未接入`)
    return
  }
  if (mod.code === props.activeKey) return
  router.push(`/admin/settings/${mod.code}`)
}
</script>

<template>
  <aside class="settings-nav">
    <div class="nav-kicker">模 块</div>
    <p v-if="!navModules.length" class="nav-empty">暂无可用设置模块</p>
    <RouterLink
      v-for="mod in navModules"
      :key="mod.code"
      :to="mod.writable ? `/admin/settings/${mod.code}` : ''"
      class="nav-item"
      :class="{
        active: mod.code === activeKey,
        disabled: !mod.writable,
      }"
      @click.prevent="selectModule(mod)"
    >
      <span class="nav-label">{{ mod.displayName || mod.code }}</span>
      <span v-if="!mod.writable" class="nav-badge">未接入</span>
      <span v-else-if="mod.phase" class="nav-phase">{{ mod.phase }}</span>
    </RouterLink>
  </aside>
</template>

<style scoped>
.settings-nav {
  background: #fffdf8;
  border: 1.5px dashed var(--hairline);
  border-radius: var(--radius-card);
  padding: 16px 12px;
  position: sticky;
  top: 16px;
}

.nav-kicker {
  font: 10px var(--fd);
  color: var(--ink-soft);
  letter-spacing: 0.16em;
  padding: 4px 10px 10px;
}

.nav-empty {
  margin: 0;
  padding: 8px 10px;
  font: 13px var(--fb);
  color: var(--ink-soft);
}

.nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border: 1.5px solid transparent;
  background: transparent;
  color: var(--ink);
  border-radius: 10px;
  padding: 10px 12px;
  cursor: pointer;
  margin-bottom: 4px;
  text-align: left;
  text-decoration: none;
  font: 14px var(--fd);
  letter-spacing: 0.04em;
  transition: all 0.2s;
}

.nav-item:hover:not(.disabled) {
  background: var(--paper-surface);
}

.nav-item.active {
  background: var(--accent);
  color: #fffdf8;
  border-color: transparent;
}

.nav-item.disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.nav-badge,
.nav-phase {
  font-size: 11px;
  color: var(--ink-soft);
  white-space: nowrap;
}

.nav-item.active .nav-phase {
  color: rgba(255, 253, 248, 0.8);
}

@media (max-width: 900px) {
  .settings-nav {
    position: static;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .nav-kicker,
  .nav-empty {
    width: 100%;
  }

  .nav-item {
    width: auto;
    margin-bottom: 0;
  }
}
</style>
