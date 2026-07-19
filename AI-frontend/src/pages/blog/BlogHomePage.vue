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
  CalendarOutlined,
  TagOutlined,
} from '@ant-design/icons-vue'
import { PenLine, Search, X, Eye, Heart } from 'lucide-vue-next'
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
  { label: '卡片', value: 'card' as BlogLayoutMode },
  { label: '时间线', value: 'timeline' as BlogLayoutMode },
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
            <IconAction :icon="PenLine" label="发布文章" variant="primary" size="lg" motion="pop" @click="handleCreatePost" />
          </div>
        </div>

        <div class="blog-header__search">
          <div class="search-group">
            <a-input
              v-model:value="searchQuery"
              placeholder="搜索文章标题..."
              class="search-input"
              @pressEnter="handleSearch"
            />
            <a-button type="primary" class="search-btn" @click="handleSearch">
              <template #icon><Search :size="15" /></template>
              搜索
            </a-button>
          </div>
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
            暂无文章，换个关键词或筛选条件试试
          </div>
          <div v-else class="post-list">
            <article
              v-for="post in allPosts"
              :key="post.id"
              class="post-card"
              @click="handlePostClick(post.id)"
            >
              <div class="post-card__cover" :class="{ 'post-card__cover--empty': !post.coverUrl }">
                <img v-if="post.coverUrl" :src="post.coverUrl" :alt="post.title" />
              </div>
              <div class="post-card__content">
                <div class="post-card__meta">
                  <span class="post-card__category" @click.stop="handleCategoryClick(post.categoryId)">
                    {{ post.categoryName }}
                  </span>
                  <span class="post-card__date">
                    <CalendarOutlined /> {{ formatDate(post.createdTime) }}
                  </span>
                </div>
                <h2 class="post-card__title">{{ post.title }}</h2>
                <p class="post-card__summary">{{ post.summary }}</p>
                <div class="post-card__footer">
                  <div class="post-card__tags">
                    <span
                      v-for="tag in post.tags"
                      :key="tag.id"
                      class="post-card__tag"
                      @click.stop="handleTagClick(tag.id)"
                    >
                      <TagOutlined /> {{ tag.name }}
                    </span>
                  </div>
                  <div class="post-card__stats">
                    <span v-if="blogUx.viewCountEnabled" class="post-card__stat">
                      <Eye :size="14" class="meta-icon-eye" /> {{ post.viewCount }}
                    </span>
                    <span
                      v-if="blogUx.allowLike"
                      class="post-card__stat post-card__stat--like"
                      @click.stop="handleLike(post)"
                    >
                      <Heart :size="14" class="meta-icon-beat" /> {{ post.likeCount }}
                    </span>
                  </div>
                </div>
              </div>
            </article>
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
.post-card__stat svg,
.post-card__date svg,
.search-btn :deep(svg),
.clear-filter-btn :deep(svg) {
  vertical-align: -0.14em;
}
.post-card__stat--like {
  cursor: pointer;
}
.search-btn :deep(svg) {
  transition: transform var(--transition-fast);
}
.search-btn:hover :deep(svg) {
  transform: translateX(2px);
}
.clear-filter-btn :deep(svg) {
  transition: transform var(--transition-fast);
}
.clear-filter-btn:hover :deep(svg) {
  transform: rotate(90deg);
}
@media (prefers-reduced-motion: reduce) {
  .search-btn:hover :deep(svg),
  .clear-filter-btn:hover :deep(svg) {
    transform: none;
  }
}
</style>
