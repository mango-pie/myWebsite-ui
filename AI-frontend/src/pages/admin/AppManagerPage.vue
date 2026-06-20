<script setup lang="ts">
/**
 * 应用管理页（管理员） - 路径：/admin/appManage
 * 表格展示所有应用，支持分页、搜索、编辑（新开页面）、删除、精选
 */
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { listAppByPageForAdmin, deleteAppByAdmin, updateAppByAdmin } from '@/api/appController.ts'
import '@/assets/admin-theme.css'

const router = useRouter()
const dataSource = ref<API.AppVO[]>([])
const total = ref(0)
const loading = ref(false)

const searchParams = reactive<API.AppQueryRequest>({
  pageNum: 1,
  pageSize: 10,
  appName: '',
  codeGenType: undefined,
})

function formatTime(str: string | undefined): string {
  if (!str) return '-'
  try {
    return new Date(str).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return str
  }
}

const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '应用名称', dataIndex: 'appName', width: 160, ellipsis: true },
  { title: '封面', dataIndex: 'cover', width: 80 },
  { title: '类型', dataIndex: 'codeGenType', width: 100 },
  { title: '优先级', dataIndex: 'priority', width: 80 },
  { title: '创建者', dataIndex: 'userId', width: 80 },
  { title: '创建时间', dataIndex: 'createTime', width: 160 },
  { title: '操作', key: 'action', width: 200, fixed: 'right' },
]

const fetchData = async () => {
  loading.value = true
  try {
    const res = await listAppByPageForAdmin({ ...searchParams })
    if (res.data.code === 0 && res.data.data) {
      dataSource.value = res.data.data.records ?? []
      total.value = res.data.data.totalRow ?? 0
    } else {
      message.error('获取数据失败，' + res.data.message)
    }
  } finally {
    loading.value = false
  }
}

const doSearch = () => {
  searchParams.pageNum = 1
  fetchData()
}

const onTableChange = (pag: { current?: number; pageSize?: number }) => {
  if (pag.current != null) searchParams.pageNum = pag.current
  if (pag.pageSize != null) searchParams.pageSize = pag.pageSize
  fetchData()
}

const doDelete = (id: string) => {
  Modal.confirm({
    title: '确认删除该应用吗？',
    okText: '确认',
    okType: 'danger',
    onOk: async () => {
      const res = await deleteAppByAdmin({ id })
      if (res.data.code === 0) {
        message.success('删除成功')
        fetchData()
      } else {
        message.error('删除失败，' + res.data.message)
      }
    },
  })
}

const doFeatured = (record: API.AppVO) => {
  Modal.confirm({
    title: `将「${record.appName}」设为精选？`,
    content: '将优先级设置为 99',
    okText: '确认',
    onOk: async () => {
      const res = await updateAppByAdmin({ id: record.id, priority: 99 })
      if (res.data.code === 0) {
        message.success('已设为精选')
        fetchData()
      } else {
        message.error('操作失败，' + res.data.message)
      }
    },
  })
}

onMounted(fetchData)
</script>

<template>
  <div class="app-manager-page admin-theme-page">
    <!-- 搜索表单 -->
    <a-form layout="inline" :model="searchParams" style="margin-bottom: 16px" @finish="doSearch">
      <a-form-item label="应用名称">
        <a-input v-model:value="searchParams.appName" placeholder="输入应用名称" allow-clear />
      </a-form-item>
      <a-form-item label="类型">
        <a-select
          v-model:value="searchParams.codeGenType"
          placeholder="全部"
          allow-clear
          style="width: 140px"
        >
          <a-select-option value="chat">chat（对话）</a-select-option>
          <a-select-option value="multi_file">multi_file</a-select-option>
          <a-select-option value="html">html</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item>
        <a-button type="primary" html-type="submit">搜索</a-button>
      </a-form-item>
    </a-form>

    <a-card title="应用管理" :bordered="false">
      <a-table
        :data-source="dataSource"
        :columns="columns"
        :loading="loading"
        :pagination="{
          current: searchParams.pageNum,
          pageSize: searchParams.pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t: number) => `共 ${t} 条`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }"
        :scroll="{ x: 900 }"
        row-key="id"
        @change="onTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'cover'">
            <a-avatar v-if="record.cover" :src="record.cover" shape="square" :size="48" />
            <span v-else style="color: #ccc">-</span>
          </template>
          <template v-else-if="column.dataIndex === 'codeGenType'">
            <a-tag v-if="record.codeGenType === 'chat'" color="purple">对话</a-tag>
            <a-tag v-else-if="record.codeGenType === 'multi_file'" color="blue">多文件</a-tag>
            <a-tag v-else color="green">{{ record.codeGenType ?? '-' }}</a-tag>
          </template>
          <template v-else-if="column.dataIndex === 'priority'">
            <a-tag v-if="record.priority >= 99" color="gold">精选</a-tag>
            <span v-else>{{ record.priority ?? 0 }}</span>
          </template>
          <template v-else-if="column.dataIndex === 'createTime'">
            {{ formatTime(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button
                type="link"
                size="small"
                @click="router.push({ path: `/app/edit/${record.id}`, query: { from: 'admin' } })"
              >
                编辑
              </a-button>
              <a-button type="link" size="small" @click="doFeatured(record)">精选</a-button>
              <a-button danger size="small" @click="doDelete(record.id)">删除</a-button>
            </a-space>
          </template>
        </template>
        <template #emptyText>
          <a-empty description="暂无应用数据" />
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<style scoped>
.app-manager-page {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
