# 部署指南（前端）

> **完整服务器部署流程**请参阅后端仓库：  
> **[Ai-Backend/docs/DEPLOY_SERVER.md](https://github.com/mango-pie/Ai-Backend/blob/main/docs/DEPLOY_SERVER.md)**

仓库：[mango-pie/Ai-frontend](https://github.com/mango-pie/Ai-frontend)  
后端仓库：[mango-pie/Ai-Backend](https://github.com/mango-pie/Ai-Backend)

## 目录说明

| 路径 | 说明 |
|------|------|
| `AI-frontend/src/` | Vue 3 源码 |
| `AI-frontend/dist/` | **生产静态资源**（已提交，服务器可直接 pull） |
| `AI-frontend/.env.production.example` | 生产环境变量模板 |

## 本地开发

```bash
cd AI-frontend
npm ci
npm run dev
# http://localhost:5173 ，后端需 localhost:8123
```

## 生产构建

```bash
cd AI-frontend
cp .env.production.example .env.production
# 编辑 .env.production（见下方 IP 模式示例）
npm ci
npm run build-only
```

### IP 访问模式（与 Nginx 同域反代）

```env
VITE_API_BASE_URL=/api
VITE_PREVIEW_BASE_URL=/api/static
VITE_DEPLOY_BASE_URL=http://121.43.177.236
```

构建产物在 `AI-frontend/dist/`，复制到服务器 `/var/www/ai-frontend/`。

## 服务器快速更新（dist 已在 Git）

```bash
git clone https://github.com/mango-pie/Ai-frontend.git
sudo rsync -a --delete Ai-frontend/AI-frontend/dist/ /var/www/ai-frontend/
```

完整 Nginx、后端、数据库步骤见 [DEPLOY_SERVER.md](https://github.com/mango-pie/Ai-Backend/blob/main/docs/DEPLOY_SERVER.md)。

## GitHub Actions

推送 `main` 且 `AI-frontend/` 有变更时自动 `npm run build-only`，Artifact 名 `frontend-dist`（30 天）。

## 提交 dist 到 GitHub

```bash
cd AI-frontend
npm run build-only
cd ..
git add AI-frontend/dist AI-frontend/src
git commit -m "build: update frontend dist"
git push origin main
```
