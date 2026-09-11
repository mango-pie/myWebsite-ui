<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { siteConfig } from '@/config/site'
import { useCapabilitiesStore } from '@/stores/capabilities'
import { filterGatedEntries } from '@/utils/moduleGate'

const caps = useCapabilitiesStore()
const currentYear = new Date().getFullYear()

const links = computed(() => {
  const gate = { loaded: caps.loaded, enabled: caps.enabled }
  return filterGatedEntries(siteConfig.footer.links, gate)
})
</script>

<template>
  <footer class="foot">
    <svg class="wave" width="120" height="16" viewBox="0 0 120 16">
      <path
        d="M0 8 Q15 0, 30 8 T60 8 T90 8 T120 8"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
      />
    </svg>
    <div class="foot-brand">{{ siteConfig.siteName }} · {{ siteConfig.footer.tagline }}</div>
    <nav v-if="links.length" class="foot-links" aria-label="页脚">
      <template v-for="(link, i) in links" :key="i">
        <RouterLink v-if="link.path" :to="link.path">{{ link.label }}</RouterLink>
        <a v-else-if="link.href && link.href !== '#'" :href="link.href" target="_blank" rel="noreferrer">{{
          link.label
        }}</a>
        <span v-else>{{ link.label }}</span>
      </template>
    </nav>
    <div class="foot-copy">{{ siteConfig.siteName }} · {{ currentYear }} · Powered by Vue 3 + Vite</div>
  </footer>
</template>

<style scoped>
.foot {
  border-top: 1.5px dashed var(--hairline);
  padding: 48px 32px;
  text-align: center;
  color: var(--ink-soft);
  font-size: 13px;
}

.foot .wave {
  display: block;
  margin: 0 auto 16px;
  color: var(--hairline);
}

.foot-brand {
  margin-bottom: 12px;
}

.foot-links {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 14px;
  font: 14px var(--fd);
}

.foot-links a,
.foot-links span {
  color: var(--ink);
  text-decoration: none;
}

.foot-links a:hover {
  color: var(--accent);
}

.foot-copy {
  letter-spacing: 0.02em;
}
</style>
