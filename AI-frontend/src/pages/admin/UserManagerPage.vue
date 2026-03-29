<script setup lang="ts">
/**
 * 用户管理页（管理员） - 路径：/admin/userManage
 * 表格展示用户列表，支持分页、编辑用户信息、删除；头像、角色、创建时间自定义渲染。
 */
import { onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { deleteUser, listUserVoByPage, updateUser } from '@/api/userController.ts'
import { Modal } from 'ant-design-vue'

/** 表格行数据类型，与后端 UserVO 对应 */
type ManagerRow = API.UserVO

/** 角色选项（与后端一致） */
const ROLE_OPTIONS = [
  { label: '普通用户', value: 'user' },
  { label: '管理员', value: 'admin' },
  { label: '管理人', value: 'administrator' },
]

const dataSource = ref<ManagerRow[]>([])
const total = ref(0)
const loading = ref(false)

const searchParams = reactive<API.UserQueryRequest>({
  pageNum: 1,
  pageSize: 10,
})

/** 格式化时间为本地字符串 */
function formatTime(str: string | undefined): string {
  if (!str) return '-'
  try {
    return new Date(str).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return str
  }
}

const columns = [
  { title: 'ID', dataIndex: 'id', width: 88 },
  { title: '账号', dataIndex: 'userAccount', width: 120, ellipsis: true },
  { title: '用户名', dataIndex: 'userName', width: 120, ellipsis: true },
  { title: '头像', dataIndex: 'userAvatar', width: 100 },
  { title: '简介', dataIndex: 'userProfile', width: 100, ellipsis: true },
  { title: '角色', dataIndex: 'userRole', width: 100 },
  { title: '创建时间', dataIndex: 'createTime', width: 172 },
  { title: '操作', key: 'action', width: 160, fixed: 'right' },
]

const fetchData = async () => {
  loading.value = true
  try {
    const res = await listUserVoByPage({ ...searchParams })
    const page = res.data.data
    if (page) {
      dataSource.value = page.records ?? []
      total.value = page.totalRow ?? 0
    } else {
      message.error('获取数据失败，' + res.data.message)
    }
  } finally {
    loading.value = false
  }
}

const onTableChange = (pag: { current?: number; pageSize?: number }) => {
  if (pag.current != null) searchParams.pageNum = pag.current
  if (pag.pageSize != null) searchParams.pageSize = pag.pageSize
  fetchData()
}

// 获取数据
const doSearch = () => {
  // 重置页码
  searchParams.pageNum = 1
  fetchData()
}

onMounted(() => {
  fetchData()
})

// 删除数据
const doDelete = async (id: string) => {
  Modal.confirm({
    title: '确认删除用户吗？',
    okText: '确认',
    okType: 'danger',
    onOk: async () => {
      if (!id) return
      const res = await deleteUser({ id })
      if (res.data.code === 0) {
        message.success('删除成功')
        fetchData()
      } else {
        message.error('删除失败')
      }
    },
  })
}

// 编辑用户：弹窗与表单
const editModalVisible = ref(false)
const editSubmitting = ref(false)
const editForm = reactive<API.UserUpdateRequest>({
  id: undefined,
  userName: '',
  userAvatar: '',
  userProfile: '',
  userRole: undefined,
})

const openEdit = (record: ManagerRow) => {
  editForm.id = record.id
  editForm.userName = record.userName ?? ''
  editForm.userAvatar = record.userAvatar ?? ''
  editForm.userProfile = record.userProfile ?? ''
  editForm.userRole = record.userRole ?? 'user'
  editModalVisible.value = true
}

const closeEditModal = () => {
  editModalVisible.value = false
}

const doEditSubmit = async () => {
  if (editForm.id == null) return
  editSubmitting.value = true
  try {
    const res = await updateUser({
      id: editForm.id,
      userName: editForm.userName?.trim() || undefined,
      userAvatar: editForm.userAvatar?.trim() || undefined,
      userProfile: editForm.userProfile?.trim() || undefined,
      userRole: editForm.userRole,
    })
    if (res.data?.code === 0 && res.data?.data) {
      message.success('修改成功')
      closeEditModal()
      fetchData()
    } else {
      message.error('修改失败，' + (res.data?.message ?? '请稍后重试'))
    }
  } finally {
    editSubmitting.value = false
  }
}
</script>

<template>
  <div id="userManagePage">
    <!-- 搜索表单 -->
    <a-form layout="inline" :model="searchParams" @finish="doSearch">
      <a-form-item label="账号">
        <a-input v-model:value="searchParams.userAccount" placeholder="输入账号" />
      </a-form-item>
      <a-form-item label="用户名">
        <a-input v-model:value="searchParams.userName" placeholder="输入用户名" />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" html-type="submit">搜索</a-button>
      </a-form-item>
    </a-form>
    <a-divider />
    <!-- 表格 -->
  </div>

  <div class="user-manager-page">
    <a-card title="用户管理" :bordered="false" class="user-manager-card">
      <a-table
        :data-source="dataSource"
        :columns="columns"
        :loading="loading"
        :pagination="{
          current: searchParams.pageNum,
          pageSize: searchParams.pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
          pageSizeOptions: ['10', '20', '50'],
        }"
        :scroll="{ x: 900 }"
        row-key="id"
        @change="onTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'userAvatar'">
            <a-avatar
              v-if="record.userAvatar"
              :src="record.userAvatar"
              :size="56"
              class="user-avatar"
            />
            <span v-else class="no-avatar">-</span>
          </template>
          <template v-else-if="column.dataIndex === 'userRole'">
            <a-tag v-if="record.userRole === 'admin'" color="green"> 管理员 </a-tag>
            <a-tag v-else-if="record.userRole === 'administrator'" color="red"> 管理人 </a-tag>
            <a-tag v-else color="blue">普通用户</a-tag>
          </template>
          <template v-else-if="column.dataIndex === 'createTime'">
            {{ formatTime(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="openEdit(record)">编辑</a-button>
              <a-button danger size="small" @click="doDelete(record.id)">删除</a-button>
            </a-space>
          </template>
        </template>
        <template #emptyText>
          <a-empty description="暂无用户数据" />
        </template>
      </a-table>
    </a-card>

    <!-- 编辑用户弹窗 -->
    <a-modal
      v-model:open="editModalVisible"
      title="编辑用户"
      :confirm-loading="editSubmitting"
      ok-text="保存"
      @ok="doEditSubmit"
      @cancel="closeEditModal"
    >
      <a-form layout="vertical" :model="editForm">
        <a-form-item label="用户名">
          <a-input v-model:value="editForm.userName" placeholder="请输入用户名" allow-clear />
        </a-form-item>
        <a-form-item label="头像地址">
          <a-input v-model:value="editForm.userAvatar" placeholder="头像图片 URL" allow-clear />
          <a-avatar
            v-if="editForm.userAvatar"
            :src="editForm.userAvatar"
            :size="48"
            class="edit-avatar-preview"
          />
        </a-form-item>
        <a-form-item label="个人简介">
          <a-textarea
            v-model:value="editForm.userProfile"
            placeholder="请输入个人简介"
            :rows="3"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="角色">
          <a-select v-model:value="editForm.userRole" placeholder="选择角色" style="width: 100%">
            <a-select-option v-for="opt in ROLE_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.user-manager-page {
  max-width: 1200px;
  margin: 0 auto;
}

.user-manager-card {
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.user-manager-card :deep(.ant-card-head) {
  border-bottom: 1px solid #f0f0f0;
  font-weight: 600;
}

.user-manager-card :deep(.ant-table) {
  font-size: 13px;
}

.user-avatar {
  display: block;
  border-radius: 8px;
}

.no-avatar {
  color: rgba(0, 0, 0, 0.25);
  font-size: 12px;
}

.edit-avatar-preview {
  display: block;
  margin-top: 8px;
  border-radius: 8px;
}
</style>
