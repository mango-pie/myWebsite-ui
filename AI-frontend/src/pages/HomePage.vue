<script setup lang="ts">
import { onMounted, reactive, ref, h } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { addApp, listMyAppByPage, listFeaturedAppByPage, deleteApp } from '@/api/appController'
import { useLoginUserStore } from '@/stores/loginUser'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons-vue'

function fromNow(str) {
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
const quickPrompts = ['波普风电商页面', '企业网站', '电商运营后台', '暗黑话题社区']
const initPrompt = ref('')
const creating = ref(false)

const handleCreate = async () => {
  if (!initPrompt.value.trim()) { message.warning('请输入提示词'); return }
  if (!loginUserStore.loginUser.id) { message.warning('请先登录'); router.push('/user/login'); return }
  creating.value = true
  try {
    const res = await addApp({ initPrompt: initPrompt.value.trim(), appName: initPrompt.value.trim().slice(0, 20), codeGenType: 'multi_file' })
    if (res.data.code === 0 && res.data.data) {
      router.push('/app/chat/' + res.data.data + '?initPrompt=' + encodeURIComponent(initPrompt.value.trim()))
    } else { message.error('创建失败，' + res.data.message) }
  } finally { creating.value = false }
}
const myApps = ref<API.AppVO[]>([])
//const myApps = ref([])
const myTotal = ref(0)
const myLoading = ref(false)
const mySearchParams = reactive({ pageNum: 1, pageSize: 8 })

const fetchMyApps = async () => {
  if (!loginUserStore.loginUser.id) return
  myLoading.value = true
  try {
    const res = await listMyAppByPage({ ...mySearchParams })
    if (res.data.code === 0 && res.data.data) { myApps.value = res.data.data.records || []; myTotal.value = res.data.data.totalRow || 0 }
  } finally { myLoading.value = false }
}
const onMyPageChange = (page) => { mySearchParams.pageNum = page; fetchMyApps() }
const doDeleteMyApp = (id) => {
  Modal.confirm({
    title: '确认删除该应用吗？', okText: '确认', okType: 'danger',
    onOk: async () => {
      const res = await deleteApp({ id })
      if (res.data.code === 0) { message.success('删除成功'); fetchMyApps() }
      else { message.error('删除失败，' + res.data.message) }
    },
  })
}

const featuredApps = ref<API.AppVO[]>([])
const featuredTotal = ref(0)
const featuredLoading = ref(false)
const featuredSearchParams = reactive({ pageNum: 1, pageSize: 8 })
const fetchFeaturedApps = async () => {
  featuredLoading.value = true
  try {
    const res = await listFeaturedAppByPage({ ...featuredSearchParams })
    if (res.data.code === 0 && res.data.data) { featuredApps.value = res.data.data.records || []; featuredTotal.value = res.data.data.totalRow || 0 }
  } finally { featuredLoading.value = false }
}
const onFeaturedPageChange = (page) => { featuredSearchParams.pageNum = page; fetchFeaturedApps() }
onMounted(() => { fetchMyApps(); fetchFeaturedApps() })
</script>

<template>
  <div id="homePage">
    <div class="hero">
      <h1 class="hero__title">
        一句话&nbsp;<img src="@/assets/logo.png" class="hero__logo" alt="" />&nbsp;呈所想
      </h1>
      <p class="hero__desc">与 AI 对话轻松创建应用和网站</p>
      <div class="hero__input-wrap">
        <a-textarea
          v-model:value="initPrompt"
          placeholder="使用 NoCode 创建一个高效的小工具，帮我计算......"
          :auto-size="{ minRows: 3, maxRows: 6 }"
          class="hero__textarea"
          @keydown.enter.exact.prevent="handleCreate"
        />
        <div class="hero__input-footer">
          <div class="hero__input-actions">
          </div>
          <a-button type="primary" shape="circle" size="large" :loading="creating" class="hero__send-btn" @click="handleCreate">↑</a-button>
        </div>
      </div>
      <div class="hero__quick-tags">
        <a-tag v-for="tag in quickPrompts" :key="tag" class="hero__quick-tag" @click="initPrompt = tag">{{ tag }}</a-tag>
      </div>
    </div>

    <div v-if="loginUserStore.loginUser.id" class="section">
      <div class="section__header"><span class="section__title">我的作品</span></div>
      <a-spin :spinning="myLoading">
        <a-empty v-if="!myApps.length && !myLoading" description="暂无应用，快去创建吧" />
        <div v-else class="app-grid">
          <div v-for="app in myApps" :key="app.id" class="app-card" @click="router.push('/app/chat/' + app.id)">
            <div class="app-card__cover-wrap">
              <img v-if="app.cover" :src="app.cover" class="app-card__cover" alt="封面" />
              <div v-else class="app-card__cover app-card__cover--placeholder"><span>{{ app.appName ? app.appName.slice(0, 2) : 'AI' }}</span></div>
              <div class="app-card__overlay">
                <a-button type="text" :icon="h(EditOutlined)" class="app-card__overlay-btn" @click.stop="router.push('/app/edit/' + app.id)" />
                <a-button type="text" danger :icon="h(DeleteOutlined)" class="app-card__overlay-btn" @click.stop="doDeleteMyApp(app.id)" />
              </div>
            </div>
            <div class="app-card__info">
              <div class="app-card__name">{{ app.appName || '未命名应用' }}</div>
              <div class="app-card__time">{{ fromNow(app.createTime) }}</div>
            </div>
          </div>
        </div>
        <div class="pagination">
          <a-pagination v-if="myTotal > 8" :current="mySearchParams.pageNum" :page-size="mySearchParams.pageSize" :total="myTotal" show-less-items @change="onMyPageChange" />
        </div>
      </a-spin>
    </div>

    <div class="section">
      <div class="section__header"><span class="section__title">精选案例</span></div>
      <a-spin :spinning="featuredLoading">
        <a-empty v-if="!featuredApps.length && !featuredLoading" description="暂无精选应用" />
        <div v-else class="app-grid app-grid--featured">
          <div v-for="app in featuredApps" :key="app.id" class="app-card app-card--featured" @click="router.push('/app/chat/' + app.id)">
            <div class="app-card__cover-wrap">
              <img v-if="app.cover" :src="app.cover" class="app-card__cover" alt="封面" />
              <div v-else class="app-card__cover app-card__cover--placeholder"><span>{{ app.appName ? app.appName.slice(0, 2) : 'AI' }}</span></div>
            </div>
            <div class="app-card__info app-card__info--featured">
              <a-avatar :src="app.user && app.user.userAvatar" :size="28" style="flex-shrink:0" />
              <div style="flex:1; min-width:0">
                <div class="app-card__name">{{ app.appName || '未命名应用' }}</div>
                <div class="app-card__time">{{ app.user && app.user.userName || 'NoCode 官方' }}</div>
              </div>
              <a-tag v-if="app.codeGenType" :color="app.codeGenType === 'html' ? 'green' : 'blue'" style="flex-shrink:0">{{ app.codeGenType === 'html' ? '网站' : '应用' }}</a-tag>
            </div>
          </div>
        </div>
        <div class="pagination">
          <a-pagination v-if="featuredTotal > 8" :current="featuredSearchParams.pageNum" :page-size="featuredSearchParams.pageSize" :total="featuredTotal" show-less-items @change="onFeaturedPageChange" />
        </div>
      </a-spin>
    </div>
  </div>
</template>

<style scoped>
#homePage { max-width: 1100px; margin: 0 auto; padding: 0 16px 60px; }
.hero { text-align: center; padding: 56px 0 40px; }
.hero__title { font-size: 40px; font-weight: 700; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; gap: 4px; }
.hero__logo { width: 44px; height: 44px; border-radius: 50%; background: #1a1a2e; padding: 4px; }
.hero__desc { color: #888; font-size: 16px; margin-bottom: 28px; }
.hero__input-wrap { max-width: 680px; margin: 0 auto; background: #fff; border-radius: 16px; box-shadow: 0 2px 16px rgba(0,0,0,0.08); padding: 16px 16px 12px; }
.hero__textarea { border: none !important; box-shadow: none !important; resize: none; font-size: 15px; padding: 0; }
.hero__input-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
.hero__input-actions { display: flex; gap: 4px; }
.hero__send-btn { width: 36px; height: 36px; font-size: 18px; display: flex; align-items: center; justify-content: center; }
.hero__quick-tags { margin-top: 16px; display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
.hero__quick-tag { cursor: pointer; border-radius: 20px; padding: 4px 14px; font-size: 13px; background: rgba(255,255,255,0.7); border: 1px solid #e8e8e8; transition: all 0.2s; }
.hero__quick-tag:hover { background: #fff; border-color: #1677ff; color: #1677ff; }
.section { margin-top: 48px; }
.section__header { margin-bottom: 20px; }
.section__title { font-size: 22px; font-weight: 700; }
.app-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; }
.app-grid--featured { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
.app-card { cursor: pointer; border-radius: 12px; overflow: hidden; background: #fff; box-shadow: 0 1px 6px rgba(0,0,0,0.06); transition: box-shadow 0.2s, transform 0.2s; }
.app-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.12); transform: translateY(-2px); }
.app-card__cover-wrap { position: relative; overflow: hidden; }
.app-card__cover { width: 100%; height: 160px; object-fit: cover; display: block; }
.app-card--featured .app-card__cover { height: 200px; }
.app-card__cover--placeholder { display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; font-size: 36px; font-weight: 700; }
.app-card__overlay { position: absolute; top: 8px; right: 8px; display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s; }
.app-card:hover .app-card__overlay { opacity: 1; }
.app-card__overlay-btn { background: rgba(255,255,255,0.9) !important; border-radius: 6px; width: 30px; height: 30px; padding: 0; display: flex; align-items: center; justify-content: center; }
.app-card__info { padding: 12px 14px; }
.app-card__info--featured { display: flex; align-items: center; gap: 10px; }
.app-card__name { font-size: 14px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.app-card__time { font-size: 12px; color: #999; margin-top: 2px; }
.pagination { margin-top: 24px; text-align: center; }
</style>
