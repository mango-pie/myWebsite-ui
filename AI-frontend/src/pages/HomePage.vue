<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { listMyAppByPage } from '@/api/appController'
import { getPublishedBlogPostPage } from '@/api/blogPostController'
import { useLoginUserStore } from '@/stores/loginUser'
import { siteConfig } from '@/config/site'
import DailyHitokoto from '@/components/home/DailyHitokoto.vue'

interface Entry {
  key: string
  title: string
  hint: string
  path: string
  folio: string
  meta?: string
}

const router = useRouter()
const loginUserStore = useLoginUserStore()

const latestTitle = ref('')
const postTotal = ref(0)
const myTotal = ref(0)

const isLoggedIn = computed(() => !!loginUserStore.loginUser.id)

const colophonDate = computed(() => {
  const d = new Date()
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  return `${y} 年 ${m} 月 ${day} 日`
})

const entries = computed<Entry[]>(() => {
  const list: Entry[] = [
    {
      key: 'blog',
      title: siteConfig.rooms.blog.title,
      hint: siteConfig.rooms.blog.hint,
      path: '/blog',
      folio: 'iii',
      meta: latestTitle.value
        ? latestTitle.value
        : postTotal.value
          ? `${postTotal.value} 篇已录`
          : '空白卷',
    },
    {
      key: 'lab',
      title: siteConfig.rooms.lab.title,
      hint: siteConfig.rooms.lab.hint,
      path: '/lab',
      folio: 'xi',
      meta: isLoggedIn.value && myTotal.value ? `${myTotal.value} 则试作` : '待启封',
    },
  ]

  if (isLoggedIn.value) {
    list.splice(
      1,
      0,
      {
        key: 'diary',
        title: siteConfig.rooms.diary.title,
        hint: siteConfig.rooms.diary.hint,
        path: '/diary',
        folio: 'v',
        meta: '今日手记',
      },
      {
        key: 'knowledge',
        title: siteConfig.rooms.knowledge.title,
        hint: siteConfig.rooms.knowledge.hint,
        path: '/knowledge',
        folio: 'vii',
        meta: '检索与问答',
      },
    )
    list.push({
      key: 'chat',
      title: siteConfig.rooms.chat.title,
      hint: siteConfig.rooms.chat.hint,
      path: '/chat',
      folio: 'xiii',
      meta: '未完之谈',
    })
  }

  return list
})

const enter = (path: string) => {
  router.push(path)
}

onMounted(async () => {
  try {
    const res = await getPublishedBlogPostPage({ pageNum: 1, pageSize: 1 })
    if (res.data.code === 0 && res.data.data) {
      postTotal.value = res.data.data.totalRow || 0
      latestTitle.value = res.data.data.records?.[0]?.title || ''
    }
  } catch {
    /* ignore */
  }

  if (loginUserStore.loginUser.id) {
    try {
      const res = await listMyAppByPage({ pageNum: 1, pageSize: 1 })
      if (res.data.code === 0 && res.data.data) {
        myTotal.value = res.data.data.totalRow || 0
      }
    } catch {
      /* ignore */
    }
  }
})
</script>

<template>
  <div class="codex-spread">
    <!-- 左页：扉页 -->
    <article class="codex-leaf codex-leaf--verso" aria-label="扉页">
      <div class="codex-leaf__inner">
        <p class="codex-leaf__edition">私人手稿 · 摹本</p>

        <div class="codex-leaf__seal-wrap">
          <span class="codex-leaf__seal" aria-hidden="true">紙</span>
        </div>

        <h1 class="codex-leaf__brand">{{ siteConfig.siteName }}</h1>
        <p class="codex-leaf__rule" aria-hidden="true" />
        <p class="codex-leaf__bio">{{ siteConfig.bio }}</p>

        <div class="codex-leaf__quote">
          <DailyHitokoto variant="plain" />
        </div>

        <footer class="codex-leaf__colophon">
          <span>{{ colophonDate }}</span>
          <span>于纸间重录</span>
        </footer>
      </div>
    </article>

    <!-- 书脊 -->
    <div class="codex-gutter" aria-hidden="true">
      <span class="codex-gutter__stitch" />
    </div>

    <!-- 右页：目录 -->
    <article class="codex-leaf codex-leaf--recto" aria-label="目录">
      <div class="codex-leaf__inner">
        <header class="codex-toc__head">
          <h2 class="codex-toc__title">目　　录</h2>
          <p class="codex-toc__hint">请翻至您要阅读的章节</p>
        </header>

        <nav class="codex-toc" aria-label="章节入口">
          <button
            v-for="(item, index) in entries"
            :key="item.key"
            type="button"
            class="codex-toc__row"
            :style="{ '--i': index }"
            @click="enter(item.path)"
          >
            <span class="codex-toc__num">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="codex-toc__body">
              <span class="codex-toc__name">{{ item.title }}</span>
              <span class="codex-toc__desc">{{ item.hint }}</span>
            </span>
            <span class="codex-toc__leaders" aria-hidden="true" />
            <span class="codex-toc__folio">{{ item.folio }}</span>
            <span class="codex-toc__tag">
              <span class="wax-seal wax-seal--sticker">{{ item.meta }}</span>
            </span>
          </button>
        </nav>

        <p class="codex-toc__footnote">
          米白书页 · 暗红丝带 · 合上之后，墨痕仍在。
        </p>
      </div>
    </article>
  </div>
</template>

<style scoped>
.codex-spread {
  --leaf-pad-x: clamp(1.25em, 3.5vw, 2.75em);
  --leaf-pad-y: clamp(1.5em, 4vh, 2.75em);
  display: grid;
  grid-template-columns: minmax(0, 1fr) 0.9em minmax(0, 1.05fr);
  align-items: stretch;
  min-height: calc(100dvh - 8.5rem);
  max-width: 72em;
  margin: 0 auto;
  isolation: isolate;
  animation: spreadOpen 0.9s cubic-bezier(0.22, 0.61, 0.36, 1) both;
}

/* 左右书页 */
.codex-leaf {
  position: relative;
  background:
    linear-gradient(
      105deg,
      rgba(58, 42, 28, 0.04) 0%,
      transparent 12%,
      transparent 88%,
      rgba(58, 42, 28, 0.035) 100%
    ),
    linear-gradient(180deg, #faf6eb 0%, #f5f0e1 55%, #ebe4d0 100%);
  border: 1px solid rgba(169, 144, 112, 0.55);
  box-shadow:
    0 1px 0 rgba(255, 252, 245, 0.75) inset,
    0 18px 40px rgba(58, 42, 28, 0.1);
}

.codex-leaf--verso {
  border-radius: 2px 0 0 2px;
  box-shadow:
    0 1px 0 rgba(255, 252, 245, 0.75) inset,
    8px 0 24px rgba(58, 42, 28, 0.06),
    0 18px 40px rgba(58, 42, 28, 0.1);
}

.codex-leaf--recto {
  border-radius: 0 2px 2px 0;
  box-shadow:
    0 1px 0 rgba(255, 252, 245, 0.75) inset,
    -8px 0 24px rgba(58, 42, 28, 0.06),
    0 18px 40px rgba(58, 42, 28, 0.1);
}

.codex-leaf__inner {
  height: 100%;
  min-height: 28em;
  padding: var(--leaf-pad-y) var(--leaf-pad-x);
  display: flex;
  flex-direction: column;
}

/* 书脊 */
.codex-gutter {
  position: relative;
  z-index: 2;
  background: linear-gradient(
    90deg,
    rgba(58, 42, 28, 0.12) 0%,
    rgba(58, 42, 28, 0.28) 45%,
    rgba(58, 42, 28, 0.28) 55%,
    rgba(58, 42, 28, 0.12) 100%
  );
  box-shadow:
    inset 2px 0 6px rgba(255, 252, 245, 0.15),
    inset -2px 0 6px rgba(0, 0, 0, 0.12);
}

.codex-gutter__stitch {
  position: absolute;
  top: 12%;
  bottom: 12%;
  left: 50%;
  width: 1px;
  transform: translateX(-50%);
  background: repeating-linear-gradient(
    180deg,
    rgba(245, 240, 225, 0.35) 0 4px,
    transparent 4px 10px
  );
}

/* ── 左页扉页 ── */
.codex-leaf__edition {
  margin: 0;
  font-family: var(--font-sans);
  font-size: 0.72em;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  text-align: center;
}

.codex-leaf__seal-wrap {
  display: flex;
  justify-content: center;
  margin: 2.25em 0 1.5em;
}

.codex-leaf__seal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3.4em;
  height: 3.4em;
  border: 2px solid var(--color-primary);
  color: var(--color-primary);
  font-family: var(--font-serif);
  font-size: 1.35em;
  font-weight: 700;
  letter-spacing: 0.08em;
  background:
    radial-gradient(circle at 32% 28%, rgba(255, 252, 245, 0.55), transparent 55%),
    rgba(122, 31, 31, 0.07);
  box-shadow:
    inset 0 0 0 4px rgba(122, 31, 31, 0.1),
    0 2px 6px rgba(58, 42, 28, 0.12);
  transform: rotate(-4deg);
  animation: sealPress 1.1s cubic-bezier(0.22, 0.61, 0.36, 1) 0.25s both;
}

.codex-leaf__brand {
  margin: 0;
  text-align: center;
  font-family: var(--font-serif);
  font-size: clamp(3.2rem, 8vw, 5.25rem);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: 0.18em;
  color: var(--color-text-primary);
  text-indent: 0.18em;
}

.codex-leaf__rule {
  width: 4.5em;
  height: 1px;
  margin: 1.35em auto;
  border: none;
  background: linear-gradient(90deg, transparent, #8a7355, transparent);
}

.codex-leaf__bio {
  margin: 0 auto;
  max-width: 22em;
  text-align: center;
  font-size: clamp(0.95rem, 1.6vw, 1.05rem);
  line-height: 1.85;
  color: var(--color-text-secondary);
}

.codex-leaf__quote {
  margin-top: auto;
  padding-top: 2em;
  border-top: 1px dashed rgba(169, 144, 112, 0.55);
}

.codex-leaf__colophon {
  display: flex;
  justify-content: space-between;
  gap: 1em;
  margin-top: 1.5em;
  font-family: var(--font-sans);
  font-size: 0.72em;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
}

/* ── 右页目录 ── */
.codex-toc__head {
  text-align: center;
  margin-bottom: 1.75em;
  padding-bottom: 1em;
  border-bottom: 1px solid rgba(138, 115, 85, 0.45);
}

.codex-toc__title {
  margin: 0 0 0.4em;
  font-family: var(--font-serif);
  font-size: clamp(1.35rem, 2.4vw, 1.7rem);
  font-weight: 700;
  letter-spacing: 0.45em;
  text-indent: 0.45em;
  color: var(--color-text-primary);
}

.codex-toc__hint {
  margin: 0;
  font-family: var(--font-sans);
  font-size: 0.8em;
  color: var(--color-text-muted);
}

.codex-toc {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 0;
}

.codex-toc__row {
  display: grid;
  grid-template-columns: 2.2em minmax(0, auto) minmax(1.5em, 1fr) 2em;
  grid-template-areas:
    'num body leaders folio'
    '.   tag  tag     tag';
  gap: 0.15em 0.55em;
  align-items: baseline;
  width: 100%;
  padding: 0.95em 0.25em;
  border: none;
  border-bottom: 1px dashed rgba(169, 144, 112, 0.45);
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  animation: rowRise 0.65s ease both;
  animation-delay: calc(0.35s + var(--i, 0) * 0.08s);
  transition:
    background 0.3s ease,
    padding-left 0.3s cubic-bezier(0.22, 0.61, 0.36, 1),
    transform 0.28s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.codex-toc__row:first-child {
  border-top: 1px solid rgba(138, 115, 85, 0.35);
}

.codex-toc__row:hover {
  background: rgba(160, 120, 70, 0.1);
  padding-left: 0.45em;
}

.codex-toc__row:active {
  transform: scale(0.99) rotateY(-2deg);
}

.codex-toc__row:focus-visible {
  outline: 2px solid rgba(122, 31, 31, 0.45);
  outline-offset: 2px;
}

.codex-toc__num {
  grid-area: num;
  font-family: var(--font-sans);
  font-size: 0.75em;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
}

.codex-toc__body {
  grid-area: body;
  display: flex;
  flex-direction: column;
  gap: 0.15em;
  min-width: 0;
}

.codex-toc__name {
  font-family: var(--font-serif);
  font-size: clamp(1.15rem, 2.2vw, 1.45rem);
  font-weight: 600;
  color: var(--color-text-primary);
  transition: color 0.28s ease;
}

.codex-toc__row:hover .codex-toc__name {
  color: var(--color-primary);
}

.codex-toc__desc {
  font-family: var(--font-sans);
  font-size: 0.78em;
  color: var(--color-text-secondary);
}

.codex-toc__leaders {
  grid-area: leaders;
  height: 0;
  border-bottom: 1px dotted rgba(138, 115, 85, 0.55);
  align-self: center;
  min-width: 1em;
}

.codex-toc__folio {
  grid-area: folio;
  font-family: var(--font-serif);
  font-size: 0.95em;
  font-style: italic;
  color: var(--color-text-muted);
  text-align: right;
}

.codex-toc__tag {
  grid-area: tag;
  margin-top: 0.2em;
}

.codex-toc__footnote {
  margin: 1.75em 0 0;
  padding-top: 0.85em;
  border-top: 1px solid rgba(169, 144, 112, 0.4);
  font-family: var(--font-sans);
  font-size: 0.75em;
  line-height: 1.6;
  color: var(--color-text-muted);
  text-align: center;
}

@keyframes spreadOpen {
  from {
    opacity: 0;
    transform: perspective(900px) rotateX(4deg) scale(0.985);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes sealPress {
  from {
    opacity: 0;
    transform: rotate(-12deg) scale(1.15);
  }
  to {
    opacity: 1;
    transform: rotate(-4deg) scale(1);
  }
}

@keyframes rowRise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .codex-spread,
  .codex-leaf__seal,
  .codex-toc__row {
    animation: none;
  }

  .codex-toc__row:hover,
  .codex-toc__row:active {
    padding-left: 0.25em;
    transform: none;
  }
}

@media (max-width: 900px) {
  .codex-spread {
    grid-template-columns: 1fr;
    min-height: 0;
    gap: 0;
  }

  .codex-gutter {
    display: none;
  }

  .codex-leaf--verso,
  .codex-leaf--recto {
    border-radius: 2px;
    box-shadow:
      0 1px 0 rgba(255, 252, 245, 0.75) inset,
      0 12px 28px rgba(58, 42, 28, 0.09);
  }

  .codex-leaf--verso {
    margin-bottom: 1em;
  }

  .codex-leaf__inner {
    min-height: 0;
  }

  .codex-leaf__quote {
    margin-top: 2em;
  }

  .codex-toc__row {
    grid-template-columns: 2em minmax(0, 1fr) auto;
    grid-template-areas:
      'num body folio'
      '.   tag  tag';
  }

  .codex-toc__leaders {
    display: none;
  }
}
</style>
