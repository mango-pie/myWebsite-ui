<script setup lang="ts">
import { ref, onMounted } from 'vue'
import HomeTopbar from '@/components/home/HomeTopbar.vue'
import HomeRooms from '@/components/home/HomeRooms.vue'
import { fetchHitokoto, type HitokotoItem } from '@/integrations/hitokoto'

const hitokoto = ref<HitokotoItem | null>(null)

const today = new Date()
const dayStr = String(today.getDate()).padStart(2, '0')
const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const monthStr = months[today.getMonth()]

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
        <HomeTopbar />
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

    <HomeRooms />
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

@media (max-width: 960px) {
  .hero {
    grid-template-columns: 1fr;
  }
}
</style>
