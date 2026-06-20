# qq-music-api 项目介绍

## 一、项目概述

这是一个基于 `Koa2 + TypeScript` 构建的 QQ 音乐 API 项目，通过代理 QQ 音乐 Web 端接口提供数据服务。

**项目地址**：https://github.com/Rain120/qq-music-api

**技术栈**：Koa2 + TypeScript + Axios

**⚠️ 声明**：当前代码仅供学习，不可做商业用途。

---

## 二、功能特性

| 功能 | 状态 | 说明 |
|------|------|------|
| 获取歌曲播放链接 | ✅ | 2021-01-24 |
| 获取歌曲 + 专辑图片 | ✅ | |
| 获取歌手热门歌曲 | ✅ | |
| 获取歌单分类 | ✅ | |
| 获取歌单列表 | ✅ | |
| 获取歌单详情 | ✅ | |
| 获取歌曲歌词 | ✅ | |
| 获取 MV | ✅ | |
| 获取专辑 | ✅ | |
| 获取歌手信息 | ✅ | |
| 获取搜索热词 | ✅ | |
| 获取关键字搜索提示 | ✅ | |
| 获取搜索结果 | ✅ | |
| 获取首页推荐 | ✅ | |
| 获取排行榜单列表 | ✅ | |
| 获取排行榜单详情 | ✅ | |
| 获取新碟信息 | ✅ | |
| 登录模块 | ❌ | 暂无时间做 |
| 获取个人信息 | ❌ | 依赖登录态 |

---

## 三、快速启动

### 1. 安装

```bash
git clone git@github.com:Rain120/qq-music-api.git
cd qq-music-api
npm install
```

### 2. 启动

```bash
# 开发环境（支持热重载）
npm run dev

# 生产环境
npm start
```

启动后访问 `http://localhost:3200/explorer` 使用 API Explorer 调试接口。

---

## 四、核心 API 接口

### 1. 搜索歌曲
```
GET /api/search?key=周杰伦&limit=20&page=1
```

### 2. 获取歌曲播放链接
```
GET /api/song?id=00477
```

### 3. 获取歌词
```
GET /api/lyric?id=0039k58J2v6f46
```

### 4. 获取歌单详情
```
GET /api/playlist?id=123456
```

### 5. 获取歌手热门歌曲
```
GET /api/singer/song?id=001
```

### 6. 获取专辑
```
GET /api/album?id=123
```

### 7. 获取排行榜
```
GET /api/top/list?idx=1
```

### 8. 获取首页推荐
```
GET /api/recommend
```

---

## 五、与前端播放器的对接

### 数据映射

```typescript
// 前端播放器需要的 Song 结构
interface Song {
  id: string;           // 歌曲唯一标识
  title: string;        // 歌曲名称
  artist: string;       // 艺术家
  album: string;        // 专辑
  coverUrl: string;      // 封面图URL
  audioUrl: string;      // 音频文件URL
  duration: number;      // 时长（秒）
  lyrics?: Lyric[];      // 歌词
}
```

### 对接示例

前端 `useAudioPlayer.ts` 中添加歌曲：

```typescript
import { useAudioPlayer } from '@/design'

const { addToPlaylist } = useAudioPlayer()

// 调用 qq-music-api 搜索歌曲
const searchSongs = async (keyword: string) => {
  const res = await fetch(`http://localhost:3200/api/search?key=${keyword}`)
  const data = await res.json()
  
  // 转换数据格式
  const songs = data.data.map(item => ({
    id: item.songmid,
    title: item.songname,
    artist: item.singer.map(s => s.name).join('/'),
    album: item.albumname,
    coverUrl: `https://y.gtimg.cn/music/photo_new/T002R300x300M000${item.albummid}.jpg`,
    audioUrl: `http://localhost:3200/api/song?id=${item.songmid}`,
    duration: item.interval,
  }))
  
  addToPlaylist(songs)
}
```

---

## 六、部署架构建议

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   前端播放器     │ ──▶ │   qq-music-api       │ ──▶ │   QQ音乐服务器   │
│                 │     │   (Node.js :3200)    │     │                 │
│  播放器组件      │     │  - 数据代理          │     │  y.gtimg.cn     │
│  useAudioPlayer │     │  - 跨域解决          │     │  c.y.qq.com     │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
         │
         │ Vite 代理
         ▼
┌─────────────────┐
│   AI-backend    │
│   前端开发服务器  │
│   (:5173)       │
└─────────────────┘
```

### Vite 代理配置（vite.config.ts）

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/music-api': {
        target: 'http://localhost:3200',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/music-api/, '')
      }
    }
  }
})
```

---

## 七、优缺点分析

### 优点

| 优点 | 说明 |
|------|------|
| 开源免费 | MIT 协议，可免费使用 |
| 功能完善 | 覆盖搜索、播放、歌词、歌单等常用功能 |
| API Explorer | 内置调试工具，方便开发 |
| TypeScript | 类型安全，易于维护 |
| 热更新 | 开发环境支持热重载 |

### 缺点

| 缺点 | 说明 |
|------|------|
| ⚠️ 非官方 API | 依赖 QQ 音乐 Web 端接口，可能不稳定 |
| ⚠️ 版权风险 | 仅供学习，不可商业用途 |
| ⚠️ 无登录态 | 无法获取用户个人数据 |
| ⚠️ 接口变动 | QQ 音乐接口可能随时变更 |
| ⚠️ 无正式文档 | 只有 GitHub README |

---

## 八、可用性评估

### 推荐程度：★★★☆☆（仅供学习）

### 原因：

**可以用的原因**：
- ✅ 功能基本齐全，可以快速实现音乐搜索和播放
- ✅ 开源项目，可以直接对接使用
- ✅ 有 API Explorer，调试方便

**需要考虑的问题**：
- ⚠️ 官方明确声明不可商业用途
- ⚠️ 依赖第三方 Web 接口，可能存在不稳定因素
- ⚠️ 如果 QQ 音乐接口变更，项目可能失效
- ⚠️ 无登录态，无法实现用户个性化功能

---

## 九、替代方案对比

| 方案 | 成本 | 稳定性 | 版权风险 | 推荐度 |
|------|------|--------|----------|--------|
| qq-music-api（非官方） | 免费 | 中 | 高 | ★★★☆☆ |
| 腾讯音乐开放平台（官方） | 可能付费 | 高 | 低 | ★★★★☆ |
| 网易云音乐 API | 免费 | 中 | 中 | ★★★☆☆ |
| 自建音乐库 | 高 | 高 | 低 | ★★★★★ |

---

## 十、快速集成步骤

1. **启动 qq-music-api**
   ```bash
   git clone git@github.com:Rain120/qq-music-api.git
   cd qq-music-api
   npm install
   npm run dev
   ```

2. **配置 Vite 代理**（避免跨域）
   ```typescript
   // vite.config.ts
   server: {
     proxy: {
       '/music-api': {
         target: 'http://localhost:3200',
         changeOrigin: true
       }
     }
   }
   ```

3. **创建音乐 API 服务**
   ```typescript
   // src/api/musicApi.ts
   const BASE_URL = '/music-api'
   
   export const searchMusic = (keyword: string) => 
     fetch(`${BASE_URL}/api/search?key=${keyword}`)
   
   export const getSongUrl = (mid: string) => 
     fetch(`${BASE_URL}/api/song?id=${mid}`)
   
   export const getLyric = (mid: string) => 
     fetch(`${BASE_URL}/api/lyric?id=${mid}`)
   ```

4. **集成到播放器**
   - 在搜索页面调用 `searchMusic` 获取歌曲列表
   - 将歌曲数据转换后调用 `addToPlaylist` 添加到播放列表

---

## 十一、总结

`qq-music-api` 是一个**非官方**的 QQ 音乐 API 项目，适合：

- ✅ **学习研究**：了解 API 设计、数据结构
- ✅ **个人项目**：非商业用途的小项目
- ✅ **快速原型**：快速验证音乐功能

不适合：
- ❌ **商业项目**：存在版权风险
- ❌ **生产环境**：接口不稳定，无官方保障

**建议**：如果需要长期稳定使用，考虑申请腾讯音乐开放平台官方 API 或自建音乐库。
