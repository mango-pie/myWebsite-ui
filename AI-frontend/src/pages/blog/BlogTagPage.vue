<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CalendarOutlined, TagOutlined } from '@ant-design/icons-vue'
import { ArrowLeft, Eye, Heart } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const tagName = decodeURIComponent(String(route.params.name))

const posts = ref([
  {
    id: 1,
    title: 'Vue 3 Composition API 完全指南',
    summary: '深入理解 Vue 3 的 Composition API，包括 setup、ref、reactive、computed 等核心概念。',
    category: '前端开发',
    tags: ['Vue', 'JavaScript', '前端'],
    views: 1234,
    likes: 89,
    createdAt: '2024-01-15',
    cover: 'https://picsum.photos/seed/vue/800/400'
  },
  {
    id: 2,
    title: 'TypeScript 高级类型技巧',
    summary: '探索 TypeScript 的高级类型系统，包括泛型、条件类型、映射类型等。',
    category: '前端开发',
    tags: ['TypeScript', 'JavaScript'],
    views: 856,
    likes: 67,
    createdAt: '2024-01-12',
    cover: 'https://picsum.photos/seed/ts/800/400'
  },
  {
    id: 4,
    title: 'React Hooks 最佳实践',
    summary: '总结 React Hooks 的使用经验，包括 useState、useEffect、useContext 等常用 Hooks。',
    category: '前端开发',
    tags: ['React', 'JavaScript', '前端'],
    views: 987,
    likes: 78,
    createdAt: '2024-01-08',
    cover: 'https://picsum.photos/seed/react/800/400'
  }
])

const pagination = ref({
  current: 1,
  pageSize: 6,
  total: posts.value.length
})

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

const handlePostClick = (id: number) => {
  router.push(`/blog/${id}`)
}

const handleTagClick = (tag: string) => {
  router.push(`/tag/${tag}`)
}

const goBack = () => {
  router.back()
}
</script>

<template>
  <div id="blogTagPage" class="blog-shell-page">
    <div class="tag-header">
      <div class="tag-header__content">
        <button class="tag-header__back" @click="goBack">
          <ArrowLeft :size="15" class="tag-back-icon" /> 返回博客首页
        </button>
        <h1 class="tag-header__title"># {{ tagName }}</h1>
        <p class="tag-header__desc">共 {{ posts.length }} 篇相关文章</p>
      </div>
    </div>

    <div class="blog-container">
      <main class="blog-main">
        <div class="post-list">
          <article
            v-for="post in posts"
            :key="post.id"
            class="post-card"
            @click="handlePostClick(post.id)"
          >
            <div class="post-card__cover" :class="{ 'post-card__cover--empty': !post.cover }">
              <img v-if="post.cover" :src="post.cover" :alt="post.title" />
            </div>
            <div class="post-card__content">
              <div class="post-card__meta">
                <span class="post-card__date">
                  <CalendarOutlined /> {{ formatDate(post.createdAt) }}
                </span>
              </div>
              <h2 class="post-card__title">{{ post.title }}</h2>
              <p class="post-card__summary">{{ post.summary }}</p>
              <div class="post-card__footer">
                <div class="post-card__tags">
                  <span
                    v-for="tag in post.tags"
                    :key="tag"
                    class="post-card__tag"
                    :class="{ 'post-card__tag--active': tag === tagName }"
                    @click.stop="handleTagClick(tag)"
                  >
                    <TagOutlined /> {{ tag }}
                  </span>
                </div>
                <div class="post-card__stats">
                  <span class="post-card__stat">
                    <Eye :size="14" class="meta-icon-eye" /> {{ post.views }}
                  </span>
                  <span class="post-card__stat">
                    <Heart :size="14" class="meta-icon-beat" /> {{ post.likes }}
                  </span>
                </div>
              </div>
            </div>
          </article>
        </div>

        <div class="pagination">
          <a-pagination
            :current="pagination.current"
            :page-size="pagination.pageSize"
            :total="pagination.total"
            show-less-items
          />
        </div>
      </main>

      <aside class="blog-sidebar">
        <div class="sidebar-section">
          <h3 class="sidebar-section__title">相关标签</h3>
          <div class="tag-cloud">
            <span
              v-for="tag in ['Vue', 'React', 'TypeScript', 'Node.js', 'Docker', 'Git']"
              :key="tag"
              class="tag-cloud__item"
              :class="{ 'tag-cloud__item--active': tag === tagName }"
              @click="handleTagClick(tag)"
            >
              {{ tag }}
            </span>
          </div>
        </div>

        <div class="sidebar-section">
          <h3 class="sidebar-section__title">文章分类</h3>
          <ul class="category-list">
            <li
              v-for="cat in ['前端开发', '后端开发', 'DevOps', '工具技巧']"
              :key="cat"
              class="category-list__item"
              @click="router.push(`/category/${cat}`)"
            >
              {{ cat }}
            </li>
          </ul>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.tag-header__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.tag-back-icon {
  transition: transform var(--transition-fast);
}
.tag-header__back:hover .tag-back-icon {
  transform: translateX(-3px);
}
.post-card__stat svg,
.post-card__date svg {
  vertical-align: -0.14em;
}
@media (prefers-reduced-motion: reduce) {
  .tag-header__back:hover .tag-back-icon {
    transform: none;
  }
}
</style>