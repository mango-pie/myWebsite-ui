# 通用时段背景 Period Atmosphere

可复用到首页 / 博客 / 日记 / 其它房间的 **1920×1080 舞台**。

## 接入

1. 在页面引入 [`period-atmosphere.css`](./period-atmosphere.css)
2. `<html data-theme="morning|noon|dusk|night">`（与 Tweaks 时段一致）
3. 舞台容器 `position: relative; overflow: hidden;`，背景可透明（由 `.atm-wash` 承担）
4. 舞台内最底层粘贴 [`period-atmosphere.snippet.html`](./period-atmosphere.snippet.html)
5. 业务内容 `z-index ≥ 1`
6. 可选：`body` 加 class `period-page-bg`，外框也跟同套洗色

## 时段特征（靠显隐，不是只换滤镜）

| 时段 | 洗色 | 特色层 |
|------|------|--------|
| 晨 | 冷青 + 樱粉 | glow + mist |
| 午 | 天蓝 + 浅金 | sun + rays |
| 昏 | 橘粉 + 藕紫 | dusk 落日 + birds + 淡星 |
| 夜 | 靛蓝雾（仍偏浅、可读） | moon + stars |

组件/玻璃卡只需换房间色调（如 `--craft-*`），不必为每时段重做一套手账道具。

## 示例

日记预览：[`../Diary v8.html`](../Diary%20v8.html)（已内联本 CSS，单文件打开即可看整体效果；源头仍以本目录为准）
