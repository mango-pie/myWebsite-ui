# MIKU PULSE 独立运行

播放器现在有三种启动方式，原网站内的 `/music` 不受影响。

## 1. 独立网页

```bash
npm run dev:music
```

浏览器只加载播放器入口 `music.html`，不会启动网站首页、布局、宠物或悬浮播放器。

生产构建：

```bash
npm run build:music
npm run preview:music
```

产物在 `dist-music/`。

## 2. PWA 桌面安装

`build:music` 会同时生成 Web App Manifest 和 Service Worker。部署 `dist-music/` 后，在
Chrome / Edge 中打开 `music.html`，可从浏览器菜单安装为独立窗口。

PWA 会离线缓存播放器界面；网易云搜索、音频和 MV 仍需联网。

独立部署时，默认请求同源 `/netease-api`。如果 API 在其他地址，构建前设置：

```env
VITE_NETEASE_API_BASE=https://your-api.example.com
```

## 3. Windows 桌面版（Tauri）

首次构建前安装：

1. Rust（rustup）
2. Microsoft C++ Build Tools（Desktop development with C++）
3. WebView2 Runtime（Windows 11 通常自带）

开发：

```bash
npm run tauri:dev
```

安装包：

```bash
npm run tauri:build
```

产物在 `src-tauri/target/release/bundle/`。

桌面版通过 Tauri HTTP 插件直连 `http://127.0.0.1:3000`，因此使用网易云功能前需启动
项目原有的 Netease API Enhanced 服务。本地文件播放、界面和已经缓存的曲库不依赖网站后端。
