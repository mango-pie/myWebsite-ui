<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { ArrowLeft, Save, Sparkles } from 'lucide-vue-next'
import { getDiaryByDate } from '@/integrations/diaryController'
import { useDiaryAutoSave } from '@/composables/useDiaryAutoSave'
import { MOOD_OPTIONS, formatDiaryDate, todayDateString } from '@/utils/diaryFormat'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const dirty = ref(false)
const ready = ref(false)

const form = reactive({
  diaryDate: todayDateString(),
  title: '',
  content: '',
  mood: undefined as string | undefined,
})

const displayDate = computed(() => formatDiaryDate(form.diaryDate))

const { saveStatus, entryId, markDirty, saveNow } = useDiaryAutoSave(
  () => ({
    diaryDate: form.diaryDate,
    title: form.title,
    content: form.content,
    mood: form.mood,
    status: 0,
  }),
  { enabled: ready },
)

const saveStatusText = computed(() => {
  switch (saveStatus.value) {
    case 'saving':
      return '保存中...'
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
        entryId.value = data.id ?? null
      } else {
        form.title = ''
        form.content = ''
        form.mood = undefined
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

function onFieldChange() {
  dirty.value = true
  markDirty()
}

async function handleSave() {
  const ok = await saveNow(0)
  if (ok) {
    dirty.value = false
    message.success('已保存')
  }
}

const moodEmojis: Record<string, string> = {
  happy: '😊',
  calm: '😌',
  tired: '😴',
  sad: '😔',
  excited: '🤩',
}

watch(
  () => route.query.date,
  (date) => {
    if (date && typeof date === 'string') {
      form.diaryDate = date
      loadByDate(date)
    }
  },
  { immediate: true },
)

onMounted(() => {
  const date = route.query.date as string
  if (date) {
    form.diaryDate = date
    loadByDate(date)
  } else {
    loadByDate(todayDateString())
  }
})
</script>

<template>
  <div class="container">
    <div v-if="loading" class="loading-state">
      <div class="sticker" style="padding: 60px; text-align: center;">
        <p>加载中...</p>
      </div>
    </div>

    <div v-else class="write-layout">
      <div class="stamp-wrap">
        <div class="stamp" style="--accent: var(--st-sakura);">
          <span class="d">{{ form.diaryDate.split('-')[2] }}</span>
          <span class="m">{{ form.diaryDate.split('-')[1] }}</span>
        </div>
        <p class="display-date">{{ displayDate }}</p>
      </div>

      <div class="sticker write-form">
        <div class="tape" style="--tc: var(--st-mint); --tilt: -4deg; --tw: 70px;" />
        
        <div class="form-header">
          <button class="btn-back" @click="router.push('/diary')">
            <ArrowLeft :size="18" />
            返回
          </button>
          <div class="save-status">
            <span class="status-dot" :class="saveStatus" />
            {{ saveStatusText }}
          </div>
        </div>

        <div class="form-field">
          <label>标题</label>
          <input
            v-model="form.title"
            type="text"
            class="form-input"
            placeholder="今天的标题..."
            @input="onFieldChange"
          />
        </div>

        <div class="form-field">
          <label>心情</label>
          <div class="mood-selector">
            <button
              v-for="mood in MOOD_OPTIONS"
              :key="mood.value"
              class="mood-pill"
              :class="{ active: form.mood === mood.value }"
              :data-tone="form.mood === mood.value ? 'sakura' : 'outline'"
              @click="form.mood = mood.value; onFieldChange()"
            >
              {{ moodEmojis[mood.value] || '' }} {{ mood.label }}
            </button>
          </div>
        </div>

        <div class="form-field">
          <label>正文</label>
          <textarea
            v-model="form.content"
            class="form-textarea"
            placeholder="写点什么..."
            rows="16"
            @input="onFieldChange"
          />
        </div>

        <div class="form-footer">
          <button class="btn ghost" @click="handleSave">
            <Save :size="16" />
            保存草稿
          </button>
          <button class="btn" @click="handleSave">
            <Sparkles :size="16" />
            完成
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.write-layout {
  max-width: 720px;
  margin: 0 auto;
}

.stamp-wrap {
  text-align: center;
  margin-bottom: 32px;
}

.display-date {
  margin: 12px 0 0;
  font: 16px var(--fd);
  color: var(--ink-soft);
}

.write-form {
  padding: 32px;
  position: relative;
}

.form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: var(--ink-soft);
  font: 14px var(--fd);
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.2s;
}

.btn-back:hover {
  background: var(--paper-surface);
  color: var(--ink);
}

.save-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font: 13px var(--fd);
  color: var(--ink-soft);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--ink-soft);
}

.status-dot.saved {
  background: var(--st-mint);
}

.status-dot.saving {
  background: var(--st-cream);
  animation: pulse 1s infinite;
}

.status-dot.error {
  background: #E88B8B;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.form-field {
  margin-bottom: 24px;
}

.form-field label {
  display: block;
  font: 14px var(--fd);
  color: var(--ink-soft);
  margin-bottom: 10px;
  letter-spacing: 0.05em;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--hairline);
  border-radius: 10px;
  background: #FFFDF8;
  font: 18px var(--fb);
  color: var(--ink);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(61, 139, 194, 0.15);
}

.mood-selector {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.mood-pill {
  padding: 8px 16px;
  border-radius: 999px;
  font: 14px var(--fd);
  background: transparent;
  border: 1.5px dashed var(--hairline);
  color: var(--ink-soft);
  cursor: pointer;
  transition: all 0.2s;
}

.mood-pill:hover {
  border-style: solid;
  border-color: var(--accent);
  color: var(--accent);
}

.mood-pill.active {
  background: var(--st-sakura);
  border-style: solid;
  border-color: var(--hairline);
  color: var(--ink);
}

.form-textarea {
  width: 100%;
  padding: 16px;
  border: 2px dashed var(--hairline);
  border-radius: 10px;
  background: #FFFDF8;
  font: 16px / 1.8 var(--fb);
  color: var(--ink);
  outline: none;
  resize: vertical;
  transition: border-color 0.2s, border-style 0.2s;
}

.form-textarea:focus {
  border-color: var(--accent);
  border-style: solid;
}

.form-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 20px;
  border-top: 1.5px dashed var(--hairline);
}

@media (max-width: 768px) {
  .write-form {
    padding: 20px;
  }
}
</style>
