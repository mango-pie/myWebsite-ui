<script setup lang="ts">
/**
 * 博客首页 - 展示文章列表、分类、标签
 * - 支持搜索、分类筛选、排序
 * - 卡片 / 时间线排版切换
 */
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  PenLine,
  Search,
  X,
} from 'lucide-vue-next'
import IconAction from '@/components/ui/IconAction.vue'
import { queryBlogPostPage, incrementLikeCount } from '@/api/blogPostController'
import { getAllCategories } from '@/api/blogCategoryController'
import { getTagCloud } from '@/api/blogTagController'
import { useLoginUserStore } from '@/stores/loginUser'
import { isAdminRole } from '@/config/permission'
import { siteConfig } from '@/config/site'
import { useBlogLayoutMode } from '@/composables/useBlogLayoutMode'
import type { BlogLayoutMode } from '@/composables/useBlogLayoutMode'
import BlogFilterSidebar from '@/components/blog/BlogFilterSidebar.vue'
import BlogPostTimeline from '@/components/blog/BlogPostTimeline.vue'
import {
  loadBlogSettings,
  markBlogLikeDisabled,
  type BlogUxSettings,
} from '@/utils/blogSettings'

const router = useRouter()
const route = useRoute()
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

const layoutOptions = [
  { label: '目录', value: 'card' as BlogLayoutMode },
  { label: '年表', value: 'timeline' as BlogLayoutMode },
]

const searchQuery = ref('')
const sortBy = ref<'latest' | 'popular'>('latest')
const selectedCategoryId = ref<number | null>(null)
const selectedTagId = ref<number | null>(null)
const loading = ref(false)

const allPosts = ref<API.BlogPostVO[]>([])
const categories = ref<API.BlogCategoryVO[]>([])
const tags = ref<API.BlogTagVO[]>([])

const pagination = reactive({
  current: 1,
  pageSize: 0,
  total: 0,
})

const isTimelineLayout = computed(() => layoutMode.value === 'timeline')

const canManageMeta = computed(() => isAdminRole(loginUserStore.loginUser?.userRole))

const handleMetaCreated = (type: 'category' | 'tag') => {
  if (type === 'category') {
    fetchCategories()
  } else {
    fetchTags()
  }
}

const buildQueryParams = (): API.BlogPostQueryRequest => ({
  pageNum: pagination.current,
  // <=0 时后端使用 list.page_size_default
  pageSize: 0,
  status: 1,
  title: searchQuery.value.trim() || undefined,
  categoryId: selectedCategoryId.value ?? undefined,
  tagId: selectedTagId.value ?? undefined,
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
      categories.value = res.data.data
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

const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

const handlePostClick = (id: number | undefined) => {
  if (id) {
    router.push(`/blog/${id}`)
  }
}

const handleCategoryClick = (id: number | undefined) => {
  if (id === undefined) {
    selectedCategoryId.value = null
  } else {
    selectedCategoryId.value = selectedCategoryId.value === id ? null : id
  }
  selectedTagId.value = null
  pagination.current = 1
  fetchPosts()
}

const handleTagClick = (id: number | undefined) => {
  if (id === undefined) return
  selectedTagId.value = selectedTagId.value === id ? null : id
  selectedCategoryId.value = null
  pagination.current = 1
  fetchPosts()
}

const onCategorySelectChange = () => {
  selectedTagId.value = null
  pagination.current = 1
  fetchPosts()
}

const handleSearch = () => {
  pagination.current = 1
  fetchPosts()
}

const clearFilters = () => {
  selectedCategoryId.value = null
  selectedTagId.value = null
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

const handlePageChange = (page: number, pageSize: number) => {
  pagination.current = page
  if (pageSize) pagination.pageSize = pageSize
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

const initFromRoute = () => {
  const { categoryId, tagId } = route.query
  if (categoryId) {
    selectedCategoryId.value = Number(categoryId)
    selectedTagId.value = null
  } else if (tagId) {
    selectedTagId.value = Number(tagId)
    selectedCategoryId.value = null
  } else {
    selectedCategoryId.value = null
    selectedTagId.value = null
  }
}

onMounted(async () => {
  blogUx.value = await loadBlogSettings()
  if (blogUx.value.pageSizeDefault > 0) {
    pagination.pageSize = blogUx.value.pageSizeDefault
  }
  initFromRoute()
  fetchPosts()
  fetchCategories()
  fetchTags()

  // React to Agent creating/updating blog drafts
  if (typeof window !== 'undefined') {
    window.addEventListener('agent-ui-action', (e: Event) => {
      const d = (e as CustomEvent).detail
      if (d?.type === 'refresh' && (d.module === 'blog_list' || d.module === 'blog_editor')) {
        fetchPosts()
      }
    })
  }
})

watch(
  () => route.query,
  () => {
    initFromRoute()
    pagination.current = 1
    fetchPosts()
  },
)

watch(sortBy, () => {
  pagination.current = 1
  fetchPosts()
})
</script>

<template>
  <div
    id="blogHomePage"
    class="blog-shell-page"
    :class="{ 'blog-shell-page--timeline': isTimelineLayout }"
  >
    <header class="blog-header">
      <div class="blog-header__content">
        <div class="blog-header__top">
          <div>
            <p class="blog-header__kicker">随笔卷</p>
            <h1 class="blog-header__title">{{ siteConfig.blogTitle }}</h1>
            <p class="blog-header__desc">{{ siteConfig.blogSubtitle }}</p>
          </div>
          <div class="blog-header__actions">
            <a-segmented
              class="blog-layout-switch"
              :value="layoutMode"
              :options="layoutOptions"
              @change="(val: BlogLayoutMode) => setLayoutMode(val)"
            />
            <IconAction
              :icon="PenLine"
              label="落笔"
              variant="primary"
              size="md"
              motion="pop"
              @click="handleCreatePost"
            />
          </div>
        </div>

        <div class="blog-header__search">
          <label class="blog-find">
            <Search :size="14" :stroke-width="2" aria-hidden="true" />
            <input
              v-model="searchQuery"
              type="search"
              placeholder="在书页中检索标题…"
              @keydown.enter.prevent="handleSearch"
            />
          </label>
        </div>
      </div>
    </header>

    <div class="blog-container" :class="`blog-container--${layoutMode}`">
      <aside
        v-if="isTimelineLayout"
        class="blog-sidebar blog-sidebar--left"
      >
        <BlogFilterSidebar
          :categories="categories"
          :tags="tags"
          :selected-category-id="selectedCategoryId"
          :selected-tag-id="selectedTagId"
          :show-about="true"
          :can-manage-meta="canManageMeta"
          @category-click="handleCategoryClick"
          @tag-click="handleTagClick"
          @meta-created="handleMetaCreated"
        />
      </aside>

      <main class="blog-main">
        <div class="filter-bar">
          <div class="filter-bar__left">
            <template v-if="!isTimelineLayout">
              <span class="filter-bar__label">分类:</span>
              <a-select
                v-model:value="selectedCategoryId"
                class="filter-bar__select"
                placeholder="全部"
                :allow-clear="true"
                @change="onCategorySelectChange"
              >
                <a-select-option :value="null">全部</a-select-option>
                <a-select-option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ cat.name }}
                </a-select-option>
              </a-select>
            </template>
          </div>
          <div class="filter-bar__right">
            <a-button
              v-if="selectedCategoryId || selectedTagId || searchQuery"
              type="link"
              class="clear-filter-btn"
              @click="clearFilters"
            >
              <template #icon><X :size="15" /></template>
              清除筛选
            </a-button>
            <template v-if="!isTimelineLayout">
              <span class="filter-bar__label">排序:</span>
              <a-select v-model:value="sortBy" class="filter-bar__select">
                <a-select-option value="latest">最新发布</a-select-option>
                <a-select-option value="popular">最热门</a-select-option>
              </a-select>
            </template>
          </div>
        </div>

        <BlogPostTimeline
          v-if="isTimelineLayout"
          :posts="allPosts"
          :loading="loading"
          :selected-tag-id="selectedTagId"
          @post-click="handlePostClick"
          @category-click="handleCategoryClick"
          @tag-click="handleTagClick"
          :allow-like="blogUx.allowLike"
          :show-view-count="blogUx.viewCountEnabled"
          @like="handleLike"
        />

        <template v-else>
          <div v-if="!loading && allPosts.length === 0" class="post-list--empty">
            这一卷暂无篇章。换个关键词，或先落下一笔。
          </div>
          <div v-else class="post-list folio-toc">
            <button
              v-for="(post, index) in allPosts"
              :key="post.id"
              type="button"
              class="folio-toc__row post-card"
              :style="{ '--i': index }"
              @click="handlePostClick(post.id)"
            >
              <span class="folio-toc__num">{{ String(index + 1 + (pagination.current - 1) * (pagination.pageSize || 10)).padStart(2, '0') }}</span>
              <span class="folio-toc__body">
                <span class="folio-toc__name">{{ post.title }}</span>
                <span class="folio-toc__desc">
                  <span
                    v-if="post.categoryName"
                    class="post-card__category"
                    @click.stop="handleCategoryClick(post.categoryId)"
                  >{{ post.categoryName }}</span>
                  {{ post.summary || '（无摘要）' }}
                </span>
              </span>
              <span class="folio-toc__leaders" aria-hidden="true" />
              <span class="folio-toc__folio">{{ formatDate(post.createdTime) }}</span>
              <span class="folio-toc__meta">
                <span
                  v-if="blogUx.viewCountEnabled"
                  class="wax-seal wax-seal--sticker"
                >阅 {{ post.viewCount || 0 }}</span>
                <span
                  v-if="blogUx.allowLike"
                  class="wax-seal"
                  @click.stop="handleLike(post)"
                >赞 {{ post.likeCount || 0 }}</span>
              </span>
            </button>
          </div>
        </template>

        <div class="pagination">
          <a-pagination
            :current="pagination.current"
            :page-size="pagination.pageSize"
            :total="pagination.total"
            show-less-items
            @change="handlePageChange"
          />
        </div>
      </main>

      <aside v-if="!isTimelineLayout" class="blog-sidebar">
        <BlogFilterSidebar
          :categories="categories"
          :tags="tags"
          :selected-category-id="selectedCategoryId"
          :selected-tag-id="selectedTagId"
          :show-about="true"
          :can-manage-meta="canManageMeta"
          @category-click="handleCategoryClick"
          @tag-click="handleTagClick"
          @meta-created="handleMetaCreated"
        />
      </aside>
    </div>
  </div>
</template>

<style scoped>
.blog-header__kicker {
  margin: 0 0 0.4em;
  font-family: var(--font-sans);
  font-size: 0.72em;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.blog-find {
  display: flex;
  align-items: center;
  gap: 0.5em;
  width: 100%;
  height: 2.5em;
  padding: 0 0.85em;
  border: 1px solid var(--color-border);
  border-radius: 2px;
  background: rgba(250, 246, 235, 0.75);
  color: var(--color-text-secondary);
  font-family: var(--font-sans);
  font-size: 0.88em;
}

.blog-find input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-text-primary);
  font: inherit;
}

.folio-toc__row.post-card {
  display: grid;
  grid-template-columns: 2.4em minmax(0, auto) minmax(1.2em, 1fr) auto;
  grid-template-areas:
    'num body leaders folio'
    '.   meta meta meta';
  gap: 0.2em 0.55em;
  align-items: baseline;
  width: 100%;
  padding: 1em 0.25em;
  border: none;
  border-bottom: 1px dashed rgba(169, 144, 112, 0.5);
  border-radius: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
  font: inherit;
  color: inherit;
  animation: folioRise 0.55s ease both;
  animation-delay: calc(0.04s + var(--i, 0) * 0.05s);
  transition:
    background 0.28s ease,
    padding-left 0.28s ease;
}

.folio-toc__row.post-card:hover {
  background: rgba(160, 120, 70, 0.1);
  padding-left: 0.5em;
  box-shadow: none;
  transform: none;
}

.folio-toc__num {
  grid-area: num;
  font-family: var(--font-sans);
  font-size: 0.75em;
  color: var(--color-text-muted);
}

.folio-toc__body {
  grid-area: body;
  display: flex;
  flex-direction: column;
  gap: 0.2em;
  min-width: 0;
}

.folio-toc__name {
  font-family: var(--font-serif);
  font-size: clamp(1.15rem, 2.5vw, 1.4rem);
  font-weight: 600;
  color: var(--color-text-primary);
}

.folio-toc__row:hover .folio-toc__name {
  color: var(--color-primary);
}

.folio-toc__desc {
  font-family: var(--font-sans);
  font-size: 0.8em;
  color: var(--color-text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.folio-toc__desc .post-card__category {
  margin-right: 0.5em;
}

.folio-toc__leaders {
  grid-area: leaders;
  height: 0;
  border-bottom: 1px dotted rgba(138, 115, 85, 0.55);
  align-self: center;
}

.folio-toc__folio {
  grid-area: folio;
  font-family: var(--font-serif);
  font-size: 0.85em;
  font-style: italic;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.folio-toc__meta {
  grid-area: meta;
  display: flex;
  flex-wrap: wrap;
  gap: 0.45em;
  margin-top: 0.25em;
}

@keyframes folioRise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (max-width: 640px) {
  .folio-toc__row.post-card {
    grid-template-columns: 2em minmax(0, 1fr);
    grid-template-areas:
      'num body'
      '. folio'
      '. meta';
  }

  .folio-toc__leaders {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .folio-toc__row.post-card {
    animation: none;
  }
}
</style>
