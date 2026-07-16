<script setup lang="ts">
import { computed } from 'vue'
import {
  CalendarOutlined,
  TagOutlined,
  EyeOutlined,
  HeartOutlined,
} from '@ant-design/icons-vue'

const props = withDefaults(
  defineProps<{
    posts: API.BlogPostVO[]
    loading?: boolean
    selectedTagId?: number | null
    allowLike?: boolean
    showViewCount?: boolean
  }>(),
  {
    allowLike: true,
    showViewCount: true,
  },
)

const emit = defineEmits<{
  postClick: [id: number | undefined]
  categoryClick: [id: number | undefined]
  tagClick: [id: number | undefined]
  like: [post: API.BlogPostVO]
}>()

type TimelineSide = 'left' | 'right'

interface TimelineMonthEntry {
  kind: 'month'
  key: string
  label: string
}

interface TimelinePostEntry {
  kind: 'post'
  key: string
  post: API.BlogPostVO
  side: TimelineSide
}

type TimelineEntry = TimelineMonthEntry | TimelinePostEntry

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

function monthLabel(dateStr: string | undefined) {
  if (!dateStr) return '未分类'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
}

const timelineEntries = computed<TimelineEntry[]>(() => {
  const entries: TimelineEntry[] = []
  let lastMonth = ''
  let index = 0

  for (const post of props.posts) {
    const label = monthLabel(post.createdTime)
    if (label !== lastMonth) {
      entries.push({
        kind: 'month',
        key: `month-${label}`,
        label,
      })
      lastMonth = label
    }

    entries.push({
      kind: 'post',
      key: `post-${post.id ?? index}`,
      post,
      side: index % 2 === 0 ? 'left' : 'right',
    })
    index += 1
  }

  return entries
})
</script>

<template>
  <div v-if="loading" class="post-timeline post-timeline--loading">加载中...</div>
  <div v-else-if="posts.length === 0" class="post-list--empty">暂无文章，换个关键词或筛选条件试试</div>
  <div v-else class="post-timeline">
    <div class="post-timeline__track" />

    <template v-for="entry in timelineEntries" :key="entry.key">
      <h3 v-if="entry.kind === 'month'" class="post-timeline__month">
        <span class="post-timeline__month-badge">{{ entry.label }}</span>
      </h3>

      <article
        v-else
        class="post-timeline__item"
        :class="`post-timeline__item--${entry.side}`"
        @click="emit('postClick', entry.post.id)"
      >
        <span class="post-timeline__dot" />
        <div class="post-timeline__body">
          <div
            class="post-timeline__cover"
            :class="{ 'post-timeline__cover--empty': !entry.post.coverUrl }"
          >
            <img
              v-if="entry.post.coverUrl"
              :src="entry.post.coverUrl"
              :alt="entry.post.title"
            />
          </div>
          <div class="post-timeline__content">
            <div class="post-timeline__meta">
              <span
                v-if="entry.post.categoryName"
                class="post-card__category"
                @click.stop="emit('categoryClick', entry.post.categoryId)"
              >
                {{ entry.post.categoryName }}
              </span>
              <span class="post-card__date">
                <CalendarOutlined /> {{ formatDate(entry.post.createdTime) }}
              </span>
            </div>
            <h2 class="post-timeline__title">{{ entry.post.title }}</h2>
            <p v-if="entry.post.summary" class="post-timeline__summary">{{ entry.post.summary }}</p>
            <div class="post-timeline__footer">
              <div class="post-card__tags">
                <span
                  v-for="tag in entry.post.tags"
                  :key="tag.id"
                  class="post-card__tag"
                  :class="{ 'post-card__tag--active': tag.id === selectedTagId }"
                  @click.stop="emit('tagClick', tag.id)"
                >
                  <TagOutlined /> {{ tag.name }}
                </span>
              </div>
              <div class="post-card__stats">
                <span v-if="showViewCount" class="post-card__stat">
                  <EyeOutlined /> {{ entry.post.viewCount ?? 0 }}
                </span>
                <span
                  v-if="allowLike"
                  class="post-card__stat"
                  @click.stop="emit('like', entry.post)"
                >
                  <HeartOutlined /> {{ entry.post.likeCount ?? 0 }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </article>
    </template>
  </div>
</template>
