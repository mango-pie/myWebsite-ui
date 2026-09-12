<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import {
  deleteKnowledgeBase,
  listKnowledgeBases,
  updateKnowledgeBase,
} from '@/api/knowledge'
import { listKnowledgeDocuments } from '@/api/knowledge/knowledgeDocument'
import { isAdminRole } from '@/config/permission'
import { useLoginUserStore } from '@/stores/loginUser'
import { themeByHour, type HomeTheme } from '@/composables/useHomeTheme'
import KnowledgeRoomShell from '@/components/knowledge/KnowledgeRoomShell.vue'

const LIB_TABS = ['册', '检', '成', '问'] as const

type CabFile = { id: string; k: string; v: string }
type CabToy = { key: string; label: string; dot: string; num: string; files: CabFile[] }

const cabToys = ref<CabToy[]>([
  {
    key: 'clip',
    label: '回形针',
    dot: 'a',
    num: 'Ⅰ',
    files: [
      { id: 'clip-a', k: 'CLIP', v: '旧标签 · A' },
      { id: 'clip-b', k: 'CLIP', v: '弯曲的银丝' },
    ],
  },
  {
    key: 'stamp',
    label: '印章',
    dot: 'b',
    num: 'Ⅱ',
    files: [
      { id: 'stamp-a', k: 'SEAL', v: '「藏」印' },
      { id: 'stamp-b', k: 'SEAL', v: '「阅」印' },
    ],
  },
  {
    key: 'slip',
    label: '索书条',
    dot: 'c',
    num: 'Ⅲ',
    files: [
      { id: 'slip-a', k: 'CALL', v: '空白索书条' },
      { id: 'slip-b', k: 'CALL', v: 'TP · 草稿' },
    ],
  },
  {
    key: 'dust',
    label: '灰尘',
    dot: 'd',
    num: 'Ⅳ',
    files: [{ id: 'dust-a', k: 'DUST', v: '书架掉落的屑' }],
  },
  {
    key: 'spare',
    label: '空屉',
    dot: 'e',
    num: 'Ⅴ',
    files: [{ id: 'spare-a', k: 'EMPTY', v: '留给以后' }],
  },
])

const SPINE = ['s1', 's2', 's3', 's4', 's5'] as const
const PERIOD: Record<HomeTheme, { name: string; hint: string }> = {
  morning: { name: '晨光', hint: '薄雾与书脊蓝' },
  noon: { name: '午间', hint: '阳光与薄荷点缀' },
  dusk: { name: '暮色', hint: '橘霞里的书架蓝' },
  night: { name: '星夜', hint: '夜灯下的馆藏' },
}

const router = useRouter()
const loginUserStore = useLoginUserStore()
const canManageSettings = computed(() => isAdminRole(loginUserStore.loginUser?.userRole))

const loading = ref(false)
const dataSource = ref<API.KnowledgeBaseVO[]>([])
const total = ref(0)
const selectedId = ref<string | number | null>(null)
const catFlip = ref(false)
const sealPop = ref(false)
const openDrawers = ref<Set<string>>(new Set(['clip']))
const dropTarget = ref<string | null>(null)
const libTab = ref<string>('册')
const heldFileId = ref<string | null>(null)
const returningIds = ref<Set<string>>(new Set())
const draggingId = ref<string | null>(null)
const statusFilter = ref<string | null>('SUCCESS')
const intakeRows = ref<Array<{ t: string; n: string; s: string }>>([])

let cabDragFileId: string | null = null
let cabDidDrag = false
const returnTimers = new Map<string, ReturnType<typeof setTimeout>>()

const findCabFile = (fileId: string) => {
  for (const toy of cabToys.value) {
    const file = toy.files.find((f) => f.id === fileId)
    if (file) return { file, toy }
  }
  return null
}

const heldFile = computed(() => {
  if (!heldFileId.value) return null
  const found = findCabFile(heldFileId.value)
  if (!found) return null
  return { ...found.file, toyKey: found.toy.key }
})

const cabDeskEmpty = computed(() => heldFileId.value == null)
const cabOpenCount = computed(() => openDrawers.value.size)
const cabOpenLabel = computed(() => {
  if (heldFileId.value) return `手持 1 · 开着 ${cabOpenCount.value} 屉`
  if (cabOpenCount.value) return `开着 ${cabOpenCount.value} 屉`
  return '全关紧了'
})

const isDrawerOpen = (key: string) => openDrawers.value.has(key)

const openDrawerSlot = (key: string) => {
  const next = new Set(openDrawers.value)
  next.add(key)
  openDrawers.value = next
}

const toggleDrawerSlot = (key: string) => {
  const next = new Set(openDrawers.value)
  if (next.has(key)) {
    // 关上时：若该屉有手持档案，先放回
    if (heldFileId.value) {
      const found = findCabFile(heldFileId.value)
      if (found?.toy.key === key) putCabFile({ silent: true })
    }
    next.delete(key)
  } else {
    next.add(key)
  }
  openDrawers.value = next
}

const flashReturn = (fileId: string) => {
  const next = new Set(returningIds.value)
  next.add(fileId)
  returningIds.value = next
  const prev = returnTimers.get(fileId)
  if (prev) clearTimeout(prev)
  returnTimers.set(
    fileId,
    setTimeout(() => {
      const cur = new Set(returningIds.value)
      cur.delete(fileId)
      returningIds.value = cur
      returnTimers.delete(fileId)
    }, 480),
  )
}

const takeCabFile = (fileId: string, { silent = false } = {}) => {
  const found = findCabFile(fileId)
  if (!found) return
  if (heldFileId.value === fileId) return
  if (heldFileId.value && heldFileId.value !== fileId) putCabFile({ silent: true })
  heldFileId.value = fileId
  openDrawerSlot(found.toy.key)
  if (!silent) message.success(`抽出 · ${found.file.v}`)
}

const putCabFile = ({ silent = false } = {}) => {
  const id = heldFileId.value
  if (!id) return
  const found = findCabFile(id)
  heldFileId.value = null
  flashReturn(id)
  if (!silent) message.success(`放回 · ${found?.file.v || '档案'}`)
}

const moveCabFile = (fileId: string, targetKey: string, { silent = false } = {}) => {
  const found = findCabFile(fileId)
  const target = cabToys.value.find((t) => t.key === targetKey)
  if (!found || !target) return false
  if (found.toy.key === targetKey && heldFileId.value !== fileId) return false

  // 从原屉移除
  found.toy.files = found.toy.files.filter((f) => f.id !== fileId)
  // 若是手持，清桌面
  if (heldFileId.value === fileId) heldFileId.value = null
  // 放进目标屉
  target.files.push(found.file)
  openDrawerSlot(targetKey)
  flashReturn(fileId)
  if (!silent) message.success(`挪到「${target.label}」· ${found.file.v}`)
  return true
}

const clearCabDrop = () => {
  dropTarget.value = null
}

const onCabRailClick = (e: MouseEvent) => {
  if (cabDidDrag) {
    cabDidDrag = false
    return
  }
  const target = e.target as HTMLElement
  const fileBtn = target.closest('.cab-file') as HTMLElement | null
  if (fileBtn && !fileBtn.classList.contains('is-held')) {
    e.stopPropagation()
    const id = fileBtn.dataset.file
    if (id) takeCabFile(id)
    return
  }
  const drawer = target.closest('.cab-drawer')
  if (!drawer) return
  const slot = drawer.closest('.cab-slot') as HTMLElement | null
  const toyKey = slot?.dataset.toy
  if (!toyKey) return
  const opening = !isDrawerOpen(toyKey)
  toggleDrawerSlot(toyKey)
  const name = cabToys.value.find((t) => t.key === toyKey)?.label || '抽屉'
  message.success(opening ? `沙沙 · 打开「${name}」` : `咔 · 关上「${name}」`)
}

const onCabDragStart = (e: DragEvent) => {
  const target = e.target as HTMLElement
  // 桌面手持卡
  if (target.closest('.cab-held')) {
    if (!heldFileId.value) {
      e.preventDefault()
      return
    }
    cabDragFileId = heldFileId.value
    cabDidDrag = false
    draggingId.value = heldFileId.value
    e.dataTransfer?.setData('text/cab-file', heldFileId.value)
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
    return
  }
  const f = target.closest('.cab-file') as HTMLElement | null
  if (!f || f.classList.contains('is-held')) {
    e.preventDefault()
    return
  }
  const id = f.dataset.file
  if (!id) {
    e.preventDefault()
    return
  }
  cabDragFileId = id
  cabDidDrag = false
  draggingId.value = id
  e.dataTransfer?.setData('text/cab-file', id)
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

const onCabDrag = () => {
  if (cabDragFileId) cabDidDrag = true
}

const onCabDragEnd = () => {
  draggingId.value = null
  clearCabDrop()
  cabDragFileId = null
}

const onCabDragOver = (e: DragEvent) => {
  if (!cabDragFileId && !heldFileId.value) return
  const target = e.target as HTMLElement
  const slot = target.closest('.cab-slot') as HTMLElement | null
  const desk = target.closest('.cab-desk')
  if (!slot && !desk) return
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  if (slot?.dataset.toy) {
    dropTarget.value = slot.dataset.toy
    openDrawerSlot(slot.dataset.toy)
  } else if (desk) {
    dropTarget.value = 'desk'
  }
}

const onCabDragLeave = (e: DragEvent) => {
  const target = e.target as HTMLElement
  const related = e.relatedTarget as Node | null
  const slot = target.closest('.cab-slot') as HTMLElement | null
  if (slot && related && !slot.contains(related) && dropTarget.value === slot.dataset.toy) {
    dropTarget.value = null
  }
  const desk = target.closest('.cab-desk')
  if (desk && related && !desk.contains(related) && dropTarget.value === 'desk') {
    dropTarget.value = null
  }
}

const onCabDrop = (e: DragEvent) => {
  e.preventDefault()
  const fileId = cabDragFileId || heldFileId.value
  const target = e.target as HTMLElement
  const slot = target.closest('.cab-slot') as HTMLElement | null
  const desk = target.closest('.cab-desk')
  clearCabDrop()
  if (!fileId) return
  cabDidDrag = true
  if (slot?.dataset.toy) {
    moveCabFile(fileId, slot.dataset.toy)
  } else if (desk && heldFileId.value !== fileId) {
    takeCabFile(fileId)
  }
  cabDragFileId = null
  draggingId.value = null
}

const onHeldClick = () => {
  if (cabDidDrag) {
    cabDidDrag = false
    return
  }
  putCabFile()
}

const query = reactive<API.KnowledgeBaseQueryRequest>({
  pageNum: 1,
  pageSize: 24,
  name: undefined,
  status: undefined,
})

const modalOpen = ref(false)
const submitting = ref(false)
const editingId = ref<number | string | null>(null)
const form = reactive({
  name: '',
  description: '',
  visibility: 'private',
  status: 1,
})

const period = computed(() => PERIOD[themeByHour(new Date().getHours())] ?? PERIOD.morning)

const selected = computed(() => {
  if (selectedId.value == null) return dataSource.value[0] ?? null
  return dataSource.value.find((x) => String(x.id) === String(selectedId.value)) ?? dataSource.value[0] ?? null
})

const selectedIndex = computed(() => {
  if (!selected.value) return -1
  return dataSource.value.findIndex((x) => String(x.id) === String(selected.value?.id))
})

const bayLabel = computed(() => String(Math.max(1, selectedIndex.value + 1)).padStart(2, '0'))

const totalDocs = computed(() => dataSource.value.reduce((s, x) => s + (x.documentCount ?? 0), 0))

const shelfFill = computed(() => {
  const n = Math.min(dataSource.value.length, 6)
  return Math.round((n / 6) * 100)
})

const callSlip = computed(() => {
  const kb = selected.value
  if (!kb) return '空架 · 新建一座馆藏'
  return `${bayLabel.value} · ${kb.name} · ${kb.documentCount ?? 0} 篇`
})

const formatIntakeTime = (raw?: string) => {
  if (!raw) return '—'
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return raw.slice(0, 10)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return sameDay ? `今天 ${hh}:${mm}` : `${d.getMonth() + 1}-${String(d.getDate()).padStart(2, '0')} ${hh}:${mm}`
}

const loadIntake = async () => {
  const kb = selected.value
  if (kb?.id == null) {
    intakeRows.value = []
    return
  }
  try {
    const res = await listKnowledgeDocuments(kb.id, { pageNum: 1, pageSize: 4 })
    if (res.data.code === 0 && res.data.data?.records?.length) {
      intakeRows.value = res.data.data.records.map((doc) => ({
        t: formatIntakeTime(doc.createTime || doc.updateTime),
        n: doc.fileName || doc.name || '未命名文档',
        s: doc.parseStatus || 'PENDING',
      }))
    } else {
      intakeRows.value = []
    }
  } catch {
    intakeRows.value = []
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await listKnowledgeBases({ ...query })
    if (res.data.code === 0 && res.data.data) {
      dataSource.value = res.data.data.records ?? []
      total.value = res.data.data.totalRow ?? 0
      if (selectedId.value == null && dataSource.value[0]?.id != null) {
        selectedId.value = dataSource.value[0].id
      }
    } else {
      message.error(res.data.message || '加载失败')
    }
  } finally {
    loading.value = false
  }
}

const selectKb = (row: API.KnowledgeBaseVO) => {
  if (row.id == null) return
  selectedId.value = row.id
}

const enterKb = (row?: API.KnowledgeBaseVO | null) => {
  const kb = row ?? selected.value
  if (kb?.id == null) return
  router.push(`/knowledge/${kb.id}`)
}

const openChat = () => {
  const kb = selected.value
  if (kb?.id == null) return
  router.push(`/knowledge/${kb.id}/chat`)
}

const openCreate = () => {
  router.push('/knowledge/create')
}

const openEdit = () => {
  const row = selected.value
  if (!row) return
  editingId.value = row.id ?? null
  form.name = row.name ?? ''
  form.description = row.description ?? ''
  form.visibility = row.visibility || 'private'
  form.status = row.status ?? 1
  modalOpen.value = true
}

const submitForm = async () => {
  if (!form.name.trim()) {
    message.warning('请输入知识库名称')
    return
  }
  if (editingId.value == null) return
  submitting.value = true
  try {
    const res = await updateKnowledgeBase(editingId.value, {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      visibility: form.visibility || 'private',
      status: form.status,
    })
    if (res.data.code === 0) {
      message.success('保存成功')
      modalOpen.value = false
      fetchData()
    } else {
      message.error(res.data.message || '保存失败')
    }
  } finally {
    submitting.value = false
  }
}

const handleDelete = () => {
  const row = selected.value
  if (!row) return
  const count = row.documentCount ?? 0
  Modal.confirm({
    title: '删除知识库',
    content:
      count > 0
        ? `「${row.name}」下有 ${count} 个文档，删除将级联清理关联数据。确认？`
        : `确认删除「${row.name}」？`,
    okType: 'danger',
    onOk: async () => {
      if (row.id == null) return
      const res = await deleteKnowledgeBase(row.id)
      if (res.data.code === 0) {
        message.success('已删除')
        selectedId.value = null
        fetchData()
      } else {
        message.error(res.data.message || '删除失败')
      }
    },
  })
}

const onSeal = () => {
  sealPop.value = true
  window.setTimeout(() => {
    sealPop.value = false
  }, 480)
}

const onKey = (e: KeyboardEvent) => {
  if (modalOpen.value) return
  if (e.key === 'Enter') {
    e.preventDefault()
    enterKb()
    return
  }
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
  if (!dataSource.value.length) return
  const i = Math.max(0, selectedIndex.value)
  const next = e.key === 'ArrowRight' ? Math.min(dataSource.value.length - 1, i + 1) : Math.max(0, i - 1)
  const row = dataSource.value[next]
  if (row?.id != null) selectedId.value = row.id
}

watch(selectedId, () => {
  catFlip.value = false
  void loadIntake()
})

onMounted(() => {
  fetchData().then(() => loadIntake())
  window.addEventListener('keydown', onKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  returnTimers.forEach((t) => clearTimeout(t))
  returnTimers.clear()
})
</script>

<template>
  <KnowledgeRoomShell note-label="Knowledge v17 · 书架馆藏">
    <div class="shell" :aria-busy="loading">
      <aside class="side">
        <div class="side-card glass anim" style="animation-delay:.05s;flex:none">
          <h3 class="font-display">关于房间</h3>
          <p class="about">目录选库，中栏上架下读，侧栏开屉。SUCCESS 后再进 RAG。</p>
          <button class="chip-btn primary block" type="button" style="margin-top:10px" @click="openCreate">＋ 新建知识库</button>
          <button
            v-if="canManageSettings"
            class="chip-btn block"
            type="button"
            style="margin-top:8px"
            @click="router.push('/admin/settings/knowledge')"
          >知识库设置</button>
          <button class="chip-btn block" type="button" style="margin-top:8px" @click="router.push('/admin/knowledge/ingest')">精读房间 →</button>
        </div>

        <div class="catalog glass anim" style="animation-delay:.15s" role="listbox" aria-label="知识库目录">
          <div class="cap">目录</div>
          <button
            v-for="(row, idx) in dataSource"
            :key="String(row.id)"
            type="button"
            class="catalog-item"
            :class="{ 'is-on': String(row.id) === String(selected?.id) }"
            role="option"
            :aria-selected="String(row.id) === String(selected?.id)"
            @click="selectKb(row)"
            @dblclick="enterKb(row)"
          >
            <span class="num">{{ String(idx + 1).padStart(2, '0') }}</span>
            <span class="name">{{ row.name }}</span>
            <span class="ok">{{ row.documentCount ?? 0 }} 篇</span>
          </button>
          <div v-if="!dataSource.length && !loading" class="catalog-item" style="opacity:.55;cursor:default">
            <span class="num">··</span>
            <span class="name">还没有知识库</span>
            <span class="ok">新建</span>
          </div>
        </div>

        <div class="lib-corner glass anim" style="animation-delay:.22s" aria-label="馆藏角装饰">
          <div class="period-chip"><span class="p-dot" /><span>{{ period.name }}</span></div>
          <h3 class="font-display">馆藏角</h3>
          <div class="lib-tabs">
            <button
              v-for="tab in LIB_TABS"
              :key="tab"
              type="button"
              class="lib-tab"
              :class="{ lit: libTab === tab }"
              :title="tab"
              @click="libTab = tab"
            >{{ tab }}</button>
          </div>
          <button type="button" class="cat-card" :class="{ 'is-flipped': catFlip }" title="点击翻转索书卡" @click="catFlip = !catFlip">
            <div class="cat-card-inner">
              <div class="cat-face front">
                <div class="frame">
                  <div class="call">TP · {{ bayLabel }}</div>
                  <div class="sub">{{ selected?.name || '空架' }}</div>
                </div>
                <div class="cap font-display">索书卡</div>
              </div>
              <div class="cat-face back">
                <div class="bk font-display">{{ selected?.name || '空架' }}</div>
                <div class="bh text-pretty">点目录或书脊选库<br>Enter 进入馆藏</div>
              </div>
            </div>
          </button>
          <div class="lib-row">
            <div class="mini-shelf" aria-hidden="true">
              <div class="sp"><i /><i /><i /><i /></div>
              <div class="ledge" />
            </div>
            <div class="magnifier" aria-hidden="true" />
            <button type="button" class="lib-stamp" title="盖章" @click="onSeal">藏</button>
            <button type="button" class="lib-stamp b" title="盖章" @click="onSeal">阅</button>
          </div>
          <div class="call-slip">
            <div class="k">当前架位</div>
            <div class="v">{{ callSlip }}</div>
          </div>
          <div class="deco-quote">
            <div class="q font-display">「</div>
            <p class="text-pretty">目录点选 · 书脊浏览 · 摘要确认。解析 SUCCESS，再进 RAG。</p>
          </div>
        </div>
      </aside>

      <main class="main list-stack">
        <div class="list-head anim" style="animation-delay:.08s">
          <div class="left">
            <div class="eyebrow">/knowledge</div>
            <h1 class="font-display">知识库<span class="sticker font-display">馆藏</span></h1>
            <p class="sub">目录/书脊选库 · 档案可拖去别的屉</p>
          </div>
          <div class="period-chip">
            <div class="n font-display"><span class="p-dot" /><span>{{ period.name }}</span></div>
            <div class="h">{{ period.hint }}</div>
          </div>
        </div>

        <div class="mid-bay">
          <div class="shelf-board mid-read-shelf anim" style="animation-delay:.16s">
            <div class="shelf-top">
              <div class="shelf-tag" aria-hidden="true">架位 <b>{{ bayLabel }}</b></div>
              <div class="shelf-fill" aria-hidden="true">
                <span>占用</span>
                <span class="track"><i :style="{ width: `${shelfFill}%` }" /></span>
                <span>{{ Math.min(dataSource.length, 6) }}/6</span>
              </div>
            </div>
            <button type="button" class="lib-seal" :class="{ 'is-pop': sealPop }" title="馆员印 · 点击盖章" @click="onSeal">馆</button>
            <div class="shelf-body">
              <div class="shelf-props">
                <div class="ribbons" role="group" aria-label="解析态签">
                  <button type="button" class="ribbon r0" :class="{ lit: statusFilter === 'SUCCESS' }" title="SUCCESS" @click="statusFilter = statusFilter === 'SUCCESS' ? null : 'SUCCESS'">成</button>
                  <button type="button" class="ribbon r1" :class="{ lit: statusFilter === 'PARSING' }" title="PARSING" @click="statusFilter = statusFilter === 'PARSING' ? null : 'PARSING'">析</button>
                  <button type="button" class="ribbon r2" :class="{ lit: statusFilter === 'PENDING' }" title="PENDING" @click="statusFilter = statusFilter === 'PENDING' ? null : 'PENDING'">待</button>
                  <button type="button" class="ribbon r3" :class="{ lit: statusFilter === 'FAILED' }" title="FAILED" @click="statusFilter = statusFilter === 'FAILED' ? null : 'FAILED'">败</button>
                </div>
              </div>
              <div class="shelf-row" role="listbox" aria-label="知识库书脊">
                <button
                  v-for="(row, idx) in dataSource.slice(0, 5)"
                  :key="String(row.id)"
                  type="button"
                  class="kb-spine"
                  :class="[SPINE[idx % SPINE.length], { 'is-on': String(row.id) === String(selected?.id) }]"
                  role="option"
                  :aria-selected="String(row.id) === String(selected?.id)"
                  @click="selectKb(row)"
                  @dblclick="enterKb(row)"
                >
                  {{ row.name }}
                  <em>{{ String(idx + 1).padStart(2, '0') }}</em>
                  <i class="bm" />
                </button>
                <button type="button" class="kb-spine s6" disabled title="空位">空<em>·</em></button>
              </div>
            </div>
          </div>

          <article class="folio mid-read-folio anim" style="animation-delay:.24s">
            <span class="excerpt-mount" aria-hidden="true" />
            <div class="pick-stamp" aria-hidden="true">选</div>
            <div class="excerpt-hero">
              <div class="eyebrow">当前库</div>
              <h2 class="font-display">{{ selected?.name || '尚未选库' }}</h2>
              <p class="meta">{{ selected?.id != null ? `/knowledge/${selected.id}` : '—' }}</p>
            </div>
            <div class="excerpt-body">
              <div class="excerpt-main">
                <p class="lead text-pretty">
                  {{ selected?.description?.trim() || '收录产品说明、架构笔记与 FAQ。解析成功的文档可进入 RAG 问答；失败项展示 errorMessage，可重试 parse。' }}
                </p>
                <div class="fact-chips">
                  <span class="fact">文档 <b>{{ selected?.documentCount ?? 0 }}</b></span>
                  <span class="fact">可见 <b>{{ selected?.visibility === 'public' ? '公开' : '私有' }}</b></span>
                  <span class="fact">状态 <b>{{ selected?.status === 0 ? '禁用' : '正常' }}</b></span>
                </div>
                <div class="pick-list">
                  <div v-if="selected?.description?.trim()" class="pick-block">
                    <div class="pk text-pretty">{{ selected.description.trim() }}</div>
                    <div class="ps">{{ selected.name }} · 简介</div>
                  </div>
                </div>
              </div>
              <div class="folio-intake">
                <div class="fi-cap">入库流水</div>
                <div class="intake">
                  <div v-for="(row, idx) in intakeRows" :key="`${row.n}-${idx}`" class="intake-row">
                    <span class="t">{{ row.t }}</span>
                    <span class="n">{{ row.n }}</span>
                    <span class="d" :class="row.s" :title="row.s" />
                  </div>
                  <div v-if="!intakeRows.length" class="intake-row" style="opacity: 0.55">
                    <span class="t">—</span>
                    <span class="n">暂无入库记录</span>
                    <span class="d PENDING" title="PENDING" />
                  </div>
                </div>
              </div>
            </div>
            <div class="excerpt-foot">
              <span class="cap">←→ 换库 · Enter 进馆藏</span>
              <span class="mark" />
              <span class="spine-chip"><i aria-hidden="true" /><span>书脊 {{ bayLabel }} · {{ selected?.documentCount ?? 0 }} 篇</span></span>
            </div>
          </article>

          <aside
            class="cab-rail glass anim"
            style="animation-delay:.28s"
            aria-label="档案柜玩具"
            @click="onCabRailClick"
            @dragstart="onCabDragStart"
            @drag="onCabDrag"
            @dragend="onCabDragEnd"
            @dragover="onCabDragOver"
            @dragleave="onCabDragLeave"
            @drop="onCabDrop"
          >
            <div class="cab-cap">档案柜</div>
            <div class="cab-hint">开屉 · 拖档案换屉 · 点抽出/放回</div>
            <div class="cab-stack" role="group" aria-label="玩具抽屉">
              <div
                v-for="toy in cabToys"
                :key="toy.key"
                class="cab-slot"
                :class="{
                  'is-open': isDrawerOpen(toy.key),
                  'is-drop': dropTarget === toy.key,
                }"
                :data-toy="toy.key"
              >
                <button type="button" class="cab-drawer" title="开合抽屉">
                  <span :class="['dot', toy.dot]" />
                  <span class="label-win"><span class="num">{{ toy.num }}</span><span class="name">{{ toy.label }}</span></span>
                  <span class="pull" aria-hidden="true" />
                </button>
                <div class="cab-files">
                  <button
                    v-for="file in toy.files"
                    :key="file.id"
                    type="button"
                    class="cab-file"
                    :class="{
                      'is-held': heldFileId === file.id,
                      'is-dragging': draggingId === file.id,
                      'is-return': returningIds.has(file.id),
                    }"
                    draggable="true"
                    :data-file="file.id"
                    :data-k="file.k"
                    :data-v="file.v"
                  >
                    <span class="fk">{{ file.k }}</span><span class="fv">{{ file.v }}</span>
                  </button>
                </div>
              </div>
            </div>
            <div
              class="cab-desk"
              :class="{
                'is-empty': cabDeskEmpty,
                'is-drop': dropTarget === 'desk',
              }"
            >
              <div v-if="cabDeskEmpty" class="cab-desk-empty">抽出的档案<br>会落在这里</div>
              <button
                v-else-if="heldFile"
                type="button"
                class="cab-held"
                draggable="true"
                title="拖到其他屉，或点击放回原屉"
                @click.stop="onHeldClick"
              >
                <div class="hk">{{ heldFile.k }}</div>
                <div class="hv">{{ heldFile.v }}</div>
                <div class="hb">拖去别的屉 · 点放回原屉</div>
              </button>
            </div>
            <div class="cab-meta"><b>{{ cabOpenLabel }}</b></div>
          </aside>
        </div>
      </main>

      <aside class="deck">
        <div class="panel glass anim" style="animation-delay:.12s">
          <span class="edge-fold" aria-hidden="true" />
          <div class="eyebrow">站内统计</div>
          <div class="stat-grid">
            <div class="stat-cell"><div class="n font-display">{{ total }}</div><div class="l">知识库</div></div>
            <div class="stat-cell"><div class="n font-display">{{ totalDocs }}</div><div class="l">文档</div></div>
            <div class="stat-cell"><div class="n font-display">{{ selected?.documentCount ?? 0 }}</div><div class="l">可问答</div></div>
            <div class="stat-cell"><div class="n font-display">{{ dataSource.filter((x) => x.status !== 0).length }}</div><div class="l">会话</div></div>
          </div>
        </div>

        <div class="panel glass anim" style="animation-delay:.16s">
          <div class="eyebrow">解析健康 · {{ selected?.name || '—' }}</div>
          <div class="health-bar" role="img" aria-label="解析状态占比">
            <i class="ok" :style="{ width: selected?.documentCount ? '75%' : '0%' }" />
            <i class="parsing" :style="{ width: selected?.documentCount ? '8%' : '0%' }" />
            <i class="pending" :style="{ width: selected?.documentCount ? '9%' : '0%' }" />
            <i class="failed" :style="{ width: selected?.documentCount ? '8%' : '0%' }" />
          </div>
          <div class="health-legend">
            <span><i class="ok" />SUCCESS <b>{{ selected?.documentCount ?? 0 }}</b></span>
            <span><i class="parsing" />PARSING <b>0</b></span>
            <span><i class="pending" />PENDING <b>0</b></span>
            <span><i class="failed" />FAILED <b>0</b></span>
          </div>
        </div>

        <div class="panel glass anim" style="flex:1;display:flex;flex-direction:column;animation-delay:.2s">
          <div class="eyebrow">最近问答</div>
          <button type="button" class="recent-q" @click="openChat()"><div class="rq">今天</div>向量检索 topK 怎么配？</button>
          <button type="button" class="recent-q" @click="openChat()"><div class="rq">昨天</div>解析 FAILED 如何重试？</button>
          <button type="button" class="recent-q" @click="openChat()"><div class="rq">07-20</div>chunk 预览入口在哪？</button>
          <div class="blotter" aria-hidden="true">
            <div class="k">阅览便签</div>
            <div class="v">至少 1 篇 SUCCESS 才适合进问答 · 失败看 errorMessage</div>
          </div>
          <div class="ready-strip">
            <div class="lab">就绪条</div>
            当前库 · 可问答 <b>{{ selected?.documentCount ?? 0 }}</b> 篇 SUCCESS
          </div>
          <div class="deck-foot">
            <button class="chip-btn primary block" type="button" @click="enterKb()">进入馆藏</button>
            <button class="chip-btn block" type="button" @click="openChat()">快捷问答</button>
          </div>
        </div>
      </aside>
    </div>

    <a-modal
      v-model:open="modalOpen"
      title="编辑知识库"
      :confirm-loading="submitting"
      ok-text="保存"
      cancel-text="取消"
      @ok="submitForm"
    >
      <a-form layout="vertical">
        <a-form-item label="名称" required>
          <a-input v-model:value="form.name" placeholder="知识库名称" maxlength="64" />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model:value="form.description" :rows="3" placeholder="可选描述" maxlength="500" />
        </a-form-item>
        <a-form-item label="可见范围">
          <a-select v-model:value="form.visibility" style="width:100%">
            <a-select-option value="private">私有</a-select-option>
            <a-select-option value="public">公开</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="form.status" style="width:100%">
            <a-select-option :value="1">正常</a-select-option>
            <a-select-option :value="0">禁用</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </KnowledgeRoomShell>
</template>
