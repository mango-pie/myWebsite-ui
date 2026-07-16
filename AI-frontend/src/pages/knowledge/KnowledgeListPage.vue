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
import '@/assets/admin-theme.css'
import { LibraryBig } from 'lucide-vue-next'

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

const columns = [
  { title: '名称', dataIndex: 'name', ellipsis: true },
  { title: '描述', dataIndex: 'description', ellipsis: true },
  { title: '文档数', dataIndex: 'documentCount', width: 90 },
  { title: '可见范围', dataIndex: 'visibility', width: 100 },
  { title: '状态', dataIndex: 'status', width: 90 },
  { title: '更新时间', dataIndex: 'updateTime', width: 180 },
  { title: '操作', key: 'action', width: 200, fixed: 'right' as const },
]

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
  <div class="kb-list-page admin-theme-page">
    <!-- 面包屑 -->
    <a-breadcrumb class="admin-breadcrumb">
      <a-breadcrumb-item>
        <router-link to="/">首页</router-link>
      </a-breadcrumb-item>
      <a-breadcrumb-item>知识库</a-breadcrumb-item>
    </a-breadcrumb>

    <!-- 页面头部 -->
    <div class="admin-page-hero">
      <div class="hero-left">
        <div class="hero-title"><LibraryBig :size="22" /> 知识库</div>
        <div class="hero-subtitle">共 {{ total }} 个知识库 · 构建你的 AI 知识体系</div>
      </div>
      <div class="hero-extra">
        <a-space>
          <a-button
            v-if="canManageSettings"
            @click="router.push('/admin/settings/knowledge')"
          >
            知识库设置
          </a-button>
          <a-button type="primary" size="large" @click="openCreate">＋ 新建知识库</a-button>
        </a-space>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="admin-filter-bar">
      <a-input
        v-model:value="query.name"
        allow-clear
        placeholder="搜索知识库名称…"
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
      <a-button type="primary" @click="onSearch">搜索</a-button>
      <a-button @click="onReset">重置</a-button>
    </div>

    <!-- 数据表格 -->
    <a-card :bordered="false">
      <a-table
        row-key="id"
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="{
          current: query.pageNum,
          pageSize: query.pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t: number) => `共 ${t} 条`,
        }"
        :scroll="{ x: 960 }"
        @change="onTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'name'">
            <a style="cursor: pointer" @click="router.push(`/knowledge/${record.id}`)">
              {{ record.name }}
            </a>
          </template>
          <template v-else-if="column.dataIndex === 'visibility'">
            <a-tag :color="record.visibility === 'public' ? 'blue' : 'default'">
              {{ record.visibility === 'public' ? '公开' : '私有' }}
            </a-tag>
          </template>
          <template v-else-if="column.dataIndex === 'status'">
            <a-badge
              :status="record.status === 1 ? 'success' : 'default'"
              :text="record.status === 1 ? '正常' : '禁用'"
            />
          </template>
          <template v-else-if="column.dataIndex === 'description'">
            {{ record.description || '-' }}
          </template>
          <template v-else-if="column.dataIndex === 'documentCount'">
            <span style="font-weight: 500">{{ record.documentCount ?? 0 }}</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space :size="4">
              <a-button type="link" size="small" @click="router.push(`/knowledge/${record.id}`)">进入</a-button>
              <a-button type="link" size="small" @click="router.push(`/knowledge/${record.id}/chat`)">问答</a-button>
              <a-dropdown :trigger="['click']" placement="bottomRight">
                <button class="admin-action-trigger" title="更多操作">···</button>
                <template #overlay>
                  <a-menu @click="({ key }: { key: string }) => {
                    if (key === 'edit') openEdit(record)
                    else if (key === 'delete') handleDelete(record)
                  }">
                    <a-menu-item key="edit">编辑</a-menu-item>
                    <a-menu-divider />
                    <a-menu-item key="delete" danger>
                      <span style="color: var(--color-error)">删除</span>
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </a-space>
          </template>
        </template>
        <template #emptyText>
          <a-empty description="还没有知识库">
            <template #children>
              <a-button type="primary" @click="openCreate">创建第一个知识库</a-button>
            </template>
          </a-empty>
        </template>
      </a-table>
    </a-card>

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
/* admin-theme.css handles all theming */
</style>
