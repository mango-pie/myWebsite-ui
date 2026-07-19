<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { ArrowLeft, Save, Check, Sparkles } from 'lucide-vue-next'
import IconAction from '@/components/ui/IconAction.vue'
import { getDiaryByDate } from '@/integrations/diaryController'
import { useDiaryAutoSave } from '@/composables/useDiaryAutoSave'
import { isDiaryAiEnabled, openDiaryAiPanel } from '@/composables/useDiaryAi'
import { MOOD_OPTIONS, formatDiaryDate, todayDateString } from '@/utils/diaryFormat'
import { diaryDefaultStatus, loadDiarySettings } from '@/utils/diarySettings'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const dirty = ref(false)
const ready = ref(false)
let defaultNewStatus = 0

const form = reactive({
  diaryDate: todayDateString(),
  title: '',
  content: '',
  mood: undefined as string | undefined,
  status: 0,
})

const dateValue = computed({
  get: () => dayjs(form.diaryDate),
  set: (val: Dayjs | null) => {
    if (val) {
      form.diaryDate = val.format('YYYY-MM-DD')
    }
  },
})

const displayDate = computed(() => formatDiaryDate(form.diaryDate))

const { saveStatus, entryId, markDirty, saveNow } = useDiaryAutoSave(
  () => ({
    diaryDate: form.diaryDate,
    title: form.title,
    content: form.content,
    mood: form.mood,
    status: form.status,
  }),
  { enabled: ready },
)

const saveStatusText = computed(() => {
  switch (saveStatus.value) {
    case 'saving':
      return '保存中…'
    case 'saved':
      return '已保存'
    case 'error':
      return '保存失败'
    default:
      return dirty.value ? '未保存' : ''
  }
})

async function loadByDate(date: string) {
  loading.value = true
  ready.value = false
  try {
    const res = await getDiaryByDate({ date })
    if (res.data.code === 0) {
      const data = res.data.data
      if (data) {
        form.title = data.title ?? ''
        form.content = data.content ?? ''
        form.mood = data.mood
        form.status = data.status ?? 0
        entryId.value = data.id ?? null
      } else {
        form.title = ''
        form.content = ''
        form.mood = undefined
        form.status = defaultNewStatus
        entryId.value = null
      }
      dirty.value = false
    }
  } catch {
    message.error('加载日记失败')
  } finally {
    loading.value = false
    ready.value = true
  }
}

// React to Agent tool results that affect the current diary day
if (typeof window !== 'undefined') {
  window.addEventListener('agent-ui-action', (e: Event) => {
    const detail = (e as CustomEvent).detail
    if (detail?.type === 'refresh' && detail.module === 'diary_day') {
      loadByDate(form.diaryDate)
    }
    if (detail?.type === 'navigate' && detail.path) {
      // optional: let chat handle navigation; no-op here
    }
  })
}

function onFieldChange() {
  dirty.value = true
  markDirty()
}

async function handleComplete() {
  const ok = await saveNow(1)
  if (ok) {
    form.status = 1
    dirty.value = false
    message.success('日记已标记为完成')
    if (entryId.value) {
      router.push(`/diary/${entryId.value}`)
    } else {
      router.push('/diary')
    }
  } else {
    message.error('保存失败')
  }
}

function handleBack() {
  router.push('/diary')
}

function handleAiClick() {
  openDiaryAiPanel({ entryId: entryId.value ?? undefined, date: form.diaryDate })
}

watch(
  () => form.diaryDate,
  (newDate, oldDate) => {
    if (oldDate && newDate !== oldDate) {
      loadByDate(newDate)
    }
  },
)

onBeforeRouteLeave((_to, _from, next) => {
  if (dirty.value && saveStatus.value !== 'saved') {
    const leave = window.confirm('有未保存的内容，确定离开吗？')
    next(leave)
    return
  }
  next()
})

onMounted(async () => {
  const diaryUx = await loadDiarySettings()
  defaultNewStatus = diaryDefaultStatus(diaryUx)
  form.status = defaultNewStatus
  const queryDate = route.query.date
  if (typeof queryDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(queryDate)) {
    form.diaryDate = queryDate
  }
  loadByDate(form.diaryDate)
})
</script>

<template>
  <div class="diary-write-page">
    <div class="diary-write-container">
      <div class="diary-write-header">
        <IconAction :icon="ArrowLeft" label="返回" variant="ghost" motion="slide" @click="handleBack" />
        <div class="diary-write-header__meta">
          <span class="diary-write-header__status">{{ saveStatusText }}</span>
          <IconAction :icon="Save" label="保存" variant="soft" motion="pop" @click="() => saveNow()" />
          <IconAction :icon="Check" label="完成" variant="primary" motion="pop" @click="handleComplete" />
        </div>
      </div>

      <a-spin :spinning="loading">
        <div class="diary-write-form">
          <div class="diary-write-form__row">
            <a-date-picker
              v-model:value="dateValue"
              format="YYYY-MM-DD"
              :allow-clear="false"
            />
            <span class="diary-write-form__date-label">{{ displayDate }}</span>
          </div>

          <a-input
            v-model:value="form.title"
            placeholder="标题（可选）"
            size="large"
            class="diary-write-form__title"
            @input="onFieldChange"
          />

          <div class="diary-write-form__moods">
            <span class="diary-write-form__moods-label">心情</span>
            <a-radio-group v-model:value="form.mood" button-style="solid" @change="onFieldChange">
              <a-radio-button v-for="m in MOOD_OPTIONS" :key="m.value" :value="m.value">
                {{ m.emoji }} {{ m.label }}
              </a-radio-button>
            </a-radio-group>
          </div>

          <a-textarea
            v-model:value="form.content"
            placeholder="今天发生了什么…（支持 Markdown）"
            :rows="18"
            class="diary-write-form__content"
            @input="onFieldChange"
          />

          <IconAction
            class="diary-write-form__ai"
            :icon="Sparkles"
            label="AI 助手（即将上线）"
            variant="soft"
            motion="pop"
            :disabled="!isDiaryAiEnabled"
            @click="handleAiClick"
          />
        </div>
      </a-spin>
    </div>
  </div>
</template>

<style scoped>
.diary-write-page {
  min-height: calc(100vh - 160px);
}

.diary-write-container {
  max-width: 900px;
  margin: 0 auto;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
}

.diary-write-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.diary-write-header__meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.diary-write-header__status {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.diary-write-form__row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.diary-write-form__date-label {
  color: var(--color-text-secondary);
}

.diary-write-form__title {
  margin-bottom: 16px;
}

.diary-write-form__moods {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.diary-write-form__moods-label {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.diary-write-form__content {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  margin-bottom: 16px;
}

.diary-write-form__ai {
  opacity: 0.7;
}
</style>
