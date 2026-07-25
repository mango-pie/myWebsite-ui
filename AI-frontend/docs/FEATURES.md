# 纸间前端 · 待实现功能总览

> 状态：UI / 布局 / 首页已清空（API Shell），仅保留 `src/api`、integrations、SSE 工具与 `src/router` 路由表。完整界面参考 Git 标签 **v0.9.1**。  
> 本文档依据旧路由与接口整理，作为重建前端的功能清单与验收对照。  
> 更新日期：2026-07-25

---

## 0. 现状与重建范围

| 已保留 | 需重新实现 |
|--------|------------|
| `src/api/*` 后端客户端与 typings | 全部页面、布局、导航、主题 |
| `src/integrations/*` | 登录态、权限门闸、模块能力探测 UI |
| `src/request.ts`、SSE 工具 | 路由、状态管理、表单与列表交互 |
| OpenAPI 生成配置 | 全局组件（页头、播放器、宠物等，按需） |

**模块开关**（`GET /app/modules` → `getAppModules`）：菜单与路由应按后端返回的模块 key 显隐。

已知模块 key：`blog` · `diary` · `chat` · `knowledge` · `app-lab` · `study` · `ops`

**角色**（历史约定）：访客 / 登录用户 `user` / 管理员 `admin` / 学习管理员 `administrator`（以实际后端角色为准）。

---

## 1. 基础壳层与横切能力（P0）

重建任何业务页之前必须先有：

| 功能 | 说明 | 接口 / 依赖 |
|------|------|-------------|
| 应用启动与 HTTP | Axios、Cookie Session、大整数安全解析、401/403 提示 | `request.ts`、`safeJson` |
| 模块能力探测 | 首屏拉取模块开关，控制菜单与路由 | `getAppModules` |
| 路由与壳布局 | 公开壳 / 工作区壳；路由 meta（模块、角色、room） | Vue Router |
| 登录态 | 拉取当前用户、未登录跳转、退出 | `userController`：`getLoginUser`、`userLogout` 等 |
| 权限门闸 | 按角色与模块隐藏入口；管理页鉴权 | 前端守卫 + 后端 401/403 |
| 站点文案配置 | 站名、房间名、关于页文案等可配置入口 | 本地 `site` 配置 + 可选 `siteSettings` |
| 全局反馈 | Toast / Modal / 空态 / 加载态 | UI 库自定 |
| 图片上传 | 通用图床（头像、封面、正文插图） | `imageUploadController`、`blogImageController` |

可选横切（P2，旧版有过）：

- 背景轮播、鼠标轨迹、悬浮球菜单、桌宠
- 网易云音乐悬浮播放器 / 歌词（`integrations/neteaseMusic`）
- TTS 朗读（`ttsController`）

---

## 2. 账号与个人（P0）

| 功能 | 路径建议 | 能力要点 | 主要接口 |
|------|----------|----------|----------|
| 登录 | `/user/login` | 账密登录、跳转回原页 | `userLogin` |
| 注册 | `/user/register` | 注册并引导登录 | `userRegister` |
| 个人信息 | `/user/profile` | 查看/改资料、头像 | `getLoginUser`、`updateMyUser`、头像上传 |
| 关于页 | `/about` | 站主介绍、技能、联系方式 | 本地配置为主 |

---

## 3. 首页 / 门厅（P0）

| 功能 | 路径 | 能力要点 |
|------|------|----------|
| 首页 | `/` | 品牌入口；跳转随笔 / 日记 / 知识 / 对话 / 实验室等（按登录与模块） |
| 可选 | — | 最新随笔摘要、实验数量、今日一言（`integrations/hitokoto`） |

---

## 4. 随笔 · Blog（模块 `blog`）

### 4.1 公开阅读

| 功能 | 路径建议 | 能力要点 | 主要接口 |
|------|----------|----------|----------|
| 随笔列表 | `/blog` | 分页、搜索标题、分类/标签筛选、排序（最新/热门）、布局切换 | `queryBlogPostPage`、`getPublishedBlogPostPage`、`getAllCategories`、`getTagCloud` |
| 文章详情 | `/blog/:id` | Markdown 渲染、阅读数、点赞、分享链接、相关文、标签跳转 | `getBlogPostVo`、`incrementViewCount`、`incrementLikeCount` |
| 按分类 | `/category/:name` | 分类下文章列表 | `getBlogPostPageByCategory` |
| 按标签 | `/tag/:name` | 标签下文章列表 | `getBlogPostPageByTag` |

### 4.2 创作与管理

| 功能 | 路径建议 | 能力要点 | 主要接口 |
|------|----------|----------|----------|
| 发布 / 编辑 | `/blog/create`、`/blog/edit/:id` | 标题、摘要、正文、封面、分类标签、草稿/发布 | `addBlogPost`、`updateBlogPost`、`updateBlogPostStatus`、图片上传 |
| 博客管理（管理端） | `/admin/blogManage` | 列表、置顶、改状态、删除 | `queryBlogPostPage`、`toggleTopStatus`、`deleteBlogPost`、分类/标签 CRUD |
| 分类 CRUD | 管理端内 | 增删改查、分页 | `blogCategoryController` |
| 标签 CRUD | 管理端内 | 增删改查、标签云、文章关联 | `blogTagController`、`blogPostTagController` |

**站点设置相关**：点赞/浏览开关、默认分页等（见「站点设置」）。

---

## 5. 日记 · Diary（模块 `diary`）

| 功能 | 路径建议 | 能力要点 | 主要接口 |
|------|----------|----------|----------|
| 日记列表 | `/diary` | 按日期倒序列表、预览、跳转详情 | `queryDiaryPage` |
| 写日记 | `/diary/write` | 按日写作、标题、心情、正文、自动保存（可选）、AI 辅助（可选） | `saveDiaryEntry`、`getDiaryByDate` |
| 日记详情 | `/diary/:id` | 渲染正文、编辑/删除、上一篇/下一篇 | `getDiaryEntryVo`、`getDiaryPrevNext`、`deleteDiaryEntry` |
| 月历（可选） | 列表旁 | 按月有日记的日期点 | `listDiaryByMonth` |

权限：登录用户私有；无公开访客流。

---

## 6. AI 对话 · Chat（模块 `chat`）

| 功能 | 路径建议 | 能力要点 | 主要接口 / 工具 |
|------|----------|----------|-----------------|
| 对话入口 | `/chat` | 选角色/模式、开新会话 | `createConversation`、`resolveDefault` |
| 会话页 | `/chat/:conversationId` | 侧栏会话列表、消息流、SSE 流式回复、停止生成 | `listConversations`、`listMessages`、`deleteConversation`、流式工具 `sseChatStream` |
| Ask / Agent 模式 | 会话内 | 分段 plan、工具调用展示、UI Action（刷新/跳转/toast） | SSE 事件：`chunk` / `segment_plan` / `tool_call` / `done` 等 |
| 附件 | 会话内 | 上传并挂到消息 | `integrations/chatAttachmentController` |
| 对话管理（管理端） | `/admin/chatHistoryManage` | 管理员分页查看/清理历史 | `listChatHistoryByPageForAdmin` 等 |

相关：应用对话见「实验室」。

---

## 7. 知识库 · Knowledge（模块 `knowledge`）

### 7.1 用户侧

| 功能 | 路径建议 | 能力要点 | 主要接口 |
|------|----------|----------|----------|
| 知识库列表 | `/knowledge` | 创建/编辑/删除、可见性、状态、检索 | `listKnowledgeBases`、`createKnowledgeBase`、`updateKnowledgeBase`、`deleteKnowledgeBase` |
| 知识库详情 | `/knowledge/:kbId` | 文档列表、上传、解析、分块、下载、删除 | `knowledgeDocument.*` |
| 知识库问答 | `/knowledge/:kbId/chat` | RAG 问答、SSE 流式 | `knowledgeChat`、`knowledgeSseStream` |

### 7.2 AI 精读 / 管理侧

| 功能 | 路径建议 | 能力要点 | 主要接口 |
|------|----------|----------|----------|
| 内容采集 | `/admin/knowledge/ingest` | URL / 文件 / 批量 URL 入库 | `ingestKnowledgeUrl`、`ingestKnowledgeFile`、`ingestKnowledgeBatchUrl` |
| 精读任务 | `/admin/knowledge/jobs` | 任务进度轮询 | `getKnowledgeReadingJob` |
| 精读列表 | `/admin/knowledge/notes` | 列表、筛选、删除、检索预览 | `listKnowledgeNotes`、`searchKnowledgePreview`、`deleteKnowledgeNote` |
| 精读详情 | `/admin/knowledge/notes/:noteId` | 详情编辑、再蒸馏、发博客/同步、入向量索引 | `getKnowledgeNoteDetail`、`updateKnowledgeNote`、`redistillKnowledgeNote`、`publishKnowledgeNoteBlog`、`syncKnowledgeNoteBlog`、`indexKnowledgeNote`、`reindexKnowledgeNote` |
| 领域知识树 | `/admin/knowledge/learning` | 领域/分支树、挂叶、合并、门禁、批量建议 | `learning.ts` 全套 |

文档入库链路（后端已有）：上传 → MinIO → 解析 → 切块 → Embedding → pgvector；前端需展示状态与失败重试。

---

## 8. 实验室 · App Lab（模块 `app-lab`）

| 功能 | 路径建议 | 能力要点 | 主要接口 |
|------|----------|----------|----------|
| 实验室首页 | `/lab` | 一句话生成应用、我的实验列表 | `addApp`、`listMyAppByPage`、`chatToGenCode`（流式） |
| 应用对话 | `/app/chat/:appId` | 对应用继续对话改代码、预览/部署相关 | `chatToGenCode`、应用历史接口 |
| 应用编辑 | `/app/edit/:appId` | 改名称/封面/配置 | `getAppById`、`updateApp` |
| 应用管理（管理端） | `/admin/appManage` | 全站应用 CRUD、精选、部署 | `listAppByPageForAdmin`、`updateAppByAdmin`、`deployApp`、`listFeaturedAppByPage` 等 |

---

## 9. 学习工作台 · Study（模块 `study`）

路径建议：`/administrator/study`（历史路径；重建时可改为 `/study`，需同步后端权限）。

| 功能 | 能力要点 | 主要接口 |
|------|----------|----------|
| 工作区初始化 | 首次进入初始化列表等 | `initWorkspace` |
| 清单 / 列表 | 多列表、排序 | `studyListController` |
| 任务 | 增删改查、详情 | `studyTaskController` |
| Checklist | 任务检查项 | `studyChecklistController` |
| 习惯 | 习惯面板与日历 | `studyHabitController` |
| 专注 / 番茄钟 | 开始/暂停/恢复/完成/放弃、进行中会话 | `studyFocusController` |
| 统计 | 今日 / 区间统计 | `studyStatsController` |

角色：历史上偏向 `administrator`，重建时与后端确认。

---

## 10. 管理后台 · Admin（P1）

| 功能 | 路径建议 | 能力要点 | 主要接口 |
|------|----------|----------|----------|
| 用户管理 | `/admin/userManage` | 用户分页、改角色/状态、删除等 | `userController` 管理接口 |
| 站点设置 | `/admin/settings/:module` | 分模块配置（site / blog / knowledge / …） | `siteSettings` |
| 变更审计 | `/admin/settings/audit` | 设置变更记录 | `siteSettings` 审计相关 |
| 依赖健康 | `/admin/settings/health` | 外部依赖健康检查 | health 相关 API |

另见上文：博客管理、应用管理、对话管理、知识精读系列。

---

## 11. 运维中心 · Ops（模块 `ops`，P2）

| 功能 | 路径建议 | 能力要点 | 主要接口 |
|------|----------|----------|----------|
| AI 用量 | `/admin/ops/usage` | Token / 调用量 | `opsObservability` |
| 操作审计 | `/admin/ops/audit` | 操作日志 | 同上 |
| 业务统计 | `/admin/ops/stats` | 业务指标 | 同上 |
| 访问日志 | `/admin/ops/access-logs` | 访问记录 | 同上 |

---

## 12. 建议实现优先级（重建排期）

```text
P0  壳层 + 登录注册 + 首页
    → 随笔读/写（公开主链路）
    → 日记（私有主链路）
P1  对话（SSE）
    → 知识库列表/文档/问答（SSE）
    → 实验室基础生成与对话
P2  AI 精读 + 领域知识树
    → 学习工作台
    → 管理后台（用户 / 站点设置）
P3  运维中心、音乐播放器、TTS、桌宠等体验增强
```

每完成一块，用本文对应用例做冒烟验收；接口以 `src/api` 为准，可用 `npm run openapi2ts` 与后端同步。

---

## 13. 旧版路由速查（v0.9.1）

| 区域 | 路径 |
|------|------|
| 公开 | `/` `/about` `/blog*` `/category/:name` `/tag/:name` `/lab` `/user/login` `/user/register` |
| 工作区 | `/diary*` `/knowledge*` `/chat*` `/app/*` `/user/profile` `/administrator/study` |
| 管理 | `/admin/userManage` `/admin/appManage` `/admin/blogManage` `/admin/knowledge/*` `/admin/chatHistoryManage` `/admin/settings*` `/admin/ops*` |

取回旧 UI 参考：

```bash
git checkout v0.9.1 -- AI-frontend/src
```

---

## 14. 相关文档

| 文档 | 用途 |
|------|------|
| [README.md](../README.md) | API Shell 说明 |
| [00-project-overview.md](./00-project-overview.md) | 知识库主链路与阶段规划（偏 RAG 产品叙述） |
| [01～05](./README.md) | V1–V5 分阶段需求（知识库产品线） |
| [brand-spec.md](./brand-spec.md) | 旧「纸间」视觉规格（可选参考，不强制） |
| `chat-*-frontend-guide.md` | 对话 / AstrBot / Agent 前端协议 |
| `frontend-tts-api.md` | TTS 接口说明 |

---

## 15. 验收检查清单（总）

- [ ] 未登录可浏览公开随笔 / 关于 / 实验室入口（按模块开关）
- [ ] 登录注册、个人资料、退出闭环
- [ ] 模块关闭时对应菜单与路由不可达或友好提示
- [ ] 随笔：列表筛选 → 详情阅读 → 发布编辑 → 管理端维护
- [ ] 日记：列表 → 写作保存 → 详情 → 前后篇
- [ ] 对话：建会话 → SSE 流式 → 历史与删除
- [ ] 知识库：建库 → 上传文档 → 解析状态 → RAG 问答流式
- [ ] 精读：采集 → 任务进度 → 笔记详情 →（可选）发博客 / 挂知识树
- [ ] 实验室：生成应用 → 应用内对话 → 管理端可见
- [ ] 管理端与运维页仅管理员可进；403/401 行为正确

---

*本文是「要做什么」的功能台账，不是视觉稿。新 UI 方向确定后，可另附交互与视觉说明，并在本文件标注各功能完成状态。*
