# AI 场景平台 - 前端

一个基于 Vue 3 的 AI 驱动网站生成平台，用户通过自然语言提示词与 AI 对话，实时生成完整的 HTML/CSS/JS 网站，并支持一键部署预览。

---

## 技术栈

| 技术           | 版本   | 用途                        |
| -------------- | ------ | --------------------------- |
| Vue 3          | ^3.5   | 核心框架（Composition API） |
| Vue Router     | ^5.0   | 客户端路由                  |
| Pinia          | ^3.0   | 全局状态管理                |
| Ant Design Vue | ^4.2   | UI 组件库                   |
| Axios          | ^1.13  | HTTP 请求客户端             |
| marked         | ^17.0  | Markdown 渲染               |
| highlight.js   | ^11.11 | 代码语法高亮                |
| Vite           | ^7.3   | 构建工具                    |
| TypeScript     | ~5.9   | 类型系统                    |

---

## 快速开始

**环境要求**：Node.js `^20.19.0` 或 `>=22.12.0`

```bash
# 克隆项目
git clone <repo-url>
cd ai-frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

开发服务器默认运行在 `http://localhost:5173`，后端服务需在 `http://localhost:8123` 启动。

---

## 环境变量

项目使用 Vite 环境变量，所有变量以 `VITE_` 前缀开头。

| 变量                    | 说明                       | 开发默认值                         |
| ----------------------- | -------------------------- | ---------------------------------- |
| `VITE_API_BASE_URL`     | 后端 API 根路径            | `http://localhost:8123/api`        |
| `VITE_PREVIEW_BASE_URL` | 应用生成预览静态文件根路径 | `http://localhost:8123/api/static` |
| `VITE_DEPLOY_BASE_URL`  | 部署后应用的访问域名       | `http://localhost`                 |

修改 `.env.development` 或 `.env.production` 来覆盖默认值。

---

## 构建与部署

```bash
# 类型检查 + 生产构建
npm run build

# 本地预览构建产物
npm run preview
```

构建产物输出到 `dist/` 目录，部署前需确认 `.env.production` 中的三个域名变量已正确配置。

---

## 执行逻辑

### 1. 应用启动流程

```
main.ts
  ├── createApp(App)
  ├── app.use(createPinia())          # 注册状态管理
  ├── app.use(router)                 # 注册路由（含 beforeEach 守卫，见 access.ts）
  ├── app.use(Antd)                   # 注册 UI 组件库
  ├── app.directive('permission', …)  # 注册 v-permission 自定义指令
  └── app.mount('#app')

App.vue（根组件）
  ├── 调用 loginUserStore.fetchLoginUser()  # 静默拉取当前登录用户
  └── 渲染 <BasicLayout />                  # 全站统一布局
```

`App.vue` 挂载时立即异步拉取登录态，失败时静默处理（保持"未登录"状态），不阻塞页面渲染。

---

### 2. 路由与权限守卫

路由配置在 `src/router/index.ts`，权限规则集中在 `src/config/permission.ts`。

**路由守卫流程（`src/access.ts`）**：

```
router.beforeEach
  ├── 首次进入：await fetchLoginUser()   # 确保用户状态已加载
  ├── getRequiredRole(to.path)           # 查询该路径所需权限
  │     ├── 无要求 → next()
  │     ├── 需登录 → 未登录则跳 /user/login
  │     └── 需管理员 → 非管理员则跳 /
  └── next()
```

**权限配置方式**（`src/config/permission.ts`）：

- `ROUTE_PERMISSIONS`：路径 → 所需角色的映射表，新增受保护页面只需加一行
- `MENU_ITEMS`：导航菜单配置，`requiredRole` 字段控制菜单项的可见性
- `/admin/*` 路径前缀默认需要 `admin` 角色，无需逐一配置

**三种权限使用方式**：

```ts
// 1. 路由守卫（自动）：src/access.ts

// 2. 模板中隐藏元素
<button v-permission="'admin'">仅管理员可见</button>

// 3. JS 逻辑中判断
import { hasPermission, isAdmin } from '@/utils/permission'
if (isAdmin()) { ... }
```

---

### 3. 状态管理

使用 Pinia，目前只有一个 Store：

**`src/stores/loginUser.ts`**

```ts
{
  loginUser: LoginUserVO // 当前登录用户，未登录时 id 为空
  fetchLoginUser() // 请求 /user/get/login 并写入 store
  setLoginUser(user) // 直接覆盖（用于登出清空）
}
```

登录态在以下时机被更新：

- `App.vue` 挂载时（静默，不阻塞渲染）
- `BasicLayout.vue` 的 `onMounted`（确保布局渲染时菜单权限正确）
- `access.ts` 路由守卫首次触发时（确保鉴权前用户已加载）

---

### 4. API 请求层

**`src/request.ts`** — 全局 Axios 实例：

```
请求发出
  └── baseURL = VITE_API_BASE_URL（环境变量）
      withCredentials = true（携带 Cookie，Session 登录）
      transformResponse：大整数安全处理
        └── 正则将 16 位以上数字转为字符串，防止雪花 ID 精度丢失

响应返回
  └── 拦截器检查 data.code
        └── 40100（未登录）→ 跳转 /user/login?redirect=当前页
```

**API 文件**（`src/api/`）由 `@umijs/openapi` 根据后端 Swagger 自动生成，**不要**在该目录手写或修改：

- `appController.ts` — 应用相关接口
- `userController.ts` — 用户相关接口
- `typings.d.ts` — 全局类型声明（`API` 命名空间）

**第三方 / 非后端接口**（Hitokoto、网易云等）放在 `src/integrations/`，运行 `npm run openapi2ts` 不会覆盖。详见 `src/integrations/README.md`。

---

### 5. 核心业务流程：AI 生成网站

这是项目最核心的功能，完整流程如下：

```
用户在主页输入提示词
  │
  ├── 调用 POST /app/add → 创建应用，获得 appId
  │
  └── 跳转 /app/chat/:appId?initPrompt=xxx
        │
        ├── 页面加载：getAppById 获取应用信息
        │
        ├── 自动发送 initPrompt 作为首条消息
        │     │
        │     └── fetch GET /app/chat/gen/code?appId=&message=
        │           ├── SSE 流式读取（ReadableStream）
        │           ├── 解析 data:{"d":"文字片段"} 格式
        │           ├── 实时追加到 AI 消息气泡（marked 渲染 Markdown）
        │           └── 流结束 → 自动调用 handleDeploy(silent=true)
        │
        ├── 部署：POST /app/deploy → 返回 deployKey
        │     └── 构建预览 URL：VITE_DEPLOY_BASE_URL/{key}/
        │
        └── 右侧 iframe 加载预览 URL，展示生成的网站
```

用户也可以继续发送消息迭代优化，每次流结束后都会重新部署并刷新预览。

---

### 6. 布局与菜单渲染

```
BasicLayout.vue
  ├── 计算 menuItems：MENU_ITEMS.filter(canShowMenuItem(item, loginUser))
  ├── 计算 selectedKeys：精确匹配当前路径，fallback 前缀匹配
  └── 传给 GlobalHeader → 渲染 <a-menu>
```

菜单项的增删只需修改 `src/config/permission.ts` 的 `MENU_ITEMS` 数组，布局和权限过滤自动生效。

---

## 目录结构

```
src/
├── api/                  # 自动生成的后端接口函数和类型（勿手动修改）
│   ├── appController.ts  # 应用相关接口
│   ├── userController.ts # 用户相关接口
│   ├── typings.d.ts      # API 全局类型（API 命名空间）
│   └── index.ts
│
├── assets/               # 静态资源（图片、全局样式）
│
├── components/           # 全局通用组件
│   ├── GlobalHeader.vue  # 顶部导航栏
│   ├── GlobalFooter.vue  # 页脚
│   └── PermissionWrapper.vue  # 权限包裹组件
│
├── config/
│   └── permission.ts     # 权限核心配置（路由权限表 + 菜单配置）
│
├── directives/
│   └── permission.ts     # v-permission 自定义指令
│
├── layouts/
│   └── BasicLayout.vue   # 全站通用布局（Header + RouterView + Footer）
│
├── pages/                # 页面组件（与路由一一对应）
│   ├── app/
│   │   ├── AppChatPage.vue   # AI 对话 + 实时预览页
│   │   └── AppEditPage.vue   # 应用信息编辑页
│   ├── admin/
│   │   ├── AppManagerPage.vue  # 应用管理（仅管理员）
│   │   └── UserManagerPage.vue # 用户管理（仅管理员）
│   ├── user/
│   │   ├── UserLoginPage.vue
│   │   ├── UserRegisterPage.vue
│   │   └── UserProfilePage.vue
│   └── HomePage.vue      # 主页（提示词输入 + 应用列表）
│
├── router/
│   └── index.ts          # 路由表配置
│
├── stores/
│   └── loginUser.ts      # 登录用户 Pinia Store
│
├── utils/
│   └── permission.ts     # 权限工具函数（供 JS 逻辑调用）
│
├── access.ts             # 全局路由守卫（权限拦截）
├── request.ts            # Axios 全局实例（拦截器、大整数处理）
└── main.ts               # 应用入口
```

---

## 新增页面指南

1. 在 `src/pages/` 下创建 `.vue` 文件
2. 在 `src/router/index.ts` 添加路由记录
3. 如需权限保护，在 `src/config/permission.ts` 的 `ROUTE_PERMISSIONS` 加一行
4. 如需出现在导航菜单，在 `MENU_ITEMS` 加一项

---

## 代码规范

```bash
# 格式化
npm run format

# Lint（oxlint + eslint）
npm run lint

# 类型检查
npm run type-check
```
