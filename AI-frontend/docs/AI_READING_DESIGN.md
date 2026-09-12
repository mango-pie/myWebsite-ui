# AI 精读模块 · 设计思想 / 需求 / UI 风格总览

> **文档性质**：产品 + 前端设计综合说明（汇总稿）  
> **产品真相源**：`E:\java_demo\Ai-Backend\docs\ai-reading-workbench\`（00～08）  
> **前端实现**：本仓库 `AI-frontend`（Reading Room 壳 + 采集/笔记/学习页）  
> **后端实现**：兄弟仓库 `Ai-Backend`（Spring Admin API）  
> **问题归档**：[`READING_WORKBENCH_ISSUES.md`](./READING_WORKBENCH_ISSUES.md)  
> **整理日期**：2026-07-29

---

## 目录

1. [一句话定位](#1-一句话定位)
2. [设计思想与原则](#2-设计思想与原则)
3. [与相邻模块的边界](#3-与相邻模块的边界)
4. [版本路线与完整需求](#4-版本路线与完整需求)
5. [业务对象与状态机](#5-业务对象与状态机)
6. [信息架构与用户流程](#6-信息架构与用户流程)
7. [前后端架构](#7-前后端架构)
8. [UI 设计风格](#8-ui-设计风格)
9. [站点设置（reading 模块）](#9-站点设置reading-模块)
10. [验收与已知问题](#10-验收与已知问题)
11. [关键文件索引](#11-关键文件索引)

---

## 1. 一句话定位

**AI 精读**是管理员专用的「发现 → 蒸馏 → 确认 → 沉淀」工作台：把优质网页/文件变成可反复复习的 Markdown 精读稿，经人工预览编辑后，再分流到博客展示和/或知识库 RAG；V3 进一步用「领域知识树」把多篇精读组织成可复习的枝叶结构。

核心不是「自动发文机器人」，而是：

> 把发现优质资料、快速精炼、人工确认、沉淀到博客和知识库做成一条可复用链路。

---

## 2. 设计思想与原则

### 2.1 产品隐喻

| 层面 | 隐喻 | 含义 |
| --- | --- | --- |
| 业务 | **蒸馏工房** | 原材料（URL/文件/搜索候选）→ 合蒸/精炼 → 工作稿 → 分流入库 |
| 视觉 | **紫罗兰天文台（Violet Observatory）** | 玻璃制图板、星图、器皿/银河/遥测装饰，衬托「观测—提炼」气质 |
| 角色 | **管理员操作台** | 信息密度服务于决策与操作；装饰可以有，不能抢职责、不能假数据 |

一句话约束（来自问题归档）：

> 需求文档定位的是管理员操作台，不是装饰观测站。装饰可以有，不能抢职责、不能假数据、不能拆功能。

### 2.2 四条硬原则

1. **先预览，后入库**  
   精读稿先进 `knowledge_note`，管理员确认后再写 `blog_post` 或向量库。挂树 ≠ 入库。

2. **博客与知识库解耦**  
   - `blog_post`：对外展示  
   - 知识库文档/chunk：RAG 检索  
   - `knowledge_note`：中间工作稿（唯一编辑真相源）

3. **索引精炼稿，保留原文溯源**  
   入知识库时向量化 `distilled_md`；原文保存在 `source_document.raw_text`（或合蒸材料包）供对照。

4. **Agent / 搜索只做输入源**  
   不自动发博客、不自动入库、不静默改领域树。选中 URL、确认挂叶、确认建枝，均须人工。

### 2.3 流水线哲学

```text
发现（URL / 文件 / 联网搜索候选）
  → 抓取或合蒸材料包
  → AI 重构为一篇 Markdown 精读（knowledge_note）
  → 人工预览、编辑、再蒸馏
  → 分流：发博客 和/或 入知识库
  →（V3）挂到领域树，按枝复习
```

设计选型上明确采用 **「先精炼，后分流」**：不先入库再精炼，也不在搜索阶段自动沉淀。

### 2.4 异步的设计意图（V2）

默认 `async` 不是为了炫技，而是：

- 提交合蒸后**不阻塞**页面；
- 任务落库（`knowledge_reading_job`），可用 `jobId` 轮询；
- **允许离开采集页**，在任务监视面继续跟踪。

本地 `localStorage` 只是加速展示的辅助，**服务端 job 列表才是真相源**。

---

## 3. 与相邻模块的边界

| 模块 | 关系 | 明确不做 / 不混用 |
| --- | --- | --- |
| 知识库 RAG（`/knowledge`） | 精读确认后可 `index` 生成 MD 文档与 chunk | 精读工作台 ≠ 用户面书架/问答 |
| 博客（`/blog`） | 精读确认后可 `publish-blog` / `sync-blog` | 不替代博客编辑器；发布后可跳转编辑器 |
| TTS / 站点朗读 | 独立站点设置 | **不属于**精读链路 |
| 知识库聊天 | RAG 对话 | 精读里的「聊」仅指 V3 **门闩问答**（CHAT_ONLY） |
| 学习模块（`/administrator/study`） | 另一套学习能力 | 精读 V3「领域学习」是精读工作台内的树复习 |

知识库房间设计稿明确：**排除 AI 精读并入用户面**——精读是 admin 工作台，不是公共阅读页。

---

## 4. 版本路线与完整需求

### 4.1 版本一览

```text
V1 MVP
  URL / 文件采集 → AI 精炼 → 预览编辑 → 发博客 / 入知识库
  半自动 Agent：手动候选 URL + 学习大纲展示

V2
  真实联网搜索 + 多选勾选 + 合蒸一篇 + 异步 job

V3
  领域知识树：选手动领域 → 相关门闩 → 枝/叶 → V2 精读 → 确认挂 note 复习
```

---

### 4.2 V1 需求明细

#### 4.2.1 内容采集

| Tab | 能力 | 要点 |
| --- | --- | --- |
| URL | `POST /ingest/url` | Jina Reader 抓正文 → AI 精炼 → note |
| 文件 | `POST /ingest/file` | PDF / DOCX / TXT / MD → 提取正文 → 精炼 |
| AI 搜索（半自动） | 手动多行候选 URL | `sourceType=AGENT`；可选展示学习大纲（不落库） |

字段共性：可选标题、标签；成功后进入精读详情。

#### 4.2.2 精读列表

路由：`/admin/knowledge/notes`

四类筛选：

- 关键词（标题 / URL / 标签）
- 来源：全部 / URL / FILE / AGENT
- 博客状态：未发布 / 草稿 / 已发布 / 需同步 / 同步失败 …
- 入库状态：未入库 / 已入库 / 需重建 …

列表操作：打开详情、删除等。

#### 4.2.3 精读详情（审阅）

路由：`/admin/knowledge/notes/:noteId`

布局契约：

```text
顶部：标题、来源、状态 Tag
正文：左侧 Markdown 编辑器 | 右侧 Markdown 预览
侧栏：原文摘要、完整原文弹窗、博客/知识库关联
底部：保存 / 再蒸馏 / 发博客 / 同步 / 入库 / 重建
```

行为：

| 操作 | 规则 |
| --- | --- |
| 保存 | 更新标题、标签、`distilled_md`；更新 `last_edited_at` |
| 再蒸馏 | 覆盖 Markdown；前端按设置二次确认 |
| 发博客 | 草稿或直接发布；已发布过再 publish 报错；可询问是否打开博客编辑器 |
| 同步博客 | 手动覆盖标题与正文 |
| 入库 | 选已有库或新建；用 `distilled_md` 切块 + embedding |
| 重建索引 | 删旧 chunk 后重建 |

状态联动：

- 已发布 note 被编辑 → `SYNC_REQUIRED`
- 已入库 note 被编辑 → `REINDEX_REQUIRED`

#### 4.2.4 V1 明确不做

- 真实联网搜索、批量自动精炼  
- 异步任务队列（V1 同步）  
- 版本历史、Markdown/博客 diff  
- 索引版本化、领域知识树、多模型选择面板  

---

### 4.3 V2 需求明细

#### 4.3.1 产品四步

1. 告诉 AI **要学什么**（goal + 可选 preference / tags / distillPrompt）  
2. **联网搜索**候选页（默认 DeepSeek web_search；Tavily / placeholder 备用）  
3. 用户**勾选**若干 URL → DeepSeek **读页**物化材料包 → 按提示词 **合蒸一篇** 完整精读  
4. 人工确认后发博客 / 入知识库  

合蒸语义：

- **只生成一篇** `knowledge_note`（不是一文一 note）  
- `SourceDocument.rawText` 保存拼接后的材料包  
- 至少 1 个来源可读即可继续；失败来源写入 `failedSources`  

#### 4.3.2 异步合蒸

| 项 | 约定 |
| --- | --- |
| 入口 | `POST /ingest/batch-url`（默认 async） |
| 立即返回 | `jobId` + `KnowledgeReadingJobVO` |
| 轮询 | 每 2s `GET /reading-jobs/{jobId}` |
| 落库表 | `knowledge_reading_job` |
| Worker | `@Scheduled` ~3s；全局最多 1 个 `RUNNING` |
| 超时 | 约 20 分钟标 `FAILED` |
| 调试 | `reading.ingest.sync_mode=sync` 一次返回 `noteId` |

进度文案建议：

| progress | 文案 |
| --- | --- |
| `QUEUED` | 排队中 |
| `READING` | 正在读取网页 |
| `DISTILLING` | 正在重构精读 |
| `DONE` | 完成 |
| `ERROR` | 失败 |

搜索阶段另有 `SEARCHING` / `AWAITING_SELECT`（候选等待勾选）。

#### 4.3.3 模型分工（配置）

| 用途 | 配置键 | 默认倾向 |
| --- | --- | --- |
| 搜索候选 | `search-model` | deepseek-v4-flash |
| 读网页材料 | `reading-model` | deepseek-v4-flash |
| 精读重构 | `distill-model` | deepseek-v4-pro |

DeepSeek 官方 Key 与知识库 DashScope Key **分开**。

#### 4.3.4 勾选约束（产品体验）

- 建议勾选约 **2～5** 条（实现侧常有上限，如最多 5～8）  
- 勾选后合蒸，不在搜索阶段缓存全文  

---

### 4.4 V3 需求明细（领域知识树）

#### 4.4.1 要解决的问题

同一大领域（如 Java）多次 V2 产出彼此孤立；博客/精读列表平铺，缺少「学了什么、缺什么」的复习导航。

成功标准：

> 选中 Java 树后，能按枝浏览已学 note，空枝提示补学；与 Java 无关的问题只问答、不污染树；用户对树结构有完全控制权。

#### 4.4.2 概念模型

| 概念 | 定义 |
| --- | --- |
| **domain** | 用户手动创建的大领域根（如 Java）；每用户下领域名唯一 |
| **branch（枝）** | 主题目录，L1 / L2，depth ≤ 2 |
| **leaf（叶）** | 对一篇 `knowledge_note` 的唯一挂载；同 note 全局只挂一处 |
| **snapshot** | 当前 domain 枝列表快照，供门闩与建议 |

原则：

1. 树以**已学内容生长**，不默认铺满标准课表；空枝稀疏，0 叶时强调「还没学」  
2. 继承「先预览后入库」：挂树 ≠ 入库  
3. AI **不建 domain、不静默改树**  
4. **BRANCH 不出 note**；**LEAF 走 V2**；LEAF 确认屏可顺带建 1 条枝  

#### 4.4.3 相关门闩（Gate）

输入：用户问题 + 当前 `domainId` + 枝快照  

输出核心：

| 字段 | 含义 |
| --- | --- |
| `related` | 是否属于当前领域 |
| `intent` | `CHAT_ONLY` / `BRANCH` / `LEAF` |
| `reason` / `answer` / `hints` | 展示与引导 |
| `suggestedBranchId` / `suggestedNewBranch` | 建枝/挂枝建议 |

前端行为：

| related | intent | 行为 |
| --- | --- | --- |
| false | CHAT_ONLY | 只展示回答与 hints；**禁用**搜文/合蒸/挂树 |
| true | BRANCH | 可确认建枝；**禁用**合蒸（除非改问成 LEAF） |
| true | LEAF | 进入 V2；仍须勾选 URL 与合蒸确认 |

补救：重新判定、树编辑器改挂；**不提供**跳过门闩强制搜文。后端对非法合蒸请求双保险拒绝。

#### 4.4.4 LEAF 路径顺序

```text
选中 domain → 门闩（related=true 且 intent=LEAF）
  → 搜索候选（有 domain 时可不生成 preview 大纲）
  → 勾选 URL → batch-url / job → note
  → 挂叶确认屏 → 用户确认 → leaf_attachment
```

门闩之前不得 `batch-url`。

#### 4.4.5 树操作需求

- Domain：创建 / 重命名 / 删除  
- Branch：新建 / 重命名 / 删除 / 合并 / 移动（仍满足 depth≤2、同父名唯一）  
- Leaf：挂载 / 移动 / 卸载；同枝允许多 note  
- 批量建议回挂：从未入当前树的 note 中一次给出挂枝建议（不重复蒸馏）  
- 空枝 CTA：「还没学 · 去搜一篇」（可带 skipGate 语境，见联调文档）  

#### 4.4.6 V3 职责边界

| 角色 | 做 | 不做 |
| --- | --- | --- |
| 用户 | 建域、改树、确认建枝/挂叶、发博/入库 | — |
| AI | related/intent、不相关问答、LEAF 时 V2、批量回挂建议 | 创建 domain、无人值守发博入库、同 note 多挂、自动同义合并 |
| 系统 | 同父去重、门闩失败拒绝合蒸、快照上限 | — |

---

## 5. 业务对象与状态机

### 5.1 核心对象

```text
source_document           原文与来源（URL / FILE / AGENT）；合蒸时可为材料包
knowledge_note            精炼稿 + 博客/入库状态（中间工作稿）
blog_post                 正式博客
knowledge_document        精炼稿对应的知识库虚拟 MD
knowledge_document_chunk  切块 + embedding（pgvector）
knowledge_reading_job     V2 异步搜索/合蒸任务
learning_domain           V3 领域根
learning_branch           V3 枝
leaf_attachment           V3 note 挂载
```

### 5.2 Note 发布 / 入库状态（概念）

**博客侧常见状态**：`NOT_PUBLISHED` → `DRAFT_CREATED` / `PUBLISHED`；编辑后可能 `SYNC_REQUIRED`；失败态如同步失败。

**入库侧常见状态**：`NOT_INDEXED` → `INDEXED`；编辑后可能 `REINDEX_REQUIRED`。

### 5.3 Reading Job 状态机

**status（生命周期）**：`PENDING` | `RUNNING` | `WAITING` | `SUCCESS` | `FAILED`

**progress（进度展示）**：`SEARCHING` → `AWAITING_SELECT` → `QUEUED` → `READING` → `DISTILLING` → `DONE` / `ERROR`

- `WAITING`（等用户勾选）不占全局 RUNNING 槽  
- 全局同时最多 1 个 RUNNING  

### 5.4 默认蒸馏结构（system prompt 意图）

精读输出应适合反复复习，结构倾向包含：

- 核心思想  
- 关键知识点（约 3～5 个）  
- 代码/配置精髓  
- 延伸问题  

可通过 `reading.distill.system_prompt` 或单次请求 `distillPrompt` 覆盖。

---

## 6. 信息架构与用户流程

### 6.1 导航与路由

工作区菜单「AI 精读」（`requireModule: knowledge`）：

| 菜单 | 路由 | 页面职责 |
| --- | --- | --- |
| 内容采集 | `/admin/knowledge/ingest` | URL / 文件 / AI 搜索三 Tab；V2 合蒸 |
| 精读任务 | `/admin/knowledge/jobs` | 设计上为异步监视面；当前实现常重定向/并入采集或列表条带 |
| 精读列表 | `/admin/knowledge/notes` | 筛选 + 文章架；可展示进行中 job |
| 审阅详情 | `/admin/knowledge/notes/:noteId` | 编辑 / 预览 / 发布 / 入库 |
| 领域知识树 | `/admin/knowledge/learning` | Domain 树 + 门闩 + 挂叶 |

壳层：`meta.room: 'reading'` → 跳过公共站 chrome，进入 `ReadingRoomShell`。

键盘快捷（壳层）：

| 键 | 行为 |
| --- | --- |
| `1` | 采集 |
| `2` / `3` | 文章列表 |
| `4` | 已在详情则停留，否则进列表 |
| `5` | 领域学习 |
| `Esc` | 回采集 |

上下文 chip：工作台 / 我的文章 / 审阅文章 / 领域学习。

### 6.2 主流程 A：URL / 文件（同步）

```text
采集页 → 提交 URL 或文件
  → 生成 note
  → 详情审阅编辑
  → 发博客 和/或 入知识库
```

### 6.3 主流程 B：AI 搜索合蒸（异步）

```text
填写学习目标 → POST search（或 reading-jobs/search）
  → 轮询至候选列表（AWAITING_SELECT）
  → 勾选 2～5 URL
  → POST batch-url（带 jobId 复用）
  → 轮询 READING / DISTILLING
  → SUCCESS + noteId → 详情
  → 确认后分流博客/知识库
```

离开采集页后，应能在任务监视面用服务端列表继续跟踪。

### 6.4 主流程 C：领域学习（门闩 + 挂叶）

```text
创建/选中 domain → 提问门闩
  ├─ CHAT_ONLY → 只问答
  ├─ BRANCH → 确认建枝
  └─ LEAF → V2 合蒸 → 挂叶确认 → 树上复习
空枝「去搜一篇」可进入补学；树编辑器负责移叶/合并等。
```

无 domain 的 V1/V2 采集链路与 V3 **并行**，互不替代。

---

## 7. 前后端架构

### 7.1 仓库拆分

| 层 | 位置 |
| --- | --- |
| 产品 PRD | `Ai-Backend/docs/ai-reading-workbench/` |
| 后端 API / Worker | `Ai-Backend`（`KnowledgeAdminController`、`LearningAdminController` 等） |
| 前端房间 UI | `AI-frontend`（本仓库） |
| 视觉原型 | `design-preview/Reading*.html`、`Reading Room v1.html` |

### 7.2 前端结构（概念）

```text
ReadingRoomShell（1920×1080 stage · 时段主题 · craft · topbar）
  ├── KnowledgeIngestPage      内容采集
  ├── KnowledgeNoteListPage    我的文章 + 任务条带
  ├── KnowledgeNoteDetailPage  审阅
  └── LearningView             领域树工作台
       ├── DomainTree / ContentPanel / Gate UI
       ├── AttachConfirm / NoteList / JobProgress
       └── Pinia learning-workbench.store
```

关键 composable / API：

| 文件 | 职责 |
| --- | --- |
| `api/knowledge/knowledgeNote.ts` | 采集、笔记、job |
| `api/learning.ts` | V3 领域树 |
| `useReadingJobTracker.ts` | 本地 job 辅助缓存（非真相源） |
| `useKnowledgeSearchDraft.ts` | 搜索草稿恢复 |
| `useReadingRoomCraft.ts` | 装饰交互 |
| `utils/readingSettings.ts` | UX 设置缓存 |
| `stores/learning-workbench.store.ts` | V3 状态 |

### 7.3 后端 API 面（摘要）

**知识 / 精读** `@/admin/knowledge`

| 方法 | 路径 | 作用 |
| --- | --- | --- |
| POST | `/ingest/url` | 单 URL |
| POST | `/ingest/file` | 文件 |
| POST | `/ingest/batch-url` | 多 URL 合蒸 |
| POST | `/reading-jobs/search` | 异步搜索 |
| GET | `/reading-jobs`、`/reading-jobs/{id}` | 任务列表与轮询 |
| CRUD | `/notes`、`/notes/{id}` | 笔记 |
| POST | `/notes/{id}/redistill` | 再蒸馏 |
| POST | `/notes/{id}/publish-blog`、`/sync-blog` | 博客 |
| POST | `/notes/{id}/index`、`/reindex` | 知识库 |
| POST | `/search/preview` | 同步搜索（调试） |

**学习树** `@/admin/knowledge/learning`：domains / tree / branches / merge / gate / attach / move / detach / leaves / unattached / batch-suggest。

---

## 8. UI 设计风格

### 8.1 视觉方向

**Reading Room v1 — Violet Observatory / 紫罗兰蒸馏工房**

- 固定舞台：**1920×1080**，圆角约 36px，经 `useHomeStageScale` 等比缩放适配视口  
- 主色：**violet `#9b8ce8`**，软底 `#e4dffd`  
- 气质：奶油玻璃制图板、星图、器皿扫描、银河扫光、遥测柱阵  
- 与站点其它房间（Home / Blog / Diary / Knowledge）共享「时段大气 + Station Tweaks」体系，但精读以紫罗兰为房间识别色  

CSS 自述：

> 精读房间 v1 — 五页 · leftover 高密度蒸馏工房 · 1920×1080 · violet #9b8ce8 · 3 栏 248 \| mid \| 280

### 8.2 设计 Token

| Token | 值 | 用途 |
| --- | --- | --- |
| `--ink` | `#4c5570` | 主字色 |
| `--ink-soft` / `--ink-faint` | `#7a83a0` / `#a5acc4` | 次级 / 弱提示 |
| `--room` / `--c-violet` | `#9b8ce8` | 房间主色 |
| `--c-lilac` | `#c79ae0` | 辅色 |
| `--c-blue` | `#6aaee8` | 信息/链路 |
| `--c-mint` | `#5fc4a5` | 成功/生长 |
| `--c-sun` | `#ffcf6e` | 高亮/午间 |
| `--c-sakura` | `#f490ad` | 点缀 |
| `--r-md` / `--r-sm` | `20px` / `14px` | 圆角 |
| `--col-side` / `--col-deck` | `248px` / `280px` | 左右栏宽 |
| `--mid-input-w` | `680px` | 中栏输入区 |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.5, 1)` | 弹性动效 |
| `--ease-out` | `cubic-bezier(0.22, 0.8, 0.32, 1)` | 出场缓动 |
| 阴影 | 蓝灰双层 soft shadow | 玻璃浮起 |

### 8.3 字体

| 角色 | 字体 |
| --- | --- |
| 正文 | PingFang SC / Hiragino Sans GB / Microsoft YaHei / Source Han Sans SC |
| 展示 / 头像趣味 | **ZCOOL KuaiLe（站酷快乐体）** `.font-display` |

避免默认 Inter/Roboto 作为房间主识别；学习子页另有 `learning-tokens.css`（粉紫主色 `#b8a4c9`、偏 admin 工具感），嵌在 Reading Shell 内但保留树工作台语义色（CHAT / BRANCH / LEAF）。

### 8.4 时段主题（Period Atmosphere）

`data-theme`：`morning` | `noon` | `dusk` | `night`

| 主题 | craft 倾向 |
| --- | --- |
| morning | 淡紫 + 樱粉，雾面偏紫 |
| noon | 暖日金 + 紫罗兰 + 蓝 |
| dusk | 暮粉 + 橙金 + 紫 |
| night | 深紫蓝，玻璃偏冷白 |

背景为多层径向渐变 + 斜向线性渐变，随主题约 1.4s 过渡。支持自动按时段切换与手动 StationTweaks（含墨色模式）。

### 8.5 构图契约（Compose Contract）

设计稿约定：

```text
function fixed / leftover = deco
```

- **功能面**（`fn-panel`）：采集控件、列表、编辑器等固定职责区  
- **leftover**（`deco-leftover`）：星图、器皿、柱阵等装饰吃掉剩余空间  

采集页适合「左紧凑操作 + 右高密度 craft」。  

**重要产品纠正**：非采集页（列表 / 详情 / 学习）主内容是列表、树、双栏编辑器，**不能**被定宽定高成「小纸条 + 大装饰留白」。装饰只能衬托，不能降低操作台可扫读性。详见问题归档 P4～P6。

### 8.6 布局骨架

三栏意象：

```text
[ side 248 ]  [ mid bay / 输入或正文 ]  [ deck 280 ]
```

页面内容区自 topbar 下约 `top: 84px` 起，左右 padding 约 48px；入场 `readingPageIn`（上移 14px + 淡入）。

### 8.7 组件气质

| 元素 | 风格 |
| --- | --- |
| 玻璃面板 | 高透明度白/雾面、柔阴影、中大圆角 |
| Toast | 深色胶囊底栏居中，letter-spacing 略松 |
| Chip / 状态 | 房间色描边或软底，忌堆叠大片假 KPI |
| 采集 Tab | 三入口并列，AI 搜索为合蒸主路径 |
| 详情 | **左编辑右预览** 为硬 UI 契约；原文默认摘要，全文弹窗 |
| 学习树 | 左树右文；门闩结果驱动禁用态；空枝补学 CTA |

### 8.8 动效与 Craft

至少两类有意运动（实现于 `useReadingRoomCraft`）：

1. **道具点击**：`.obs-prop.craft-hit` 弹跳 + toast  
2. **合蒸链路仪式**：器皿扫描 → 星辰扫光/光束 → 遥测柱与星位同步  

星名示例：星尘 / 流光 / 涟漪 / 暗斑。  

动效原则：制造「工房在运转」的在场感，**不得用假数据柱阵冒充真实 note/job 统计**。

### 8.9 设计原型演进

| 文件 | 阶段 |
| --- | --- |
| `design-preview/Reading v0～v2.html` | 早期精读视觉探索 |
| `design-preview/Reading Ingest v0.html` | 采集页专项 |
| `design-preview/Reading Room v0.html` | 房间壳雏形 |
| `design-preview/Reading Room v1.html` | **当前视觉规范源**（抽出为 `reading-room-v1.css`） |

与博客/知识库房间的禁止项（棕木黄铜、日记 scrapbook、把精读并入用户书架等）在站点设计复盘中单独约束；精读房间走紫罗兰天文台路线，与知识库「蓝强调书架」刻意区分。

### 8.10 UI 与产品的优先级

视觉服务于协议，优先级建议：

1. Job 持久化与可离页跟踪  
2. 列表 / 详情真实数据与状态  
3. 详情 Markdown 双栏可读  
4. 纠正错误 leftover 构图  
5. 再打磨 craft 装饰  

---

## 9. 站点设置（reading 模块）

| 设置键（概念） | 作用 |
| --- | --- |
| `distill.temperature` / `max_tokens` / `system_prompt` | 蒸馏行为与结构 |
| `publish.default_as_draft` | 默认发草稿 |
| `publish.ask_open_editor` | 发布后是否询问打开编辑器 |
| `redistill.confirm_required` | 再蒸馏二次确认 |
| `search.provider` | `deepseek` \| `tavily` \| `placeholder` |
| `ingest.sync_mode` | `async`（默认）\| `sync` |

前端通过 `readingSettings.ts` 读取 UX 相关项（会话内缓存）。

---

## 10. 验收与已知问题

### 10.1 验收脚本（产品）

**脚本 A — URL → 博客**：采集 → 详情改稿 → 发草稿 → 博客编辑器核对。  

**脚本 B — URL → 知识库**：采集 → 入库（已有/新建）→ 文档与切块可见 → RAG 能命中。  

**脚本 C — 修改后同步**：已发博且已入库的 note 改 MD → 出现需同步/需重建 → sync + reindex 恢复。  

**脚本 D — 半自动/真实搜索**：目标 → 候选 →（V2）勾选合蒸 → note。  

**脚本 E — V2 async**：`batch-url` 立即有 `jobId`；轮询至 SUCCESS；第二任务排队。  

**脚本 F — V3**：选 domain → 不相关只问答 → BRANCH 只建枝 → LEAF 合蒸挂叶 → 空枝补学 → 移叶。  

### 10.2 当前问题摘要（2026-07-28 归档）

| ID | 问题 | 本质 |
| --- | --- | --- |
| P1 | 数据/KPI 与业务不同步 | 装饰冒充真相源 |
| P2 | 蒸馏任务列表存不住 | 未以服务端 job 为源 |
| P3 | 搜索/蒸馏中切页断裂 | 违背 async 可离页设计 |
| P4 | 详情预览格式/留白异常 | 违背左编右预契约 |
| P5 | 非采集页大面积空白 | leftover 协议误用 |
| P6 | 设计比例压过产品协议 | 方向性错误 |

根因一句话：把「空白归装饰」执行过度，削弱了操作台协议。

---

## 11. 关键文件索引

### 产品文档（Ai-Backend）

| 文档 | 内容 |
| --- | --- |
| `00-overview.md` | 定位、原则、版本 |
| `01-v1-mvp.md` | MVP 阶段与验收 |
| `02-v1-backend.md` | 表结构与接口 |
| `03-v1-frontend.md` | V1 页面交互 |
| `04-v2-search-batch.md` | 搜索与合蒸 |
| `05-v3-agent-path.md` | 领域树 PRD |
| `06-v2-frontend-sync.md` | V2 联调 |
| `07-v3-backend.md` | V3 DDL/API |
| `08-v3-frontend-sync.md` | V3 联调 |

### 前端（本仓库）

| 路径 | 内容 |
| --- | --- |
| `src/components/reading/ReadingRoomShell.vue` | 房间壳 |
| `src/assets/styles/reading-room-v1.css` | 房间视觉系统 |
| `src/pages/admin/KnowledgeIngestPage.vue` | 采集 |
| `src/pages/admin/KnowledgeNoteListPage.vue` | 列表 |
| `src/pages/admin/KnowledgeNoteDetailPage.vue` | 详情 |
| `src/components/learning/*` | 领域学习 |
| `docs/READING_WORKBENCH_ISSUES.md` | 问题归档 |
| `docs/AI_READING_DESIGN.md` | **本文** |

---

## 附录：设计金句备忘

> 「先预览，后入库。」  

> 「博客与知识库解耦…… knowledge_note 是中间工作稿。」  

> 「Agent / 搜索只做输入源，不自动发博客、不自动入库。」  

> 「选中 Java 树后，能按枝浏览已学 note……用户对树结构有完全控制权。」  

> 「async 的目的就是：提交后不阻塞，可离页轮询。」  

> 「compose contract · function fixed / leftover = deco」——但 leftover 不能取代列表、预览与任务监视面。  

> 「管理员操作台，不是装饰观测站。」  

---

*本文为汇总说明，若与 `ai-reading-workbench` 目录冲突，以该目录对应版本 PRD / 联调文档为准；UI token 与壳行为以 `reading-room-v1.css` + `ReadingRoomShell.vue` 为准。*
