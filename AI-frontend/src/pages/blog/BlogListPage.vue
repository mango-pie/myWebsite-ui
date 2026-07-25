<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { Search, PenLine } from 'lucide-vue-next'
import { queryBlogPostPage } from '@/api/blogPostController'
import { getAllCategories } from '@/api/blogCategoryController'
import { getTagCloud } from '@/api/blogTagController'

const router = useRouter()

const searchQuery = ref('')
const selectedCategoryId = ref<number | null>(null)
const selectedTagId = ref<number | null>(null)
const loading = ref(false)

const posts = ref<API.BlogPostVO[]>([])
const categories = ref<API.BlogCategoryVO[]>([])
const tags = ref<API.BlogTagVO[]>([])

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
})

const fetchPosts = async () => {
  loading.value = true
  try {
    const res = await queryBlogPostPage({
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
      status: 1,
      title: searchQuery.value.trim() || undefined,
      categoryId: selectedCategoryId.value ?? undefined,
      tagId: selectedTagId.value ?? undefined,
      sortOrder: 'descend',
    })
    if (res.data.code === 0 && res.data.data) {
      posts.value = res.data.data.records || []
      pagination.total = Number(res.data.data.totalRow || 0)
    } else {
      message.error('获取文章列表失败')
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
  if (id === undefined) {
    selectedTagId.value = null
  } else {
    selectedTagId.value = selectedTagId.value === id ? null : id
  }
  selectedCategoryId.value = null
  pagination.current = 1
  fetchPosts()
}

const handleSearch = () => {
  pagination.current = 1
  fetchPosts()
}

const tapeColors = ['var(--st-sakura)', 'var(--st-mint)', 'var(--st-sky)', 'var(--st-cream)']
const tapeTilts = ['-4deg', '3deg', '-3deg', '4deg']

onMounted(() => {
  fetchPosts()
  fetchCategories()
  fetchTags()
})
</script>

<template>
  <div class="container">
    <header class="page-header">
      <div>
        <h1>随笔</h1>
        <p class="subtitle">记录思考与灵感</p>
      </div>
    </header>

    <div class="search-bar">
      <div class="sticker search-wrapper">
        <Search :size="18" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索文章标题..."
          @keyup.enter="handleSearch"
        />
      </div>
      <button class="btn" @click="handleSearch">搜索</button>
    </div>

    <div class="filter-section">
      <div class="filter-group">
        <h3>分类</h3>
        <div class="pill-list">
          <button
            class="pill"
            :data-tone="selectedCategoryId === null ? 'outline' : 'sky'"
            @click="handleCategoryClick(undefined)"
          >
            全部
          </button>
          <button
            v-for="cat in categories"
            :key="cat.id"
            class="pill"
            :data-tone="selectedCategoryId === cat.id ? 'sky' : 'outline'"
            @click="handleCategoryClick(cat.id)"
          >
            {{ cat.name }}
          </button>
        </div>
      </div>

      <div class="filter-group">
        <h3>标签</h3>
        <div class="pill-list">
          <button
            class="pill"
            :data-tone="selectedTagId === null ? 'outline' : 'sakura'"
            @click="handleTagClick(undefined)"
          >
            全部
          </button>
          <button
            v-for="tag in tags"
            :key="tag.id"
            class="pill"
            :data-tone="selectedTagId === tag.id ? 'sakura' : 'outline'"
            @click="handleTagClick(tag.id)"
          >
            {{ tag.name }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="sticker" style="padding: 40px; text-align: center;">
        <p>加载中...</p>
      </div>
    </div>

    <div v-else-if="!posts.length" class="empty-state">
      <div class="sticker" style="padding: 60px 40px; text-align: center;">
        <div class="empty-icon">✍️</div>
        <h3>还没有文章</h3>
        <p>写下第一篇文章吧</p>
      </div>
    </div>

    <div v-else class="post-list">
      <div
        v-for="(post, index) in posts"
        :key="post.id"
        class="sticker post-card"
        :style="{ '--rot': (index % 2 === 0 ? -1 : 1) * 1.5 + 'deg' }"
        @click="handlePostClick(post.id)"
      >
        <div
          class="tape"
          :style="{
            '--tc': tapeColors[index % 4],
            '--tilt': tapeTilts[index % 4],
          }"
        />
        <div class="post-header">
          <div class="post-meta">
            <span class="category-pill">{{ post.categoryName || '未分类' }}</span>
            <span class="date">{{ formatDate(post.createdTime) }}</span>
          </div>
          <h2>{{ post.title }}</h2>
        </div>
        <p class="post-summary">{{ post.summary || '暂无摘要' }}</p>
        <div class="post-footer">
          <div class="tags">
            <span v-for="tag in post.tags" :key="tag.id" class="tag">
              {{ tag.name }}
            </span>
          </div>
          <div class="stats">
            <span>👁 {{ post.viewCount || 0 }}</span>
            <span>❤ {{ post.likeCount || 0 }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1.5px dashed var(--hairline);
}

.page-header h1 {
  margin: 0 0 8px;
  font-size: 48px;
}

.subtitle {
  margin: 0;
  color: var(--ink-soft);
  font-size: 15px;
}

.search-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
  align-items: center;
}

.search-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  max-width: 500px;
}

.search-wrapper input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font: 15px var(--fb);
  color: var(--ink);
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 32px;
  padding: 24px;
  background: var(--paper-surface);
  border: 1.5px dashed var(--hairline);
  border-radius: var(--radius-card);
}

.filter-group h3 {
  margin: 0 0 12px;
  font-size: 18px;
}

.pill-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px;
  font-size: 24px;
}

.empty-state p {
  margin: 0;
  color: var(--ink-soft);
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.post-card {
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  transform: rotate(var(--rot, 0deg));
}

.post-card:hover {
  transform: rotate(0deg) translateY(-4px);
}

.post-header {
  margin-bottom: 16px;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.category-pill {
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  background: var(--st-sky);
  border: 1.5px solid var(--hairline);
}

.date {
  font-size: 13px;
  color: var(--ink-soft);
}

.post-header h2 {
  margin: 0;
  font-size: 24px;
  line-height: 1.3;
}

.post-summary {
  margin: 0 0 16px;
  font-size: 15px;
  line-height: 1.7;
  color: var(--ink);
}

.post-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 1.5px dashed var(--hairline);
}

.tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 11px;
  background: var(--st-cream);
  border: 1px solid var(--hairline);
}

.stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--ink-soft);
}

@media (max-width: 768px) {
  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-wrapper {
    max-width: none;
  }
}
</style>
