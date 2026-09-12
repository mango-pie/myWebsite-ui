<script setup lang="ts">
import { useRouter } from 'vue-router'
import { siteConfig } from '@/config/site'
import HomeMiniBar from '@/components/home/HomeMiniBar.vue'
import HomePageDeco from '@/components/home/HomePageDeco.vue'

defineProps<{
  pageLabel: string
}>()

const emit = defineEmits<{
  home: []
}>()

const router = useRouter()

const footerGo = (link: { label: string; path?: string; href?: string }) => {
  if (link.path) router.push(link.path)
  else if (link.href && link.href !== '#') window.open(link.href, '_blank')
}
</script>

<template>
  <section class="home-page home-page--closing" data-screen-label="04 Closing">
    <HomeMiniBar :page-label="pageLabel" @home="emit('home')" />

    <div class="closing-layout">
      <div class="closing-glow closing-glow--a" aria-hidden="true" />
      <div class="closing-glow closing-glow--b" aria-hidden="true" />
      <span class="closing-washi closing-washi--l" aria-hidden="true" />
      <span class="closing-washi closing-washi--r" aria-hidden="true" />

      <div class="closing-mark" aria-hidden="true">
        <span class="closing-mark__ring" />
        <span class="closing-mark__dot" />
        <HomePageDeco variant="closing" />
      </div>

      <span class="page-sticker page-sticker--thanks font-display">谢谢来访 ♪</span>

      <p class="closing-eyebrow">END OF TOUR</p>
      <div class="closing-brand-wrap">
        <h2 class="closing-brand font-display">{{ siteConfig.siteName }}</h2>
      </div>
      <p class="closing-kana">{{ siteConfig.brandKana }}</p>
      <p class="closing-bio">{{ siteConfig.bio }}</p>
      <p class="closing-tag">{{ siteConfig.footer.tagline }}</p>

      <nav class="closing-links">
        <a
          v-for="link in siteConfig.footer.links"
          :key="link.label"
          href="#"
          @click.prevent="footerGo(link)"
        >
          {{ link.label }}
        </a>
      </nav>

      <div class="closing-actions">
        <button type="button" class="closing-back" @click="emit('home')">回到门厅</button>
        <span class="closing-icp">{{ siteConfig.footer.icp }}</span>
      </div>
    </div>
  </section>
</template>
