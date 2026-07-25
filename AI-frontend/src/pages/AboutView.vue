<script setup lang="ts">
import { siteConfig } from '@/config/site'

const { about } = siteConfig
const year = new Date().getFullYear()
</script>

<template>
  <div class="imprint">
    <p class="imprint__edition">版权页 · Colophon</p>

    <div class="imprint__seal" aria-hidden="true">紙</div>
    <h1 class="imprint__brand">{{ siteConfig.siteName }}</h1>
    <p class="imprint__owner">{{ siteConfig.ownerName }}</p>
    <p class="imprint__rule" aria-hidden="true" />
    <p class="imprint__bio">{{ siteConfig.bio }}</p>

    <section class="imprint__block">
      <h2 class="imprint__label">所长</h2>
      <ul class="imprint__list">
        <li v-for="skill in about.skills" :key="skill">{{ skill }}</li>
      </ul>
    </section>

    <section class="imprint__block">
      <h2 class="imprint__label">所好</h2>
      <ul class="imprint__list">
        <li v-for="item in about.interests" :key="item">{{ item }}</li>
      </ul>
    </section>

    <section class="imprint__block">
      <h2 class="imprint__label">通邮</h2>
      <div class="imprint__links">
        <a :href="about.contact.email.href">{{ about.contact.email.label }}</a>
        <a :href="about.contact.github.href" target="_blank" rel="noopener">{{ about.contact.github.label }}</a>
      </div>
    </section>

    <footer class="imprint__colophon">
      <span>{{ about.techStack }}</span>
      <span>© {{ year }} {{ siteConfig.siteName }}</span>
    </footer>
  </div>
</template>

<style scoped>
.imprint {
  max-width: 36em;
  margin: 0 auto;
  padding: 2em 1em 4em;
  text-align: center;
  animation: imprintRise 0.7s ease both;
}

.imprint__edition {
  margin: 0 0 1.75em;
  font-family: var(--font-sans);
  font-size: 0.72em;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.imprint__seal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3.2em;
  height: 3.2em;
  margin-bottom: 1.25em;
  border: 2px solid var(--color-primary);
  color: var(--color-primary);
  font-family: var(--font-serif);
  font-size: 1.25em;
  font-weight: 700;
  background:
    radial-gradient(circle at 32% 28%, rgba(255, 252, 245, 0.55), transparent 55%),
    rgba(122, 31, 31, 0.07);
  box-shadow:
    inset 0 0 0 4px rgba(122, 31, 31, 0.1),
    0 2px 6px rgba(58, 42, 28, 0.12);
  transform: rotate(-4deg);
}

.imprint__brand {
  margin: 0 0 0.35em;
  font-family: var(--font-serif);
  font-size: clamp(2.6rem, 8vw, 3.8rem);
  font-weight: 700;
  letter-spacing: 0.18em;
  text-indent: 0.18em;
  color: var(--color-text-primary);
  line-height: 1.1;
}

.imprint__owner {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 1.05em;
  color: var(--color-primary);
  letter-spacing: 0.12em;
}

.imprint__rule {
  width: 4em;
  height: 1px;
  margin: 1.35em auto;
  border: none;
  background: linear-gradient(90deg, transparent, #8a7355, transparent);
}

.imprint__bio {
  margin: 0 auto 2.25em;
  max-width: 28em;
  font-size: 1.02em;
  line-height: 1.85;
  color: var(--color-text-secondary);
}

.imprint__block {
  text-align: left;
  margin: 0 auto 1.75em;
  max-width: 26em;
  padding-top: 1.25em;
  border-top: 1px dashed var(--color-border);
}

.imprint__label {
  margin: 0 0 0.75em;
  font-family: var(--font-sans);
  font-size: 0.72em;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.imprint__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.45em 1.1em;
  font-family: var(--font-serif);
  font-size: 1em;
  color: var(--color-text-primary);
}

.imprint__list li {
  position: relative;
}

.imprint__list li::before {
  content: '·';
  margin-right: 0.35em;
  color: var(--color-primary);
}

.imprint__links {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25em;
}

.imprint__links a {
  font-family: var(--font-serif);
  font-size: 1.05em;
  color: var(--color-primary);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.28s ease;
}

.imprint__links a:hover {
  border-bottom-color: var(--color-primary);
}

.imprint__colophon {
  display: flex;
  flex-direction: column;
  gap: 0.45em;
  margin-top: 2.5em;
  padding-top: 1.25em;
  border-top: 1px solid var(--color-border);
  font-family: var(--font-sans);
  font-size: 0.78em;
  color: var(--color-text-muted);
  letter-spacing: 0.04em;
}

@keyframes imprintRise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .imprint {
    animation: none;
  }
}
</style>
