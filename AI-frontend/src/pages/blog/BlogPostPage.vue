<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { renderBlogMarkdown } from '@/utils/blogMarkdown'
import { ArrowLeft, Pencil, Heart, Share2, Copy } from 'lucide-vue-next'
import { message, Spin } from 'ant-design-vue'
import { getBlogPostVo, incrementLikeCount, incrementViewCount } from '@/api/blogPostController'
import { getPublishedBlogPostPage } from '@/api/blogPostController'
import { useLoginUserStore } from '@/stores/loginUser'
import { isAdminRole } from '@/config/permission'
import { rememberLastBlogPost } from '@/composables/useBlogLastPost'
import { siteConfig } from '@/config/site'
import {
  loadBlogSettings,
  markBlogLikeDisabled,
  markBlogViewDisabled,
  type BlogUxSettings,
} from '@/utils/blogSettings'

const router = useRouter()
const route = useRoute()
const loginUserStore = useLoginUserStore()

// 响应式数据
const post = ref<API.BlogPostVO | null>(null)
const relatedPosts = ref<API.BlogPostVO[]>([])
const loading = ref(true)
const isLiked = ref(false)
const showShareModal = ref(false)
const shareUrl = computed(() => (typeof window !== 'undefined' ? window.location.href : ''))
const blogUx = ref<BlogUxSettings>({
  pageSizeDefault: 10,
  summaryMaxLength: 200,
  allowLike: true,
  viewCountEnabled: true,
  defaultStatus: 0,
  defaultStatusKey: 'DRAFT',
})

// 监听路由参数变化
watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      fetchPost()
      fetchRelatedPosts()
    }
  },
)

// 渲染文章内容
const renderedContent = computed(() => {
  if (!post.value?.content) return ''
  return renderBlogMarkdown(post.value.content)
})

const canEdit = computed(() => isAdminRole(loginUserStore.loginUser?.userRole))

// 格式化日期
const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

// 获取文章详情
const fetchPost = async () => {
  try {
    loading.value = true
    const currentId = Number(route.params.id)
    console.log('开始获取文章，ID:', currentId)
    const response = await getBlogPostVo({ id: currentId })
    console.log('API响应:', response)
    console.log('response.data:', response.data)
    console.log('response.data?.data:', response.data?.data)
    
    if (response.data?.data) {
      post.value = response.data.data
      rememberLastBlogPost(currentId)
      console.log('文章数据已设置:', post.value)
      if (blogUx.value.viewCountEnabled) {
        const viewRes = await incrementViewCount({ id: currentId })
        if (viewRes.data.code === 0) {
          if (post.value.viewCount !== undefined) {
            post.value.viewCount += 1
          }
        } else {
          const msg = viewRes.data.message || ''
          if (String(msg).includes('已关闭')) {
            markBlogViewDisabled()
            blogUx.value = { ...blogUx.value, viewCountEnabled: false }
          }
        }
      }
    } else {
      message.error('获取文章失败: ' + (response.data?.message || '未知错误'))
      console.log('API错误信息:', response.data?.message)
    }
  } catch (error) {
    console.error('获取文章失败:', error)
    message.error('获取文章失败: ' + error)
  } finally {
    loading.value = false
  }
}

// 获取相关文章
const fetchRelatedPosts = async () => {
  try {
    const currentId = Number(route.params.id)
    const response = await getPublishedBlogPostPage({ pageNum: 1, pageSize: 5 })
    if (response.data?.data?.records) {
      relatedPosts.value = response.data.data.records.filter((item) => item.id !== currentId)
    }
  } catch (error) {
    console.error('获取相关文章失败:', error)
  }
}

// 点赞
const handleLike = async () => {
  if (!blogUx.value.allowLike) return
  try {
    const currentId = Number(route.params.id)
    const res = await incrementLikeCount({ id: currentId })
    if (res.data.code !== 0) {
      const msg = res.data.message || '点赞失败'
      if (String(msg).includes('已关闭')) {
        markBlogLikeDisabled()
        blogUx.value = { ...blogUx.value, allowLike: false }
        message.warning(msg)
      } else {
        message.error(msg)
      }
      return
    }
    if (isLiked.value) {
      if (post.value?.likeCount !== undefined) post.value.likeCount--
      isLiked.value = false
      message.info('已取消点赞')
    } else {
      if (post.value?.likeCount !== undefined) post.value.likeCount++
      isLiked.value = true
      message.success('点赞成功')
    }
  } catch (error) {
    console.error('点赞失败:', error)
    message.error('点赞失败')
  }
}

// 分享
const handleShare = () => {
  const url = window.location.href
  navigator.clipboard.writeText(url).then(() => {
    message.success('链接已复制到剪贴板')
    showShareModal.value = false
  })
}

// 点击标签
const handleTagClick = (tag: API.BlogTagVO) => {
  router.push({ name: '博客首页', query: { tagId: tag.id } })
}

// 点击分类
const handleCategoryClick = (categoryId: number | undefined) => {
  if (categoryId) {
    router.push({ name: '博客首页', query: { categoryId } })
  }
}

// 点击相关文章
const handleRelatedPostClick = (id: number | undefined) => {
  if (id) {
    router.push(`/blog/${id}`)
  }
}

// 返回
const goBack = () => {
  router.back()
}

const handleEdit = () => {
  if (post.value?.id) {
    router.push({
      path: `/blog/edit/${post.value.id}`,
      query: { from: route.fullPath },
    })
  }
}

// 初始化
onMounted(async () => {
  blogUx.value = await loadBlogSettings()
  fetchPost()
  fetchRelatedPosts()
})
</script>

<template>
  <div id="blogPostPage" class="chapter-page">
    <Spin :spinning="loading">
      <div v-if="!loading && !post" class="chapter-empty">
        <h2>此篇不存，或已撕去</h2>
        <button type="button" class="chapter-link-btn" @click="goBack">返回</button>
      </div>

      <article v-if="post" class="chapter">
        <div class="chapter__toolbar">
          <button type="button" class="chapter-link-btn" @click="goBack">
            <ArrowLeft :size="15" /> 返回目录
          </button>
          <button v-if="canEdit" type="button" class="chapter-link-btn" @click="handleEdit">
            <Pencil :size="15" /> 修订
          </button>
        </div>

        <header class="chapter__head">
          <p class="chapter__kicker">
            <button type="button" class="chapter__cat" @click="handleCategoryClick(post.categoryId)">
              {{ post.categoryName || '未分类' }}
            </button>
            <span>·</span>
            <span>{{ formatDate(post.createdTime) }}</span>
          </p>
          <h1 class="chapter__title">{{ post.title }}</h1>
          <p v-if="post.summary" class="chapter__deck">{{ post.summary }}</p>
          <p class="chapter__ornament" aria-hidden="true">❧</p>
          <div class="chapter__byline">
            <span>{{ post.userName || siteConfig.ownerName }}</span>
            <span v-if="blogUx.viewCountEnabled" class="wax-seal wax-seal--sticker">阅 {{ post.viewCount || 0 }}</span>
            <span v-if="blogUx.allowLike" class="wax-seal">赞 {{ post.likeCount || 0 }}</span>
          </div>
          <div v-if="post.tags?.length" class="chapter__tags">
            <button
              v-for="tag in post.tags"
              :key="tag.id"
              type="button"
              class="chapter__tag"
              @click="handleTagClick(tag)"
            >
              #{{ tag.name }}
            </button>
          </div>
        </header>

        <div class="chapter__body blog-prose" v-html="renderedContent" />

        <div class="chapter__actions">
          <button
            v-if="blogUx.allowLike"
            type="button"
            class="chapter-action"
            :class="{ 'is-active': isLiked }"
            @click="handleLike"
          >
            <Heart :size="15" :fill="isLiked ? 'currentColor' : 'none'" />
            {{ isLiked ? '已赞' : '赞赏' }}
          </button>
          <button type="button" class="chapter-action" @click="showShareModal = true">
            <Share2 :size="15" /> 传抄链接
          </button>
        </div>

        <aside v-if="relatedPosts.length" class="chapter__seealso">
          <h2 class="chapter__seealso-title">另见</h2>
          <button
            v-for="relatedPost in relatedPosts"
            :key="relatedPost.id"
            type="button"
            class="chapter__seealso-row"
            @click="handleRelatedPostClick(relatedPost.id)"
          >
            <span>{{ relatedPost.title }}</span>
            <span>{{ formatDate(relatedPost.createdTime) }}</span>
          </button>
        </aside>

        <p class="chapter__footnote">评论栏暂未启封。若有想法，可先自行誊录。</p>
      </article>

      <a-modal v-model:open="showShareModal" title="传抄此篇" :footer="null">
        <div class="share-modal">
          <p>复制链接：</p>
          <input type="text" :value="shareUrl" readonly class="share-modal__input" />
          <button type="button" class="share-modal__btn" @click="handleShare">
            <Copy :size="15" /> 复制
          </button>
        </div>
      </a-modal>
    </Spin>
  </div>
</template>


<style scoped>
.chapter-page {
  min-height: calc(100vh - 10rem);
  padding-bottom: 2em;
}

.chapter {
  max-width: 40em;
  margin: 0 auto;
  padding: 0.5em 0.75em 3em;
}

.chapter__toolbar {
  display: flex;
  justify-content: space-between;
  gap: 0.75em;
  margin-bottom: 1.5em;
}

.chapter-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35em;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-family: var(--font-sans);
  font-size: 0.85em;
  cursor: pointer;
  padding: 0.25em 0;
  transition: color 0.25s ease;
}

.chapter-link-btn:hover {
  color: var(--color-primary);
}

.chapter__head {
  text-align: center;
  margin-bottom: 2em;
  padding-bottom: 1.5em;
  border-bottom: 1px solid var(--color-border);
}

.chapter__kicker {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5em;
  margin: 0 0 0.85em;
  font-family: var(--font-sans);
  font-size: 0.8em;
  color: var(--color-text-muted);
}

.chapter__cat {
  border: none;
  background: transparent;
  color: var(--color-primary);
  font: inherit;
  cursor: pointer;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.chapter__title {
  margin: 0 0 0.65em;
  font-family: var(--font-serif);
  font-size: clamp(1.85rem, 4.5vw, 2.6rem);
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: 0.04em;
  color: var(--color-text-primary);
}

.chapter__deck {
  margin: 0 auto 1em;
  max-width: 32em;
  font-size: 1em;
  line-height: 1.7;
  color: var(--color-text-secondary);
}

.chapter__ornament {
  margin: 0.5em 0 1em;
  color: var(--color-text-muted);
  letter-spacing: 0.25em;
}

.chapter__byline {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0.55em;
  font-family: var(--font-serif);
  font-size: 0.95em;
  color: var(--color-text-secondary);
}

.chapter__tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.65em;
  margin-top: 1em;
}

.chapter__tag {
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font-family: var(--font-sans);
  font-size: 0.8em;
  cursor: pointer;
}

.chapter__tag:hover {
  color: var(--color-primary);
}

.chapter__body {
  margin: 0 auto;
}

.chapter__actions {
  display: flex;
  gap: 0.75em;
  justify-content: center;
  margin: 2.25em 0 1.5em;
  padding-top: 1.25em;
  border-top: 1px dashed var(--color-border);
}

.chapter-action {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  height: 2.3em;
  padding: 0 0.95em;
  border: 1px solid var(--color-border);
  border-radius: 2px;
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  font-family: var(--font-sans);
  font-size: 0.85em;
  cursor: pointer;
  transition:
    color 0.25s ease,
    border-color 0.25s ease,
    background 0.25s ease;
}

.chapter-action:hover,
.chapter-action.is-active {
  color: var(--color-primary);
  border-color: rgba(122, 31, 31, 0.35);
  background: var(--color-primary-08);
}

.chapter__seealso {
  margin-top: 2em;
  padding-top: 1.25em;
  border-top: 1px solid var(--color-border);
}

.chapter__seealso-title {
  margin: 0 0 0.85em;
  font-family: var(--font-serif);
  font-size: 1.05em;
  letter-spacing: 0.2em;
  text-align: center;
  color: var(--color-text-primary);
}

.chapter__seealso-row {
  display: flex;
  justify-content: space-between;
  gap: 1em;
  width: 100%;
  padding: 0.7em 0.2em;
  border: none;
  border-bottom: 1px dashed rgba(169, 144, 112, 0.45);
  background: transparent;
  color: inherit;
  font-family: var(--font-serif);
  font-size: 0.95em;
  text-align: left;
  cursor: pointer;
}

.chapter__seealso-row:hover {
  color: var(--color-primary);
  background: rgba(160, 120, 70, 0.08);
}

.chapter__seealso-row span:last-child {
  flex-shrink: 0;
  font-family: var(--font-sans);
  font-size: 0.8em;
  font-style: italic;
  color: var(--color-text-muted);
}

.chapter__footnote {
  margin: 1.75em 0 0;
  text-align: center;
  font-family: var(--font-sans);
  font-size: 0.75em;
  color: var(--color-text-muted);
}

.chapter-empty {
  text-align: center;
  padding: 4em 1em;
  color: var(--color-text-secondary);
}

.chapter-empty h2 {
  font-family: var(--font-serif);
  margin-bottom: 1em;
}

.share-modal p {
  margin-bottom: 0.75em;
  color: var(--color-text-secondary);
}

.share-modal__input {
  width: 100%;
  margin-bottom: 0.75em;
  padding: 0.55em 0.7em;
  border: 1px solid var(--color-border);
  border-radius: 2px;
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
}

.share-modal__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35em;
  padding: 0.45em 0.9em;
  border: 1px solid var(--color-border);
  border-radius: 2px;
  background: var(--color-primary);
  color: #f5f0e1;
  font-family: var(--font-sans);
  cursor: pointer;
}
</style>
