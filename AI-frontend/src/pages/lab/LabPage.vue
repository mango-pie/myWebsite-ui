<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { listMyAppByPage, deleteApp } from '@/api/appController'
import { useLoginUserStore } from '@/stores/loginUser'
import { siteConfig } from '@/config/site'
import { Edit, Trash2, FlaskConical, LogIn } from 'lucide-vue-next'
import LabCreatePanel from '@/components/lab/LabCreatePanel.vue'
import IconAction from '@/components/ui/IconAction.vue'

function fromNow(str: string | undefined) {
  if (!str) return ''
  const diff = Date.now() - new Date(str).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return mins + ' 分钟前'
  const hours = Math.floor(mins / 60)
  if (hours < 24) return hours + ' 小时前'
  const days = Math.floor(hours / 24)
  if (days < 7) return days + ' 天前'
  return Math.floor(days / 30) + ' 个月前'
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
    title: '撕去这份实验稿？',
    okText: '确认',
    okType: 'danger',
    onOk: async () => {
      const res = await deleteApp({ id })
      if (res.data.code === 0) {
        message.success('已删除')
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
  <div id="labPage" class="lab-folio" data-room="lab">
    <header class="lab-folio__head">
      <p class="lab-folio__kicker">附卷 · 试作</p>
      <h1 class="lab-folio__title">{{ siteConfig.heroLabTitle }}</h1>
      <p class="lab-folio__sub">{{ siteConfig.labPage.subtitle }}</p>
    </header>

    <section class="lab-folio__create book-note-panel">
      <LabCreatePanel />
    </section>

    <section v-if="loginUserStore.loginUser.id" class="lab-folio__section">
      <div class="lab-folio__section-head">
        <h2>{{ siteConfig.sections.myExperiments }}</h2>
        <span>{{ myTotal }} 则</span>
      </div>

      <a-spin :spinning="myLoading">
        <p v-if="!myApps.length && !myLoading" class="lab-folio__empty">
          {{ siteConfig.sections.emptyMyApps }}
        </p>
        <nav v-else class="folio-toc" aria-label="实验目录">
          <button
            v-for="(app, index) in myApps"
            :key="app.id"
            type="button"
            class="folio-toc__row"
            :style="{ '--i': index }"
            @click="router.push('/app/chat/' + app.id)"
          >
            <span class="folio-toc__num">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="folio-toc__body">
              <span class="folio-toc__name">{{ app.appName || '未命名实验' }}</span>
              <span class="folio-toc__desc">{{ fromNow(app.createTime) }}</span>
            </span>
            <span class="folio-toc__leaders" aria-hidden="true" />
            <span class="folio-toc__actions" @click.stop>
              <IconAction
                :icon="Edit"
                variant="ghost"
                size="sm"
                aria-label="编辑"
                @click="router.push('/app/edit/' + app.id)"
              />
              <IconAction
                :icon="Trash2"
                variant="danger"
                size="sm"
                motion="shake"
                aria-label="删除"
                @click="doDeleteMyApp(app.id)"
              />
            </span>
          </button>
        </nav>
        <div class="lab-folio__pager">
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

    <section v-else class="lab-folio__login book-note-panel">
      <FlaskConical :size="22" :stroke-width="1.5" />
      <p>登录后可在此查阅你的实验稿</p>
      <IconAction :icon="LogIn" label="去登录" variant="primary" @click="router.push('/user/login')" />
    </section>
  </div>
</template>

<style scoped>
.lab-folio {
  max-width: 44em;
  margin: 0 auto;
  padding: 0.5em 0.75em 3.5em;
}

.lab-folio__head {
  text-align: center;
  margin-bottom: 1.75em;
  padding-bottom: 1.25em;
  border-bottom: 1px solid var(--color-border);
}

.lab-folio__kicker {
  margin: 0 0 0.45em;
  font-family: var(--font-sans);
  font-size: 0.72em;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.lab-folio__title {
  margin: 0 0 0.4em;
  font-family: var(--font-serif);
  font-size: clamp(2rem, 5vw, 2.6rem);
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--color-text-primary);
}

.lab-folio__sub {
  margin: 0;
  font-size: 0.95em;
  color: var(--color-text-secondary);
}

.lab-folio__create {
  margin-bottom: 2em;
  transform: none;
}

.lab-folio__section-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.75em;
  font-family: var(--font-sans);
}

.lab-folio__section-head h2 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 1.2em;
  letter-spacing: 0.12em;
  color: var(--color-text-primary);
}

.lab-folio__section-head span {
  font-size: 0.8em;
  color: var(--color-text-muted);
}

.lab-folio__empty {
  padding: 1.5em 0.25em;
  border-top: 1px dashed var(--color-border);
  font-family: var(--font-serif);
  color: var(--color-text-muted);
}

.folio-toc {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--color-border);
}

.folio-toc__row {
  display: grid;
  grid-template-columns: 2.4em minmax(0, auto) minmax(1em, 1fr) auto;
  gap: 0.45em 0.55em;
  align-items: center;
  width: 100%;
  padding: 0.95em 0.25em;
  border: none;
  border-bottom: 1px dashed rgba(169, 144, 112, 0.5);
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.28s ease, padding-left 0.28s ease;
}

.folio-toc__row:hover {
  background: rgba(160, 120, 70, 0.1);
  padding-left: 0.5em;
}

.folio-toc__num {
  font-family: var(--font-sans);
  font-size: 0.75em;
  color: var(--color-text-muted);
}

.folio-toc__body {
  display: flex;
  flex-direction: column;
  gap: 0.15em;
  min-width: 0;
}

.folio-toc__name {
  font-family: var(--font-serif);
  font-size: 1.15em;
  font-weight: 600;
  color: var(--color-text-primary);
}

.folio-toc__row:hover .folio-toc__name {
  color: var(--color-primary);
}

.folio-toc__desc {
  font-family: var(--font-sans);
  font-size: 0.78em;
  color: var(--color-text-muted);
}

.folio-toc__leaders {
  height: 0;
  border-bottom: 1px dotted rgba(138, 115, 85, 0.55);
  align-self: center;
}

.folio-toc__actions {
  display: inline-flex;
  gap: 0.25em;
}

.lab-folio__pager {
  margin-top: 1.25em;
  text-align: center;
}

.lab-folio__login {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.85em;
  text-align: center;
  color: var(--color-text-secondary);
  transform: none;
}

@media (max-width: 640px) {
  .folio-toc__row {
    grid-template-columns: 2em minmax(0, 1fr) auto;
  }

  .folio-toc__leaders {
    display: none;
  }
}
</style>
