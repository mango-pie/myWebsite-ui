<script setup lang="ts">
import { siteConfig } from '@/config/site'

const { about } = siteConfig
</script>

<template>
  <div class="about-page">
    <div class="about-card">
      <a-avatar :size="100" :src="siteConfig.avatar" class="about-card__avatar" />
      <h1 class="about-card__title">{{ about.title }}</h1>
      <p class="about-card__name">{{ siteConfig.ownerName }}</p>
      <p class="about-card__bio">{{ siteConfig.bio }}</p>

      <div class="about-section">
        <h2 class="about-section__label">技能</h2>
        <div class="about-tags">
          <a-tag v-for="skill in about.skills" :key="skill" color="pink">{{ skill }}</a-tag>
        </div>
      </div>

      <div class="about-section">
        <h2 class="about-section__label">兴趣</h2>
        <div class="about-tags">
          <a-tag v-for="item in about.interests" :key="item">{{ item }}</a-tag>
        </div>
      </div>

      <div class="about-section">
        <h2 class="about-section__label">联系我</h2>
        <div class="about-contact">
          <a :href="about.contact.email.href" class="about-contact__link">{{ about.contact.email.label }}</a>
          <a :href="about.contact.github.href" class="about-contact__link" target="_blank" rel="noopener">{{ about.contact.github.label }}</a>
        </div>
      </div>

      <p class="about-tech">{{ about.techStack }}</p>
    </div>
  </div>
</template>

<style scoped>
.about-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 20px 80px;
}

.about-card {
  background: var(--color-bg-card);
  backdrop-filter: blur(16px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 48px 40px;
  text-align: center;
  box-shadow: var(--shadow-lg);
}

.about-card__avatar {
  margin-bottom: 20px;
  border: 3px solid rgba(232, 121, 169, 0.4);
}

.about-card__title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.about-card__name {
  font-size: 18px;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 16px;
}

.about-card__bio {
  font-size: 15px;
  color: var(--color-text-secondary);
  line-height: 1.8;
  margin-bottom: 32px;
}

.about-section {
  text-align: left;
  margin-bottom: 24px;
}

.about-section__label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-muted);
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.about-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.about-contact {
  display: flex;
  gap: 24px;
}

.about-contact__link {
  color: var(--color-primary);
  text-decoration: none;
  font-size: 15px;
  transition: opacity var(--transition-fast);
}

.about-contact__link:hover {
  opacity: 0.85;
}

.about-tech {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--color-border);
  font-size: 13px;
  color: var(--color-text-muted);
}

@media (max-width: 768px) {
  .about-card {
    padding: 32px 24px;
  }

  .about-contact {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
