# MIKU PULSE 播放器工作日志

> 记录一次完整的「问题排查 → 新功能接入 → 全面改进」工作会话。
> 日期：2026-08 中旬 · 项目根：`AI-backend/AI-frontend`
> 相关文档：[改进意见](./MUSIC_PLAYER_IMPROVEMENTS.md) · [独立运行说明](./MUSIC_STANDALONE.md)

---

## 一、背景问题：脚本启动后网易云登录报错

### 现象

`C:\Users\芒果派\Desktop\MIKU PULSE 播放器.bat` 直接脚本启动后，播放器点「登录/搜索」报：

```
登录失败: TypeError: Failed to fetch
    at musicRuntimeFetch (musicRuntime.ts:24:21)
    at fetchJson (useNeteaseLogin.ts:119:21)
    at generateQrCode (useNeteaseLogin.ts:193:27)
```

### 根因

1. **后端没人拉起**：桌面 bat 只启动 Vite 前端，菜单里「播放器 API：未启动」仅是警告。前端 `getNeteaseApiBase()` 返回 `/netease-api`，Vite 代理转发到 `localhost:3000` 时无服务 → `Failed to fetch`。
2. **bat 编码错误（用户随后反馈乱码）**：脚本含中文必须用系统 ANSI（GBK/936）+ CRLF 编码，`cmd.exe` 不认 UTF-8 批处理；且 `timeout /t 1` 在 PATH 混入 Git 工具时会调错程序。
3. **preview 模式无代理**：`vite preview` 不继承 `server.proxy`，`/netease-api` 会 404。

### 修复

| 项 | 改动 |
|----|------|
| 启动脚本（桌面 + `scripts/start-music-player.bat`） | 重写为 GBK + CRLF 编码；进菜单前自动拉起 `api-enhanced`（:3000，最小化窗口 + 10 秒探活）；新增菜单 [5] 仅启动 API；等待用 `ping -n 2 127.0.0.1` 替代 `timeout` |
| `vite.config.ts` | 新增 `preview.proxy`（`/netease-api`、`/netease-img`）；workbox `maximumFileSizeToCacheInBytes` 提到 20MB（7.3MB 背景图超 2MiB 默认上限导致 PWA 打包失败） |

---

## 二、新功能：接入第二个在线音乐源（QQ音乐 / 酷狗）

### 选型结论

用户选择的 Meting API 原版是 **PHP 项目**，本机只有 Node.js → 改为**自研零依赖 Node 服务 `meting-lite`**，接口对齐 Meting 风格（`/api?server=&type=&id=`）。

### 服务端 `meting-lite/server.js`（零依赖，端口 3300）

- `search`：QQ `client_search_cp` / 酷狗 `song_search_v2`（实测 20 首/平台）
- `url`：QQ 走 `u.y.qq.com/cgi-bin/musicu.fcg`（免费 vkey）；酷狗走 `m.kugou.com/app/i/getSongInfo.php`
- `lyric`：QQ `fcg_query_lyric_new`（nobase64）；酷狗 `m.kugou.com/app/i/krc.php`（偶发取不到，UI 会提示）
- `toplist`（第二轮迭代新增）：QQ `fcg_v8_toplist_cp`（topid 26 热歌/62 巅峰MV）+ 酷狗 `mobiles.kugou.com/api/v3/rank/song`（rankid 8888/8889）
- 注意：项目根 `package.json` 是 `"type": "module"`，文件必须用 ESM 语法（`import http`）

### 前端

- 新增 `src/integrations/metingMusic.ts`：`searchMeting` / `getMetingUrl` / `getMetingLyric` / `getMetingToplist`（duration 毫秒→秒归一化）
- `usePulsePlayer.ts`：`PulseTrack` 增加 `remoteServer` / `remoteId`；`runSearch` 并行搜网易云 + QQ + 酷狗；`ensurePlayable` / `loadLyricsFor` 按来源分支；`persistMeta` / `loadPersisted` 持久化多平台曲目（刷新后自动恢复）
- `MusicPage.vue` 搜索来源 chips 加「QQ音乐」「酷狗」，徽标 `QQ` / `KG`
- `vite.config.ts` 增加 `/meting-api` 代理（dev + preview + PWA NetworkOnly）
- 两个 bat 脚本新增 `:ensure_meting`（自动拉起 :3300）

---

## 三、全站改进（依据《改进意见》分三批）

### S1 · 快速体验修复（已构建验收）

1. **本地导入持久化**：`pulseLocalLibrary.ts` 新增 `blobs` object store（DB v2），fallback `<input type=file>` 导入 ≤200MB 的音频写入 IndexedDB，刷新后 `hydrateLocalTracks` / `restoreLocalPlayback` 自动恢复；超限降级为一次性导入。`LocalPersistKind` 增 `'blob'`
2. **EQ 预设**：`pulseEqGraph.ts` 新增 `EQ_PRESETS`（平直/流行/摇滚/爵士/古典/重低音/人声），`usePulsePlayer` 加 `setEqPreset` / `eqPresetId`（持久化，手动调档自动退出预设），`PulseAudioLabView` 加预设 chips
3. **文案人话化**：11 处技术文案（「请确认 netease-api 代理已启动」等）改为用户语言；舞台空态改「搜一首歌」
4. 确认已有：Media Session（metadata + play/pause/prev/next/seekto）、本地曲目歌词在线兜底（`lookupOnlineLyrics`）

### S2 · 内容与功能补齐（已构建验收）

5. **多源榜单**：`meting-lite` 加 `toplist`；`metingMusic.ts` 加 `METING_TOPLISTS` + `getMetingToplist`；发现页「热门榜单」区块（4 榜、展开全部、单曲播放）
6. **网易云榜单**：`neteaseMusic.ts` 加 `getToplists` / `getToplistDetail`；发现页「网易云榜单」横排区块（复用 Song 型 detail 面板）
7. **电台 DJ**：`neteaseMusic.ts` 加 `NetEaseDjRadio` / `getHotDjRadios` / `getDjPrograms`（`/dj/hot` + `/dj/program`，programs.mainSong 映射 Song）；发现页「电台 · 主播」区块
8. **歌曲详情抽屉**：新增 `PulseSongDetailDrawer.vue`（封面/播放/下一首/加队列/收藏/下载/加歌单 + 相似歌曲 `/simi/song`）；搜索/曲库/歌单行加 `⋯` 入口
9. **批量管理 + 拖拽排序**：`reorderUserPlaylist` / `batchRemoveFromUserPlaylist`；`PulsePlaylistsView` 重写，本地歌单「编辑」模式（复选框多选、批量下载/移出、GripVertical 拖拽）
10. **本地歌单封面**：`trackById` 辅助，侧栏本地歌单显示首曲封面
11. **登录引导条**：未登录时发现页顶部横幅 → 一键跳设置登录
12. 确认已有：歌词自动兜底

### P2 · 亮点功能（已构建验收）

13. **听歌统计**：`STATS_KEY` 播放计数持久化 + `recordPlay` + `listenStats`（累计播放/时长/听歌数 + Top10 歌单/歌手），歌单页「听歌统计」面板
14. **沉浸模式**：`immersive` 状态 + `.is-immersive` CSS（隐藏 rail/topbar），顶栏「沉浸」按钮
15. **桌面通知**：`notify()` 辅助（document.hidden 时才弹），顶栏「通知」按钮请求权限；切歌、下载完成时通知
16. **场景电台**：发现页 4 张场景卡（专注学习/深度工作/放松入眠/周末咖啡），多源关键词搜索一键成队播放
17. **移动端基础适配**：660px 断点补强（图表/场景卡单列、歌单单列、详情抽屉全宽、统计卡缩放、沉浸布局修正）

### 发现并顺带修复的问题

- `PulseDiscoverView.vue` 原编辑器行缩进被误改 → 已修复对齐
- `MusicPage.vue` `goBack()` 曾被 edit 截断 → 已恢复原逻辑
- PWA workbox 预缓存超限（2MiB 默认）→ `maximumFileSizeToCacheInBytes: 20 * 1024 * 1024`

---

## 四、改动文件清单

**新增**
- `meting-lite/server.js` — 零依赖多平台聚合服务（:3300）
- `src/integrations/metingMusic.ts` — 前端多平台封装
- `src/pages/music/views/PulseSongDetailDrawer.vue` — 歌曲详情抽屉
- `docs/MUSIC_PLAYER_IMPROVEMENTS.md` — 改进意见文档

**修改**
- `scripts/start-music-player.bat` + `桌面/MIKU PULSE 播放器.bat` — GBK 重写 + 自动拉起两个后端
- `vite.config.ts` — preview proxy / meting 代理 / workbox 上限
- `src/composables/usePulsePlayer.ts` — remoteServer/remoteId、EQ 预设、榜单入口、详情、批量、统计、沉浸、通知
- `src/composables/usePulseDiscover.ts` — charts / neteaseCharts / djRadios / 多源 load
- `src/composables/pulse/pulseTypes.ts` — LocalPersistKind 'blob'、STATS_KEY
- `src/composables/pulse/pulseEqGraph.ts` — EQ_PRESETS
- `src/integrations/pulseLocalLibrary.ts` — IDB blobs 持久化
- `src/integrations/neteaseMusic.ts` — toplist / dj / simi 接口
- `src/pages/music/MusicPage.vue` — 沉浸/通知按钮、登录引导、详情抽屉挂载
- `src/pages/music/views/PulseDiscoverView.vue` — 场景电台/热门榜单/网易云榜单/电台区块
- `src/pages/music/views/PulseSearchView.vue`、`PulseLibraryView.vue`、`PulsePlaylistsView.vue` — 详情入口/批量编辑
- `src/pages/music/views/PulseAudioLabView.vue` — EQ 预设 UI
- `src/pages/music/views/PulseStageView.vue`、`PulseSettingsView.vue` — 文案修正
- `src/assets/styles/music-pulse-v1.css` — 图表/抽屉/统计/场景/批量/沉浸/响应式样式

---

## 五、验证与边界

- **构建**：每个阶段 `vite build --mode music-standalone` 通过（含类型检查 + PWA 打包）
- **接口实测**：meting-lite 搜索/URL/歌词/榜单（QQ 280 首榜、酷狗 30 首榜）、api-enhanced `/dj/hot` + `/dj/program`、`/toplist` 均返回正确数据
- **已知边界**：
  - 酷狗歌词接口不稳定（UI 提示「暂无歌词」，不影响播放）
  - QQ VIP 受限曲目播放失败（提示换来源）
  - 榜单/电台依赖本地后端（bat 已自动拉起；meting-lite 改动后需重启窗口）
  - 移动端为基础适配，未像素级打磨
  - 跨平台曲目 URL 会过期，刷新后自动重取（与网易云机制一致）

---

## 六、给后续开发者的提示

- 沙箱/CI 里跑 vite 需要 esbuild 子进程权限；`npm` 的 npm-cli 路径访问可能被 OS 级限制，可用 `node node_modules/vite/bin/vite.js build` 直跑
- `meting-lite` 零依赖是刻意选择（用户环境无 PHP、无 git 权限），新增平台只需在 `server.js` 加一个 async 函数 + 路由分支
- 三字段 `neteaseId / remoteServer / remoteId` 是过渡态，后续可收敛为 `{ platform, id }` 单一远端引用模型
- `usePulsePlayer.ts` 已 3200+ 行，建议按域拆分（播放/队列/搜索/曲库/MV/下载/本地文件）