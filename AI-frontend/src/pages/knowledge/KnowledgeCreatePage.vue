<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { createKnowledgeBase } from '@/api/knowledge'
import KnowledgeRoomShell from '@/components/knowledge/KnowledgeRoomShell.vue'

const router = useRouter()
const submitting = ref(false)
const form = reactive({
  name: '',
  description: '',
  visibility: 'private',
})

const pipeStep = computed(() => {
  if (submitting.value) return 2
  if (form.name.trim()) return 1
  return 0
})

const ghostLabel = computed(() => form.name.trim() || '待命名')

const submit = async () => {
  if (!form.name.trim()) {
    message.warning('请输入知识库名称')
    return
  }
  submitting.value = true
  try {
    const res = await createKnowledgeBase({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      visibility: form.visibility || 'private',
    })
    if (res.data.code === 0 && res.data.data?.id != null) {
      message.success('创建成功')
      router.replace(`/knowledge/${res.data.data.id}`)
    } else if (res.data.code === 0) {
      message.success('创建成功')
      router.replace('/knowledge')
    } else message.error(res.data.message || '创建失败')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <KnowledgeRoomShell note-label="Knowledge · 新建书架">
    <div class="shell">
      <aside class="side side-stack anim" style="animation-delay: 0.08s">
        <button class="back-chip" type="button" @click="router.push('/knowledge')">← 返回列表 · Esc</button>
        <div class="side-card glass">
          <span class="tape" />
          <h3 class="font-display">新建说明</h3>
          <p class="about">POST /kb/knowledge-bases。先建空库，再上传文档。</p>
        </div>
        <div class="panel glass" style="flex: 1; display: flex; flex-direction: column; min-height: 0">
          <div class="eyebrow">上架预览</div>
          <div class="spine-stage">
            <div class="spine-ghost" :class="{ 'is-empty': !form.name.trim() }">
              {{ ghostLabel }}<em>06</em>
            </div>
            <div class="spine-base" aria-hidden="true" />
          </div>
          <p class="meta" style="text-align: center">输入库名，看它立在架上</p>
        </div>
      </aside>

      <main class="main room-col anim" style="animation-delay: 0.16s; justify-content: center">
        <div class="room-head" style="max-width: 680px; width: 100%; margin: 0 auto 8px">
          <div>
            <div class="eyebrow">NEW SHELF</div>
            <h1 class="font-display">新建知识库</h1>
            <p class="sub">填一张建库卡 · 右栏看流程</p>
          </div>
        </div>
        <div class="form-card">
          <span class="fr-mount" aria-hidden="true" />
          <span class="edge-call" aria-hidden="true">新架 <b>06</b></span>
          <span class="edge-fold" aria-hidden="true" />
          <div class="eyebrow" style="margin-top: 6px">/knowledge · create</div>
          <div class="field-row" style="margin-top: 14px">
            <label>库名</label>
            <input v-model="form.name" type="text" placeholder="例如：产品手册" maxlength="40" />
          </div>
          <div class="field-row">
            <label>简介（可选）</label>
            <textarea v-model="form.description" placeholder="一两句话说明这座库收什么…" />
          </div>
          <div class="field-row">
            <label>可见性</label>
            <select v-model="form.visibility">
              <option value="private">私有 · 仅自己</option>
              <option value="public">公开 · 站内可读</option>
            </select>
          </div>
          <div style="display: flex; gap: 10px; margin-top: 6px">
            <button class="chip-btn primary" type="button" :disabled="submitting" @click="submit">
              {{ submitting ? '创建中…' : '创建知识库' }}
            </button>
            <button class="chip-btn" type="button" @click="router.push('/knowledge')">取消</button>
          </div>
          <p class="meta" style="margin-top: 12px">成功后跳转馆藏</p>
        </div>
      </main>

      <aside class="deck anim" style="animation-delay: 0.24s">
        <div class="panel glass" style="flex: 1; display: flex; flex-direction: column">
          <span class="tape sun" />
          <div class="eyebrow">建库流程</div>
          <div class="pipeline">
            <div class="step s1" :class="{ on: pipeStep >= 1 }"><span class="dot" />填写库名 / 简介</div>
            <div class="step s2" :class="{ on: pipeStep >= 2 }"><span class="dot" />创建空库</div>
            <div class="step s3"><span class="dot" />上传并解析</div>
            <div class="step s4"><span class="dot" />进入问答</div>
          </div>
          <div class="hint-box" style="margin-top: auto">解析 SUCCESS 后才适合问答。不在此房做 AI 精读。</div>
        </div>
      </aside>
    </div>
  </KnowledgeRoomShell>
</template>
