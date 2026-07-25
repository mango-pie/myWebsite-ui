<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { renderBlogMarkdown } from '@/utils/blogMarkdown'
import { ArrowLeft, Heart, Share2, Eye } from 'lucide-vue-next'
import { message } from 'ant-design-vue'
import { getBlogPostVo, incrementLikeCount, incrementViewCount } from '@/api/blogPostController'

const router = useRouter()
const route = useRoute()

const post = ref<API.BlogPostVO | null>(null)
const loading = ref(true)
const isLiked = ref(false)

const renderedContent = computed(() => {
  if (!post.value?.content) return ''
  return renderBlogMarkdown(post.value.content)
})

const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

const fetchPost = async () => {
  try {
    loading.value = true
    const currentId = Number(route.params.id)
    const response = await getBlogPostVo({ id: currentId })
    
    if (response.data?.data) {
      post.value = response.data.data
      try {
        await incrementViewCount({ id: currentId })
        if (post.value.viewCount !== undefined) {
          post.value.viewCount += 1
        }
      } catch {
        // view count increment is optional
      }
    } else {
      message.error('获取文章失败')
    }
  } catch (error) {
    console.error('获取文章失败:', error)
    message.error('获取文章失败')
  } finally {
    loading.value = false
  }
}

const handleLike = async () => {
  if (!post.value?.id || isLiked.value) return
  try {
    const res = await incrementLikeCount({ id: post.value.id })
    if (res.data.code === 0) {
      isLiked.value = true
      if (post.value.likeCount !== undefined) {
        post.value.likeCount += 1
      }
      message.success('已点赞')
    }
  } catch {
    message.error('点赞失败')
  }
}

const handleShare = async () => {
  const url = window.location.href
  try {
    await navigator.clipboard.writeText(url)
    message.success('链接已复制')
  } catch {
    message.info('请手动复制链接：' + url)
  }
}

watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      fetchPost()
    }
  },
)

onMounted(() => {
  fetchPost()
})
</script>

<template>
  <div class="container">
    <div v-if="loading" class="loading-state">
      <div class="sticker" style="padding: 60px; text-align: center;">
        <p>加载中...</p>
      </div>
    </div>

    <div v-else-if="!post" class="empty-state">
      <div class="sticker" style="padding: 60px; text-align: center;">
        <p>文章不存在或已被删除</p>
        <button class="btn" @click="router.push('/blog')" style="margin-top: 16px;">
          返回随笔列表
        </button>
      </div>
    </div>

    <article v-else class="post-article">
      <header class="post-header">
        <button class="btn-back" @click="router.push('/blog')">
          <ArrowLeft :size="18" />
          返回
        </button>
        <div class="post-meta-top">
          <span class="category-pill">{{ post.categoryName || '未分类' }}</span>
          <span class="date">{{ formatDate(post.createdTime) }}</span>
        </div>
        <h1 class="post-title">{{ post.title }}</h1>
        <div class="post-stats">
          <span class="stat">
            <Eye :size="14" />
            {{ post.viewCount || 0 }} 阅读
          </span>
          <span class="stat">
            <Heart :size="14" />
            {{ post.likeCount || 0 }} 点赞
          </span>
        </div>
      </header>

      <div v-if="post.coverUrl" class="post-cover">
        <img :src="post.coverUrl" :alt="post.title" />
      </div>

      <div class="sticker post-content-wrapper">
        <div class="tape" style="--tc: var(--st-cream); --tilt: -3deg; --tw: 80px;" />
        <div class="prose" v-html="renderedContent" />
      </div>

      <div v-if="post.tags?.length" class="post-tags">
        <span v-for="tag in post.tags" :key="tag.id" class="tag">
          {{ tag.name }}
        </span>
      </div>

      <footer class="post-footer">
        <button class="btn" :class="{ liked: isLiked }" @click="handleLike" :disabled="isLiked">
          <Heart :size="16" :fill="isLiked ? 'currentColor' : 'none'" />
          {{ isLiked ? '已点赞' : '点赞' }}
        </button>
        <button class="btn ghost" @click="handleShare">
          <Share2 :size="16" />
          分享
        </button>
      </footer>
    </article>
  </div>
</template>

<style scoped>
.post-article {
  max-width: 800px;
  margin: 0 auto;
}

.post-header {
  margin-bottom: 32px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: var(--ink-soft);
  font: 14px var(--fd);
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.2s;
  margin-bottom: 20px;
}

.btn-back:hover {
  background: var(--paper-surface);
  color: var(--ink);
}

.post-meta-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.category-pill {
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  background: var(--st-sky);
  border: 1.5px solid var(--hairline);
  font-family: var(--fd);
}

.date {
  font-size: 13px;
  color: var(--ink-soft);
}

.post-title {
  font-size: 42px;
  line-height: 1.2;
  margin: 0 0 16px;
}

.post-stats {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: var(--ink-soft);
}

.stat {
  display: flex;
  align-items: center;
  gap: 4px;
}

.post-cover {
  margin-bottom: 32px;
  border-radius: var(--radius-card);
  overflow: hidden;
  border: 2px solid var(--hairline);
  box-shadow: var(--shadow-day);
}

.post-cover img {
  width: 100%;
  height: auto;
  display: block;
}

.post-content-wrapper {
  padding: 40px;
  margin-bottom: 32px;
  position: relative;
}

.prose {
  font: 16px / 1.9 var(--fb);
  color: var(--ink);
}

.prose :deep(h1),
.prose :deep(h2),
.prose :deep(h3) {
  font-family: var(--fd);
  margin: 32px 0 16px;
  color: var(--ink);
}

.prose :deep(h1) { font-size: 28px; }
.prose :deep(h2) { font-size: 24px; }
.prose :deep(h3) { font-size: 20px; }

.prose :deep(p) {
  margin: 0 0 16px;
}

.prose :deep(a) {
  color: var(--accent);
  text-decoration: underline wavy;
  text-underline-offset: 3px;
}

.prose :deep(a:hover) {
  text-decoration-style: solid;
}

.prose :deep(code) {
  background: var(--paper-surface);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 14px;
}

.prose :deep(pre) {
  background: var(--paper-surface);
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 20px 0;
  border: 1.5px dashed var(--hairline);
}

.prose :deep(pre code) {
  background: transparent;
  padding: 0;
}

.prose :deep(blockquote) {
  border-left: 3px dashed var(--st-mint);
  padding: 8px 0 8px 20px;
  margin: 20px 0;
  color: var(--ink-soft);
  font-style: italic;
}

.prose :deep(img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 20px 0;
}

.prose :deep(ul),
.prose :deep(ol) {
  margin: 16px 0;
  padding-left: 24px;
}

.prose :deep(li) {
  margin: 8px 0;
}

.post-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 32px;
}

.tag {
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  background: var(--st-cream);
  border: 1.5px solid var(--hairline);
}

.post-footer {
  display: flex;
  gap: 12px;
  padding-top: 24px;
  border-top: 1.5px dashed var(--hairline);
}

.btn.liked {
  background: var(--st-sakura);
  color: var(--ink);
}

@media (max-width: 768px) {
  .post-title {
    font-size: 32px;
  }

  .post-content-wrapper {
    padding: 24px;
  }
}
</style>
