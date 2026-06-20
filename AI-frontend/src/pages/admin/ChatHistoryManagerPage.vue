<script setup lang="ts">
/**
 * 对话管理页（管理员） - 路径：/admin/chatHistoryManage
 * 表格展示所有对话历史，支持分页、搜索、删除
 */
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { listChatHistoryByPageForAdmin, deleteByAppId } from '@/api/chatHistoryController.ts'
import '@/assets/admin-theme.css'

const router = useRouter()
const dataSource = ref<API.ChatHistoryVO[]>([])
const total = ref(0)
const loading = ref(false)

const searchParams = reactive<API.ChatHistoryQueryRequest>({
  pageNum: 1,
  pageSize: 10,
  message: '',
  messageType: undefined,
  appId: undefined,
  userId: undefined,
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
  { title: '应用 ID', dataIndex: 'appId', width: 120 },
  { title: '用户 ID', dataIndex: 'userId', width: 100 },
  { title: '消息类型', dataIndex: 'messageType', width: 100 },
  { title: '消息内容', dataIndex: 'message', width: 400, ellipsis: true },
  { title: '创建时间', dataIndex: 'createTime', width: 160 },
  { title: '操作', key: 'action', width: 120, fixed: 'right' },
]

const fetchData = async () => {
  loading.value = true
  try {
    const res = await listChatHistoryByPageForAdmin({
      chatHistoryQueryRequest: { ...searchParams }
    })
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

const doDeleteByAppId = (appId: string) => {
  Modal.confirm({
    title: `确认删除应用 ${appId} 的所有对话记录吗？`,
    okText: '确认',
    okType: 'danger',
    onOk: async () => {
      const res = await deleteByAppId({ appId })
      if (res.data.code === 0) {
        message.success('删除成功')
        fetchData()
      } else {
        message.error('删除失败，' + res.data.message)
      }
    },
  })
}

onMounted(fetchData)
</script>

<template>
  <div class="chat-history-manager-page admin-theme-page">
    <!-- 搜索表单 -->
    <a-form layout="inline" :model="searchParams" style="margin-bottom: 16px" @finish="doSearch">
      <a-form-item label="应用 ID">
        <a-input v-model:value="searchParams.appId" placeholder="输入应用 ID" allow-clear />
      </a-form-item>
      <a-form-item label="用户 ID">
        <a-input v-model:value="searchParams.userId" placeholder="输入用户 ID" allow-clear />
      </a-form-item>
      <a-form-item label="消息类型">
        <a-select
          v-model:value="searchParams.messageType"
          placeholder="全部"
          allow-clear
          style="width: 140px"
        >
          <a-select-option value="user">user</a-select-option>
          <a-select-option value="ai">ai</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="消息内容">
        <a-input v-model:value="searchParams.message" placeholder="输入消息内容" allow-clear />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" html-type="submit">搜索</a-button>
      </a-form-item>
    </a-form>

    <a-card title="对话管理" :bordered="false">
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
        :scroll="{ x: 1000 }"
        row-key="id"
        @change="onTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'messageType'">
            <a-tag :color="record.messageType === 'user' ? 'blue' : 'green'">
              {{ record.messageType ?? '-' }}
            </a-tag>
          </template>
          <template v-else-if="column.dataIndex === 'createTime'">
            {{ formatTime(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button danger size="small" @click="doDeleteByAppId(record.appId?.toString() || '')">
                删除该应用对话
              </a-button>
            </a-space>
          </template>
        </template>
        <template #emptyText>
          <a-empty description="暂无对话数据" />
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<style scoped>
.chat-history-manager-page {
  max-width: 1200px;
  margin: 0 auto;
}
</style>