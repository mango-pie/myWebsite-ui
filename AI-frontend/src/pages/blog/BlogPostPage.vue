<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { renderBlogMarkdown } from '@/utils/blogMarkdown'
import {
  CalendarOutlined,
  TagOutlined,
  EyeOutlined,
  HeartOutlined,
  MessageOutlined,
  ShareAltOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  EditOutlined,
} from '@ant-design/icons-vue'
import { message, Spin } from 'ant-design-vue'
import { getBlogPostVo, incrementLikeCount, incrementViewCount } from '@/api/blogPostController'
import { getTagCloud } from '@/api/blogTagController'
import { getPublishedBlogPostPage } from '@/api/blogPostController'
import { useLoginUserStore } from '@/stores/loginUser'
import { isAdminRole } from '@/config/permission'
import { rememberLastBlogPost } from '@/composables/useBlogLastPost'
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
const tagCloud = ref<API.BlogTagVO[]>([])
const loading = ref(true)
const isLiked = ref(false)
const showShareModal = ref(false)
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
      fetchTagCloud()
      fetchRelatedPosts()
    }
  }
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

// 获取标签云
const fetchTagCloud = async () => {
  try {
    const response = await getTagCloud()
    console.log('标签云响应:', response)
    if (response.data?.data) {
      tagCloud.value = response.data.data
    }
  } catch (error) {
    console.error('获取标签云失败:', error)
  }
}

// 获取相关文章
const fetchRelatedPosts = async () => {
  try {
    const currentId = Number(route.params.id)
    const response = await getPublishedBlogPostPage({ pageNum: 1, pageSize: 5 })
    console.log('相关文章响应:', response)
    if (response.data?.data?.records) {
      relatedPosts.value = response.data.data.records.filter(item => item.id !== currentId)
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
  fetchTagCloud()
  fetchRelatedPosts()
})
</script>

<template>
  <div id="blogPostPage">
    <Spin :spinning="loading">
      <div v-if="!loading && !post" class="empty-state">
        <h2>文章不存在或已被删除</h2>
        <a-button type="primary" @click="goBack">返回首页</a-button>
      </div>

      <div class="post-header" v-if="post">
        <div class="post-header__cover">
          <img :src="post.coverUrl || 'https://picsum.photos/seed/default/1200/600'" :alt="post.title" />
          <div class="post-header__overlay">
            <button class="post-header__back" @click="goBack">
              <ArrowLeftOutlined /> 返回
            </button>
            <button v-if="canEdit" class="post-header__back post-header__edit" @click="handleEdit">
              <EditOutlined /> 编辑
            </button>
          </div>
        </div>
      </div>

      <div class="post-container" v-if="post">
        <article class="post-content">
          <header class="post-meta">
            <span 
              class="post-meta__category"
              @click="handleCategoryClick(post.categoryId)"
            >
              {{ post.categoryName || '未分类' }}
            </span>
            <span class="post-meta__date">
              <CalendarOutlined /> {{ formatDate(post.createdTime) }}
            </span>
          </header>

          <h1 class="post-title">{{ post.title }}</h1>

          <div class="post-author">
            <img :src="post.userAvatar || 'https://picsum.photos/seed/avatar/100/100'" :alt="post.userName" class="post-author__avatar" />
            <div class="post-author__info">
              <span class="post-author__name">{{ post.userName || '匿名作者' }}</span>
              <span class="post-author__bio">{{ post.summary }}</span>
            </div>
            <div class="post-stats">
              <span v-if="blogUx.viewCountEnabled" class="post-stat">
                <EyeOutlined /> {{ post.viewCount || 0 }}
              </span>
              <span v-if="blogUx.allowLike" class="post-stat">
                <HeartOutlined /> {{ post.likeCount || 0 }}
              </span>
            </div>
          </div>

          <div class="post-tags">
            <span 
              v-for="tag in post.tags" 
              :key="tag.id" 
              class="post-tag"
              @click="handleTagClick(tag)"
            >
              <TagOutlined /> {{ tag.name }}
            </span>
          </div>

          <div
            class="post-body blog-prose"
            v-html="renderedContent"
          ></div>

          <div class="post-actions">
            <button
              v-if="blogUx.allowLike"
              class="action-btn"
              :class="{ 'action-btn--liked': isLiked }"
              @click="handleLike"
            >
              <HeartOutlined /> {{ post.likeCount || 0 }}
            </button>
            <button 
              class="action-btn"
              @click="showShareModal = true"
            >
              <ShareAltOutlined /> 分享
            </button>
          </div>
        </article>

        <aside class="post-sidebar">
          <div class="sidebar-section">
            <h3 class="sidebar-section__title">相关文章</h3>
            <ul class="related-posts">
              <li v-for="relatedPost in relatedPosts" :key="relatedPost.id" class="related-post" @click="handleRelatedPostClick(relatedPost.id)">
                <img :src="relatedPost.coverUrl || 'https://picsum.photos/seed/related/100/60'" alt="" />
                <div>
                  <a>{{ relatedPost.title }}</a>
                  <span>{{ formatDate(relatedPost.createdTime) }}</span>
                </div>
              </li>
            </ul>
          </div>

          <div class="sidebar-section">
            <h3 class="sidebar-section__title">标签云</h3>
            <div class="tag-cloud">
              <span 
                v-for="tag in tagCloud" 
                :key="tag.id"
                class="tag-cloud__item"
                @click="handleTagClick(tag)"
              >
                {{ tag.name }}
              </span>
            </div>
          </div>
        </aside>
      </div>

      <div class="comments-section" v-if="post">
        <div class="comments-container">
          <h2 class="comments-title">
            <MessageOutlined /> 评论
          </h2>

          <div class="comment-input">
            <img src="https://picsum.photos/seed/guest/50/50" alt="头像" class="comment-input__avatar" />
            <textarea
              placeholder="写下你的评论..."
              class="comment-input__textarea"
              disabled
            ></textarea>
            <button class="comment-input__submit" disabled>发表评论</button>
          </div>

          <div class="comments-list">
            <p class="no-comments">暂无评论，快来抢沙发吧！</p>
          </div>
        </div>
      </div>

      <a-modal
        v-model:open="showShareModal"
        title="分享文章"
        :footer="null"
      >
        <div class="share-modal">
          <p>复制链接分享给朋友：</p>
          <input type="text" :value="window.location.href" readonly class="share-modal__input" />
          <button class="share-modal__btn" @click="handleShare">复制链接</button>
        </div>
      </a-modal>
    </Spin>
  </div>
</template>

<style scoped>
#blogPostPage {
  min-height: 100vh;
  background: transparent;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: #fff;
  border-radius: 12px;
  margin: 40px auto;
  max-width: 600px;
}

.empty-state h2 {
  color: #666;
  margin-bottom: 24px;
}

.post-header {
  position: relative;
}

.post-header__cover {
  height: 400px;
  overflow: hidden;
  position: relative;
}

.post-header__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-header__overlay {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.post-header__back {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.post-header__back:hover {
  background: #fff;
}

.post-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 32px;
}

.post-content {
  background: var(--prose-bg);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  padding: 40px;
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(16px);
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.post-meta__category {
  background: var(--color-primary-20);
  color: #fff;
  padding: 6px 14px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.post-meta__category:hover {
  background: var(--color-primary-35);
}

.post-meta__date {
  color: var(--color-text-muted);
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.post-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 24px;
  line-height: 1.3;
}

.post-author {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  margin-bottom: 24px;
}

.post-author__avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
}

.post-author__info {
  flex: 1;
}

.post-author__name {
  display: block;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.post-author__bio {
  font-size: 13px;
  color: var(--color-text-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-stats {
  display: flex;
  gap: 16px;
}

.post-stat {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-muted);
  font-size: 13px;
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}

.post-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.post-tag:hover {
  background: var(--color-primary-12);
  color: var(--color-text-primary);
}

.post-body {
  width: 100%;
}

.post-actions {
  display: flex;
  gap: 16px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--color-border);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.action-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary-light);
}

.action-btn--liked {
  border-color: #ff4d4f;
  color: #ff4d4f;
}

.post-sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.sidebar-section {
  background: var(--color-bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  padding: 20px;
}

.sidebar-section__title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px;
  padding-bottom: 12px;
  color: var(--color-text-primary);
  border-bottom: 2px solid var(--color-primary);
}

.related-posts {
  list-style: none;
  padding: 0;
  margin: 0;
}

.related-post {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: background 0.2s;
}

.related-post:last-child {
  border-bottom: none;
}

.related-post:hover {
  background: rgba(255, 255, 255, 0.04);
}

.related-post img {
  width: 100px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}

.related-post div {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.related-post a {
  font-size: 13px;
  color: var(--color-text-primary);
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.related-post span {
  font-size: 12px;
  color: var(--color-text-muted);
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-cloud__item {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  font-size: 13px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.tag-cloud__item:hover {
  background: var(--color-primary-12);
  color: var(--color-text-primary);
}

.comments-section {
  background: transparent;
  margin-top: 32px;
}

.comments-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

.comments-title {
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 24px;
}

.comment-input {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
}

.comment-input__avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  flex-shrink: 0;
}

.comment-input__textarea {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.05);
  color: var(--color-text-primary);
  border-radius: 8px;
  font-size: 14px;
  resize: none;
  min-height: 80px;
}

.comment-input__submit {
  align-self: flex-end;
  padding: 10px 24px;
  background: var(--gradient-primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.comment-input__submit:hover {
  background: #764ba2;
}

.no-comments {
  text-align: center;
  color: var(--color-text-muted);
  padding: 40px 0;
}

.share-modal {
  text-align: center;
}

.share-modal__input {
  width: 100%;
  padding: 12px;
  margin: 16px 0;
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.05);
  color: var(--color-text-primary);
  border-radius: 8px;
  font-size: 14px;
}

.share-modal__btn {
  padding: 10px 32px;
  background: var(--gradient-primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.share-modal__btn:hover {
  filter: brightness(1.05);
}

@media (max-width: 960px) {
  .post-container {
    grid-template-columns: 1fr;
  }

  .post-title {
    font-size: 24px;
  }

  .post-content {
    padding: 24px;
  }

  .post-author {
    flex-direction: column;
    text-align: center;
  }

  .post-header__cover {
    height: 250px;
  }
}
</style>
