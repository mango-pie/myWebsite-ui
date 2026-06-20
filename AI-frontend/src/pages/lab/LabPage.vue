<script setup lang="ts">
import { onMounted, reactive, ref, h } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { listMyAppByPage, deleteApp } from '@/api/appController'
import { useLoginUserStore } from '@/stores/loginUser'
import { siteConfig } from '@/config/site'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import LabCreatePanel from '@/components/lab/LabCreatePanel.vue'

function fromNow(str: string | undefined) {
  if (!str) return ''
  const diff = Date.now() - new Date(str).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '创建于 刚刚'
  if (mins < 60) return '创建于 ' + mins + ' 分钟前'
  const hours = Math.floor(mins / 60)
  if (hours < 24) return '创建于 ' + hours + ' 小时前'
  const days = Math.floor(hours / 24)
  if (days < 7) return '创建于 ' + days + ' 天前'
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return '创建于 ' + weeks + ' 周前'
  return '创建于 ' + Math.floor(days / 30) + ' 个月前'
}

const router = useRouter()
const loginUserStore = useLoginUserStore()

const myApps = ref<API.AppVO[]>([])
const myTotal = ref(0)
const myLoading = ref(false)
const mySearchParams = reactive({ pageNum: 1, pageSize: 8 })

const fetchMyApps = async () => {
  if (!loginUserStore.loginUser.id) return
  myLoading.value = true
  try {
    const res = await listMyAppByPage({ ...mySearchParams })
    if (res.data.code === 0 && res.data.data) {
      myApps.value = res.data.data.records || []
      myTotal.value = res.data.data.totalRow || 0
    }
  } finally {
    myLoading.value = false
  }
}

const onMyPageChange = (page: number) => {
  mySearchParams.pageNum = page
  fetchMyApps()
}

const doDeleteMyApp = (id: number | undefined) => {
  Modal.confirm({
    title: '确认删除该实验作品吗？',
    okText: '确认',
    okType: 'danger',
    onOk: async () => {
      const res = await deleteApp({ id })
      if (res.data.code === 0) {
        message.success('删除成功')
        fetchMyApps()
      } else {
        message.error('删除失败，' + res.data.message)
      }
    },
  })
}

onMounted(() => {
  fetchMyApps()
})
</script>

<template>
  <div id="labPage">
    <header class="lab-page__header">
      <h1 class="lab-page__title">{{ siteConfig.heroLabTitle }}</h1>
      <p class="lab-page__subtitle">{{ siteConfig.labPage.subtitle }}</p>
    </header>

    <section class="lab-page__create theme-glass-card">
      <LabCreatePanel />
    </section>

    <section v-if="loginUserStore.loginUser.id" class="lab-page__section">
      <div class="lab-page__section-header">
        <span class="lab-page__section-title">{{ siteConfig.sections.myExperiments }}</span>
        <span class="lab-page__section-count">{{ myTotal }} 个实验</span>
      </div>
      <a-spin :spinning="myLoading">
        <a-empty v-if="!myApps.length && !myLoading" :description="siteConfig.sections.emptyMyApps" />
        <div v-else class="app-grid">
          <div
            v-for="app in myApps"
            :key="app.id"
            class="app-card"
            @click="router.push('/app/chat/' + app.id)"
          >
            <div class="app-card__cover-wrap">
              <img v-if="app.cover" :src="app.cover" class="app-card__cover" alt="封面" />
              <div v-else class="app-card__cover app-card__cover--placeholder">
                <span>{{ app.appName ? app.appName.slice(0, 2) : '实验' }}</span>
              </div>
              <div class="app-card__shine" />
              <div class="app-card__overlay">
                <a-button
                  type="text"
                  :icon="h(EditOutlined)"
                  class="app-card__overlay-btn"
                  @click.stop="router.push('/app/edit/' + app.id)"
                />
                <a-button
                  type="text"
                  danger
                  :icon="h(DeleteOutlined)"
                  class="app-card__overlay-btn"
                  @click.stop="doDeleteMyApp(app.id)"
                />
              </div>
            </div>
            <div class="app-card__info">
              <div class="app-card__name">{{ app.appName || '未命名实验' }}</div>
              <div class="app-card__time">{{ fromNow(app.createTime) }}</div>
            </div>
          </div>
        </div>
        <div class="pagination">
          <a-pagination
            v-if="myTotal > 8"
            :current="mySearchParams.pageNum"
            :page-size="mySearchParams.pageSize"
            :total="myTotal"
            show-less-items
            @change="onMyPageChange"
          />
        </div>
      </a-spin>
    </section>

    <section v-else class="lab-page__login-hint theme-glass-card">
      <p>登录后可在此查看和管理你的实验作品</p>
      <a-button type="primary" @click="router.push('/user/login')">去登录</a-button>
    </section>
  </div>
</template>

<style scoped>
#labPage {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 20px 80px;
  position: relative;
  z-index: 1;
}

.lab-page__header {
  margin-top: 24px;
  margin-bottom: 28px;
  text-align: center;
}

.lab-page__title {
  font-size: 32px;
  font-weight: 700;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.lab-page__subtitle {
  margin-top: 10px;
  font-size: 15px;
  color: var(--color-text-secondary);
}

.lab-page__create {
  padding: 28px;
}

.lab-page__section {
  margin-top: 48px;
}

.lab-page__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.lab-page__section-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.lab-page__section-count {
  font-size: 14px;
  color: var(--color-text-muted);
}

.lab-page__login-hint {
  margin-top: 32px;
  padding: 32px;
  text-align: center;
  color: var(--color-text-secondary);
}

.lab-page__login-hint p {
  margin-bottom: 16px;
}

.app-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
}

.app-card {
  cursor: pointer;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--gradient-card);
  border: 1px solid var(--color-border);
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.app-card:hover {
  transform: translateY(-6px);
  border-color: rgba(232, 121, 169, 0.3);
  box-shadow: var(--shadow-glow);
}

.app-card__cover-wrap {
  position: relative;
  overflow: hidden;
}

.app-card__cover {
  width: 100%;
  height: 180px;
  object-fit: cover;
  display: block;
  transition: transform 0.5s ease;
}

.app-card:hover .app-card__cover {
  transform: scale(1.08);
}

.app-card__cover--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-primary);
  color: #fff;
  font-size: 42px;
  font-weight: 700;
  height: 180px;
}

.app-card__shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
  transition: left 0.6s ease;
}

.app-card:hover .app-card__shine {
  left: 150%;
}

.app-card__overlay {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.3s ease;
}

.app-card:hover .app-card__overlay {
  opacity: 1;
  transform: translateY(0);
}

.app-card__overlay-btn {
  background: rgba(26, 22, 37, 0.85) !important;
  backdrop-filter: blur(10px);
  border-radius: 10px;
  width: 36px;
  height: 36px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border) !important;
}

.app-card__info {
  padding: 16px;
}

.app-card__name {
  font-size: 16px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-text-primary);
}

.app-card__time {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-top: 4px;
}

.pagination {
  margin-top: 32px;
  text-align: center;
}

@media (max-width: 768px) {
  .lab-page__title {
    font-size: 26px;
  }

  .lab-page__create {
    padding: 20px;
  }

  .app-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 16px;
  }

  .app-card__cover,
  .app-card__cover--placeholder {
    height: 120px;
    font-size: 28px;
  }
}
</style>
