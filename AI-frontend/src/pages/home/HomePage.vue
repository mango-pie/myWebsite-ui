<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useModuleStore } from '@/stores/modules'
import { fetchHitokoto, type HitokotoItem } from '@/integrations/hitokoto'

const moduleStore = useModuleStore()
const hitokoto = ref<HitokotoItem | null>(null)

const today = new Date()
const dayStr = String(today.getDate()).padStart(2, '0')
const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const monthStr = months[today.getMonth()]

const moduleEntries = [
  { key: 'blog', label: '随笔', desc: '长文沉淀，Markdown 与图床。', icon: 'feather', to: '/blog', tone: 'cream' as const },
  { key: 'diary', label: '日记', desc: '按日记录，私有空间。', icon: 'book-open', to: '/diary', tone: 'sakura' as const },
  { key: 'knowledge', label: '知识库', desc: 'RAG 检索与问答。', icon: 'brain', to: '/knowledge', tone: 'mint' as const },
  { key: 'chat', label: '对话', desc: 'AI 对话 · Agent 模式。', icon: 'message-circle', to: '/chat', tone: 'sky' as const },
  { key: 'app-lab', label: '实验室', desc: '一句话生成应用。', icon: 'flask-conical', to: '/lab', tone: 'cream' as const },
]

const toneColors: Record<string, string> = {
  cream: 'var(--st-cream)',
  sakura: 'var(--st-sakura)',
  mint: 'var(--st-mint)',
  sky: 'var(--st-sky)',
}

const tapeColors = ['var(--st-sakura)', 'var(--st-mint)', 'var(--st-sky)', 'var(--st-cream)', 'var(--st-sakura)']
const tapeTilts = ['6deg', '-4deg', '3deg', '-5deg', '4deg']

onMounted(async () => {
  try {
    hitokoto.value = await fetchHitokoto()
  } catch {
    // hitokoto may be unavailable
  }
})
</script>

<template>
  <div class="container">
    <div class="hero">
      <div>
        <h1 class="title">
          纸间
          <span class="sparkle-1">
            <svg width="48" height="48" viewBox="0 0 48 48">
              <path d="M24 4 L28 20 L44 22 L30 30 L35 46 L24 36 L13 46 L18 30 L4 22 L20 20 Z" fill="currentColor" opacity=".7" />
            </svg>
          </span>
          <span class="sparkle-2">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path d="M12 2 L14 10 L22 11 L15 16 L18 24 L12 19 L6 24 L9 16 L2 11 L10 10 Z" fill="currentColor" opacity=".5" />
            </svg>
          </span>
        </h1>
        <p class="sub">
          在纸页与代码之间，留一些光。
          <span class="underline-squiggle">
            <svg width="200" height="12" viewBox="0 0 200 12">
              <path d="M0 6 Q25 0, 50 6 T100 6 T150 6 T200 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </span>
        </p>
        <div class="hero-actions">
          <RouterLink to="/blog" class="btn">翻翻随笔</RouterLink>
          <RouterLink to="/about" class="btn ghost">认识站主</RouterLink>
        </div>
      </div>
      <div class="hero-side">
        <div class="hitokoto">
          <span class="tape tape-corner" />
          <div class="label">今 日 · 一 言</div>
          <p v-if="hitokoto" style="margin: 0">{{ hitokoto.hitokoto }}</p>
          <p v-else style="margin: 0; color: var(--ink-soft)">[一言加载中…]</p>
          <div class="stamp-corner">
            <div class="stamp">
              <span class="d">{{ dayStr }}</span>
              <span class="m">{{ monthStr }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="section-divider">
      <div class="line" />
      <div class="icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2 L14 10 L22 11 L15 16 L18 24 L12 19 L6 24 L9 16 L2 11 L10 10 Z" />
        </svg>
      </div>
      <div class="line" />
    </div>

    <div class="section-title">
      <h2>模块入口</h2>
      <span class="count">· 按后端开关显隐</span>
    </div>
    <div class="modules">
      <RouterLink
        v-for="(m, i) in moduleEntries"
        :key="m.key"
        v-show="moduleStore.isEnabled(m.key)"
        :to="m.to"
        class="sticker mod"
      >
        <span
          class="tape"
          :style="{
            '--tc': tapeColors[i],
            '--tilt': tapeTilts[i],
          }"
        />
        <div class="icon-wrap" :style="{ background: toneColors[m.tone] }">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle v-if="m.icon === 'message-circle'" cx="12" cy="12" r="10" />
            <path v-if="m.icon === 'feather'" d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
            <path v-if="m.icon === 'book-open'" d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            <path v-if="m.icon === 'brain'" d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44A2.5 2.5 0 0 1 5 17.5 2.5 2.5 0 0 1 3.04 15 2.5 2.5 0 0 1 2 12.5 2.5 2.5 0 0 1 4.5 10 2.5 2.5 0 0 1 7 4.5 2.5 2.5 0 0 1 9.5 2z" />
            <path v-if="m.icon === 'flask-conical'" d="M10 2v7.31 M14 2v7.31 M9 14h6 M8.5 2h7 M5.5 22h13 M14 9.3o6.5 8.7" />
          </svg>
        </div>
        <h3>{{ m.label }}</h3>
        <p>{{ m.desc }}</p>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.hero {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 48px;
  align-items: center;
  padding: 72px 0 48px;
  position: relative;
}

.title {
  font: clamp(88px, 15vw, 200px) / 0.92 var(--fd);
  color: var(--ink);
  letter-spacing: 0.02em;
  margin: 0;
  position: relative;
}

.sparkle-1 {
  position: absolute;
  top: -30px;
  right: -10px;
  color: var(--st-cream);
}

.sparkle-2 {
  position: absolute;
  bottom: 10px;
  left: -24px;
  color: var(--st-sakura);
  opacity: 0.6;
}

.sub {
  font: 18px var(--fb);
  color: var(--ink-soft);
  margin-top: 20px;
  position: relative;
}

.underline-squiggle {
  position: absolute;
  bottom: -12px;
  left: 0;
  color: var(--st-mint);
  opacity: 0.6;
}

.hero-actions {
  margin-top: 36px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.hero-side {
  position: relative;
  padding: 40px 0;
}

.hitokoto {
  background: #FFFDF8;
  border: 2px solid var(--hairline);
  border-radius: 14px;
  padding: 28px 28px 28px 32px;
  font: 17px / 1.7 var(--fb);
  color: var(--ink);
  position: relative;
  box-shadow: var(--shadow-day);
  transform: rotate(-2deg);
}

.tape-corner {
  position: absolute;
  top: -10px;
  right: 24px;
  --tc: var(--st-mint);
  --tilt: -4deg;
}

.label {
  font: 12px var(--fd);
  color: var(--ink-soft);
  letter-spacing: 0.18em;
  margin-bottom: 10px;
}

.stamp-corner {
  position: absolute;
  top: -28px;
  right: -24px;
}

.section-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin: 56px 0;
  color: var(--hairline);
}

.section-divider .line {
  flex: 1;
  height: 1.5px;
  border-top: 1.5px dashed var(--hairline);
}

.section-divider .icon {
  color: var(--st-cream);
  display: flex;
}

.modules {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
  margin-top: 20px;
}

.mod {
  padding: 28px 24px;
  text-decoration: none;
  color: inherit;
}

.icon-wrap {
  width: 52px;
  height: 52px;
  border: 1.5px dashed var(--hairline);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ink);
  margin-bottom: 16px;
}

.mod h3 {
  font-size: 22px;
  margin-bottom: 6px;
}

.mod p {
  font-size: 14px;
  color: var(--ink-soft);
  margin: 0;
  line-height: 1.6;
}

@media (max-width: 960px) {
  .hero {
    grid-template-columns: 1fr;
  }
  .modules {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .modules {
    grid-template-columns: 1fr;
  }
}
</style>
