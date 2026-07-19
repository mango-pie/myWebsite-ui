<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import PublicHeader from '@/components/PublicHeader.vue'
import GlobalFooter from '@/components/GlobalFooter.vue'
import { useBackgroundSlideshow } from '@/composables/useBackgroundSlideshow'
import { useLoginUserStore } from '@/stores/loginUser'

const route = useRoute()
const loginUserStore = useLoginUserStore()
const isScrolled = ref(false)
const { layerA, layerB, activeLayer, hasImages, fadeDuration } = useBackgroundSlideshow()

const room = computed(() => (route.meta.room as string) || 'public')

const onScroll = () => {
  isScrolled.value = window.scrollY > 20
}

onMounted(() => {
  loginUserStore.fetchLoginUser()
  window.addEventListener('scroll', onScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <div class="public-layout" :data-room="room">
    <div class="background-effects" :style="{ '--bg-fade-duration': fadeDuration }">
      <img
        v-if="hasImages && layerA"
        class="background-effects__image"
        :class="{ 'is-active': activeLayer === 'a' }"
        :src="layerA"
        alt=""
      />
      <img
        v-if="hasImages && layerB"
        class="background-effects__image"
        :class="{ 'is-active': activeLayer === 'b' }"
        :src="layerB"
        alt=""
      />
      <div class="background-effects__overlay" />
      <div class="background-effects__blob background-effects__blob--1" />
      <div class="background-effects__blob background-effects__blob--2" />
    </div>

    <header class="public-layout__header" :class="{ 'is-scrolled': isScrolled }">
      <PublicHeader />
    </header>

    <main class="public-layout__content">
      <RouterView v-slot="{ Component, route: viewRoute }">
        <component :is="Component" :key="viewRoute.fullPath" />
      </RouterView>
    </main>

    <footer class="public-layout__footer">
      <GlobalFooter />
    </footer>
  </div>
</template>

<style scoped>
.public-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.background-effects {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.background-effects__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity var(--bg-fade-duration, 1.2s) ease;
}

.background-effects__image.is-active {
  opacity: 0.28;
}

.background-effects__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, rgba(26, 22, 37, 0.75) 0%, rgba(45, 36, 56, 0.6) 100%);
}

.background-effects__blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.22;
}

.background-effects__blob--1 {
  width: 420px;
  height: 420px;
  background: linear-gradient(135deg, #e879a9, #7c9ce0);
  top: -140px;
  left: -100px;
  animation: blobFloat 22s ease-in-out infinite;
}

.background-effects__blob--2 {
  width: 340px;
  height: 340px;
  background: linear-gradient(135deg, #f4b8c1, #7c9ce0);
  bottom: -120px;
  right: -60px;
  animation: blobFloat 26s ease-in-out infinite reverse;
}

@keyframes blobFloat {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(40px, -30px) scale(1.08);
  }
}

.public-layout__header {
  position: relative;
  z-index: 100;
  height: 64px;
  flex-shrink: 0;
}

.public-layout__content {
  flex: 1;
  position: relative;
  z-index: 1;
  padding: 24px;
}

.public-layout__footer {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 12px 16px 20px;
  background: rgba(26, 22, 37, 0.78);
  border-top: 1px solid var(--color-border);
  backdrop-filter: blur(16px);
}

@media (max-width: 768px) {
  .public-layout__content {
    padding: 12px;
  }
}
</style>
