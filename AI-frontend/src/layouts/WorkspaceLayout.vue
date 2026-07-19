<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import WorkspaceRail from '@/components/workspace/WorkspaceRail.vue'
import { useLoginUserStore } from '@/stores/loginUser'
import { siteConfig } from '@/config/site'

const route = useRoute()
const loginUserStore = useLoginUserStore()

const room = computed(() => (route.meta.room as string) || 'workspace')
const year = new Date().getFullYear()

onMounted(() => {
  loginUserStore.fetchLoginUser()
})
</script>

<template>
  <div class="workspace-layout" :data-room="room">
    <div class="workspace-layout__bg" />
    <WorkspaceRail />
    <div class="workspace-layout__main">
      <div class="workspace-layout__content">
        <RouterView v-slot="{ Component, route: viewRoute }">
          <KeepAlive include="ChatPage">
            <component
              :is="Component"
              v-if="viewRoute.meta.keepAlive"
              :key="viewRoute.path"
            />
          </KeepAlive>
          <component
            :is="Component"
            v-if="!viewRoute.meta.keepAlive"
            :key="viewRoute.fullPath"
          />
        </RouterView>
      </div>
      <div class="workspace-layout__bar">
        © {{ year }} {{ siteConfig.siteName }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.workspace-layout {
  min-height: 100vh;
  display: flex;
  position: relative;
  background: var(--color-bg-primary);
}

.workspace-layout__bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 60% 40% at 10% 0%, rgba(232, 121, 169, 0.1), transparent 60%),
    radial-gradient(ellipse 50% 35% at 90% 100%, rgba(124, 156, 224, 0.08), transparent 55%),
    linear-gradient(160deg, #1a1625 0%, #2d2438 50%, #1a1625 100%);
}

.workspace-layout__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
  min-height: 100vh;
}

.workspace-layout__content {
  flex: 1;
  min-height: 0;
  padding: 16px 20px;
  overflow: auto;
}

.workspace-layout__bar {
  flex-shrink: 0;
  padding: 8px 16px;
  font-size: 12px;
  color: var(--color-text-muted);
  text-align: center;
  border-top: 1px solid var(--color-border);
}

@media (max-width: 768px) {
  .workspace-layout__content {
    padding: 12px 12px 72px;
  }

  .workspace-layout__bar {
    display: none;
  }
}
</style>
