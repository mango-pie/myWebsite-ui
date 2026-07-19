<script setup lang="ts">
import { computed, onMounted, ref, type Component } from 'vue'
import { useRouter } from 'vue-router'
import {
  BookOpen,
  NotebookPen,
  LibraryBig,
  FlaskConical,
  MessagesSquare,
} from 'lucide-vue-next'
import { listMyAppByPage } from '@/api/appController'
import { getPublishedBlogPostPage } from '@/api/blogPostController'
import { useLoginUserStore } from '@/stores/loginUser'
import { siteConfig } from '@/config/site'
import DailyHitokoto from '@/components/home/DailyHitokoto.vue'
import HomeClock from '@/components/home/HomeClock.vue'
import { vTilt } from '@/composables/useTilt'
import { useCountUp } from '@/composables/useCountUp'

interface RoomCard {
  key: string
  title: string
  hint: string
  path: string
  icon: Component
  accent: string
  requireLogin?: boolean
  meta?: string
}

const router = useRouter()
const loginUserStore = useLoginUserStore()

const latestTitle = ref('')
const postTotal = ref(0)
const myTotal = ref(0)

const postDisplay = useCountUp(postTotal)
const myDisplay = useCountUp(myTotal)

const isLoggedIn = computed(() => !!loginUserStore.loginUser.id)

const rooms = computed<RoomCard[]>(() => {
  const list: RoomCard[] = [
    {
      key: 'blog',
      title: siteConfig.rooms.blog.title,
      hint: siteConfig.rooms.blog.hint,
      path: '/blog',
      icon: BookOpen,
      accent: 'rose',
      meta: latestTitle.value
        ? `最近：${latestTitle.value}`
        : postTotal.value
          ? `${postTotal.value} 篇随笔`
          : '还没有随笔',
    },
    {
      key: 'lab',
      title: siteConfig.rooms.lab.title,
      hint: siteConfig.rooms.lab.hint,
      path: '/lab',
      icon: FlaskConical,
      accent: 'violet',
      meta: isLoggedIn.value && myTotal.value ? `${myTotal.value} 个实验` : '生成可运行的小应用',
    },
  ]

  if (isLoggedIn.value) {
    list.splice(
      1,
      0,
      {
        key: 'diary',
        title: siteConfig.rooms.diary.title,
        hint: siteConfig.rooms.diary.hint,
        path: '/diary',
        icon: NotebookPen,
        accent: 'lilac',
        requireLogin: true,
        meta: '打开今日手账',
      },
      {
        key: 'knowledge',
        title: siteConfig.rooms.knowledge.title,
        hint: siteConfig.rooms.knowledge.hint,
        path: '/knowledge',
        icon: LibraryBig,
        accent: 'blue',
        requireLogin: true,
        meta: '检索与问答',
      },
    )
    list.push({
      key: 'chat',
      title: siteConfig.rooms.chat.title,
      hint: siteConfig.rooms.chat.hint,
      path: '/chat',
      icon: MessagesSquare,
      accent: 'rose',
      requireLogin: true,
      meta: '进入对话工作台',
    })
  }

  return list
})

const enter = (path: string) => {
  router.push(path)
}

onMounted(async () => {
  try {
    const res = await getPublishedBlogPostPage({ pageNum: 1, pageSize: 1 })
    if (res.data.code === 0 && res.data.data) {
      postTotal.value = res.data.data.totalRow || 0
      latestTitle.value = res.data.data.records?.[0]?.title || ''
    }
  } catch {
    /* ignore */
  }

  if (loginUserStore.loginUser.id) {
    try {
      const res = await listMyAppByPage({ pageNum: 1, pageSize: 1 })
      if (res.data.code === 0 && res.data.data) {
        myTotal.value = res.data.data.totalRow || 0
      }
    } catch {
      /* ignore */
    }
  }
})
</script>

<template>
  <div class="home-hall">
    <div class="hall-top">
      <section class="hall-hero">
        <p class="hall-hero__eyebrow">{{ siteConfig.siteSubtitle }}</p>
        <h1 class="hall-hero__brand">{{ siteConfig.siteName }}</h1>
        <p class="hall-hero__bio">{{ siteConfig.bio }}</p>
        <div class="hall-hero__quote">
          <DailyHitokoto variant="plain" />
        </div>
      </section>
      <aside class="hall-clock">
        <HomeClock variant="plain" />
      </aside>
    </div>

    <section class="hall-rooms" aria-label="房间入口">
      <button
        v-for="(room, index) in rooms"
        :key="room.key"
        v-tilt
        type="button"
        class="room-door"
        :class="`room-door--${room.accent}`"
        :data-room-key="room.key"
        :style="{ '--i': index }"
        @click="enter(room.path)"
      >
        <span class="room-door__glow" aria-hidden="true" />
        <span class="room-door__icon">
          <component :is="room.icon" :size="36" :stroke-width="1.75" />
        </span>
        <span class="room-door__body">
          <span class="room-door__title">{{ room.title }}</span>
          <span class="room-door__hint">{{ room.hint }}</span>
          <span class="room-door__meta">
            <template v-if="room.key === 'blog' && !latestTitle && postTotal">
              <span class="room-door__count">{{ postDisplay }}</span> 篇随笔
            </template>
            <template v-else-if="room.key === 'lab' && isLoggedIn && myTotal">
              <span class="room-door__count">{{ myDisplay }}</span> 个实验
            </template>
            <template v-else>{{ room.meta }}</template>
          </span>
        </span>
      </button>
    </section>
  </div>
</template>

<style scoped>
.home-hall {
  max-width: 1080px;
  margin: 0 auto;
  padding: 24px 8px 64px;
  min-height: calc(100vh - 180px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 48px;
}

.hall-top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 280px);
  gap: 28px;
  align-items: start;
}

.hall-hero {
  text-align: left;
  min-width: 0;
  animation: riseIn 500ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
}

.hall-clock {
  padding: 16px 18px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(12px);
  animation: riseIn 500ms cubic-bezier(0.22, 1, 0.36, 1) 120ms backwards;
}

.hall-hero__eyebrow {
  margin: 0 0 12px;
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.hall-hero__brand {
  margin: 0 0 16px;
  font-size: clamp(42px, 7vw, 64px);
  font-weight: 700;
  line-height: 1.1;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hall-hero__bio {
  margin: 0 0 20px;
  font-size: 17px;
  line-height: 1.7;
  color: var(--color-text-secondary);
}

.hall-hero__quote {
  opacity: 0.85;
  max-width: 520px;
}

.hall-rooms {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.room-door {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
  min-height: 200px;
  padding: 24px 22px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
  color: inherit;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transform: perspective(720px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
  transform-style: preserve-3d;
  animation: riseIn 500ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
  animation-delay: calc(160ms + var(--i, 0) * 60ms);
  transition:
    border-color 0.25s ease,
    background 0.25s ease,
    box-shadow 0.25s ease;
}

.room-door:hover {
  border-color: rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.28);
}

.room-door__glow {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  opacity: 0;
  background: radial-gradient(
    260px circle at var(--mx, 50%) var(--my, 50%),
    var(--color-primary-12),
    transparent 60%
  );
  transition: opacity 0.25s ease;
}

.room-door:hover .room-door__glow {
  opacity: 1;
}

.room-door > :not(.room-door__glow) {
  position: relative;
  z-index: 1;
}

.room-door__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  transition: transform 0.25s ease;
}

.room-door:hover .room-door__icon {
  transform: scale(1.08);
}

.room-door__icon :deep(svg) {
  transition: transform 0.25s ease;
  transform-origin: center;
}

.room-door[data-room-key='blog']:hover .room-door__icon :deep(svg) {
  animation: iconFlip 0.6s ease;
}

.room-door[data-room-key='lab']:hover .room-door__icon :deep(svg) {
  animation: iconShake 0.6s ease;
}

.room-door[data-room-key='chat']:hover .room-door__icon :deep(svg) {
  animation: iconBounce 0.6s ease;
}

.room-door[data-room-key='diary']:hover .room-door__icon :deep(svg) {
  animation: iconWiggle 0.6s ease;
}

.room-door[data-room-key='knowledge']:hover .room-door__icon :deep(svg) {
  animation: iconPulse 0.6s ease;
}

.room-door__count {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: var(--color-primary-light);
}

.room-door--rose .room-door__icon {
  color: var(--color-primary-light);
  background: var(--color-primary-12);
}

.room-door--blue .room-door__icon {
  color: var(--color-secondary-light);
  background: var(--color-secondary-20);
}

.room-door--violet .room-door__icon {
  color: #c4b5fd;
  background: rgba(167, 139, 250, 0.16);
}

.room-door--lilac .room-door__icon {
  color: #e9d5ff;
  background: rgba(201, 160, 220, 0.16);
}

.room-door__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  width: 100%;
}

.room-door__title {
  font-size: 22px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.room-door__hint {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.room-door__meta {
  margin-top: 8px;
  font-size: 13px;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@keyframes riseIn {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes iconFlip {
  0% {
    transform: perspective(200px) rotateY(0deg);
  }
  50% {
    transform: perspective(200px) rotateY(-24deg);
  }
  100% {
    transform: perspective(200px) rotateY(0deg);
  }
}

@keyframes iconShake {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-9deg);
  }
  75% {
    transform: rotate(9deg);
  }
}

@keyframes iconBounce {
  0%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-6px);
  }
  70% {
    transform: translateY(-2px);
  }
}

@keyframes iconWiggle {
  0%,
  100% {
    transform: rotate(0deg);
  }
  30% {
    transform: rotate(-6deg) translateX(-1px);
  }
  60% {
    transform: rotate(5deg) translateX(1px);
  }
}

@keyframes iconPulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.16);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hall-hero,
  .hall-clock,
  .room-door {
    animation: none;
  }

  .room-door {
    transform: none;
  }

  .room-door:hover .room-door__icon,
  .room-door:hover .room-door__icon :deep(svg) {
    animation: none;
    transform: none;
  }

  .room-door__glow {
    display: none;
  }
}

@media (max-width: 800px) {
  .hall-top {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .home-hall {
    gap: 32px;
    padding-top: 12px;
    justify-content: flex-start;
  }

  .hall-rooms {
    grid-template-columns: 1fr;
  }

  .room-door {
    flex-direction: row;
    align-items: center;
    min-height: 0;
    padding: 18px 16px;
  }
}
</style>
