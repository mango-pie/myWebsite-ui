<script setup lang="ts">
/**
 * 随笔房间 — design-preview/Blog v6.html 定稿的 Vue 实现（LIST 屏）。
 * 1920×1080 舞台 + scale 适配；数据接真实 API（queryBlogPostPage / getAllCategories / getTagCloud）。
 * 详情/发布/筛选屏与杂志架拖拽为后续迭代；分类与标签暂做页内过滤（设计契约的筛选页未移植）。
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  queryBlogPostPage,
  incrementLikeCount,
} from '@/api/blogPostController'
import { getAllCategories } from '@/api/blogCategoryController'
import { getTagCloud } from '@/api/blogTagController'
import { loadBlogSettings, markBlogLikeDisabled } from '@/utils/blogSettings'
import { siteConfig } from '@/config/site'

type JournalPost = {
  id: number
  title: string
  summary: string
  cat: string
  tags: string[]
  date: string
  month: string
  views: number
  likes: number
  cover: number
  coverUrl?: string
}

const router = useRouter()

/* ---------- 数据 ---------- */
const posts = ref<JournalPost[]>([])
const categories = ref<API.BlogCategoryVO[]>([])
const tagCloud = ref<API.BlogTagVO[]>([])
const loading = ref(true)
const blogUx = ref({ allowLike: true })

function fmtDate(raw?: string): string {
  return (raw || '').slice(0, 10)
}
function fmtMonth(raw?: string): string {
  const d = (raw || '').slice(0, 7)
  if (!/^\d{4}-\d{2}$/.test(d)) return '更早'
  const [, m] = d.split('-')
  return `${d.slice(0, 4)} · ${String(Number(m))}月`
}

async function loadAll() {
  loading.value = true
  try {
    const [postRes, catRes, tagRes] = await Promise.all([
      queryBlogPostPage({ pageNum: 1, pageSize: 100 } as API.BlogPostQueryRequest),
      getAllCategories(),
      getTagCloud(),
    ])
    const records = postRes.data?.data?.records ?? []
    posts.value = records.map((p, i) => ({
      id: Number(p.id),
      title: p.title || '未命名',
      summary: p.summary || '',
      cat: p.categoryName || '未分类',
      tags: (p.tags ?? []).map((t) => t.name || '').filter(Boolean),
      date: fmtDate(p.createdTime),
      month: fmtMonth(p.createdTime),
      views: p.viewCount ?? 0,
      likes: p.likeCount ?? 0,
      cover: (i % 3) + 1,
      coverUrl: p.coverUrl || undefined,
    }))
    categories.value = catRes.data?.data ?? []
    tagCloud.value = tagRes.data?.data ?? []
  } catch {
    message.error('随笔加载失败')
  } finally {
    loading.value = false
  }
}

/* ---------- 视图状态 ---------- */
const q = ref('')
const sortMode = ref<'latest' | 'popular'>('latest')
const layout = ref<'card' | 'timeline'>('card')
const page = ref(1)
const PAGE_SIZE = 7
const likedMap = ref<Record<number, boolean>>({})
const activeCat = ref('')
const activeTag = ref('')

const catItems = computed(() => {
  const all = { name: '全部', count: posts.value.length }
  const rest = categories.value.map((c) => ({
    name: c.name || '未命名',
    count: c.postCount ?? posts.value.filter((p) => p.cat === c.name).length,
  }))
  return [all, ...rest]
})

const tagItems = computed(() =>
  (tagCloud.value.length
    ? tagCloud.value.map((t) => ({ name: t.name || '', count: t.count ?? 0 }))
    : []
  ).sort((a, b) => b.count - a.count),
)

const filtered = computed(() => {
  let list = posts.value.slice()
  if (q.value) list = list.filter((p) => p.title.includes(q.value))
  if (activeCat.value) list = list.filter((p) => p.cat === activeCat.value)
  if (activeTag.value) list = list.filter((p) => p.tags.includes(activeTag.value))
  if (sortMode.value === 'popular') list.sort((a, b) => b.likes + b.views - (a.likes + a.views))
  else list.sort((a, b) => b.date.localeCompare(a.date))
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))
const pageItems = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return filtered.value.slice(start, start + PAGE_SIZE)
})

const monthGroups = computed(() => {
  const by = new Map<string, JournalPost[]>()
  for (const p of filtered.value) {
    const arr = by.get(p.month) ?? []
    arr.push(p)
    by.set(p.month, arr)
  }
  return [...by.entries()].map(([month, items]) => ({ month, items }))
})

function resetToFirstPage() {
  page.value = 1
}

function setSearch(v: string) {
  q.value = v
  resetToFirstPage()
}
function setSort(mode: 'latest' | 'popular') {
  sortMode.value = mode
  resetToFirstPage()
}
function setLayout(mode: 'card' | 'timeline') {
  layout.value = mode
}
function pickCat(name: string) {
  if (name === '全部') {
    activeCat.value = ''
    activeTag.value = ''
  } else {
    activeCat.value = activeCat.value === name ? '' : name
  }
  resetToFirstPage()
}
function pickTag(name: string) {
  activeTag.value = activeTag.value === name ? '' : name
  resetToFirstPage()
}
function clearFilters() {
  activeCat.value = ''
  activeTag.value = ''
  setSearch('')
}

/* ---------- 点赞 ---------- */
async function toggleLike(p: JournalPost) {
  if (!likedMap.value[p.id]) {
    if (!blogUx.value.allowLike) {
      message.info('点赞已关闭')
      return
    }
    try {
      await incrementLikeCount({ id: p.id })
    } catch {
      markBlogLikeDisabled()
    }
  }
  likedMap.value = { ...likedMap.value, [p.id]: !likedMap.value[p.id] }
  message.success(likedMap.value[p.id] ? '已喜欢' : '已取消')
}

function likeCount(p: JournalPost): number {
  return p.likes + (likedMap.value[p.id] ? 1 : 0)
}
function viewLabel(n: number): string {
  return n > 999 ? `${(n / 1000).toFixed(1)}k` : String(n)
}
function openPost(id: number) {
  void router.push(`/blog/${id}`)
}

/* ---------- 杂志架 ---------- */
const THEMES = ['t-sakura', 't-mint', 't-violet', 't-sun']
const shelf = computed(() =>
  filtered.value.slice(0, 6).map((p, i) => ({
    id: p.id,
    vol: Math.max(1, filtered.value.length - i),
    title: p.title,
    theme: THEMES[i % THEMES.length],
  })),
)
const shelfIdx = ref(0)
const flipFx = ref<{ exitCls: string; enterCls: string } | null>(null)
let flipTimer: number | undefined

interface ShelfBook {
  id: number
  vol: number
  title: string
  theme: string
  cls: string
}

const shelfDisplay = computed<ShelfBook[]>(() => {
  const n = shelf.value.length
  if (!n) return []
  const at = (i: number): ShelfBook =>
    shelf.value[(shelfIdx.value + i + n) % n] as ShelfBook
  if (!flipFx.value) {
    return [
      { ...at(2), cls: 'is-back' },
      { ...at(1), cls: 'is-mid' },
      { ...at(0), cls: 'is-front' },
    ]
  }
  const exitCls = flipFx.value.exitCls
  const enterCls = flipFx.value.enterCls
  const out: ShelfBook[] = [
    { ...at(2), cls: 'is-back fx-dim' },
    { ...at(1), cls: 'is-mid fx-dim' },
    { ...at(0), cls: `is-front ${exitCls}` },
  ]
  const dirDown = exitCls.includes('down') ? -1 : 1
  out.push({ ...(shelf.value[(shelfIdx.value + dirDown + n) % n] as ShelfBook), cls: enterCls })
  return out
})

const shelfFront = computed(() => shelf.value[shelfIdx.value])

function flipShelf(dir: 1 | -1, side: 'left' | 'right') {
  if (flipFx.value || shelf.value.length < 2) return
  const exitCls =
    dir > 0 ? (side === 'right' ? 'fx-exit-right' : 'fx-exit-left') : 'fx-exit-down'
  const enterCls =
    dir > 0 ? 'is-enter-up' : side === 'right' ? 'is-enter-side-right' : 'is-enter-side-left'
  flipFx.value = { exitCls, enterCls }
  window.setTimeout(() => {
    const n = shelf.value.length
    shelfIdx.value = (shelfIdx.value + dir + n) % n
    flipFx.value = null
  }, 600)
}

let lastTap = 0
function onShelfTap(e: PointerEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.mag-book.is-front')) return
  const now = Date.now()
  if (now - lastTap < 320) {
    const cur = shelfFront.value
    if (cur) openPost(cur.id)
  }
  lastTap = now
}

/* ---------- 时钟 ---------- */
const now = ref(new Date())
let clockTimer: number | undefined
const clockTime = computed(() => {
  const p = (n: number) => String(n).padStart(2, '0')
  return { h: p(now.value.getHours()), m: p(now.value.getMinutes()), s: p(now.value.getSeconds()) }
})
const clockDate = computed(() => {
  const d = now.value
  const weekCN = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 · 周${weekCN[d.getDay()]}`
})
const deckMonth = computed(() => {
  const mo = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return mo[now.value.getMonth()]
})
const deckDay = computed(() => now.value.getDate())
const deckWeek = computed(() => '周' + ['日', '一', '二', '三', '四', '五', '六'][now.value.getDay()])

/* ---------- 时段主题 ---------- */
function autoTheme(): 'morning' | 'noon' | 'dusk' | 'night' {
  const h = new Date().getHours()
  if (h >= 6 && h < 11) return 'morning'
  if (h >= 11 && h < 17) return 'noon'
  if (h >= 17 && h < 20) return 'dusk'
  return 'night'
}
const theme = ref<ReturnType<typeof autoTheme>>(autoTheme())
function setTheme(name: 'morning' | 'noon' | 'dusk' | 'night') {
  theme.value = name
}

/* ---------- 舞台缩放 ---------- */
const stageWrap = ref<HTMLElement | null>(null)
const stageEl = ref<HTMLElement | null>(null)
const navBlogBtn = ref<HTMLElement | null>(null)
const pillStyle = ref<{ left: string; width: string; opacity: string }>({
  left: '0px',
  width: '0px',
  opacity: '0',
})
function movePill() {
  const btn = navBlogBtn.value
  if (!btn) return
  pillStyle.value = {
    left: `${btn.offsetLeft}px`,
    width: `${btn.offsetWidth}px`,
    opacity: '1',
  }
}
const STAGE_W = 1920
const STAGE_H = 1080
function fit() {
  const s = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H, 1.15)
  if (stageEl.value) stageEl.value.style.transform = `scale(${s})`
  if (stageWrap.value) {
    stageWrap.value.style.width = `${STAGE_W * s}px`
    stageWrap.value.style.height = `${STAGE_H * s}px`
  }
  movePill()
}

/* ---------- 键盘 ---------- */
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') flipShelf(-1, 'left')
  if (e.key === 'ArrowRight') flipShelf(1, 'right')
}

/* ---------- 生命周期 ---------- */
onMounted(async () => {
  fit()
  window.addEventListener('resize', fit)
  window.addEventListener('keydown', onKeydown)
  clockTimer = window.setInterval(() => {
    now.value = new Date()
  }, 1000)
  const ux = await loadBlogSettings()
  blogUx.value = { allowLike: ux.allowLike }
  await loadAll()
})
onUnmounted(() => {
  window.removeEventListener('resize', fit)
  window.removeEventListener('keydown', onKeydown)
  if (clockTimer) window.clearInterval(clockTimer)
  if (flipTimer) window.clearTimeout(flipTimer)
})
</script>

<template>
  <div id="blog-journal-viewport">
    <div ref="stageWrap" id="blog-journal-stage-wrap">
      <div
        ref="stageEl"
        id="blog-journal-stage"
        data-page="list"
        :data-layout="layout"
        :data-theme="theme"
      >
        <div class="deco" style="left: 980px; top: 96px; animation: floaty 6s ease-in-out infinite">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.2 6.6L21 11l-6.8 2.4L12 20l-2.2-6.6L3 11l6.8-2.4L12 2z" fill="#ffcf6e" /></svg>
        </div>
        <div class="deco" style="left: 70px; top: 920px; animation: floaty 7s ease-in-out infinite; animation-delay: -3s">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.2 6.6L21 11l-6.8 2.4L12 20l-2.2-6.6L3 11l6.8-2.4L12 2z" fill="#f490ad" opacity=".75" /></svg>
        </div>
        <div class="deco" style="left: 1760px; top: 700px; animation: floaty 8s ease-in-out infinite; animation-delay: -1s">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="#9b8ce8" stroke-width="3" opacity=".5" /></svg>
        </div>

        <header id="topbar" class="anim">
          <button type="button" class="brand" title="回到站点首页" @click="router.push('/')">
            <div class="brand-mark"><svg viewBox="0 0 24 24" fill="none"><path d="M12 2l2.2 6.6L21 11l-6.8 2.4L12 20l-2.2-6.6L3 11l6.8-2.4L12 2z" fill="#fff" /></svg></div>
            <div>
              <div class="brand-name font-display">{{ siteConfig.siteName }}</div>
              <div class="brand-sub">PAPER STATION</div>
            </div>
          </button>
          <nav id="mainnav">
            <span id="navPill" :style="pillStyle"></span>
            <button ref="navHomeBtn" type="button" @click="router.push('/')">首页</button>
            <button ref="navBlogBtn" type="button" class="active">随笔</button>
            <button type="button" @click="router.push('/diary')">日记</button>
            <button type="button" @click="router.push('/knowledge')">知识库</button>
            <button type="button" @click="router.push('/lab')">实验室</button>
            <button type="button" @click="router.push('/chat')">对话</button>
          </nav>
          <div class="top-right">
            <div class="clock-chip">
              <div class="clock-time">{{ clockTime.h }}<span class="colon">:</span>{{ clockTime.m }} <span class="sec">{{ clockTime.s }}</span></div>
              <div class="clock-date">{{ clockDate }}</div>
            </div>
            <div class="avatar">纸</div>
          </div>
        </header>

        <section class="page on" id="page-list">
          <div class="list-shell">
            <aside class="list-side anim" style="animation-delay: 0.15s">
              <div class="side-card glass">
                <span class="tape"></span>
                <h3 class="font-display">关于</h3>
                <p class="about-text text-pretty">{{ siteConfig.blogSubtitle || '记录想法与实验笔记' }}</p>
              </div>
              <div class="side-card glass">
                <h3 class="font-display">搜索</h3>
                <div class="search-compact" :class="{ 'has-q': q }">
                  <svg class="search-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" stroke-linecap="round" /></svg>
                  <input type="search" :value="q" placeholder="搜标题…" autocomplete="off" @input="setSearch(($event.target as HTMLInputElement).value.trim())" />
                  <button v-if="q" type="button" class="search-clear" aria-label="清除搜索" @click="setSearch('')">×</button>
                </div>
              </div>
              <div class="side-card glass">
                <div class="side-h">
                  <h3 class="font-display">分类</h3>
                </div>
                <p class="filter-hint">点击分类筛选本页文章</p>
                <div class="cat-list">
                  <button
                    v-for="c in catItems"
                    :key="c.name"
                    type="button"
                    class="cat-item"
                    :class="{ on: c.name === '全部' ? !activeCat : activeCat === c.name }"
                    @click="pickCat(c.name)"
                  >
                    <span class="lab">{{ c.name }}</span>
                    <span class="n">{{ c.count }}</span>
                  </button>
                </div>
              </div>
              <div class="side-card glass" style="flex: 1; min-height: 0">
                <div class="side-h">
                  <h3 class="font-display">标签</h3>
                </div>
                <p class="filter-hint">点击标签筛选 · 再点取消</p>
                <div class="tag-cloud">
                  <button
                    v-for="t in tagItems"
                    :key="t.name"
                    type="button"
                    class="tag-pill check"
                    :class="{ on: activeTag === t.name }"
                    @click="pickTag(t.name)"
                  >
                    <span>#{{ t.name }}</span>
                  </button>
                </div>
              </div>
            </aside>

            <div class="list-main anim" style="animation-delay: 0.22s">
              <div class="list-head">
                <div>
                  <div class="eyebrow">JOURNAL</div>
                  <h1 class="font-display">{{ siteConfig.blogTitle || '随笔' }}<span class="sticker font-display">Vol.{{ posts.length }}</span></h1>
                  <div class="sub">把日子写成一页页小故事</div>
                </div>
                <div class="list-actions">
                  <div class="seg-mini">
                    <button type="button" :class="{ on: layout === 'card' }" @click="setLayout('card')">卡片</button>
                    <button type="button" :class="{ on: layout === 'timeline' }" @click="setLayout('timeline')">时间线</button>
                  </div>
                  <div class="seg-mini list-sort">
                    <button type="button" :class="{ on: sortMode === 'latest' }" @click="setSort('latest')">最新</button>
                    <button type="button" :class="{ on: sortMode === 'popular' }" @click="setSort('popular')">热门</button>
                  </div>
                  <button type="button" class="chip-btn primary font-display" @click="message.info('发布页还原中，敬请期待')">发布</button>
                </div>
              </div>

              <div v-if="loading" class="empty-state show" style="display: block">
                <div class="t font-display">正在装订期刊…</div>
              </div>
              <template v-else>
                <div class="bento" style="opacity: 1">
                  <article
                    v-for="(p, i) in pageItems"
                    :key="p.id"
                    class="post-card"
                    :class="{ featured: i === 0 }"
                    @click="openPost(p.id)"
                  >
                    <div class="cover" :class="`c${p.cover}`" :style="p.coverUrl ? { backgroundImage: `url(${p.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined">
                      <span class="masthead">JOURNAL</span>
                      <span v-if="!p.coverUrl" class="ratio">16:9</span>
                    </div>
                    <div class="body">
                      <div class="meta"><span>{{ p.cat }}</span><span>{{ p.date.slice(5) }}</span></div>
                      <div class="title font-display">{{ p.title }}</div>
                      <p class="summary text-pretty">{{ p.summary }}</p>
                      <div class="foot">
                        <div class="tags"><span v-for="t in p.tags.slice(0, 2)" :key="t">#{{ t }}</span></div>
                        <div class="stats">
                          <span style="display: inline-flex; align-items: center; gap: 3px">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 12px; height: 12px"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
                            {{ viewLabel(p.views) }}
                          </span>
                          <button type="button" class="like-mini" :class="{ liked: likedMap[p.id] }" @click.stop="toggleLike(p)">
                            <svg viewBox="0 0 24 24" :fill="likedMap[p.id] ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" style="width: 12px; height: 12px"><path d="M12 21s-7.2-4.6-9.5-8.2C.7 9.8 2.2 6 5.6 6c1.9 0 3.2 1.1 4 2.2C10.4 7.1 11.7 6 13.6 6c3.4 0 4.9 3.8 3.1 6.8C19.2 16.4 12 21 12 21z" /></svg>
                            {{ likeCount(p) }}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                </div>
                <div class="timeline-wrap">
                  <div class="tl-scroll">
                    <div class="tl-line"></div>
                    <template v-for="g in monthGroups" :key="g.month">
                      <div class="tl-month">{{ g.month }}</div>
                      <div v-for="p in g.items" :key="p.id" class="tl-row">
                        <div class="tl-card" @click="openPost(p.id)">
                          <div class="t font-display">{{ p.title }}</div>
                          <div class="s text-pretty">{{ p.summary }}</div>
                          <div class="m">{{ p.cat }} · {{ p.date }}</div>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
                <div v-if="!pageItems.length" class="empty-state show">
                  <div class="t font-display">没有找到相关随笔</div>
                  <button type="button" class="chip-btn" style="margin-top: 10px" @click="clearFilters">清除条件</button>
                </div>
              </template>

              <div class="list-foot">
                <div class="page-dots">
                  <button
                    v-for="i in totalPages"
                    :key="i"
                    type="button"
                    class="page-dot"
                    :class="{ on: page === i }"
                    @click="page = i"
                  >
                    {{ i }}
                  </button>
                </div>
                <div class="snap-hint">单屏构图 · 分页翻页</div>
              </div>
            </div>

            <aside class="deck anim" style="animation-delay: 0.3s">
              <div class="deck-seal" title="本期印章">樱</div>
              <div class="deck-cal">
                <div class="mo">{{ deckMonth }}</div>
                <div class="dy font-display">{{ deckDay }}</div>
                <div class="wk">{{ deckWeek }}</div>
              </div>
              <div class="mag-stack" @pointerup="onShelfTap">
                <div class="mag-dots" aria-hidden="true">
                  <i v-for="(b, i) in shelf" :key="b.id" :class="{ on: i === shelfIdx }"></i>
                </div>
                <button type="button" class="mag-nav prev" aria-label="上一本" :disabled="shelf.length <= 1" @click="flipShelf(-1, 'left')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M15 6l-6 6 6 6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                </button>
                <button type="button" class="mag-nav next" aria-label="下一本" :disabled="shelf.length <= 1" @click="flipShelf(1, 'right')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                </button>
                <div class="mag-stage">
                  <button
                    v-for="b in shelfDisplay"
                    :key="`${b.id}-${b.cls}`"
                    type="button"
                    class="mag-book"
                    :class="[b.theme, b.cls]"
                    :aria-label="`Vol.${b.vol}`"
                  >
                    <span class="washi" aria-hidden="true"></span>
                    <span class="mast">J O U R N A L</span>
                    <span class="vol font-display">{{ b.vol }}</span>
                    <span class="latest"><b>本期封面故事</b><span>{{ b.title }}</span></span>
                  </button>
                </div>
                <div class="mag-hint">按钮翻页 · 双击打开</div>
              </div>
              <svg class="deck-plane" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M2.5 12.5L21 3l-7.5 18-2.2-7.3L2.5 12.5z" />
              </svg>
              <div class="deck-foot" role="button" tabindex="0" @click="shelfFront && openPost(shelfFront.id)">
                <div>
                  <div class="k">{{ shelfFront ? (shelfFront.title.length > 10 ? shelfFront.title.slice(0, 10) + '…' : shelfFront.title) : '暂无文章' }}</div>
                  <div class="v font-display">Vol.{{ shelfFront?.vol ?? posts.length }}</div>
                </div>
                <span class="go"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" /></svg></span>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </div>

    <div id="tweaks">
      <div class="panel">
        <h4>TWEAKS</h4>
        <div class="row">
          <label>列表布局</label>
          <div class="seg">
            <button type="button" :class="{ on: layout === 'card' }" @click="setLayout('card')">卡片</button>
            <button type="button" :class="{ on: layout === 'timeline' }" @click="setLayout('timeline')">时间线</button>
          </div>
        </div>
        <div class="row">
          <label>时段</label>
          <div class="seg">
            <button type="button" :class="{ on: theme === 'morning' }" @click="setTheme('morning')">晨</button>
            <button type="button" :class="{ on: theme === 'noon' }" @click="setTheme('noon')">午</button>
            <button type="button" :class="{ on: theme === 'dusk' }" @click="setTheme('dusk')">昏</button>
            <button type="button" :class="{ on: theme === 'night' }" @click="setTheme('night')">夜</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Tweaks 面板常驻展开（v6 原型由 fab 切换，实现版简化为常驻） */
#tweaks .panel {
  display: block;
}
</style>
