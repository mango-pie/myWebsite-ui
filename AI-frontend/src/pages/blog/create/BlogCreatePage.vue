<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  addBlogPost,
  updateBlogPost,
  getBlogPostVo,
} from '@/api/blogPostController'
import { uploadCommonImage } from '@/api/imageUploadController'
import { getAllCategories } from '@/api/blogCategoryController'
import { getAllTags } from '@/api/blogTagController'
import { useLoginUserStore } from '@/stores/loginUser'
import { resolveBlogReturnPath } from '@/composables/useBlogLastPost'
import { loadBlogSettings, type BlogUxSettings } from '@/utils/blogSettings'
import BlogRoomShell from '@/components/blog/BlogRoomShell.vue'

const router = useRouter()
const route = useRoute()
const loginUserStore = useLoginUserStore()

const isEdit = computed(() => !!route.params.id)
const loading = ref(false)
const submitting = ref(false)
const uploading = ref(false)

const blogUx = ref<BlogUxSettings>({
  pageSizeDefault: 10,
  summaryMaxLength: 200,
  allowLike: true,
  viewCountEnabled: true,
  defaultStatus: 0,
  defaultStatusKey: 'DRAFT',
})

const STATUS_DRAFT = 0
const STATUS_PUBLISHED = 1

const form = reactive({
  id: null as number | null,
  title: '',
  summary: '',
  content: '',
  categoryId: null as number | null,
  tagIds: [] as number[],
  coverUrl: '',
  status: STATUS_DRAFT as number,
})

const isDraft = computed(() => form.status !== STATUS_PUBLISHED)
const pageTitle = computed(() => {
  if (!isEdit.value) return '写文章'
  return isDraft.value ? '编辑草稿' : '编辑文章'
})

const statusLabel = computed(() => {
  if (!isEdit.value) return form.status === STATUS_PUBLISHED ? '将发布' : '草稿预览'
  return isDraft.value ? '草稿' : '已发布'
})

const categoryOptions = ref<API.BlogCategoryVO[]>([])
const tagOptions = ref<API.BlogTagVO[]>([])
const coverInput = ref<HTMLInputElement | null>(null)

const openCoverPicker = () => coverInput.value?.click()

const beforeUpload = (file: File) => {
  if (!file.type.startsWith('image/')) {
    message.error('只能上传图片文件!')
    return false
  }
  if (file.size / 1024 / 1024 >= 5) {
    message.error('图片大小不能超过 5MB!')
    return false
  }
  return true
}

const handleImageUpload = async (file: File) => {
  if (!beforeUpload(file)) return
  uploading.value = true
  try {
    const res = await uploadCommonImage(file)
    if (res.data.code === 0 && res.data.data) {
      const uploadData = res.data.data as { url?: string } | string
      form.coverUrl = typeof uploadData === 'string' ? uploadData : uploadData?.url || ''
      message.success('图片上传成功')
    } else {
      message.error('图片上传失败：' + (res.data.message || '未知错误'))
    }
  } catch (error) {
    console.error('图片上传失败:', error)
    message.error('图片上传失败')
  } finally {
    uploading.value = false
  }
}

const onCoverPick = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) handleImageUpload(file)
  input.value = ''
}

const handleRemoveCover = () => {
  form.coverUrl = ''
}

const handleTagToggle = (tagId: number) => {
  const i = form.tagIds.indexOf(tagId)
  if (i === -1) form.tagIds.push(tagId)
  else form.tagIds.splice(i, 1)
}

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

const handleSubmit = async (nextStatus: number) => {
  if (!validateForm()) return
  submitting.value = true
  try {
    const payload = {
      title: form.title,
      summary: form.summary,
      content: form.content,
      categoryId: form.categoryId ?? undefined,
      tagIds: form.tagIds,
      coverUrl: form.coverUrl,
      status: nextStatus,
    }
    const res =
      isEdit.value && form.id
        ? await updateBlogPost({ id: form.id, ...payload })
        : await addBlogPost(payload)

    if (res.data.code === 0) {
      form.status = nextStatus
      const asDraft = nextStatus === STATUS_DRAFT
      message.success(
        asDraft
          ? isEdit.value
            ? '草稿已保存'
            : '草稿已创建'
          : isEdit.value
            ? '文章已发布'
            : '文章发布成功',
      )
      const returnPath = resolveBlogReturnPath(
        route.query.from,
        isEdit.value && form.id ? `/blog/${form.id}` : null,
      )
      if (returnPath) router.push(returnPath)
      else if (isEdit.value && form.id) router.push(`/blog/${form.id}`)
      else if (res.data.data) router.push(`/blog/${res.data.data}`)
      else router.push('/blog')
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

const handleReset = () => {
  if (isEdit.value) fetchPostDetail()
  else {
    form.title = ''
    form.summary = ''
    form.content = ''
    form.categoryId = null
    form.tagIds = []
    form.coverUrl = ''
    form.status = blogUx.value.defaultStatus
  }
}

const handleBack = () => {
  const returnPath = resolveBlogReturnPath(
    route.query.from,
    isEdit.value && form.id ? `/blog/${form.id}` : null,
  )
  if (returnPath) {
    router.push(returnPath)
    return
  }
  router.push('/blog')
}

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
      form.tagIds = (post.tags || []).map((tag) => tag.id!).filter(Boolean) as number[]
      form.coverUrl = post.coverUrl || ''
      form.status = post.status ?? STATUS_DRAFT
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

onMounted(async () => {
  if (!loginUserStore.loginUser?.id) {
    message.warning('请先登录')
    router.push(`/user/login?redirect=${encodeURIComponent(route.fullPath)}`)
    return
  }

  blogUx.value = await loadBlogSettings()
  form.status = blogUx.value.defaultStatus

  try {
    const [cRes, tRes] = await Promise.all([getAllCategories(), getAllTags()])
    if (cRes.data.code === 0 && cRes.data.data) {
      categoryOptions.value = cRes.data.data as API.BlogCategoryVO[]
    }
    if (tRes.data.code === 0 && tRes.data.data) {
      tagOptions.value = tRes.data.data as API.BlogTagVO[]
    }
  } catch (e) {
    console.error(e)
  }

  if (isEdit.value) fetchPostDetail()
})
</script>

<template>
  <BlogRoomShell>
    <div class="create-shell">
      <aside class="detail-rail">
        <button type="button" class="back-chip" @click="handleBack">← 返回</button>
        <div class="side-card glass">
          <span class="tape" />
          <h3 class="font-display">写作提示</h3>
          <p class="tip-line text-pretty">
            标题先定方向，摘要留一句钩子，正文用 Markdown。侧栏放元数据，主栏专心写。
          </p>
        </div>
        <div class="side-card glass" style="flex: 1">
          <h3 class="font-display">状态</h3>
          <p class="tip-line">
            当前：{{ statusLabel }}<br />
            {{ loading ? '加载中…' : submitting ? '提交中…' : '就绪' }}
          </p>
        </div>
      </aside>

      <div class="form-panel glass">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 14px">
          <div>
            <div class="eyebrow">EDITOR</div>
            <div class="font-display" style="font-size: 32px; letter-spacing: 2px">{{ pageTitle }}</div>
          </div>
        </div>
        <div class="form-row">
          <label class="form-label" for="fTitle">标题</label>
          <input id="fTitle" v-model="form.title" class="form-input" maxlength="100" placeholder="给文章起个名字" />
        </div>
        <div class="form-row">
          <label class="form-label" for="fSummary">摘要</label>
          <input
            id="fSummary"
            v-model="form.summary"
            class="form-input"
            :maxlength="blogUx.summaryMaxLength"
            placeholder="一句话介绍"
          />
        </div>
        <div class="form-row">
          <label class="form-label" for="fContent">正文</label>
          <textarea id="fContent" v-model="form.content" class="form-textarea" placeholder="Markdown…" />
        </div>
        <div class="form-actions">
          <button type="button" class="btn ghost" :disabled="submitting" @click="handleReset">重置</button>
          <button type="button" class="btn" :disabled="submitting" @click="handleSubmit(STATUS_DRAFT)">
            存草稿
          </button>
          <button
            type="button"
            class="btn primary font-display"
            :disabled="submitting"
            @click="handleSubmit(STATUS_PUBLISHED)"
          >
            发布
          </button>
        </div>
      </div>

      <aside class="form-panel glass detail-side">
        <div class="form-row">
          <div class="form-label">封面</div>
          <div
            class="cover-upload"
            role="button"
            tabindex="0"
            @click="openCoverPicker"
            @keydown.enter="openCoverPicker"
          >
            <img v-if="form.coverUrl" :src="form.coverUrl" alt="封面" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px" />
            <template v-else>
              <span>{{ uploading ? '上传中…' : '[image] 16:9' }}</span>
              <span style="font-size: 10px">点击上传</span>
            </template>
          </div>
          <input ref="coverInput" type="file" accept="image/*" hidden @change="onCoverPick" />
          <button
            v-if="form.coverUrl"
            type="button"
            class="chip-btn"
            style="margin-top: 8px"
            @click="handleRemoveCover"
          >
            移除封面
          </button>
        </div>
        <div class="form-row">
          <label class="form-label" for="fCat">分类</label>
          <select
            id="fCat"
            class="form-select"
            :value="form.categoryId ?? ''"
            @change="form.categoryId = Number(($event.target as HTMLSelectElement).value) || null"
          >
            <option value="">选择分类</option>
            <option v-for="cat in categoryOptions" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>
        <div class="form-row">
          <div class="form-label">标签</div>
          <div class="tag-cloud">
            <button
              v-for="tag in tagOptions"
              :key="tag.id"
              type="button"
              class="tag-pill check"
              :class="{ on: form.tagIds.includes(tag.id!) }"
              @click="handleTagToggle(tag.id!)"
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
        <div
          class="side-card"
          style="
            background: rgba(255, 255, 255, 0.55);
            margin-top: 8px;
            padding: 14px;
            border-radius: 14px;
            border: 1.5px dashed rgba(150, 160, 200, 0.35);
          "
        >
          <h3 class="font-display" style="font-size: 14px; margin-bottom: 8px">发布检查</h3>
          <p class="tip-line">封面、分类、至少 1 个标签 —— 建议写完再勾。</p>
        </div>
        <div class="deck" style="flex: 1; min-height: 160px; margin-top: 8px">
          <div class="mag-stack" style="min-height: 0; flex: 1">
            <div class="mag-stage" style="left: 12px; right: 12px; top: 8px; bottom: 8px">
              <div class="mag-book t-sun is-front" style="cursor: default">
                <span class="mast">DRAFT</span>
                <span class="vol font-display" style="font-size: 32px">稿</span>
                <span class="latest"><b>写作区</b><span>元数据在这一侧</span></span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </BlogRoomShell>
</template>
