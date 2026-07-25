<script setup lang="ts">
</script>

<template>
  <div class="container">
    <div class="about-hero">
      <div class="about-avatar-wrap">
        <span class="tape tape-1" />
        <div class="placeholder avatar">[立绘占位]</div>
        <span class="tape tape-2" />
      </div>
      <div class="about-bio">
        <span class="about-deco-sparkle">
          <svg width="48" height="48" viewBox="0 0 48 48">
            <path
              d="M24 4 L27 19 L42 21 L29 28 L33 44 L24 35 L15 44 L19 28 L6 21 L21 19 Z"
              fill="currentColor"
              opacity=".6"
            />
          </svg>
        </span>
        <h1>关于站主</h1>
        <p class="intro">关于「纸间」这个名字——在纸页与代码之间，留一些光。</p>
        <p>这里是一个人的小角落，记录技术笔记、日常碎碎念、读书心得。偶尔也会做一些有趣的实验。</p>
        <p>喜欢简洁有温度的设计，相信好的工具应该像纸笔一样自然。</p>
      </div>
    </div>

    <div class="section-divider">
      <div class="line" />
      <div class="icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2 L14 10 L22 11 L15 16 L18 24 L12 19 L6 24 L9 16 L2 11 L10 10 Z" />
        </svg>
      </div>
      <div class="line" />
    </div>

    <div class="section-title">
      <h2>技能贴纸</h2>
      <span class="count">· 常用技术栈</span>
    </div>
    <div class="skills-grid">
      <span class="pill">Java</span>
      <span class="pill">Spring Boot</span>
      <span class="pill">Vue 3</span>
      <span class="pill">TypeScript</span>
      <span class="pill">PostgreSQL</span>
      <span class="pill">Redis</span>
      <span class="pill">Docker</span>
      <span class="pill">AI / RAG</span>
    </div>

    <div class="section-title">
      <h2>联系</h2>
    </div>
    <div class="contacts">
      <a class="contact-card" href="#">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
        </svg>
        <span>github.com/[your-id]</span>
      </a>
      <a class="contact-card" href="#">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
        <span>you@example.com</span>
      </a>
    </div>
  </div>
</template>

<style scoped>
.about-hero {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 56px;
  align-items: center;
  padding: 64px 0 48px;
  position: relative;
}

.about-avatar-wrap {
  position: relative;
}

.tape-1 {
  position: absolute;
  top: -12px;
  left: 20px;
  --tc: var(--st-sakura);
  --tilt: -6deg;
  --tw: 80px;
}

.tape-2 {
  position: absolute;
  bottom: -10px;
  right: 10px;
  --tc: var(--st-mint);
  --tilt: 4deg;
  --tw: 70px;
}

.avatar {
  width: 180px;
  height: 180px;
  border-radius: 50%;
}

.about-bio {
  position: relative;
}

.about-deco-sparkle {
  position: absolute;
  top: -20px;
  right: 40px;
  color: var(--st-cream);
}

.intro {
  color: var(--ink-soft);
  font-size: 15px;
}

.section-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin: 48px 0;
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

.skills-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.skills-grid .pill:nth-child(1) { transform: rotate(-1.5deg); }
.skills-grid .pill:nth-child(2) { transform: rotate(1deg); }
.skills-grid .pill:nth-child(3) { transform: rotate(-0.5deg); }
.skills-grid .pill:nth-child(4) { transform: rotate(2deg); }
.skills-grid .pill:nth-child(5) { transform: rotate(-2deg); }
.skills-grid .pill:nth-child(6) { transform: rotate(1.5deg); }
.skills-grid .pill:nth-child(7) { transform: rotate(-1deg); }
.skills-grid .pill:nth-child(8) { transform: rotate(0.5deg); }

.contacts {
  display: flex;
  gap: 14px;
  margin-top: 32px;
  flex-wrap: wrap;
}

.contact-card {
  background: #FFFDF8;
  border: 2px dashed var(--hairline);
  border-radius: 14px;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  font: 14px var(--fb);
  color: var(--ink);
  text-decoration: none;
  transition: all 0.25s;
}

.contact-card:hover {
  border-style: solid;
  border-color: var(--accent);
  color: var(--accent);
  transform: translateY(-2px) rotate(-1deg);
}

@media (max-width: 960px) {
  .about-hero {
    grid-template-columns: 1fr;
    text-align: center;
  }
  .contacts {
    justify-content: center;
  }
}
</style>
