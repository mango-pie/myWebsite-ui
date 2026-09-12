<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { queryBlogPostPage, incrementLikeCount } from '@/api/blogPostController'
import { getAllCategories } from '@/api/blogCategoryController'
import { getTagCloud } from '@/api/blogTagController'
import { useLoginUserStore } from '@/stores/loginUser'
import { siteConfig } from '@/config/site'
import { useBlogLayoutMode } from '@/composables/useBlogLayoutMode'
import type { BlogLayoutMode } from '@/composables/useBlogLayoutMode'
import {
  loadBlogSettings,
  markBlogLikeDisabled,
  type BlogUxSettings,
} from '@/utils/blogSettings'
import { buildFilterQuery } from '@/utils/blogFilterQuery'
import BlogRoomShell from '@/components/blog/BlogRoomShell.vue'
import BlogPostCard from '@/components/blog/BlogPostCard.vue'
import BlogMagazineDeck from '@/components/blog/BlogMagazineDeck.vue'

const router = useRouter()
const loginUserStore = useLoginUserStore()
const { layoutMode, setLayoutMode } = useBlogLayoutMode()

const blogUx = ref<BlogUxSettings>({
  pageSizeDefault: 10,
  summaryMaxLength: 200,
  allowLike: true,
  viewCountEnabled: true,
  defaultStatus: 0,
  defaultStatusKey: 'DRAFT',
})

const searchQuery = ref('')
const sortBy = ref<'latest' | 'popular'>('latest')
const loading = ref(false)
const allPosts = ref<API.BlogPostVO[]>([])
const categories = ref<API.BlogCategoryVO[]>([])
const tags = ref<API.BlogTagVO[]>([])

const pagination = reactive({
  current: 1,
  pageSize: 0,
  total: 0,
})

const totalPages = computed(() => {
  const size = pagination.pageSize || blogUx.value.pageSizeDefault || 10
  if (size <= 0) return 1
  return Math.max(1, Math.ceil(pagination.total / size))
})

const pageDots = computed(() => {
  const n = totalPages.value
  const cur = pagination.current
  const max = Math.min(n, 7)
  const start = Math.max(1, Math.min(cur - 3, n - max + 1))
  return Array.from({ length: max }, (_, i) => start + i)
})

const monthGroups = computed(() => {
  const map = new Map<string, API.BlogPostVO[]>()
  for (const p of allPosts.value) {
    const d = p.createdTime ? new Date(p.createdTime) : null
    const key =
      d && !Number.isNaN(d.getTime())
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        : '未知'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(p)
  }
  return [...map.entries()].map(([month, posts]) => ({ month, posts }))
})

const buildQueryParams = (): API.BlogPostQueryRequest => ({
  pageNum: pagination.current,
  pageSize: 0,
  status: 1,
  title: searchQuery.value.trim() || undefined,
  sortField: sortBy.value === 'popular' ? 'view_count' : undefined,
  sortOrder: 'descend',
})

const fetchPosts = async () => {
  loading.value = true
  try {
    const res = await queryBlogPostPage(buildQueryParams())
    if (res.data.code === 0 && res.data.data) {
      allPosts.value = res.data.data.records || []
      pagination.total = Number(res.data.data.totalRow || 0)
      const size = Number(res.data.data.pageSize || 0)
      if (size > 0) pagination.pageSize = size
      else if (blogUx.value.pageSizeDefault > 0) pagination.pageSize = blogUx.value.pageSizeDefault
    } else {
      message.error('获取文章列表失败：' + (res.data.message || '未知错误'))
    }
  } catch (error) {
    console.error('获取文章列表失败:', error)
    message.error('获取文章列表失败')
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  try {
    const res = await getAllCategories()
    if (res.data.code === 0 && res.data.data) {
      categories.value = res.data.data as API.BlogCategoryVO[]
    }
  } catch (error) {
    console.error('获取分类列表失败:', error)
  }
}

const fetchTags = async () => {
  try {
    const res = await getTagCloud()
    if (res.data.code === 0 && res.data.data) {
      tags.value = res.data.data
    }
  } catch (error) {
    console.error('获取标签列表失败:', error)
  }
}

const goPost = (id: number) => router.push(`/blog/${id}`)

const goFilterOpen = () => {
  const firstCat = categories.value.find((c) => c.id != null)?.id
  if (firstCat) {
    router.push({ path: '/blog/filter', query: buildFilterQuery([firstCat], []) })
    return
  }
  const firstTag = tags.value.find((t) => t.id != null)?.id
  if (firstTag) {
    router.push({ path: '/blog/filter', query: buildFilterQuery([], [firstTag]) })
    return
  }
  message.info('暂无分类或标签可筛选')
}

const goFilterCats = (id?: number) => {
  if (!id) {
    goFilterOpen()
    return
  }
  router.push({ path: '/blog/filter', query: buildFilterQuery([id], []) })
}

const goFilterTags = (id?: number) => {
  if (!id) {
    goFilterOpen()
    return
  }
  router.push({ path: '/blog/filter', query: buildFilterQuery([], [id]) })
}

const handleSearch = () => {
  pagination.current = 1
  fetchPosts()
}

const clearSearch = () => {
  searchQuery.value = ''
  pagination.current = 1
  fetchPosts()
}

const handleCreatePost = () => {
  if (!loginUserStore.loginUser?.id) {
    message.warning('请先登录')
    router.push(`/user/login?redirect=${encodeURIComponent('/blog/create')}`)
    return
  }
  router.push('/blog/create')
}

const goPage = (page: number) => {
  if (page < 1 || page > totalPages.value || page === pagination.current) return
  pagination.current = page
  fetchPosts()
}

const handleLike = async (post: API.BlogPostVO) => {
  if (!post.id || !blogUx.value.allowLike) return
  try {
    const res = await incrementLikeCount({ id: post.id })
    if (res.data.code === 0) {
      post.likeCount = (post.likeCount || 0) + 1
      message.success('点赞成功')
    } else {
      const msg = res.data.message || '点赞失败'
      if (String(msg).includes('已关闭')) {
        markBlogLikeDisabled()
        blogUx.value = { ...blogUx.value, allowLike: false }
        message.warning(msg)
      } else {
        message.error(msg)
      }
    }
  } catch (error) {
    console.error('点赞失败:', error)
    message.error('点赞失败')
  }
}

const setLayout = (mode: BlogLayoutMode) => setLayoutMode(mode)

onMounted(async () => {
  blogUx.value = await loadBlogSettings()
  if (blogUx.value.pageSizeDefault > 0) {
    pagination.pageSize = blogUx.value.pageSizeDefault
  }
  fetchPosts()
  fetchCategories()
  fetchTags()

  if (typeof window !== 'undefined') {
    window.addEventListener('agent-ui-action', (e: Event) => {
      const d = (e as CustomEvent).detail
      if (d?.type === 'refresh' && (d.module === 'blog_list' || d.module === 'blog_editor')) {
        fetchPosts()
      }
    })
  }
})

watch(sortBy, () => {
  pagination.current = 1
  fetchPosts()
})
</script>

<template>
  <BlogRoomShell :layout-mode="layoutMode">
    <div class="list-shell">
      <aside class="list-side anim" style="animation-delay: 0.15s">
        <div class="side-card glass">
          <span class="tape" />
          <h3 class="font-display">关于</h3>
          <p class="about-text text-pretty">
            {{ siteConfig.blogSubtitle }}。学习、灵感与一点点生活碎碎念。
          </p>
        </div>
        <div class="side-card glass">
          <h3 class="font-display">搜索</h3>
          <div class="search-compact" :class="{ 'has-q': !!searchQuery.trim() }">
            <svg class="search-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" stroke-linecap="round" />
            </svg>
            <input
              v-model="searchQuery"
              type="search"
              placeholder="搜标题…"
              autocomplete="off"
              @keydown.enter.prevent="handleSearch"
            />
            <button type="button" class="search-clear" aria-label="清除搜索" @click="clearSearch">×</button>
          </div>
        </div>
        <div class="side-card glass">
          <div class="side-h">
            <h3 class="font-display">分类</h3>
            <button type="button" class="more" @click="goFilterOpen">筛选 ›</button>
          </div>
          <p class="filter-hint">点击进入筛选页 · 分类与标签可同选</p>
          <div class="cat-list">
            <button type="button" class="cat-item on" title="显示全部" @click="router.push('/blog')">
              <span class="chk" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <path d="M5 12l5 5L20 7" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
              <span class="lab">全部</span>
              <span class="n">{{ pagination.total || 0 }}</span>
            </button>
            <button
              v-for="cat in categories.slice(0, 8)"
              :key="cat.id"
              type="button"
              class="cat-item"
              :title="`进入筛选：${cat.name}`"
              @click="goFilterCats(cat.id)"
            >
              <span class="chk" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <path d="M5 12l5 5L20 7" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
              <span class="lab">{{ cat.name }}</span>
              <span v-if="cat.postCount != null" class="n">{{ cat.postCount }}</span>
              <span class="go-hint">›</span>
            </button>
          </div>
        </div>
        <div class="side-card glass" style="flex: 1; min-height: 0">
          <div class="side-h">
            <h3 class="font-display">标签</h3>
            <button type="button" class="more" @click="goFilterOpen">筛选 ›</button>
          </div>
          <p class="filter-hint">点击进入筛选页 · 与分类合并筛选</p>
          <div class="tag-cloud">
            <button
              v-for="tag in tags.slice(0, 12)"
              :key="tag.id"
              type="button"
              class="tag-pill check"
              title="进入筛选页"
              @click="goFilterTags(tag.id)"
            >
              <span class="chk" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <path d="M5 12l5 5L20 7" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
              <span>#{{ tag.name }}</span>
            </button>
          </div>
        </div>
      </aside>

      <div class="list-main anim" style="animation-delay: 0.22s">
        <div class="list-head">
          <div>
            <div class="eyebrow">JOURNAL</div>
            <h1 class="font-display">
              {{ siteConfig.blogTitle
              }}<span class="sticker font-display">Vol.{{ pagination.total || '—' }}</span>
            </h1>
            <div class="sub">把日子写成一页页小故事</div>
          </div>
          <div class="list-actions">
            <div class="seg-mini">
              <button type="button" :class="{ on: layoutMode === 'card' }" @click="setLayout('card')">
                卡片
              </button>
              <button
                type="button"
                :class="{ on: layoutMode === 'timeline' }"
                @click="setLayout('timeline')"
              >
                时间线
              </button>
            </div>
            <div class="seg-mini list-sort">
              <button type="button" :class="{ on: sortBy === 'latest' }" @click="sortBy = 'latest'">
                最新
              </button>
              <button type="button" :class="{ on: sortBy === 'popular' }" @click="sortBy = 'popular'">
                热门
              </button>
            </div>
            <button type="button" class="chip-btn primary font-display" @click="handleCreatePost">
              发布
            </button>
          </div>
        </div>

        <div v-show="layoutMode === 'card'" class="bento">
          <template v-if="!loading && allPosts.length">
            <BlogPostCard
              v-for="(post, i) in allPosts"
              :key="post.id"
              :post="post"
              :featured="i === 0"
              :allow-like="blogUx.allowLike"
              :show-view-count="blogUx.viewCountEnabled"
              @open="goPost"
              @like="handleLike"
              @tag="goFilterTags"
              @category="goFilterCats"
            />
          </template>
        </div>

        <div v-show="layoutMode === 'timeline'" class="timeline-wrap">
          <div class="tl-scroll">
            <div class="tl-line" />
            <template v-for="group in monthGroups" :key="group.month">
              <div class="tl-month">{{ group.month }}</div>
              <div v-for="post in group.posts" :key="post.id" class="tl-row">
                <button type="button" class="tl-card glass" @click="goPost(post.id!)">
                  <div class="t font-display">{{ post.title }}</div>
                  <div class="s text-pretty">{{ post.summary }}</div>
                  <div class="m">{{ post.categoryName }} · {{ post.likeCount || 0 }} 赞</div>
                </button>
              </div>
            </template>
          </div>
        </div>

        <div v-if="!loading && allPosts.length === 0" class="empty-state show">
          <div class="t font-display">没有找到相关随笔</div>
          <button type="button" class="chip-btn" style="margin-top: 10px" @click="clearSearch">
            清除搜索
          </button>
        </div>

        <div class="list-foot">
          <div class="page-dots">
            <button
              v-for="p in pageDots"
              :key="p"
              type="button"
              class="page-dot"
              :class="{ on: p === pagination.current }"
              @click="goPage(p)"
            >
              {{ p }}
            </button>
          </div>
          <div class="snap-hint">单屏构图 · 分页翻页</div>
        </div>
      </div>

      <BlogMagazineDeck :posts="allPosts" @open="goPost" />
    </div>
  </BlogRoomShell>
</template>
