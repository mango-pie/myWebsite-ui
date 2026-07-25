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
  <div class="workspace-rail">
    <div class="rail-inner">
      <button
        type="button"
        class="book-bookmark rail-item--home"
        :class="{ 'is-active': route.path === '/' }"
        :title="WORKSPACE_HOME.label"
        @click="go(WORKSPACE_HOME)"
      >
        <component :is="WORKSPACE_HOME.icon" :size="18" :stroke-width="1.75" />
        <span class="book-bookmark__label">{{ WORKSPACE_HOME.label }}</span>
      </button>

      <div class="rail-divider" />

      <nav class="rail-nav" aria-label="功能导航">
        <template v-for="item in items" :key="item.key">
          <div v-if="item.children?.length" class="rail-group">
            <button
              type="button"
              class="book-bookmark"
              :class="{
                'is-active':
                  isNavActive(item, route.path) ||
                  item.children.some((c) => route.path.startsWith(c.path)),
              }"
              :title="item.label"
              @click="toggleGroup(item.key)"
            >
              <component :is="item.icon" :size="18" :stroke-width="1.75" />
              <span class="book-bookmark__label">{{ item.label }}</span>
              <ChevronRight
                class="book-bookmark__chevron"
                :class="{ 'is-open': isGroupOpen(item) }"
                :size="14"
              />
            </button>
            <div v-if="isGroupOpen(item)" class="book-sub">
              <button
                v-for="child in item.children"
                :key="child.key"
                type="button"
                class="book-bookmark book-bookmark--sub"
                :class="{
                  'is-active':
                    route.path.startsWith(child.path) ||
                    (child.matchPrefix && route.path.startsWith(child.matchPrefix)),
                }"
                :title="child.label"
                @click="go(child)"
              >
                <component :is="child.icon" :size="15" :stroke-width="1.75" />
                <span class="book-bookmark__label">{{ child.label }}</span>
              </button>
            </div>
          </div>
          <button
            v-else
            type="button"
            class="book-bookmark"
            :class="{ 'is-active': isNavActive(item, route.path) }"
            :title="item.label"
            @click="go(item)"
          >
            <component :is="item.icon" :size="18" :stroke-width="1.75" />
            <span class="book-bookmark__label">{{ item.label }}</span>
          </button>
        </template>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.workspace-rail {
  width: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.rail-inner {
  display: flex;
  flex-direction: column;
  gap: 0.2em;
  flex: 1;
  min-height: 0;
  font-family: var(--font-sans);
}

.rail-nav {
  display: flex;
  flex-direction: column;
  gap: 0.15em;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.rail-divider {
  height: 1px;
  margin: 0.55em 0.6em;
  background: linear-gradient(90deg, transparent, var(--book-rule, var(--color-border)), transparent);
}

.rail-group {
  display: flex;
  flex-direction: column;
}
</style>
