# api-enhanced (网易云音乐 API) 前端播放器集成方案

## 一、项目概述

**项目名称**：NeteaseCloudMusicApiEnhanced/api-enhanced

**项目地址**：https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced

**官方文档**：https://neteasecloudmusicapienhanced.js.org/

**技术栈**：Node.js + Express + Axios

**许可证**：MIT License

---

## 二、功能特性

| 功能模块 | 状态 | 说明 |
|----------|------|------|
| **登录注册** | ✅ | 手机号登录、验证码、二维码登录 |
| **用户信息** | ✅ | 用户资料、收藏、动态、播放记录 |
| **歌曲播放** | ✅ | 获取播放链接、支持多种音质 |
| **歌词获取** | ✅ | 同步歌词、翻译歌词 |
| **歌单管理** | ✅ | 创建、编辑、收藏歌单 |
| **专辑/歌手** | ✅ | 获取专辑详情、歌手信息 |
| **MV/视频** | ✅ | 获取 MV 播放链接 |
| **搜索功能** | ✅ | 关键词搜索、热门搜索 |
| **推荐系统** | ✅ | 每日推荐、私人 FM |
| **排行榜** | ✅ | 各类排行榜单 |
| **歌曲解锁** | ✅ | 灰色歌曲解锁（解灰） |
| **云盘功能** | ✅ | 用户云盘歌曲管理 |

---

## 三、核心 API 接口

### 1. 搜索歌曲

```
GET /search?keywords=周杰伦&limit=20&offset=0
```

**响应示例**：
```json
{
  "result": {
    "songs": [
      {
        "id": 186695,
        "name": "晴天",
        "artists": [{"id": 6452, "name": "周杰伦"}],
        "album": {"id": 18571, "name": "叶惠美"},
        "duration": 269000,
        "picUrl": "https://p3.music.126.net/..."
      }
    ],
    "songCount": 100
  }
}
```

### 2. 获取歌曲播放链接

```
GET /song/url?id=186695
```

**响应示例**：
```json
{
  "data": [
    {
      "id": 186695,
      "url": "https://music.163.com/song/media/outer/url?id=186695.mp3",
      "br": 320000,
      "size": 10770428
    }
  ]
}
```

### 3. 获取歌词

```
GET /lyric?id=186695
```

**响应示例**：
```json
{
  "lrc": {
    "version": 11,
    "lyric": "[00:00.00] 故事的小黄花\n[00:05.20] 从出生那年就飘着"
  },
  "tlyric": {
    "version": 11,
    "lyric": "[00:00.00] The little yellow flower of the story"
  }
}
```

### 4. 获取歌单详情

```
GET /playlist/detail?id=123456
```

### 5. 获取推荐歌曲

```
GET /recommend/songs
```

### 6. 获取排行榜

```
GET /top/list?idx=1
```

---

## 四、与前端播放器的对接方案

### 数据映射

前端播放器需要的 `Song` 结构：

```typescript
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

### 集成示例

```typescript
// src/api/neteaseApi.ts
const BASE_URL = '/netease-api';

export const searchMusic = async (keyword: string) => {
  const res = await fetch(`${BASE_URL}/search?keywords=${encodeURIComponent(keyword)}`);
  const data = await res.json();
  
  return data.result.songs.map((item: any) => ({
    id: String(item.id),
    title: item.name,
    artist: item.artists.map((a: any) => a.name).join('/'),
    album: item.album.name,
    coverUrl: item.picUrl,
    audioUrl: '', // 需要单独调用 /song/url 获取
    duration: item.duration / 1000,
  }));
};

export const getSongUrl = async (id: string) => {
  const res = await fetch(`${BASE_URL}/song/url?id=${id}`);
  const data = await res.json();
  return data.data[0]?.url || '';
};

export const getLyric = async (id: string) => {
  const res = await fetch(`${BASE_URL}/lyric?id=${id}`);
  const data = await res.json();
  
  if (!data.lrc?.lyric) return [];
  
  return data.lrc.lyric
    .split('\n')
    .map((line: string) => {
      const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.+)/);
      if (match) {
        const [, min, sec, ms, text] = match;
        return {
          time: parseFloat(min) * 60 + parseFloat(sec) + parseFloat(ms) / 1000,
          text: text.trim()
        };
      }
      return null;
    })
    .filter(Boolean);
};
```

---

## 五、部署架构建议

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   前端播放器     │ ──▶ │   api-enhanced       │ ──▶ │   网易云音乐     │
│                 │     │   (Node.js :3000)    │     │   官方服务器     │
│  FloatingPlayer │     │  - 数据代理          │     │                 │
│  useAudioPlayer │     │  - 歌曲解锁          │     │  music.163.com  │
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

### Vite 代理配置

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/netease-api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/netease-api/, '')
      }
    }
  }
});
```

### Docker 快速部署

```bash
# 拉取镜像并运行
docker pull moefurina/ncm-api:latest
docker run -d -p 3000:3000 --name ncm-api \
  -e http_proxy= -e https_proxy= -e no_proxy= \
  moefurina/ncm-api:latest
```

---

## 六、优缺点分析

### 优点

| 优点 | 说明 |
|------|------|
| ✅ **功能完善** | 覆盖网易云音乐绝大部分功能 |
| ✅ **活跃维护** | 2026年5月仍有更新，社区活跃 |
| ✅ **歌曲解锁** | 支持灰色歌曲解锁（解灰）功能 |
| ✅ **多部署方式** | 支持 Docker、Vercel、Serverless |
| ✅ **文档完善** | 有详细的在线文档 |
| ✅ **TypeScript支持** | 提供类型定义 |
| ✅ **无损音质** | 支持 FLAC 无损音质 |
| ✅ **游客模式** | 无需登录即可使用基础功能 |

### 缺点

| 缺点 | 说明 |
|------|------|
| ⚠️ **非官方API** | 依赖网易云音乐接口，可能变更 |
| ⚠️ **版权风险** | 仅供学习研究，不可商业用途 |
| ⚠️ **网络限制** | 部分歌曲受地区限制 |
| ⚠️ **需要部署** | 需要自行部署后端服务 |

---

## 七、与 qq-music-api 的对比

| 对比项 | api-enhanced (网易云) | qq-music-api (QQ音乐) |
|--------|---------------------|----------------------|
| **功能完整性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **维护活跃度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **歌曲解锁** | ✅ 支持 | ❌ 未知 |
| **无损音质** | ✅ FLAC | ⚠️ 未知 |
| **文档完善度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **部署便捷性** | ⭐⭐⭐⭐⭐ (Docker) | ⭐⭐⭐ |
| **社区支持** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **版权风险** | ⚠️ 学习用途 | ⚠️ 学习用途 |

---

## 八、推荐度评估

### 综合评分：★★★★★（强烈推荐）

**推荐理由**：
1. ✅ 功能最完善的第三方音乐 API 之一
2. ✅ 持续活跃维护，更新频繁
3. ✅ 支持歌曲解锁，解决灰色歌曲问题
4. ✅ 支持无损音质，提升体验
5. ✅ 部署方式灵活，支持 Docker 一键部署
6. ✅ 有详细的官方文档

**适用场景**：
- ✅ 个人项目/学习研究
- ✅ 音乐播放器原型开发
- ✅ 开源项目集成

**不适用场景**：
- ❌ 商业项目（版权风险）
- ❌ 需要官方支持的生产环境

---

## 九、快速集成步骤

### 步骤 1：启动 api-enhanced 服务

```bash
# 方式一：Docker（推荐）
docker pull moefurina/ncm-api:latest
docker run -d -p 3000:3000 --name ncm-api \
  -e http_proxy= -e https_proxy= -e no_proxy= \
  -e CORS_ALLOW_ORIGIN=http://localhost:5173 \
  moefurina/ncm-api:latest

# 方式二：源码启动
git clone https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced.git
cd api-enhanced
pnpm install
node app.js
```

### 步骤 2：配置 Vite 代理

```typescript
// vite.config.ts
server: {
  proxy: {
    '/netease-api': {
      target: 'http://localhost:3000',
      changeOrigin: true
    }
  }
}
```

### 步骤 3：创建网易云音乐 API 服务

```typescript
// src/api/neteaseApi.ts
const BASE_URL = '/netease-api';

export const searchMusic = (keyword: string) => 
  fetch(`${BASE_URL}/search?keywords=${encodeURIComponent(keyword)}`);

export const getSongUrl = (id: string) => 
  fetch(`${BASE_URL}/song/url?id=${id}`);

export const getLyric = (id: string) => 
  fetch(`${BASE_URL}/lyric?id=${id}`);

export const getPlaylist = (id: string) => 
  fetch(`${BASE_URL}/playlist/detail?id=${id}`);

export const getRecommend = () => 
  fetch(`${BASE_URL}/recommend/songs`);
```

### 步骤 4：集成到播放器

```typescript
// 在任意组件中使用
import { useAudioPlayer } from '@/design';
import { searchMusic, getSongUrl, getLyric } from '@/api/neteaseApi';

const { addToPlaylist, playSong } = useAudioPlayer();

// 搜索歌曲
const handleSearch = async (keyword: string) => {
  const res = await searchMusic(keyword);
  const data = await res.json();
  
  const songs = data.result.songs.map((item: any) => ({
    id: String(item.id),
    title: item.name,
    artist: item.artists.map((a: any) => a.name).join('/'),
    album: item.album.name,
    coverUrl: item.picUrl,
    audioUrl: '',
    duration: item.duration / 1000,
  }));
  
  addToPlaylist(songs);
  
  // 获取第一首歌的播放链接
  const urlRes = await getSongUrl(songs[0].id);
  const urlData = await urlRes.json();
  songs[0].audioUrl = urlData.data[0]?.url || '';
  
  playSong(songs[0]);
};
```

---

## 十、注意事项

### 1. 版权合规
- 本项目仅供学习研究，不可用于商业用途
- 使用前请阅读网易云音乐服务条款
- 遵守相关法律法规

### 2. 接口稳定性
- 第三方 API 可能随时变更
- 建议做好接口容错和降级处理
- 考虑添加请求缓存机制

### 3. 网络代理
- 部分歌曲可能受地区限制
- 可配置代理服务器解决地域限制
- 开启 `ENABLE_GENERAL_UNBLOCK=true` 启用全局解灰

### 4. 性能优化
- 对搜索结果进行缓存
- 批量获取歌曲播放链接
- 歌词数据按需加载

---

## 十一、总结

**api-enhanced** 是目前最优秀的网易云音乐第三方 API 之一，具有以下优势：

| 维度 | 评价 |
|------|------|
| 功能完整性 | ⭐⭐⭐⭐⭐ |
| 维护活跃度 | ⭐⭐⭐⭐⭐ |
| 部署便捷性 | ⭐⭐⭐⭐⭐ |
| 文档质量 | ⭐⭐⭐⭐⭐ |
| **综合推荐度** | ⭐⭐⭐⭐⭐ |

**建议**：如果需要快速实现音乐播放器功能，api-enhanced 是首选方案。部署简单，功能完善，社区活跃，非常适合个人项目和学习研究使用。
