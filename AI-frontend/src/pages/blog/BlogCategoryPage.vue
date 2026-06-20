<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CalendarOutlined, TagOutlined, EyeOutlined, HeartOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()
const categoryName = decodeURIComponent(String(route.params.name))

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
  <div id="blogCategoryPage" class="blog-shell-page">
    <div class="category-header">
      <div class="category-header__content">
        <button class="category-header__back" @click="goBack">← 返回博客首页</button>
        <h1 class="category-header__title">{{ categoryName }}</h1>
        <p class="category-header__desc">共 {{ posts.length }} 篇文章</p>
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
                    @click.stop="handleTagClick(tag)"
                  >
                    <TagOutlined /> {{ tag }}
                  </span>
                </div>
                <div class="post-card__stats">
                  <span class="post-card__stat">
                    <EyeOutlined /> {{ post.views }}
                  </span>
                  <span class="post-card__stat">
                    <HeartOutlined /> {{ post.likes }}
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
          <h3 class="sidebar-section__title">其他分类</h3>
          <ul class="category-list">
            <li
              v-for="cat in ['后端开发', 'DevOps', '工具技巧']"
              :key="cat"
              class="category-list__item"
              @click="router.push(`/category/${cat}`)"
            >
              {{ cat }}
            </li>
          </ul>
        </div>

        <div class="sidebar-section">
          <h3 class="sidebar-section__title">热门标签</h3>
          <div class="tag-cloud">
            <span
              v-for="tag in ['Vue', 'React', 'TypeScript', 'JavaScript', 'Node.js']"
              :key="tag"
              class="tag-cloud__item"
              @click="handleTagClick(tag)"
            >
              {{ tag }}
            </span>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>