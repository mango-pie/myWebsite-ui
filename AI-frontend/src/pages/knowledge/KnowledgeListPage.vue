<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import {
  createKnowledgeBase,
  deleteKnowledgeBase,
  listKnowledgeBases,
  updateKnowledgeBase,
} from '@/api/knowledge'
import { isAdminRole } from '@/config/permission'
import { useLoginUserStore } from '@/stores/loginUser'
import { Plus, Search, RotateCcw, MessagesSquare } from 'lucide-vue-next'

const router = useRouter()
const loginUserStore = useLoginUserStore()
const canManageSettings = computed(() => isAdminRole(loginUserStore.loginUser?.userRole))
const loading = ref(false)
const dataSource = ref<API.KnowledgeBaseVO[]>([])
const total = ref(0)

const query = reactive<API.KnowledgeBaseQueryRequest>({
  pageNum: 1,
  pageSize: 10,
  name: undefined,
  status: undefined,
})

const modalOpen = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const submitting = ref(false)
const editingId = ref<number | string | null>(null)

const form = reactive({
  name: '',
  description: '',
  visibility: 'private',
  status: 1,
})

const fetchData = async () => {
  loading.value = true
  try {
    const res = await listKnowledgeBases({ ...query })
    if (res.data.code === 0 && res.data.data) {
      dataSource.value = res.data.data.records ?? []
      total.value = res.data.data.totalRow ?? 0
    } else {
      message.error(res.data.message || '加载失败')
    }
  } finally {
    loading.value = false
  }
}

const onSearch = () => {
  query.pageNum = 1
  fetchData()
}

const onReset = () => {
  query.name = undefined
  query.status = undefined
  query.pageNum = 1
  fetchData()
}

const openCreate = () => {
  modalMode.value = 'create'
  editingId.value = null
  form.name = ''
  form.description = ''
  form.visibility = 'private'
  form.status = 1
  modalOpen.value = true
}

const openEdit = (row: API.KnowledgeBaseVO) => {
  modalMode.value = 'edit'
  editingId.value = row.id ?? null
  form.name = row.name ?? ''
  form.description = row.description ?? ''
  form.visibility = row.visibility || 'private'
  form.status = row.status ?? 1
  modalOpen.value = true
}

const submitForm = async () => {
  if (!form.name.trim()) {
    message.warning('请输入知识库名称')
    return
  }
  submitting.value = true
  try {
    if (modalMode.value === 'create') {
      const res = await createKnowledgeBase({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        visibility: form.visibility || 'private',
      })
      if (res.data.code === 0) {
        message.success('创建成功')
        modalOpen.value = false
        fetchData()
      } else {
        message.error(res.data.message || '创建失败')
      }
    } else if (editingId.value != null) {
      const res = await updateKnowledgeBase(editingId.value, {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        visibility: form.visibility || 'private',
        status: form.status,
      })
      if (res.data.code === 0) {
        message.success('保存成功')
        modalOpen.value = false
        fetchData()
      } else {
        message.error(res.data.message || '保存失败')
      }
    }
  } finally {
    submitting.value = false
  }
}

const handleDelete = (row: API.KnowledgeBaseVO) => {
  const count = row.documentCount ?? 0
  Modal.confirm({
    title: '删除知识库',
    content:
      count > 0
        ? `「${row.name}」下有 ${count} 个文档，删除将级联清理关联数据。确认？`
        : `确认删除「${row.name}」？`,
    okType: 'danger',
    onOk: async () => {
      if (row.id == null) return
      const res = await deleteKnowledgeBase(row.id)
      if (res.data.code === 0) {
        message.success('已删除')
        fetchData()
      } else {
        message.error(res.data.message || '删除失败')
      }
    },
  })
}

const openChat = (row: API.KnowledgeBaseVO) => {
  router.push(`/knowledge/${row.id}/chat`)
}

const openDetail = (row: API.KnowledgeBaseVO) => {
  router.push(`/knowledge/${row.id}`)
}

const tapeColors = ['var(--st-sakura)', 'var(--st-mint)', 'var(--st-sky)', 'var(--st-cream)']
const tapeTilts = ['-4deg', '3deg', '-3deg', '4deg']

onMounted(fetchData)
</script>

<template>
  <div class="container">
    <header class="page-header">
      <div>
        <h1>知识库</h1>
        <p class="subtitle">管理你的知识资产，与 AI 对话探索</p>
      </div>
      <button class="btn" @click="openCreate">
        <Plus :size="16" />
        新建知识库
      </button>
    </header>

    <div class="search-bar">
      <div class="sticker search-wrapper">
        <Search :size="18" />
        <input
          v-model="query.name"
          type="text"
          placeholder="搜索知识库名称..."
          @keyup.enter="onSearch"
        />
      </div>
      <div class="search-actions">
        <button class="btn ghost" @click="onSearch">搜索</button>
        <button class="btn ghost" @click="onReset">
          <RotateCcw :size="14" />
          重置
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="sticker" style="padding: 40px; text-align: center;">
        <p>加载中...</p>
      </div>
    </div>

    <div v-else-if="!dataSource.length" class="empty-state">
      <div class="sticker" style="padding: 60px 40px; text-align: center;">
        <div class="empty-icon">📚</div>
        <h3>还没有知识库</h3>
        <p>创建你的第一个知识库，开始积累知识</p>
        <button class="btn" @click="openCreate" style="margin-top: 16px;">
          <Plus :size="16" />
          创建知识库
        </button>
      </div>
    </div>

    <div v-else class="kb-grid">
      <div
        v-for="(kb, index) in dataSource"
        :key="kb.id"
        class="sticker kb-card"
        :style="{ '--rot': (index % 2 === 0 ? -1 : 1) * 1.5 + 'deg' }"
      >
        <div
          class="tape"
          :style="{
            '--tc': tapeColors[index % 4],
            '--tilt': tapeTilts[index % 4],
          }"
        />
        <div class="kb-header">
          <h3 @click="openDetail(kb)">{{ kb.name }}</h3>
          <span class="pill" :data-tone="kb.visibility === 'public' ? 'sky' : 'outline'">
            {{ kb.visibility === 'public' ? '公开' : '私有' }}
          </span>
        </div>
        <p class="kb-desc">{{ kb.description || '暂无描述' }}</p>
        <div class="kb-stats">
          <div class="stat">
            <span class="stat-value">{{ kb.documentCount ?? 0 }}</span>
            <span class="stat-label">文档</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ kb.status === 1 ? '启用' : '禁用' }}</span>
            <span class="stat-label">状态</span>
          </div>
        </div>
        <div class="kb-actions">
          <button class="btn ghost sm" @click="openChat(kb)">
            <MessagesSquare :size="14" />
            问答
          </button>
          <button v-if="canManageSettings" class="btn ghost sm" @click="openEdit(kb)">
            编辑
          </button>
          <button v-if="canManageSettings" class="btn ghost sm danger" @click="handleDelete(kb)">
            删除
          </button>
        </div>
      </div>
    </div>

    <Modal
      v-model:open="modalOpen"
      :title="modalMode === 'create' ? '新建知识库' : '编辑知识库'"
      :confirm-loading="submitting"
      @ok="submitForm"
      @cancel="modalOpen = false"
    >
      <div class="form-field">
        <label>名称</label>
        <input v-model="form.name" type="text" placeholder="知识库名称" class="form-input" />
      </div>
      <div class="form-field">
        <label>描述</label>
        <textarea
          v-model="form.description"
          placeholder="知识库描述（可选）"
          class="form-textarea"
          rows="3"
        />
      </div>
      <div class="form-field">
        <label>可见性</label>
        <select v-model="form.visibility" class="form-select">
          <option value="private">私有</option>
          <option value="public">公开</option>
        </select>
      </div>
    </Modal>
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
  max-width: 400px;
}

.search-wrapper input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font: 15px var(--fb);
  color: var(--ink);
}

.search-actions {
  display: flex;
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

.kb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 28px;
}

.kb-card {
  padding: 24px;
  transition: all 0.3s ease;
  transform: rotate(var(--rot, 0deg));
  display: flex;
  flex-direction: column;
}

.kb-card:hover {
  transform: rotate(0deg) translateY(-4px);
}

.kb-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.kb-header h3 {
  margin: 0;
  font-size: 20px;
  line-height: 1.3;
  cursor: pointer;
  transition: color 0.2s;
}

.kb-header h3:hover {
  color: var(--accent);
}

.kb-desc {
  margin: 0 0 16px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--ink-soft);
  flex: 1;
}

.kb-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  padding: 12px 0;
  border-top: 1.5px dashed var(--hairline);
  border-bottom: 1.5px dashed var(--hairline);
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font: 18px var(--fd);
  color: var(--ink);
}

.stat-label {
  font: 11px var(--fd);
  color: var(--ink-soft);
  letter-spacing: 0.05em;
}

.kb-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.form-field {
  margin-bottom: 16px;
}

.form-field label {
  display: block;
  font: 14px var(--fd);
  color: var(--ink-soft);
  margin-bottom: 8px;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px dashed var(--hairline);
  border-radius: 10px;
  background: #FFFDF8;
  font: 14px var(--fb);
  color: var(--ink);
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  border-color: var(--accent);
  border-style: solid;
}

.btn.danger {
  color: #E88B8B;
}

.btn.danger:hover {
  background: #F5C6C6;
  color: var(--ink);
}

@media (max-width: 768px) {
  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-wrapper {
    max-width: none;
  }

  .kb-grid {
    grid-template-columns: 1fr;
  }
}
</style>
