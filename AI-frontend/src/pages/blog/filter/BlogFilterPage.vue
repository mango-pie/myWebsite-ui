<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { queryBlogPostPage, incrementLikeCount } from '@/api/blogPostController'
import { getAllCategories } from '@/api/blogCategoryController'
import { getTagCloud } from '@/api/blogTagController'
import {
  loadBlogSettings,
  markBlogLikeDisabled,
  type BlogUxSettings,
} from '@/utils/blogSettings'
import {
  parseIdList,
  buildFilterQuery,
  matchPostFilters,
  resolveServerFilter,
} from '@/utils/blogFilterQuery'
import BlogRoomShell from '@/components/blog/BlogRoomShell.vue'
import BlogPostCard from '@/components/blog/BlogPostCard.vue'
import BlogFilterChips from '@/components/blog/BlogFilterChips.vue'

type FilterChip = {
  key: string
  label: string
  kind: 'cat' | 'tag'
  id: number
}

const route = useRoute()
const router = useRouter()

const blogUx = ref<BlogUxSettings>({
  pageSizeDefault: 10,
  summaryMaxLength: 200,
  allowLike: true,
  viewCountEnabled: true,
  defaultStatus: 0,
  defaultStatusKey: 'DRAFT',
})

const loading = ref(false)
const categories = ref<API.BlogCategoryVO[]>([])
const tags = ref<API.BlogTagVO[]>([])
const rawPosts = ref<API.BlogPostVO[]>([])
const selectedCats = ref<number[]>([])
const selectedTags = ref<number[]>([])

const syncFromRoute = () => {
  selectedCats.value = parseIdList(route.query.cats)
  selectedTags.value = parseIdList(route.query.tags)
}

const pushQuery = (cats: number[], tagsIds: number[]) => {
  if (cats.length === 0 && tagsIds.length === 0) {
    router.replace('/blog')
    return
  }
  router.replace({ path: '/blog/filter', query: buildFilterQuery(cats, tagsIds) })
}

const chips = computed<FilterChip[]>(() => {
  const list: FilterChip[] = []
  for (const id of selectedCats.value) {
    const cat = categories.value.find((c) => c.id === id)
    list.push({
      key: `c-${id}`,
      id,
      kind: 'cat',
      label: cat?.name || `分类#${id}`,
    })
  }
  for (const id of selectedTags.value) {
    const tag = tags.value.find((t) => t.id === id)
    list.push({
      key: `t-${id}`,
      id,
      kind: 'tag',
      label: `#${tag?.name || id}`,
    })
  }
  return list
})

const displayPosts = computed(() => {
  const srv = resolveServerFilter(selectedCats.value, selectedTags.value)
  if (srv.mode === 'client') {
    return rawPosts.value.filter((p) =>
      matchPostFilters(p, selectedCats.value, selectedTags.value),
    )
  }
  return rawPosts.value
})

const selectedCount = computed(() => selectedCats.value.length + selectedTags.value.length)

const filterBadge = computed(() => {
  if (!chips.value.length) return '—'
  return chips.value.map((c) => c.label).join(' · ').slice(0, 18)
})

const isCatOn = (id?: number) => id != null && selectedCats.value.includes(Number(id))
const isTagOn = (id?: number) => id != null && selectedTags.value.includes(Number(id))

const toggleCat = (id?: number) => {
  if (id == null) return
  const nid = Number(id)
  const next = selectedCats.value.includes(nid)
    ? selectedCats.value.filter((x) => x !== nid)
    : [...selectedCats.value, nid]
  pushQuery(next, selectedTags.value)
}

const toggleTag = (id?: number) => {
  if (id == null) return
  const nid = Number(id)
  const next = selectedTags.value.includes(nid)
    ? selectedTags.value.filter((x) => x !== nid)
    : [...selectedTags.value, nid]
  pushQuery(selectedCats.value, next)
}

const removeChip = (chip: FilterChip) => {
  if (chip.kind === 'cat') {
    pushQuery(
      selectedCats.value.filter((x) => x !== chip.id),
      selectedTags.value,
    )
  } else {
    pushQuery(
      selectedCats.value,
      selectedTags.value.filter((x) => x !== chip.id),
    )
  }
}

const clearAll = () => router.push('/blog')

const goPost = (id: number) => router.push(`/blog/${id}`)

const goCardTag = (id: number) => pushQuery(selectedCats.value, [id])
const goCardCat = (id: number) => pushQuery([id], selectedTags.value)

const fetchMeta = async () => {
  const [cRes, tRes] = await Promise.all([getAllCategories(), getTagCloud()])
  if (cRes.data.code === 0 && cRes.data.data) {
    categories.value = cRes.data.data as API.BlogCategoryVO[]
  }
  if (tRes.data.code === 0 && tRes.data.data) {
    tags.value = tRes.data.data
  }
}

const fetchPosts = async () => {
  loading.value = true
  try {
    const srv = resolveServerFilter(selectedCats.value, selectedTags.value)
    const pageSize = srv.mode === 'client' ? 100 : 0
    const res = await queryBlogPostPage({
      pageNum: 1,
      pageSize,
      status: 1,
      categoryId: srv.categoryId,
      tagId: srv.tagId,
      sortOrder: 'descend',
    })
    if (res.data.code === 0 && res.data.data) {
      rawPosts.value = res.data.data.records || []
    } else {
      message.error('获取筛选结果失败：' + (res.data.message || '未知错误'))
    }
  } catch (e) {
    console.error(e)
    message.error('获取筛选结果失败')
  } finally {
    loading.value = false
  }
}

const handleLike = async (post: API.BlogPostVO) => {
  if (!post.id || !blogUx.value.allowLike) return
  try {
    const res = await incrementLikeCount({ id: post.id })
    if (res.data.code === 0) {
      post.likeCount = (post.likeCount || 0) + 1
      message.success('点赞成功')
    } else {
      const msg = res.data.message || '点赞失败'
      if (String(msg).includes('已关闭')) {
        markBlogLikeDisabled()
        blogUx.value = { ...blogUx.value, allowLike: false }
        message.warning(msg)
      } else {
        message.error(msg)
      }
    }
  } catch {
    message.error('点赞失败')
  }
}

onMounted(async () => {
  blogUx.value = await loadBlogSettings()
  syncFromRoute()
  if (selectedCats.value.length === 0 && selectedTags.value.length === 0) {
    await router.replace('/blog')
    return
  }
  await fetchMeta()
  await fetchPosts()
})

watch(
  () => [route.query.cats, route.query.tags] as const,
  async () => {
    syncFromRoute()
    if (selectedCats.value.length === 0 && selectedTags.value.length === 0) {
      await router.replace('/blog')
      return
    }
    await fetchPosts()
  },
)
</script>

<template>
  <BlogRoomShell>
    <div class="sub-shell">
      <aside class="detail-rail">
        <button type="button" class="back-chip" @click="clearAll">← 全部随笔</button>
        <div class="side-card glass">
          <span class="tape" />
          <h3 class="font-display">筛选说明</h3>
          <p class="about-text text-pretty">
            分类与标签在同一页勾选。类内匹配任一，类与签之间取交集；全部取消后回到列表首页。
          </p>
        </div>
        <div class="side-card glass">
          <h3 class="font-display">分类</h3>
          <p class="filter-hint">可多选 · 匹配任一</p>
          <div class="cat-list">
            <label
              v-for="cat in categories"
              :key="cat.id"
              class="cat-item"
              :class="{ on: isCatOn(cat.id) }"
              @click.prevent="toggleCat(cat.id)"
            >
              <input type="checkbox" :checked="isCatOn(cat.id)" tabindex="-1" />
              <span class="chk" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <path d="M5 12l5 5L20 7" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
              <span class="lab">{{ cat.name }}</span>
              <span v-if="cat.postCount != null" class="n">{{ cat.postCount }}</span>
            </label>
          </div>
        </div>
        <div class="side-card glass" style="flex: 1; min-height: 0; overflow: auto">
          <h3 class="font-display">标签</h3>
          <p class="filter-hint">可多选 · 与分类同时生效</p>
          <div class="tag-cloud">
            <label
              v-for="tag in tags"
              :key="tag.id"
              class="tag-pill check"
              :class="{ on: isTagOn(tag.id) }"
              @click.prevent="toggleTag(tag.id)"
            >
              <input type="checkbox" :checked="isTagOn(tag.id)" tabindex="-1" />
              <span class="chk" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <path d="M5 12l5 5L20 7" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
              <span>#{{ tag.name }}</span>
            </label>
          </div>
        </div>
      </aside>

      <div class="sub-main">
        <div class="sub-hero glass">
          <div style="min-width: 0; flex: 1">
            <div class="eyebrow">FILTER</div>
            <h1 class="font-display">筛选结果</h1>
            <div class="count">共 {{ displayPosts.length }} 篇</div>
            <BlogFilterChips :chips="chips" @remove="removeChip" />
          </div>
          <button type="button" class="chip-btn" style="flex: none; margin-top: 4px" @click="clearAll">
            清空回列表
          </button>
        </div>
        <div class="sub-grid">
          <BlogPostCard
            v-for="post in displayPosts"
            :key="post.id"
            :post="post"
            :featured="false"
            :allow-like="blogUx.allowLike"
            :show-view-count="blogUx.viewCountEnabled"
            @open="goPost"
            @like="handleLike"
            @tag="goCardTag"
            @category="goCardCat"
          />
          <div v-if="!loading && displayPosts.length === 0" class="empty-state show">
            <div class="t font-display">没有匹配的随笔</div>
            <button type="button" class="chip-btn" style="margin-top: 10px" @click="clearAll">
              清空回列表
            </button>
          </div>
        </div>
      </div>

      <aside class="sub-deck-stack">
        <div class="side-card glass">
          <h3 class="font-display">当前</h3>
          <div class="stat-grid">
            <div class="stat-cell">
              <div class="n font-display">{{ displayPosts.length }}</div>
              <div class="l">篇数</div>
            </div>
            <div class="stat-cell">
              <div class="n font-display">{{ selectedCount }}</div>
              <div class="l">已选</div>
            </div>
          </div>
        </div>
        <div class="deck">
          <div class="mag-stack" style="min-height: 0; flex: 1">
            <div class="mag-stage" style="left: 12px; right: 12px; top: 8px; bottom: 8px">
              <div class="mag-book t-violet is-front" style="cursor: default">
                <span class="mast">MIX</span>
                <span class="vol font-display" style="font-size: 36px">筛</span>
                <span class="latest"><b>当前条件</b><span>{{ filterBadge }}</span></span>
              </div>
            </div>
          </div>
          <div class="deck-foot" style="margin-top: auto" role="button" tabindex="0" @click="clearAll">
            <div>
              <div class="k">清空条件</div>
              <div class="v font-display" style="font-size: 16px">回列表首页</div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </BlogRoomShell>
</template>
