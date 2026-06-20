<script setup lang="ts">
import { inject, ref } from 'vue'
import {
  CalendarOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  LockOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue'
import { Modal, Form, Input, message } from 'ant-design-vue'
import { studyContextKey } from '@/composables/study/useStudyContext'
import { SMART_VIEWS, LIST_TYPE_INBOX, type SmartViewKey } from '@/constants/study'

const ctx = inject(studyContextKey)!
const listModalOpen = ref(false)
const editingList = ref<API.StudyListVO | null>(null)
const listForm = ref({ name: '', color: '#7c9ce0' })

const smartIcons: Record<string, typeof CalendarOutlined> = {
  today: CalendarOutlined,
  week: CalendarOutlined,
  inbox: InboxOutlined,
  completed: CheckCircleOutlined,
}

function isActiveSmart(key: SmartViewKey) {
  return ctx.selection.value.view === key && ctx.selection.value.view !== 'list'
}

function isActiveList(list: API.StudyListVO) {
  return ctx.selection.value.view === 'list' && ctx.selection.value.listId === list.id
}

async function selectSmart(key: SmartViewKey) {
  await ctx.setSelection({ view: key })
}

async function selectList(list: API.StudyListVO) {
  if (!list.id) return
  await ctx.setSelection({ view: 'list', listId: list.id, listName: list.name })
}

const customLists = () =>
  ctx.lists.value.filter((l) => l.listType !== LIST_TYPE_INBOX)

function openAddList() {
  editingList.value = null
  listForm.value = { name: '', color: '#7c9ce0' }
  listModalOpen.value = true
}

function openEditList(list: API.StudyListVO, e: Event) {
  e.stopPropagation()
  editingList.value = list
  listForm.value = { name: list.name || '', color: list.color || '#7c9ce0' }
  listModalOpen.value = true
}

async function submitListForm() {
  const name = listForm.value.name.trim()
  if (!name) {
    message.warning('请输入清单名称')
    return
  }
  if (editingList.value?.id) {
    await ctx.updateListFields({
      id: editingList.value.id,
      name,
      color: listForm.value.color,
    })
  } else {
    await ctx.addList(name, listForm.value.color)
  }
  listModalOpen.value = false
}

async function handleDeleteList(list: API.StudyListVO, e: Event) {
  e.stopPropagation()
  if (!list.id) return
  if (list.listType === LIST_TYPE_INBOX) return
  Modal.confirm({
    title: `删除清单「${list.name}」？`,
    content: '清单内任务将移至收集箱',
    okType: 'danger',
    onOk: async () => {
      const ok = await ctx.deleteListById(list.id!)
      if (ok && isActiveList(list)) {
        await selectSmart('inbox')
      }
    },
  })
}
</script>

<template>
  <aside class="study-panel study-panel--sidebar">
    <div class="study-panel__head">清单</div>
    <div class="study-panel__body">
      <div class="study-sidebar__section-label">智能清单</div>
      <button
        v-for="item in SMART_VIEWS"
        :key="item.key"
        type="button"
        class="study-nav-item"
        :class="{ 'study-nav-item--active': isActiveSmart(item.key) }"
        @click="selectSmart(item.key)"
      >
        <component :is="smartIcons[item.key]" />
        <span>{{ item.label }}</span>
      </button>

      <div class="study-sidebar__section-label">学习清单</div>
      <button
        v-for="list in customLists()"
        :key="list.id"
        type="button"
        class="study-nav-item"
        :class="{ 'study-nav-item--active': isActiveList(list) }"
        @click="selectList(list)"
      >
        <span class="study-nav-item__dot" :style="{ background: list.color || '#7c9ce0' }" />
        <span>{{ list.name }}</span>
        <LockOutlined v-if="list.listType === LIST_TYPE_INBOX" style="font-size: 12px; opacity: 0.5" />
        <span v-if="list.taskCount" class="study-nav-item__count">{{ list.taskCount }}</span>
        <EditOutlined
          v-if="list.listType !== LIST_TYPE_INBOX"
          class="study-list-edit"
          @click="openEditList(list, $event)"
        />
        <DeleteOutlined
          v-if="list.listType !== LIST_TYPE_INBOX"
          class="study-list-delete"
          @click="handleDeleteList(list, $event)"
        />
      </button>

      <div class="study-list-actions">
        <a-button type="dashed" block size="small" @click="openAddList">
          <PlusOutlined /> 新建清单
        </a-button>
      </div>
    </div>

    <a-modal
      v-model:open="listModalOpen"
      :title="editingList ? '编辑清单' : '新建清单'"
      ok-text="保存"
      cancel-text="取消"
      @ok="submitListForm"
    >
      <a-form layout="vertical">
        <a-form-item label="名称">
          <a-input v-model:value="listForm.name" placeholder="例如：Vue 学习" />
        </a-form-item>
        <a-form-item label="颜色">
          <input v-model="listForm.color" type="color" class="study-color-input" />
        </a-form-item>
      </a-form>
    </a-modal>
  </aside>
</template>

<style scoped>
.study-list-edit,
.study-list-delete {
  margin-left: 4px;
  font-size: 12px;
  opacity: 0.4;
  flex-shrink: 0;
}

.study-list-edit:hover,
.study-list-delete:hover {
  opacity: 1;
  color: #e879a9;
}

.study-color-input {
  width: 48px;
  height: 32px;
  border: none;
  cursor: pointer;
  background: transparent;
}
</style>
