<script setup lang="ts">
/**
 * SVG 领域树图：根在上，L1 水平展开，L2 挂父下；鼠标微摆
 */
import { computed, onMounted, ref } from 'vue'
import type { LearningBranchTreeNode } from '@/api/learning.types'

type Props = {
  domainName: string
  branches: LearningBranchTreeNode[]
  selectedBranchId: number | string | null
  loading?: boolean
}

type Emits = {
  'update:selected-branch-id': [branchId: number | string | null]
  'learn-empty': [payload: { branchId: number | string; branchTitle: string }]
}

const props = withDefaults(defineProps<Props>(), { loading: false })
const emit = defineEmits<Emits>()

const wrapRef = ref<HTMLElement | null>(null)
const pointer = ref({ x: 0.5, y: 0.2 })
const reduceMotion = ref(false)
const scale = ref(1)

function zoomIn() {
  scale.value = Math.min(1.4, +(scale.value + 0.1).toFixed(2))
}
function zoomOut() {
  scale.value = Math.max(0.7, +(scale.value - 0.1).toFixed(2))
}

type LayoutNode = {
  id: string
  title: string
  leafCount: number
  depth: 1 | 2
  x: number
  y: number
  branch: LearningBranchTreeNode
}

const W = 900
const H = 560
const ROOT = { x: W / 2, y: 56 }

/** 枝过多时自动缩小，防止节点重叠 */
const autoScale = computed(() => {
  const n = props.branches.filter((b) => b.depth === 1).length
  if (n <= 6) return 1
  if (n <= 12) return 0.85
  return 0.7
})

const l1List = computed(() => props.branches.filter((b) => b.depth === 1))

const layoutNodes = computed(() => {
  const nodes: LayoutNode[] = []
  const l1s = l1List.value
  const n = Math.max(l1s.length, 1)
  const gap = Math.min(160, (W - 120) / n)
  const startX = ROOT.x - ((n - 1) * gap) / 2

  l1s.forEach((b, i) => {
    const x = startX + i * gap
    const y = 200
    nodes.push({
      id: String(b.id),
      title: b.title,
      leafCount: b.leafCount,
      depth: 1,
      x,
      y,
      branch: b,
    })
    const kids = props.branches.filter(
      (c) => c.depth === 2 && String(c.parentBranchId) === String(b.id),
    )
    // 非选中路径默认少展示：若父未选中且非选中子，最多显示 2 个 L2
    const selected = String(props.selectedBranchId)
    const parentSelected = selected === String(b.id)
    const showKids = parentSelected
      ? kids
      : kids.filter((c) => String(c.id) === selected).length
        ? kids.filter((c) => String(c.id) === selected)
        : kids.slice(0, 2)

    showKids.forEach((c, j) => {
      const kn = Math.max(showKids.length, 1)
      const kg = Math.min(90, 140 / kn)
      const kx = x - ((kn - 1) * kg) / 2 + j * kg
      nodes.push({
        id: String(c.id),
        title: c.title,
        leafCount: c.leafCount,
        depth: 2,
        x: kx,
        y: 360,
        branch: c,
      })
    })
  })
  return nodes
})

const edges = computed(() => {
  const list: { x1: number; y1: number; x2: number; y2: number; key: string }[] = []
  for (const node of layoutNodes.value) {
    if (node.depth === 1) {
      list.push({ x1: ROOT.x, y1: ROOT.y + 18, x2: node.x, y2: node.y - 22, key: `r-${node.id}` })
    } else {
      const parent = layoutNodes.value.find(
        (n) => n.depth === 1 && String(n.branch.id) === String(node.branch.parentBranchId),
      )
      if (parent) {
        list.push({
          x1: parent.x,
          y1: parent.y + 18,
          x2: node.x,
          y2: node.y - 18,
          key: `p-${node.id}`,
        })
      }
    }
  }
  return list
})

function swayAt(x: number, y: number) {
  if (reduceMotion.value) return { transform: 'none', transformOrigin: `${x}px ${y}px` }
  const nx = x / W
  const ny = y / H
  const dx = (pointer.value.x - nx) * 14
  const dy = (pointer.value.y - ny) * 10
  const rot = (pointer.value.x - nx) * 6
  return {
    transform: `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) rotate(${rot.toFixed(2)}deg)`,
    transformOrigin: `${x}px ${y}px`,
  }
}

function sway(node: LayoutNode) {
  return swayAt(node.x, node.y)
}

function onPointer(e: PointerEvent) {
  const el = wrapRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  pointer.value = {
    x: (e.clientX - rect.left) / Math.max(rect.width, 1),
    y: (e.clientY - rect.top) / Math.max(rect.height, 1),
  }
}

function onSelect(node: LayoutNode) {
  emit('update:selected-branch-id', node.branch.id)
}

function onLearn(node: LayoutNode) {
  if (node.leafCount > 0) return
  emit('learn-empty', { branchId: node.branch.id, branchTitle: node.branch.title })
  emit('update:selected-branch-id', node.branch.id)
}

onMounted(() => {
  reduceMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
})

</script>

<template>
  <div
    ref="wrapRef"
    class="domain-tree-viz"
    @pointermove="onPointer"
  >
    <div class="domain-tree-viz__toolbar">
      <button type="button" class="ld-icon-btn ld-icon-btn--ghost" title="缩小" @click="zoomOut">−</button>
      <span class="domain-tree-viz__zoom-label">{{ Math.round(scale * 100) }}%</span>
      <button type="button" class="ld-icon-btn ld-icon-btn--ghost" title="放大" @click="zoomIn">+</button>
    </div>
    <div v-if="loading" class="domain-tree-viz__loading">加载树图…</div>
    <div v-else class="domain-tree-viz__canvas" :style="{ transform: `scale(${(scale * autoScale).toFixed(2)})` }">
    <svg
      class="domain-tree-viz__svg"
      :viewBox="`0 0 ${W} ${H}`"
      role="img"
      :aria-label="`${domainName} 知识树图`"
    >
      <defs>
        <linearGradient id="ld-trunk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#8db3cf" stop-opacity="0.9" />
          <stop offset="100%" stop-color="#2b5b84" stop-opacity="0.5" />
        </linearGradient>
      </defs>

      <!-- edges -->
      <path
        v-for="e in edges"
        :key="e.key"
        class="domain-tree-viz__edge"
        :d="`M ${e.x1} ${e.y1} C ${e.x1} ${(e.y1 + e.y2) / 2}, ${e.x2} ${(e.y1 + e.y2) / 2}, ${e.x2} ${e.y2}`"
        fill="none"
        stroke="url(#ld-trunk)"
        stroke-width="2.5"
      />

      <!-- root -->
      <g class="domain-tree-viz__root" :style="swayAt(ROOT.x, ROOT.y)">
        <circle :cx="ROOT.x" :cy="ROOT.y" r="28" class="domain-tree-viz__root-circle" />
        <text :x="ROOT.x" :y="ROOT.y + 5" text-anchor="middle" class="domain-tree-viz__root-label">
          {{ domainName || 'Domain' }}
        </text>
      </g>

      <!-- nodes -->
      <g
        v-for="node in layoutNodes"
        :key="node.id"
        class="domain-tree-viz__node"
        :class="{
          'is-active': String(selectedBranchId) === node.id,
          'is-empty': node.leafCount === 0,
        }"
        :style="sway(node)"
        @click="onSelect(node)"
        @dblclick="onLearn(node)"
      >
        <circle
          :cx="node.x"
          :cy="node.y"
          :r="node.depth === 1 ? 22 : 16"
          class="domain-tree-viz__circle"
        />
        <text :x="node.x" :y="node.y + 4" text-anchor="middle" class="domain-tree-viz__label">
          {{ node.title.length > 6 ? node.title.slice(0, 5) + '…' : node.title }}
        </text>
        <text
          v-if="node.leafCount > 0"
          :x="node.x + (node.depth === 1 ? 18 : 14)"
          :y="node.y - (node.depth === 1 ? 14 : 10)"
          class="domain-tree-viz__badge"
        >
          {{ node.leafCount }}
        </text>
        <text
          v-else
          :x="node.x"
          :y="node.y + (node.depth === 1 ? 30 : 24)"
          text-anchor="middle"
          class="domain-tree-viz__hint"
          @click.stop="onLearn(node)"
        >
          补学
        </text>
      </g>
    </svg>
    </div>
    <p class="domain-tree-viz__tip">拖动鼠标微摆 · 单击选中 · 空枝双击或点「补学」</p>
  </div>
</template>
