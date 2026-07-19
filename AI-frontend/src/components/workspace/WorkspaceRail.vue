<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronRight } from 'lucide-vue-next'
import { useLoginUserStore } from '@/stores/loginUser'
import { useCapabilitiesStore } from '@/stores/capabilities'
import {
  WORKSPACE_HOME,
  WORKSPACE_NAV,
  filterWorkspaceNav,
  isNavActive,
  type WorkspaceNavItem,
} from '@/config/workspaceNav'
import { resolveDiaryMenuClickPath } from '@/composables/useDiaryNav'
import { getChatEntryPath } from '@/utils/chatSession'

const router = useRouter()
const route = useRoute()
const loginUserStore = useLoginUserStore()
const capsStore = useCapabilitiesStore()
const openGroups = ref<Record<string, boolean>>({})

const hovering = ref(false)
const expanded = computed(() => hovering.value)

const items = computed(() =>
  filterWorkspaceNav(WORKSPACE_NAV, loginUserStore.loginUser ?? null, {
    loaded: capsStore.loaded,
    enabled: capsStore.enabled,
  }),
)

const resolvePath = (item: WorkspaceNavItem) => {
  let path = item.path
  if (path === '/chat') path = getChatEntryPath()
  if (path === '/diary') path = resolveDiaryMenuClickPath(route.path)
  return path
}

const go = (item: WorkspaceNavItem) => {
  const path = resolvePath(item)
  if (path !== route.path) router.push(path)
}

const toggleGroup = (key: string) => {
  openGroups.value[key] = !openGroups.value[key]
}

const isGroupOpen = (item: WorkspaceNavItem) => {
  if (openGroups.value[item.key] != null) return openGroups.value[item.key]
  return item.children?.some((c) => isNavActive(c, route.path) || route.path.startsWith(c.path)) ?? false
}
</script>

<template>
  <aside class="workspace-rail">
    <div
      class="rail-inner"
      :class="{ 'is-expanded': expanded }"
      @mouseenter="hovering = true"
      @mouseleave="hovering = false"
    >
      <button
        type="button"
        class="rail-item rail-item--home"
        :class="{ 'is-active': route.path === '/' }"
        :title="WORKSPACE_HOME.label"
        @click="go(WORKSPACE_HOME)"
      >
        <component :is="WORKSPACE_HOME.icon" :size="20" :stroke-width="2" />
        <span v-if="expanded" class="rail-item__label">{{ WORKSPACE_HOME.label }}</span>
      </button>

      <div class="rail-divider" />

      <nav class="rail-nav" aria-label="工作台导航">
        <template v-for="item in items" :key="item.key">
          <div v-if="item.children?.length" class="rail-group">
            <button
              type="button"
              class="rail-item"
              :class="{ 'is-active': isNavActive(item, route.path) || item.children.some((c) => route.path.startsWith(c.path)) }"
              :title="item.label"
              @click="expanded ? toggleGroup(item.key) : go(item)"
            >
              <component :is="item.icon" :size="20" :stroke-width="2" />
              <span v-if="expanded" class="rail-item__label">{{ item.label }}</span>
              <ChevronRight
                v-if="expanded"
                class="rail-item__chevron"
                :class="{ 'is-open': isGroupOpen(item) }"
                :size="14"
              />
            </button>
            <div v-if="expanded && isGroupOpen(item)" class="rail-sub">
              <button
                v-for="child in item.children"
                :key="child.key"
                type="button"
                class="rail-item rail-item--sub"
                :class="{ 'is-active': route.path.startsWith(child.path) || (child.matchPrefix && route.path.startsWith(child.matchPrefix)) }"
                :title="child.label"
                @click="go(child)"
              >
                <component :is="child.icon" :size="16" :stroke-width="2" />
                <span class="rail-item__label">{{ child.label }}</span>
              </button>
            </div>
          </div>
          <button
            v-else
            type="button"
            class="rail-item"
            :class="{ 'is-active': isNavActive(item, route.path) }"
            :title="item.label"
            @click="go(item)"
          >
            <component :is="item.icon" :size="20" :stroke-width="2" />
            <span v-if="expanded" class="rail-item__label">{{ item.label }}</span>
          </button>
        </template>
      </nav>
    </div>
  </aside>
</template>

<style scoped>
.workspace-rail {
  width: 64px;
  flex-shrink: 0;
  position: relative;
  z-index: 30;
}

.rail-inner {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  width: 64px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
  padding: 12px 8px;
  background: rgba(26, 22, 37, 0.92);
  border-right: 1px solid var(--color-border);
  overflow: hidden;
  transition:
    width 0.24s cubic-bezier(0.2, 0.65, 0.2, 1),
    box-shadow 0.24s ease;
}

.rail-inner.is-expanded {
  width: 216px;
  box-shadow: 12px 0 40px rgba(0, 0, 0, 0.4);
  background: rgba(26, 22, 37, 0.98);
}

.rail-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.rail-divider {
  height: 1px;
  margin: 6px 8px;
  background: var(--color-border);
}

.rail-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 44px;
  padding: 0 12px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-secondary);
  font-family: inherit;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.rail-item :deep(svg) {
  flex-shrink: 0;
  transition: transform 0.2s ease, color 0.2s ease;
}

.rail-item:hover {
  background: var(--color-primary-12);
  color: var(--color-text-primary);
}

.rail-item:hover :deep(svg) {
  transform: scale(1.08);
  color: var(--color-primary-light);
}

.rail-item.is-active {
  background: var(--color-primary-20);
  color: #fff;
}

.rail-item.is-active :deep(svg) {
  color: var(--color-primary-light);
}

.rail-item__label {
  flex: 1;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rail-item__chevron {
  transition: transform 0.2s ease;
  opacity: 0.7;
}

.rail-item__chevron.is-open {
  transform: rotate(90deg);
}

.rail-item--sub {
  min-height: 36px;
  padding-left: 18px;
  font-size: 13px;
}

.rail-sub {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 4px;
}

@media (max-width: 768px) {
  .workspace-rail {
    width: 0;
  }

  .rail-inner,
  .rail-inner.is-expanded {
    top: auto;
    left: 0;
    right: 0;
    bottom: 0;
    width: auto;
    flex-direction: row;
    align-items: center;
    gap: 0;
    padding: 6px 8px calc(6px + env(safe-area-inset-bottom, 0px));
    border-right: none;
    border-top: 1px solid var(--color-border);
    box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.3);
    z-index: 90;
  }

  .rail-nav {
    flex-direction: row;
    flex: 1;
    overflow-x: auto;
    overflow-y: hidden;
  }

  .rail-divider,
  .rail-group .rail-sub,
  .rail-item__label,
  .rail-item__chevron {
    display: none;
  }

  .rail-item,
  .rail-item--home {
    width: 48px;
    min-height: 48px;
    padding: 0;
    justify-content: center;
    flex-shrink: 0;
  }

  .rail-group {
    display: contents;
  }
}
</style>
