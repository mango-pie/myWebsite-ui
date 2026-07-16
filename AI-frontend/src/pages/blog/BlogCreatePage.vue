<script setup lang="ts">
/**
 * 博客文章发布/编辑页面
 * - 支持文章标题、内容、分类、标签编辑
 * - 支持封面图片上传
 * - 集成后端API调用
 */
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  UploadOutlined,
  PlusOutlined,
  DeleteOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons-vue'
import {
  addBlogPost,
  updateBlogPost,
  getBlogPostVo
} from '@/api/blogPostController'
import { uploadCommonImage } from '@/api/imageUploadController'
import { getAllCategories } from '@/api/blogCategoryController'
import { getAllTags } from '@/api/blogTagController'
import { useLoginUserStore } from '@/stores/loginUser'
import { resolveBlogReturnPath } from '@/composables/useBlogLastPost'
import { loadBlogSettings, type BlogUxSettings } from '@/utils/blogSettings'

const router = useRouter()
const route = useRoute()
const loginUserStore = useLoginUserStore()

// 是否是编辑模式
const isEdit = computed(() => !!route.params.id)
// 加载状态
const loading = ref(false)
// 提交状态
const submitting = ref(false)
// 上传图片状态
const uploading = ref(false)

const blogUx = ref<BlogUxSettings>({
  pageSizeDefault: 10,
  summaryMaxLength: 200,
  allowLike: true,
  viewCountEnabled: true,
  defaultStatus: 0,
  defaultStatusKey: 'DRAFT',
})

// ==================== 表单数据 ====================

const form = reactive({
  // 文章ID（编辑模式使用）
  id: null as number | null,
  // 文章标题
  title: '',
  // 文章摘要
  summary: '',
  // 文章内容
  content: '',
  // 分类ID
  categoryId: null as number | null,
  // 标签ID数组
  tagIds: [] as number[],
  // 新标签输入
  newTag: '',
  // 封面图片URL
  coverUrl: ''
})

// ==================== 可选数据 ====================

// 分类列表
const categoryOptions = ref<API.BlogCategoryVO[]>([])

// 标签列表
const tagOptions = ref<API.BlogTagVO[]>([])

// ==================== 图片上传相关 ====================

/**
 * 上传前校验
 * @param file 上传的文件
 */
const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    message.error('只能上传图片文件!')
    return false
  }
  if (!isLt5M) {
    message.error('图片大小不能超过 5MB!')
    return false
  }
  return true
}

/**
 * 处理图片上传
 * @param file 上传的文件
 */
const handleImageUpload = async (file: File) => {
  uploading.value = true
  try {
    // 调用后端 API 上传图片
    const res = await uploadCommonImage(file)

    if (res.data.code === 0 && res.data.data) {
      // 直接使用后端返回的完整 URL
      const uploadData = res.data.data as any
      form.coverUrl = uploadData?.url || uploadData || ''
      uploading.value = false
      message.success('图片上传成功')
      return true
    } else {
      message.error('图片上传失败：' + (res.data.message || '未知错误'))
      uploading.value = false
      return false
    }
  } catch (error) {
    console.error('图片上传失败:', error)
    message.error('图片上传失败')
    uploading.value = false
    return false
  }
}

/**
 * 删除封面图片
 */
const handleRemoveCover = () => {
  form.coverUrl = ''
}

// ==================== 标签管理 ====================

/**
 * 切换标签选择
 */
const handleTagToggle = (tagId: number, checked: boolean) => {
  if (checked) {
    if (!form.tagIds.includes(tagId)) {
      form.tagIds.push(tagId)
    }
  } else {
    const index = form.tagIds.indexOf(tagId)
    if (index !== -1) {
      form.tagIds.splice(index, 1)
    }
  }
}

/**
 * 检查标签是否已选中
 */
const isTagSelected = (tagId: number) => {
  return form.tagIds.includes(tagId)
}

// ==================== 表单提交 ====================

/**
 * 表单验证
 */
const validateForm = () => {
  if (!form.title.trim()) {
    message.warning('请输入文章标题')
    return false
  }
  if (!form.summary.trim()) {
    message.warning('请输入文章摘要')
    return false
  }
  if (!form.content.trim()) {
    message.warning('请输入文章内容')
    return false
  }
  if (!form.categoryId) {
    message.warning('请选择文章分类')
    return false
  }
  return true
}

/**
 * 提交表单
 */
const handleSubmit = async () => {
  if (!validateForm()) return

  submitting.value = true
  try {
    let res
    if (isEdit.value && form.id) {
      // 编辑模式
      res = await updateBlogPost({
        id: form.id,
        title: form.title,
        summary: form.summary,
        content: form.content,
        categoryId: form.categoryId ?? undefined,
        tagIds: form.tagIds,
        coverUrl: form.coverUrl
      })
    } else {
      // 新建模式
      res = await addBlogPost({
        title: form.title,
        summary: form.summary,
        content: form.content,
        categoryId: form.categoryId ?? undefined,
        tagIds: form.tagIds,
        coverUrl: form.coverUrl,
        status: blogUx.value.defaultStatus,
      })
    }

    if (res.data.code === 0) {
      message.success(isEdit.value ? '文章更新成功' : '文章发布成功')
      const returnPath = resolveBlogReturnPath(
        route.query.from,
        isEdit.value && form.id ? `/blog/${form.id}` : null,
      )
      if (returnPath) {
        router.push(returnPath)
      } else if (isEdit.value && form.id) {
        router.push(`/blog/${form.id}`)
      } else if (res.data.data) {
        router.push(`/blog/${res.data.data}`)
      } else {
        router.push('/blog')
      }
    } else {
      message.error('操作失败：' + res.data.message)
    }
  } catch (error) {
    console.error('提交失败:', error)
    message.error('操作失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

/**
 * 重置表单
 */
const handleReset = () => {
  if (isEdit.value) {
    // 编辑模式下重新获取数据
    fetchPostDetail()
  } else {
    // 新建模式下清空表单
    form.title = ''
    form.summary = ''
    form.content = ''
    form.categoryId = null
    form.tagIds = []
    form.newTag = ''
    form.coverUrl = ''
  }
}

/**
 * 返回上一页
 */
const handleBack = () => {
  const returnPath = resolveBlogReturnPath(
    route.query.from,
    isEdit.value && form.id ? `/blog/${form.id}` : null,
  )
  if (returnPath) {
    router.push(returnPath)
    return
  }
  router.back()
}

// ==================== API 调用 ====================

/**
 * 获取文章详情（编辑模式使用）
 */
const fetchPostDetail = async () => {
  if (!route.params.id) return

  loading.value = true
  try {
    const res = await getBlogPostVo({ id: Number(route.params.id) })
    if (res.data.code === 0 && res.data.data) {
      const post = res.data.data
      form.id = post.id || null
      form.title = post.title || ''
      form.summary = post.summary || ''
      form.content = post.content || ''
      form.categoryId = post.categoryId || null
      form.tagIds = (post.tags || []).map(tag => tag.id!).filter(Boolean) as number[]
      form.coverUrl = post.coverUrl || ''
    } else {
      message.error('获取文章详情失败：' + res.data.message)
      router.push('/blog')
    }
  } catch (error) {
    console.error('获取文章详情失败:', error)
    message.error('获取文章详情失败')
    router.push('/blog')
  } finally {
    loading.value = false
  }
}

/**
 * 获取分类列表
 */
const fetchCategories = async () => {
  try {
    const res = await getAllCategories()
    if (res.data.code === 0 && res.data.data) {
      categoryOptions.value = res.data.data
    }
  } catch (error) {
    console.error('获取分类列表失败:', error)
  }
}

/**
 * 获取标签列表
 */
const fetchTags = async () => {
  try {
    const res = await getAllTags()
    if (res.data.code === 0 && res.data.data) {
      tagOptions.value = res.data.data
    }
  } catch (error) {
    console.error('获取标签列表失败:', error)
  }
}

// ==================== 生命周期 ====================

onMounted(async () => {
  // 检查登录状态
  if (!loginUserStore.loginUser?.id) {
    message.warning('请先登录')
    router.push(`/user/login?redirect=${encodeURIComponent(route.fullPath)}`)
    return
  }

  blogUx.value = await loadBlogSettings()
  fetchCategories()
  fetchTags()

  if (isEdit.value) {
    fetchPostDetail()
  }
})
</script>

<template>
  <div class="blog-create-page">
    <a-spin :spinning="loading">
      <div class="create-container">
        <!-- 头部导航 -->
        <div class="page-header">
          <a-button type="link" @click="handleBack">
            <template #icon><ArrowLeftOutlined /></template>
            返回
          </a-button>
          <h1 class="page-title">{{ isEdit ? '编辑文章' : '发布文章' }}</h1>
          <div></div>
        </div>

        <a-card class="create-card">
          <a-form layout="vertical">
            <!-- 文章标题 -->
            <a-form-item label="文章标题" required>
              <a-input
                v-model:value="form.title"
                placeholder="请输入文章标题"
                :maxlength="100"
                show-count
              />
            </a-form-item>

            <!-- 文章摘要 -->
            <a-form-item label="文章摘要" required>
              <a-textarea
                v-model:value="form.summary"
                placeholder="请输入文章摘要"
                :rows="3"
                :maxlength="blogUx.summaryMaxLength"
                show-count
              />
            </a-form-item>

            <!-- 文章内容 -->
            <a-form-item label="文章内容" required>
              <a-textarea
                v-model:value="form.content"
                placeholder="请输入文章内容（支持 Markdown 格式）"
                :rows="15"
              />
            </a-form-item>

            <div class="form-row">
              <!-- 分类 -->
              <a-form-item label="文章分类" required class="form-col">
                <a-select
                  v-model:value="form.categoryId"
                  placeholder="请选择分类"
                  style="width: 100%"
                >
                  <a-select-option
                    v-for="cat in categoryOptions"
                    :key="cat.id"
                    :value="cat.id"
                  >
                    {{ cat.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>

              <!-- 标签 -->
              <a-form-item label="文章标签" class="form-col">
                <div class="tag-list">
                  <a-checkbox
                    v-for="tag in tagOptions"
                    :key="tag.id"
                    :checked="isTagSelected(tag.id!)"
                    @change="(e) => handleTagToggle(tag.id!, e.target.checked)"
                  >
                    {{ tag.name }}
                  </a-checkbox>
                </div>
              </a-form-item>
            </div>

            <!-- 封面图片 -->
            <a-form-item label="封面图片">
              <div class="cover-upload">
                <div v-if="form.coverUrl" class="cover-preview">
                  <img :src="form.coverUrl" alt="封面预览" />
                  <a-button
                    type="text"
                    danger
                    class="remove-btn"
                    @click="handleRemoveCover"
                  >
                    <template #icon><DeleteOutlined /></template>
                  </a-button>
                </div>
                <a-upload
                  v-else
                  name="file"
                  :show-upload-list="false"
                  :before-upload="beforeUpload"
                  :custom-request="({ file }: { file: File }) => handleImageUpload(file)"
                >
                  <a-button :loading="uploading">
                    <template #icon><UploadOutlined /></template>
                    上传封面图片
                  </a-button>
                  <div class="upload-hint">支持 jpg、png、gif 格式，大小不超过 5MB</div>
                </a-upload>
              </div>
            </a-form-item>

            <!-- 操作按钮 -->
            <a-form-item class="form-actions">
              <a-space :size="16">
                <a-button type="primary" size="large" :loading="submitting" @click="handleSubmit">
                  {{ isEdit ? '更新文章' : '发布文章' }}
                </a-button>
                <a-button size="large" @click="handleReset">重置</a-button>
              </a-space>
            </a-form-item>
          </a-form>
        </a-card>
      </div>
    </a-spin>
  </div>
</template>

<style scoped>
.blog-create-page {
  min-height: calc(100vh - 64px);
  background: transparent;
  padding: 24px 0;
}

.create-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.create-card {
  border-radius: var(--radius-lg);
}

.create-card :deep(.ant-card) {
  background: transparent;
}

.create-card :deep(.ant-card-body) {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(16px);
}

.create-card :deep(.ant-form-item-label > label),
.create-card :deep(.ant-form-item-explain-error) {
  color: var(--color-text-secondary);
}

.create-card :deep(.ant-input),
.create-card :deep(.ant-input-affix-wrapper),
.create-card :deep(.ant-input-number),
.create-card :deep(.ant-input-number-input),
.create-card :deep(.ant-select-selector),
.create-card :deep(.ant-input-textarea textarea) {
  background: rgba(255, 255, 255, 0.05) !important;
  border-color: var(--color-border) !important;
  color: var(--color-text-primary) !important;
}

.create-card :deep(.ant-btn-primary) {
  background: var(--gradient-primary) !important;
  border: none !important;
  box-shadow: var(--shadow-glow);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.form-col {
  margin-bottom: 0;
}

.tag-list {
  min-height: 32px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.cover-upload {
  width: 100%;
}

.cover-preview {
  position: relative;
  display: inline-block;
}

.cover-preview img {
  max-width: 300px;
  max-height: 200px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--color-overlay-strong);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.form-actions {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--color-border);
  margin-bottom: 0;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
