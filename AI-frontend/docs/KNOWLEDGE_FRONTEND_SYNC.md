# 知识库前端对接文档（Ai-Backend）

面向前端同学的正式对接说明。后端已内置 Knowledge AI（V1–V4），与博客、AI 生图等共用同一套登录态。

> 配套文档：[后端集成说明](./KNOWLEDGE_INTEGRATION.md)

---

## 1. 产品边界（先对齐，避免串模块）

| 模块 | 路由前缀 | 用途 | 前端建议页面 |
| --- | --- | --- | --- |
| 知识库 | `/api/kb/**` | 知识库 CRUD、文档上传解析、RAG 问答 | `/knowledge`、`/knowledge/:kbId`、`/knowledge/chat` |
| 博客 | `/api/blog/**` | 文章发布、分类标签 | 保持现有博客页 |
| 生图 Chat | `/api/chat/**` | AI 对话生图 | 保持现有 Chat 页 |
| 双引擎预览（管理员） | `/api/admin/knowledge/**` | URL 采集 + AI 精读 | `/admin/knowledge`（可选） |

**不要**把知识库问答接到 `/api/chat/**`，那是另一条业务线。

---

## 2. 基础约定

### 2.1 Base URL

```text
{HOST}/api
```

本地默认：`http://localhost:8123/api`

### 2.2 鉴权

- 与现有 Ai-Backend **同一套 Session Cookie**（登录后浏览器自动带上）
- 所有 `/kb/**` 接口需要已登录用户
- `/admin/knowledge/**` 额外要求 **管理员角色**（`@AuthCheck`）
- 未登录：按项目现有错误码处理（通常 40100 等）

Axios / fetch 请开启：

```ts
credentials: 'include'
// 或 axios: withCredentials: true
```

### 2.3 统一响应结构

除 SSE 外，均返回：

```ts
interface BaseResponse<T> {
  code: number;      // 0 = 成功
  data: T;
  message: string;
}
```

分页（MyBatis Flex `Page`）：

```ts
interface Page<T> {
  records: T[];
  pageNumber: number;
  pageSize: number;
  totalRow: number;
  totalPage: number;
}
```

> 若前端已有对 `Page` 字段的适配层，以实际接口返回为准；常见字段为 `records` / `totalRow`。

---

## 3. TypeScript 类型建议

```ts
/** 知识库 */
export interface KnowledgeBaseVO {
  id: number;
  name: string;
  description?: string;
  userId: number;
  visibility: 'private' | 'public' | string;
  status: number; // 1 正常，0 禁用等（以后端为准）
  documentCount: number;
  createTime: string;
  updateTime: string;
}

export interface KnowledgeBaseCreateRequest {
  name: string;
  description?: string;
  visibility?: string; // 默认 private
}

export interface KnowledgeBaseUpdateRequest {
  name?: string;
  description?: string;
  visibility?: string;
  status?: number;
}

export interface KnowledgeBaseQueryRequest {
  pageNum?: number;   // 默认 1
  pageSize?: number;  // 默认 10
  sortField?: string;
  sortOrder?: 'ascend' | 'descend' | string; // 默认 descend
  name?: string;
  visibility?: string;
  status?: number;
}

/** 文档 */
export type ParseStatus =
  | 'PENDING'
  | 'PARSING'
  | 'SUCCESS'
  | 'FAILED'
  | string;

export interface KnowledgeDocumentVO {
  id: number;
  knowledgeBaseId: number;
  userId: number;
  sourceDocumentId?: number;
  fileName: string;
  fileType: string; // pdf / docx / txt / md
  fileSize: number;
  bucketName?: string;
  objectKey?: string;
  parseStatus: ParseStatus;
  chunkCount?: number;
  errorMessage?: string;
  parsedAt?: string;
  createTime: string;
  updateTime: string;
}

export interface KnowledgeDocumentQueryRequest {
  pageNum?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: string;
  fileName?: string;
  fileType?: string;
  parseStatus?: string;
}

export interface KnowledgeChunkVO {
  id?: number;
  knowledgeBaseId?: number;
  knowledgeDocumentId?: number;
  sourceDocumentId?: number;
  chunkIndex: number;
  heading?: string;
  content: string;
  tokenCount?: number;
  metadata?: string;
  createTime?: string;
  score?: number;
}

export interface KnowledgeDownloadUrlVO {
  url: string;
  expireSeconds?: number;
}

/** 会话与消息 */
export interface KnowledgeConversationVO {
  id: number;
  userId: number;
  knowledgeBaseId?: number;
  title?: string;
  lastMessage?: string;
  createTime: string;
  updateTime: string;
}

export interface KnowledgeReferenceVO {
  chunkId?: number;
  knowledgeDocumentId?: number;
  sourceDocumentId?: number;
  chunkIndex?: number;
  documentName?: string;
  content?: string;
  similarity?: number; // BigDecimal
}

export interface KnowledgeMessageVO {
  id: number;
  conversationId: number;
  userId: number;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM' | string; // 后端存大写
  content: string;
  modelName?: string;
  createTime: string;
  references?: KnowledgeReferenceVO[];
}

export interface KnowledgeChatRequest {
  conversationId?: number;   // 续聊时传
  knowledgeBaseId: number;   // 必填（按知识库问答）
  sourceDocumentId?: number; // 预留：单文档模式
  mode?: 'knowledgeBase' | 'document' | string; // 默认 knowledgeBase
  question: string;
  topK?: number;
}

export interface KnowledgeChatResponse {
  conversationId: number;
  userMessageId: number;
  assistantMessageId: number;
  answer: string;
  references: KnowledgeReferenceVO[];
}

/** 管理员：URL 采集（双引擎预览） */
export interface KnowledgeProcessRequest {
  inputType?: string;       // 如 url
  url: string;
  knowledgeBaseId?: number;
  title?: string;
  tags?: string;
  generateSummary?: boolean; // 默认 true
  enableRag?: boolean;       // 默认 true
}
```

---

## 4. API 清单

以下路径均相对于 `{HOST}/api`。

### 4.1 知识库 CRUD

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/kb/knowledge-bases` | 分页列表（Query：`pageNum` `pageSize` `name` `status`） |
| POST | `/kb/knowledge-bases` | 创建 |
| GET | `/kb/knowledge-bases/{id}` | 详情 |
| PUT | `/kb/knowledge-bases/{id}` | 更新 |
| DELETE | `/kb/knowledge-bases/{id}` | 删除（会级联清理关联数据，以后端实现为准） |

创建示例：

```http
POST /api/kb/knowledge-bases
Content-Type: application/json

{
  "name": "Java 面试库",
  "description": "常用八股与项目经验",
  "visibility": "private"
}
```

### 4.2 文档管理

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/kb/knowledge-bases/{kbId}/documents` | 文档分页 |
| POST | `/kb/knowledge-bases/{kbId}/documents` | 上传（`multipart/form-data`，字段名 **`file`**） |
| GET | `/kb/documents/{id}` | 文档详情 |
| DELETE | `/kb/documents/{id}` | 删除 |
| GET | `/kb/documents/{id}/download-url` | 预签名下载地址 |
| POST | `/kb/documents/{id}/parse` | 触发解析 + 切块 + 向量入库 |
| GET | `/kb/documents/{id}/chunks` | 查看切块（Query：`pageNum` `pageSize`） |

上传限制（后端配置）：

- 单文件最大 **50MB**
- 类型：`pdf` / `docx` / `txt` / `md`

上传示例：

```ts
const form = new FormData();
form.append('file', file); // 字段名必须是 file

await axios.post(`/api/kb/knowledge-bases/${kbId}/documents`, form, {
  withCredentials: true,
  headers: { 'Content-Type': 'multipart/form-data' },
});
```

#### 解析状态与前端轮询建议

| parseStatus | UI 建议 |
| --- | --- |
| `PENDING` | 待解析，显示「开始解析」按钮 |
| `PARSING` | 解析中，禁用按钮，可轮询详情 |
| `SUCCESS` | 可问答；展示 `chunkCount` |
| `FAILED` | 展示 `errorMessage`，允许重试 `parse` |

推荐流程：

1. 上传成功 → 自动或手动调 `POST .../parse`
2. 若解析较慢，每 2–3s `GET /kb/documents/{id}`，直到 `SUCCESS` / `FAILED`
3. `SUCCESS` 后可进聊天页，或打开切块预览

### 4.3 会话与 RAG 问答

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/kb/conversations?knowledgeBaseId=` | 会话列表（可按知识库过滤） |
| DELETE | `/kb/conversations/{id}` | 删除会话 |
| GET | `/kb/conversations/{id}/messages` | 消息分页（`pageNum` 默认 1，`pageSize` 默认 20） |
| POST | `/kb/chat` | 同步问答（一次性返回完整答案） |
| POST | `/kb/chat/stream` | **SSE 流式问答（推荐）** |

同步问答请求体：

```json
{
  "knowledgeBaseId": 1,
  "conversationId": null,
  "question": "Spring Boot 自动配置原理？",
  "topK": 5,
  "mode": "knowledgeBase"
}
```

返回 `KnowledgeChatResponse`，含 `answer` 与 `references`。

续聊时带上上次返回的 `conversationId`。

---

## 5. SSE 流式对接（重点）

### 5.1 请求

```http
POST /api/kb/chat/stream
Content-Type: application/json
Cookie: JSESSIONID=...

{
  "knowledgeBaseId": 1,
  "conversationId": 12,
  "question": "解释一下 IOC",
  "topK": 5
}
```

响应：`Content-Type: text/event-stream`

### 5.2 事件约定

| event | data | 说明 |
| --- | --- | --- |
| `message` | 文本片段（增量） | 追加到助手气泡 |
| `done` | 当前为空字符串 `""` | 流结束信号；**不要**期望这里带完整 JSON |
| `error` | 错误信息字符串 | 展示错误态 |

流结束后请用本地拼接的 `message` 文本作为答案，并调用  
`GET /kb/conversations/{id}/messages` 拉取含 `references` 的助手消息。  
（若本地尚无 `conversationId`，可先 `GET /kb/conversations?knowledgeBaseId=` 取最新会话。）

### 5.3 前端示例（fetch + ReadableStream）

原生 `EventSource` **只支持 GET**，本接口是 POST，请用 `fetch`：

```ts
async function streamKnowledgeChat(
  body: KnowledgeChatRequest,
  handlers: {
    onMessage: (chunk: string) => void;
    onDone: () => void;
    onError: (msg: string) => void;
  }
) {
  const res = await fetch('/api/kb/chat/stream', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    handlers.onError(`HTTP ${res.status}`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE 事件以空行分隔
    const parts = buffer.split('\n\n');
    buffer = parts.pop() || '';

    for (const part of parts) {
      const lines = part.split('\n');
      let event = 'message';
      let data = '';
      for (const line of lines) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        if (line.startsWith('data:')) data += line.slice(5).trim();
      }
      if (!data) continue;

      if (event === 'message') {
        handlers.onMessage(data);
      } else if (event === 'done') {
        // data 目前可能为空；用本地累计文本 + 刷新消息列表拿 references
        handlers.onDone();
      } else if (event === 'error') {
        handlers.onError(data);
      }
    }
  }
}
```

### 5.4 UI 交互建议

1. 用户发送 → 立刻插入 user 气泡 + 空的 assistant 气泡（loading）
2. 收到 `message` → 追加 token（可做打字机效果）
3. 收到 `done` → 结束 loading；用累计文本作为答案；刷新消息列表拿 `references`
4. 收到 `error` → assistant 气泡改为错误提示，允许重试

引用区展示字段建议：`documentName`、`similarity`、`content` 摘要。

> 同步接口 `POST /kb/chat` 会直接返回完整 `KnowledgeChatResponse`（含 `conversationId` 与 `references`），适合简单联调；正式聊天页优先 SSE。

---

## 6. 建议页面与路由

| 路由 | 页面 | 调用接口 |
| --- | --- | --- |
| `/knowledge` | 知识库列表 | GET/POST/PUT/DELETE `/kb/knowledge-bases` |
| `/knowledge/:kbId` | 知识库详情 + 文档列表 | documents 系列 + parse |
| `/knowledge/:kbId/docs/:docId` | 文档详情 / 切块预览 | get、chunks、download-url |
| `/knowledge/:kbId/chat` | RAG 聊天 | conversations + chat/stream |
| `/admin/knowledge` | URL 采集精读（管理员） | `/admin/knowledge/**` |

侧边导航建议独立入口「知识库」，不要塞进博客或生图菜单。

---

## 7. 管理员双引擎预览（可选）

仅管理员可见。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/admin/knowledge/process` | URL 采集（Jina）；可选顺带精读 |
| POST | `/admin/knowledge/{sourceDocumentId}/distill` | 对已采集内容做 AI 精读 |
| POST | `/admin/knowledge/retry/{sourceDocumentId}` | 精读失败重试 |

`process` 请求体示例：

```json
{
  "inputType": "url",
  "url": "https://example.com/article",
  "knowledgeBaseId": 1,
  "title": "可选标题",
  "tags": "rag,spring",
  "generateSummary": true,
  "enableRag": true
}
```

说明：

- 当前为 **预览能力**；完整「精读笔记 → 发布博客」可后续接博客模块
- `enableRag` 表示意图写入知识库检索链路；前端可先展示状态，不必强依赖即时可搜

---

## 8. 与现有前端模块的差异对照

| 点 | 博客 / 生图 Chat | 知识库 |
| --- | --- | --- |
| 前缀 | `/blog`、`/chat` | `/kb` |
| 鉴权 | Session | 同 Session |
| 上传 | 若有，字段可能不同 | **固定字段名 `file`** |
| 流式 | 若生图有 SSE，事件名可能不同 | `message` / `done` / `error` |
| 核心数据 | 文章、图片任务 | 知识库、文档、切块、引用 |

建议：新建 `src/api/knowledge.ts`（或同等路径），不要复用 `chat.ts` 的类型与 URL。

---

## 9. 联调检查清单

- [ ] 登录后 Cookie 能带到 `/api/kb/**`
- [ ] 创建知识库 → 列表可见
- [ ] 上传 pdf/md → 详情 `parseStatus=PENDING`
- [ ] 触发 parse → 最终 `SUCCESS`，`chunkCount > 0`
- [ ] `/chat` 同步问答有答案与 references
- [ ] `/chat/stream` 能增量显示，并在 `done` 拿到完整响应
- [ ] 续聊带 `conversationId`，历史消息可拉取
- [ ] 未登录访问返回业务错误，前端跳转登录
- [ ] 管理员才能看到 `/admin/knowledge` 入口

---

## 10. 常见问题

**Q: 上传 413 / 失败？**  
检查文件是否超过 50MB、字段名是否为 `file`、类型是否在白名单。

**Q: parse 一直 PENDING？**  
确认已调 `POST .../parse`；后端依赖 MinIO + Embedding + pgvector，环境未就绪会 `FAILED` 并带 `errorMessage`。

**Q: 流式没事件？**  
确认用的是 POST + fetch，不是 EventSource；中间件/Nginx 勿缓冲 SSE（`X-Accel-Buffering: no` 等）。

**Q: 问答无引用？**  
知识库需至少有一份 `parseStatus=SUCCESS` 的文档；`topK` 可调大试一下。

---

## 11. 变更记录

| 日期 | 说明 |
| --- | --- |
| 2026-07-13 | 初版：对齐 Ai-Backend 已实现的 `/kb` 与 `/admin/knowledge` 接口 |
