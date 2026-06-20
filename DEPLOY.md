# 部署指南（前端）

仓库：[mango-pie/Ai](https://github.com/mango-pie/Ai)

## 目录说明

| 路径 | 说明 |
|------|------|
| `AI-frontend/src/` | Vue 3 源码 |
| `AI-frontend/dist/` | **生产静态资源**（构建产物，可直接给 Nginx 使用） |
| `AI-frontend/.env.production.example` | 生产环境变量模板 |

## 本地构建

```bash
cd AI-frontend
cp .env.production.example .env.production
# 编辑 .env.production 填入域名
npm ci
npm run build-only   # 跳过 type-check，与 CI 一致
```

构建产物在 `AI-frontend/dist/`。

## 服务器部署（Nginx 静态托管）

1. 将 `AI-frontend/dist/` 上传到服务器，例如 `/var/www/ai-frontend/`
2. Nginx 配置示例：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/ai-frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8123/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_buffering off;          # SSE 流式
        proxy_read_timeout 300s;
    }
}
```

3. 后端仓库见 [mango-pie/Ai-Backend](https://github.com/mango-pie/Ai-Backend)

## GitHub Actions

推送 `main` 分支且 `AI-frontend/` 有变更时，会自动执行 `npm run build-only` 并上传 `frontend-dist` 构建产物（Artifacts，保留 30 天）。

在仓库 **Settings → Secrets and variables → Actions → Variables** 可设置 `VITE_DEPLOY_BASE_URL`。

## 更新静态资源到 GitHub

每次改完前端后：

```bash
cd AI-frontend
npm run build-only
cd ..
git add AI-frontend/dist AI-frontend/src
git commit -m "build: update frontend dist"
git push origin main
```

`dist/` 已纳入版本库，服务器可直接 `git pull` 取静态文件。
