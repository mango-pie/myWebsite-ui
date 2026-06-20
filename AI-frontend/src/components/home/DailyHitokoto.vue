<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ReloadOutlined } from '@ant-design/icons-vue'
import {
  fetchHitokoto,
  getHitokotoDetailUrl,
  hitokotoTypeLabels,
  type HitokotoItem,
} from '@/integrations/hitokoto'

withDefaults(
  defineProps<{
    variant?: 'default' | 'plain'
  }>(),
  {
    variant: 'default',
  },
)

const loading = ref(true)
const refreshing = ref(false)
const error = ref('')
const item = ref<HitokotoItem | null>(null)

const typeLabel = computed(() => {
  if (!item.value) return ''
  return hitokotoTypeLabels[item.value.type] || '一言'
})

const attribution = computed(() => {
  if (!item.value) return ''
  const { from, from_who: fromWho } = item.value
  if (fromWho && from) return `${fromWho} · ${from}`
  return from || fromWho || ''
})

const detailUrl = computed(() =>
  item.value ? getHitokotoDetailUrl(item.value.uuid) : 'https://hitokoto.cn',
)

async function loadHitokoto(force = false) {
  error.value = ''
  if (force) refreshing.value = true
  else loading.value = true

  try {
    item.value = await fetchHitokoto(force)
  } catch {
    error.value = '今日一言加载失败，请稍后再试'
    item.value = null
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

onMounted(() => {
  loadHitokoto(true)
})
</script>

<template>
  <section class="daily-hitokoto" :class="{ 'daily-hitokoto--plain': variant === 'plain' }">
    <div class="daily-hitokoto__header">
      <span class="daily-hitokoto__label">今日一言</span>
      <a-tag v-if="item" class="daily-hitokoto__type">{{ typeLabel }}</a-tag>
      <button
        type="button"
        class="daily-hitokoto__refresh"
        :disabled="loading || refreshing"
        aria-label="换一句"
        @click="loadHitokoto(true)"
      >
        <ReloadOutlined :spin="refreshing" />
      </button>
    </div>

    <a-skeleton v-if="loading" active :paragraph="{ rows: 2 }" />

    <template v-else-if="item">
      <blockquote class="daily-hitokoto__quote">
        <a :href="detailUrl" target="_blank" rel="noopener noreferrer" class="daily-hitokoto__link">
          {{ item.hitokoto }}
        </a>
      </blockquote>
      <p v-if="attribution" class="daily-hitokoto__from">—— {{ attribution }}</p>
    </template>

    <p v-else class="daily-hitokoto__error">
      {{ error }}
      <a-button type="link" size="small" @click="loadHitokoto(true)">重试</a-button>
    </p>
  </section>
</template>

<style scoped>
.daily-hitokoto {
  margin-top: 20px;
  padding: 16px 18px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.03);
}

.daily-hitokoto--plain {
  margin-top: 0;
  padding: 0;
  border: none;
  background: transparent;
}

.daily-hitokoto__header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.daily-hitokoto__label {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--color-primary-light);
}

.daily-hitokoto__type {
  margin: 0;
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-text-muted);
  border-radius: 999px;
}

.daily-hitokoto__refresh {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.daily-hitokoto__refresh:hover:not(:disabled) {
  color: var(--color-text-primary);
  border-color: var(--color-border-hover);
  background: var(--color-primary-08);
}

.daily-hitokoto__refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.daily-hitokoto__quote {
  margin: 0;
  font-size: 15px;
  line-height: 1.8;
  color: var(--color-text-primary);
}

.daily-hitokoto__link {
  color: inherit;
  text-decoration: none;
  transition: color var(--transition-fast);
}

.daily-hitokoto__link:hover {
  color: var(--color-primary-light);
}

.daily-hitokoto__from {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--color-text-muted);
  text-align: right;
}

.daily-hitokoto__error {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-secondary);
}
</style>
