# AI-frontend（API Shell）

布局、主题、首页与业务页已清空。当前只保留接口层与可复用的路由切换骨架。

## 保留

| 路径 | 说明 |
|------|------|
| `src/api/` | 后端接口客户端 |
| `src/integrations/` | 日记 / 附件 / 网易云 / 一言 |
| `src/request.ts` | Axios |
| `src/utils/` | safeJson、SSE 流式工具 |
| `src/router/modules.ts` | 模块路由表（公开 + 工作区/管理） |
| `src/router/index.ts` | 路由注册、标题、滚动 |
| `src/pages/ShellPage.vue` | 无样式占位，仅验证切换 |

## 已移除

`layouts` / `assets`（样式）/ `config`（站点文案壳）/ `HomePage` / 业务页面与主题。

## 重建入口

1. 功能清单：[docs/FEATURES.md](./docs/FEATURES.md)
2. 在 `router/modules.ts` 对照路径挂真实页面
3. 需要布局时再新建 `layouts/*`，不要从本 shell 继承样式

```bash
npm install
npm run dev
```

取回旧 UI 参考：

```bash
git checkout v0.9.1 -- AI-frontend/src
```
