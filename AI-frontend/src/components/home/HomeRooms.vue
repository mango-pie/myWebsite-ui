<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useCapabilitiesStore } from '@/stores/capabilities'
import { isGatedEntryVisible } from '@/utils/moduleGate'

const caps = useCapabilitiesStore()

const moduleEntries = [
  { key: 'blog', requireModule: 'blog', label: '随笔', desc: '长文沉淀，Markdown 与图床。', icon: 'feather', to: '/blog', tone: 'cream' as const },
  { key: 'diary', requireModule: 'diary', label: '日记', desc: '按日记录，私有空间。', icon: 'book-open', to: '/diary', tone: 'sakura' as const },
  { key: 'knowledge', requireModule: 'knowledge', label: '知识库', desc: 'RAG 检索与问答。', icon: 'brain', to: '/knowledge', tone: 'mint' as const },
  { key: 'chat', requireModule: 'chat', label: '对话', desc: 'AI 对话 · Agent 模式。', icon: 'message-circle', to: '/chat', tone: 'sky' as const },
  { key: 'app-lab', requireModule: 'app-lab', label: '实验室', desc: '一句话生成应用。', icon: 'flask-conical', to: '/lab', tone: 'cream' as const },
]

const toneColors: Record<string, string> = {
  cream: 'var(--st-cream)',
  sakura: 'var(--st-sakura)',
  mint: 'var(--st-mint)',
  sky: 'var(--st-sky)',
}

const tapeColors = ['var(--st-sakura)', 'var(--st-mint)', 'var(--st-sky)', 'var(--st-cream)', 'var(--st-sakura)']
const tapeTilts = ['6deg', '-4deg', '3deg', '-5deg', '4deg']

const visibleRooms = computed(() => {
  const gate = { loaded: caps.loaded, enabled: caps.enabled }
  return moduleEntries.filter((item) => isGatedEntryVisible(item.requireModule, gate))
})
</script>

<template>
  <section class="home-rooms">
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
        v-for="(m, i) in visibleRooms"
        :key="m.key"
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
  </section>
</template>

<style scoped>
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
