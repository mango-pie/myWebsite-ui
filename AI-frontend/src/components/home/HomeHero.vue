<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { siteConfig } from '@/config/site'
import { useLoginUserStore } from '@/stores/loginUser'
import { fetchHitokoto } from '@/integrations/hitokoto'
import type { HomeTheme } from '@/composables/useHomeTheme'
import { HOME_GREET } from '@/composables/useHomeTheme'

const props = defineProps<{
  theme: HomeTheme
}>()

const router = useRouter()
const loginUserStore = useLoginUserStore()

const labPrompt = ref('')
const hitokotoText = ref('风把云揉成棉花糖的形状，落在窗台上的光是今天下午茶。')
const hitokotoFrom = ref('—— 每日一言')
const textOpacity = ref(1)
const badgeOpacity = ref(1)

const greeting = computed(() => HOME_GREET[props.theme])

watch(
  () => props.theme,
  () => {
    badgeOpacity.value = 0
    setTimeout(() => {
      badgeOpacity.value = 1
    }, 250)
  },
)

async function loadHitokoto(force = false) {
  textOpacity.value = 0
  try {
    const item = await fetchHitokoto(force)
    setTimeout(() => {
      hitokotoText.value = item.hitokoto
      const who = item.from_who
      const from = item.from
      hitokotoFrom.value =
        who && from ? `—— ${who} · ${from}` : from || who ? `—— ${from || who}` : '—— 每日一言'
      textOpacity.value = 1
    }, 250)
  } catch {
    setTimeout(() => {
      textOpacity.value = 1
    }, 250)
  }
}

const onChip = (chip: string) => {
  labPrompt.value = `做一个${chip}`
}

const goLab = () => {
  const prompt = labPrompt.value.trim()
  if (!loginUserStore.loginUser.id) {
    router.push('/user/login')
    return
  }
  if (prompt) router.push({ path: '/lab', query: { prompt } })
  else router.push('/lab')
}

const onLabGo = (e: MouseEvent) => {
  const btn = e.currentTarget as HTMLElement
  const r = btn.getBoundingClientRect()
  const rip = document.createElement('span')
  rip.className = 'ripple'
  const size = Math.max(r.width, r.height)
  rip.style.width = rip.style.height = `${size}px`
  rip.style.left = `${e.clientX - r.left - size / 2}px`
  rip.style.top = `${e.clientY - r.top - size / 2}px`
  btn.appendChild(rip)
  setTimeout(() => rip.remove(), 650)
  goLab()
}

onMounted(() => loadHitokoto(true))
</script>

<template>
  <div class="hero">
    <span
      class="hero-badge anim"
      :style="{
        animationDelay: '0.15s',
        opacity: badgeOpacity,
        transition: 'opacity .3s',
      }"
    >
      <span class="dot" :style="{ background: greeting.bg }" v-html="greeting.icon" />
      <span>{{ greeting.text }}</span>
    </span>

    <h1 class="hero-title font-display anim" style="animation-delay: 0.25s">
      <span class="jp">{{ siteConfig.brandKana }}</span>
      <span class="grad">{{ siteConfig.siteName }}</span>
      <span class="sticker font-display">{{ siteConfig.heroSticker }}</span>
    </h1>

    <p class="hero-sub anim" style="animation-delay: 0.35s">
      <span class="line" />
      {{ siteConfig.siteSubtitle }}
    </p>

    <div class="hitokoto anim" style="animation-delay: 0.45s">
      <span class="tape" />
      <button type="button" class="refresh" aria-label="换一句" @click="loadHitokoto(true)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5" />
        </svg>
      </button>
      <p class="hitokoto-text" :style="{ opacity: textOpacity }">{{ hitokotoText }}</p>
      <p class="hitokoto-from">{{ hitokotoFrom }}</p>
    </div>

    <div class="lab-card anim" style="animation-delay: 0.55s">
      <div class="lab-head">
        <span class="lab-title font-display">{{ siteConfig.heroLabTitle }}</span>
        <span class="lab-desc">{{ siteConfig.heroLabDesc }}</span>
      </div>
      <div class="lab-inputrow">
        <input
          v-model="labPrompt"
          class="lab-input"
          :placeholder="siteConfig.heroLabPlaceholder"
          @keydown.enter.prevent="goLab"
        />
        <button type="button" class="lab-go" @click="onLabGo">生成 ✦</button>
      </div>
      <div class="lab-chips">
        <span v-for="chip in siteConfig.quickPrompts" :key="chip" @click="onChip(chip)">{{ chip }}</span>
      </div>
    </div>
  </div>
</template>
