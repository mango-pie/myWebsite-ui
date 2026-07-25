<script setup lang="ts">
import type { Component } from 'vue'
import { useRouter } from 'vue-router'
import { BookOpen, FlaskConical, Info, Link as LinkIcon } from 'lucide-vue-next'
import { siteConfig } from '@/config/site'

const router = useRouter()
const currentYear = new Date().getFullYear()

const iconFor = (link: { label?: string; path?: string }): Component => {
  const label = link.label ?? ''
  if (label.includes('关于') || link.path === '/about') return Info
  if (label.includes('随笔') || link.path === '/blog') return BookOpen
  if (label.includes('实验') || link.path === '/lab') return FlaskConical
  return LinkIcon
}

const navigate = (link: { path?: string; href?: string }) => {
  if (link.path) {
    router.push(link.path)
  } else if (link.href && link.href !== '#') {
    window.open(link.href, '_blank')
  }
}
</script>

<template>
  <div class="global-footer">
    <div class="global-footer__content">
      <div class="global-footer__brand">
        <span class="global-footer__brand-text">{{ siteConfig.siteName }}</span>
        <span class="global-footer__brand-sub">{{ siteConfig.footer.tagline }}</span>
      </div>
      <div class="global-footer__links">
        <a
          v-for="(link, i) in siteConfig.footer.links"
          :key="i"
          href="javascript:void(0)"
          class="global-footer__link"
          @click.prevent="navigate(link)"
        >
          <component :is="iconFor(link)" :size="15" class="global-footer__link-icon" />
          <span>{{ link.label }}</span>
        </a>
      </div>
      <div class="global-footer__copyright">
        © {{ currentYear }} {{ siteConfig.siteName }}
        <span v-if="siteConfig.footer.icp" class="global-footer__icp"> · {{ siteConfig.footer.icp }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.global-footer {
  padding: 2em 1.25em 1.5em;
  font-family: var(--font-sans);
}

.global-footer__content {
  max-width: 44em;
  margin: 0 auto;
  text-align: center;
}

.global-footer__brand {
  margin-bottom: 1.1em;
}

.global-footer__brand-text {
  display: block;
  font-family: var(--font-serif);
  font-size: 1.2em;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 0.4em;
  letter-spacing: 0.12em;
}

.global-footer__brand-sub {
  font-size: 0.82em;
  color: var(--color-text-muted);
  font-style: italic;
}

.global-footer__links {
  display: flex;
  justify-content: center;
  gap: 1.75em;
  margin-bottom: 1.25em;
  flex-wrap: wrap;
}

.global-footer__link {
  display: inline-flex;
  align-items: center;
  gap: 0.35em;
  font-size: 0.88em;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color 0.3s ease;
  position: relative;
}

.global-footer__link-icon {
  flex-shrink: 0;
}

.global-footer__link::after {
  content: '';
  position: absolute;
  bottom: -0.25em;
  left: 0;
  width: 0;
  height: 1px;
  background: var(--color-primary);
  transition: width 0.35s ease;
}

.global-footer__link:hover {
  color: var(--color-primary);
}

.global-footer__link:hover::after {
  width: 100%;
}

.global-footer__copyright {
  font-size: 0.78em;
  color: var(--color-text-muted);
  letter-spacing: 0.02em;
}

.global-footer__icp {
  opacity: 0.8;
}

@media (max-width: 768px) {
  .global-footer {
    padding: 1.5em 0.85em 1.25em;
  }

  .global-footer__links {
    gap: 1em;
  }

  .global-footer__brand-text {
    font-size: 1.05em;
  }
}
</style>
