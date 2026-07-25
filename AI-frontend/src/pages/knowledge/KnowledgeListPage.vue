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
import { LibraryBig, Plus, Search, RotateCcw, Settings, MessagesSquare, MoreHorizontal } from 'lucide-vue-next'
import IconAction from '@/components/ui/IconAction.vue'
import '@/assets/admin-theme.css'
import '@/assets/knowledge-shell.css'

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

const onTableChange = (pag: { current?: number; pageSize?: number }) => {
  if (pag.current != null) query.pageNum = pag.current
  if (pag.pageSize != null) query.pageSize = pag.pageSize
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

onMounted(fetchData)
</script>

<template>
  <div class="kb-list-page admin-theme-page kb-room-page">
    <!-- 面包屑 -->
    <a-breadcrumb class="admin-breadcrumb">
      <a-breadcrumb-item>
        <router-link to="/">首页</router-link>
      </a-breadcrumb-item>
      <a-breadcrumb-item>知识库</a-breadcrumb-item>
    </a-breadcrumb>

    <div class="admin-page-hero">
      <div class="hero-left">
        <div class="hero-title"><LibraryBig :size="22" /> 知识库</div>
        <div class="hero-subtitle">共 {{ total }} 册书库 · 检索与问答的藏书室</div>
      </div>
      <div class="hero-extra">
        <a-space>
          <IconAction
            v-if="canManageSettings"
            :icon="Settings"
            label="设置"
            variant="soft"
            @click="router.push('/admin/settings/knowledge')"
          />
          <IconAction :icon="Plus" label="新建书库" variant="primary" @click="openCreate" />
        </a-space>
      </div>
    </div>

    <div class="admin-filter-bar">
      <a-input
        v-model:value="query.name"
        allow-clear
        placeholder="检索书库名称…"
        style="width: 200px"
        @pressEnter="onSearch"
      />
      <a-select
        v-model:value="query.status"
        allow-clear
        placeholder="状态"
        style="width: 120px"
      >
        <a-select-option :value="1">正常</a-select-option>
        <a-select-option :value="0">禁用</a-select-option>
      </a-select>
      <IconAction :icon="Search" label="检索" variant="primary" size="sm" motion="slide" @click="onSearch" />
      <IconAction :icon="RotateCcw" label="重置" variant="ghost" size="sm" motion="spin" @click="onReset" />
    </div>

    <a-spin :spinning="loading">
      <div v-if="!dataSource.length && !loading" class="kb-shelf-empty">
        <a-empty description="还没有书库">
          <template #children>
            <IconAction :icon="Plus" label="创建第一册" variant="primary" motion="pop" @click="openCreate" />
          </template>
        </a-empty>
      </div>
      <nav v-else class="kb-shelf" aria-label="知识库目录">
        <button
          v-for="(row, index) in dataSource"
          :key="row.id"
          type="button"
          class="kb-shelf__row"
          @click="router.push(`/knowledge/${row.id}`)"
        >
          <span class="kb-shelf__num">{{ String(index + 1 + ((query.pageNum || 1) - 1) * (query.pageSize || 10)).padStart(2, '0') }}</span>
          <span class="kb-shelf__body">
            <span class="kb-shelf__name">{{ row.name }}</span>
            <span class="kb-shelf__desc">{{ row.description || '（无提要）' }}</span>
          </span>
          <span class="kb-shelf__leaders" aria-hidden="true" />
          <span class="kb-shelf__marks">
            <span class="wax-seal wax-seal--sticker">{{ row.documentCount ?? 0 }} 篇</span>
            <span class="wax-seal" :class="row.visibility === 'public' ? 'wax-seal--read' : 'wax-seal--pending'">
              {{ row.visibility === 'public' ? '公开' : '私有' }}
            </span>
            <span class="wax-seal" :class="row.status === 1 ? 'wax-seal--read' : 'wax-seal--unread'">
              {{ row.status === 1 ? '在架' : '下架' }}
            </span>
          </span>
          <span class="kb-shelf__actions" @click.stop>
            <IconAction
              :icon="MessagesSquare"
              label="问答"
              variant="ghost"
              size="sm"
              @click="router.push(`/knowledge/${row.id}/chat`)"
            />
            <a-dropdown :trigger="['click']" placement="bottomRight">
              <button type="button" class="admin-action-trigger kb-more-btn" title="更多">
                <MoreHorizontal :size="16" />
              </button>
              <template #overlay>
                <a-menu
                  @click="({ key }: { key: string }) => {
                    if (key === 'edit') openEdit(row)
                    else if (key === 'delete') handleDelete(row)
                  }"
                >
                  <a-menu-item key="edit">编辑</a-menu-item>
                  <a-menu-divider />
                  <a-menu-item key="delete" danger>删除</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </span>
        </button>
      </nav>
      <div v-if="total > (query.pageSize || 10)" class="kb-shelf__pager">
        <a-pagination
          :current="query.pageNum"
          :page-size="query.pageSize"
          :total="total"
          show-size-changer
          :show-total="(t: number) => `共 ${t} 册`"
          @change="(page: number, pageSize: number) => onTableChange({ current: page, pageSize })"
        />
      </div>
    </a-spin>

    <!-- 创建/编辑弹窗 -->
    <a-modal
      v-model:open="modalOpen"
      :title="modalMode === 'create' ? '新建知识库' : '编辑知识库'"
      :confirm-loading="submitting"
      ok-text="保存"
      @ok="submitForm"
    >
      <a-form layout="vertical">
        <a-form-item label="名称" required>
          <a-input v-model:value="form.name" :maxlength="128" show-count placeholder="知识库名称" />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model:value="form.description" :maxlength="512" show-count :rows="3" />
        </a-form-item>
        <a-form-item label="可见范围">
          <a-radio-group v-model:value="form.visibility">
            <a-radio value="private">私有</a-radio>
            <a-radio value="public">公开</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item v-if="modalMode === 'edit'" label="状态">
          <a-radio-group v-model:value="form.status">
            <a-radio :value="1">正常</a-radio>
            <a-radio :value="0">禁用</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.kb-shelf {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--color-border);
}

.kb-shelf__row {
  display: grid;
  grid-template-columns: 2.4em minmax(0, auto) minmax(1em, 1fr) auto auto;
  gap: 0.45em 0.55em;
  align-items: center;
  width: 100%;
  padding: 1em 0.25em;
  border: none;
  border-bottom: 1px dashed rgba(169, 144, 112, 0.5);
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.28s ease, padding-left 0.28s ease;
}

.kb-shelf__row:hover {
  background: rgba(160, 120, 70, 0.1);
  padding-left: 0.5em;
}

.kb-shelf__num {
  font-family: var(--font-sans);
  font-size: 0.75em;
  color: var(--color-text-muted);
}

.kb-shelf__body {
  display: flex;
  flex-direction: column;
  gap: 0.2em;
  min-width: 0;
}

.kb-shelf__name {
  font-family: var(--font-serif);
  font-size: 1.15em;
  font-weight: 600;
  color: var(--color-text-primary);
}

.kb-shelf__row:hover .kb-shelf__name {
  color: var(--color-primary);
}

.kb-shelf__desc {
  font-family: var(--font-sans);
  font-size: 0.8em;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 28em;
}

.kb-shelf__leaders {
  height: 0;
  border-bottom: 1px dotted rgba(138, 115, 85, 0.55);
  align-self: center;
}

.kb-shelf__marks {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35em;
}

.kb-shelf__actions {
  display: inline-flex;
  align-items: center;
  gap: 0.25em;
}

.kb-shelf__pager {
  margin-top: 1.25em;
  text-align: center;
}

.kb-shelf-empty {
  padding: 2em 0;
}

.kb-more-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .kb-shelf__row {
    grid-template-columns: 2em minmax(0, 1fr) auto;
  }

  .kb-shelf__leaders,
  .kb-shelf__marks {
    display: none;
  }
}
</style>
