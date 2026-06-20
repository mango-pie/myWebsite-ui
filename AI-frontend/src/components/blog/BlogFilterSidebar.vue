<script setup lang="ts">
import { ref } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { siteConfig } from '@/config/site'
import { addCategory } from '@/api/blogCategoryController'
import { addTag } from '@/api/blogTagController'

defineProps<{
  categories: API.BlogCategoryVO[]
  tags: API.BlogTagVO[]
  selectedCategoryId: number | null
  selectedTagId: number | null
  showAbout?: boolean
  canManageMeta?: boolean
}>()

const emit = defineEmits<{
  categoryClick: [id: number | undefined]
  tagClick: [id: number | undefined]
  metaCreated: [type: 'category' | 'tag']
}>()

const categoryModalOpen = ref(false)
const tagModalOpen = ref(false)
const categorySubmitting = ref(false)
const tagSubmitting = ref(false)

const categoryForm = ref({ name: '', description: '' })
const tagForm = ref({ name: '', color: '#e879a9' })

function getTagSize(count: number | undefined) {
  if (!count) return 'small'
  if (count >= 10) return 'large'
  if (count >= 5) return 'medium'
  return 'small'
}

function openCategoryModal() {
  categoryForm.value = { name: '', description: '' }
  categoryModalOpen.value = true
}

function openTagModal() {
  tagForm.value = { name: '', color: '#e879a9' }
  tagModalOpen.value = true
}

async function submitCategoryForm() {
  const name = categoryForm.value.name.trim()
  if (!name) {
    message.warning('请输入分类名称')
    return
  }
  categorySubmitting.value = true
  try {
    const res = await addCategory({
      name,
      description: categoryForm.value.description.trim() || undefined,
      status: 1,
    })
    if (res.data.code === 0) {
      message.success('分类创建成功')
      categoryModalOpen.value = false
      emit('metaCreated', 'category')
    } else {
      message.error('创建失败：' + (res.data.message || '未知错误'))
    }
  } catch (error) {
    console.error('创建分类失败:', error)
    message.error('创建分类失败')
  } finally {
    categorySubmitting.value = false
  }
}

async function submitTagForm() {
  const name = tagForm.value.name.trim()
  if (!name) {
    message.warning('请输入标签名称')
    return
  }
  tagSubmitting.value = true
  try {
    const res = await addTag({
      name,
      color: tagForm.value.color || undefined,
      status: 1,
    })
    if (res.data.code === 0) {
      message.success('标签创建成功')
      tagModalOpen.value = false
      emit('metaCreated', 'tag')
    } else {
      message.error('创建失败：' + (res.data.message || '未知错误'))
    }
  } catch (error) {
    console.error('创建标签失败:', error)
    message.error('创建标签失败')
  } finally {
    tagSubmitting.value = false
  }
}
</script>

<template>
  <div class="blog-filter-sidebar">
    <div v-if="showAbout !== false" class="sidebar-section">
      <div class="sidebar-section__head">
        <h3 class="sidebar-section__title">关于我</h3>
      </div>
      <div class="about-me">
        <div class="about-me__avatar">
          <img :src="siteConfig.avatar" alt="头像" />
        </div>
        <p class="about-me__name">{{ siteConfig.ownerName }}</p>
        <p class="about-me__desc">{{ siteConfig.bio }}</p>
      </div>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-section__head">
        <h3 class="sidebar-section__title">文章分类</h3>
        <button
          v-if="canManageMeta"
          type="button"
          class="sidebar-section__add"
          title="新建分类"
          @click="openCategoryModal"
        >
          <PlusOutlined />
        </button>
      </div>
      <ul class="category-list">
        <li
          class="category-list__item"
          :class="{ 'category-list__item--active': selectedCategoryId === null }"
          @click="emit('categoryClick', undefined)"
        >
          全部
        </li>
        <li
          v-for="category in categories"
          :key="category.id"
          class="category-list__item"
          :class="{ 'category-list__item--active': category.id === selectedCategoryId }"
          @click="emit('categoryClick', category.id)"
        >
          {{ category.name }}
          <span class="category-list__count">{{ category.postCount }}</span>
        </li>
      </ul>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-section__head">
        <h3 class="sidebar-section__title">标签云</h3>
        <button
          v-if="canManageMeta"
          type="button"
          class="sidebar-section__add"
          title="新建标签"
          @click="openTagModal"
        >
          <PlusOutlined />
        </button>
      </div>
      <div class="tag-cloud">
        <span
          v-for="tag in tags"
          :key="tag.id"
          class="tag-cloud__item"
          :class="[
            `tag-cloud__item--${getTagSize(tag.count)}`,
            { 'tag-cloud__item--active': tag.id === selectedTagId },
          ]"
          @click="emit('tagClick', tag.id)"
        >
          {{ tag.name }}
        </span>
        <span
          v-if="canManageMeta"
          class="tag-cloud__item tag-cloud__item--add"
          title="新建标签"
          @click="openTagModal"
        >
          <PlusOutlined />
        </span>
      </div>
    </div>

    <a-modal
      v-model:open="categoryModalOpen"
      title="新建分类"
      ok-text="创建"
      cancel-text="取消"
      :confirm-loading="categorySubmitting"
      @ok="submitCategoryForm"
    >
      <a-form layout="vertical">
        <a-form-item label="名称" required>
          <a-input v-model:value="categoryForm.name" placeholder="例如：技术随笔" />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea
            v-model:value="categoryForm.description"
            placeholder="可选"
            :rows="2"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="tagModalOpen"
      title="新建标签"
      ok-text="创建"
      cancel-text="取消"
      :confirm-loading="tagSubmitting"
      @ok="submitTagForm"
    >
      <a-form layout="vertical">
        <a-form-item label="名称" required>
          <a-input v-model:value="tagForm.name" placeholder="例如：Vue" />
        </a-form-item>
        <a-form-item label="颜色">
          <input v-model="tagForm.color" type="color" class="blog-tag-color-input" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.blog-tag-color-input {
  width: 48px;
  height: 32px;
  border: none;
  cursor: pointer;
  background: transparent;
}
</style>
