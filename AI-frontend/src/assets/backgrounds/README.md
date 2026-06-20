# 全站背景图

将背景图片放在此目录，构建时会自动扫描并参与随机轮换。

## 支持格式

`.jpg`、`.jpeg`、`.png`、`.webp`、`.avif`

## 建议

- 分辨率建议 1920×1080 或更高
- 横图、主体居中，避免重要内容贴边（会被 `object-fit: cover` 裁切）
- 至少 2 张图才会定时轮换；仅 1 张时固定显示；无图时仅显示渐变遮罩

## 轮换间隔

在 [`src/config/site.ts`](../../config/site.ts) 的 `backgroundSlideshow` 中修改：

- `intervalMs`：切换间隔（毫秒），当前为 5 秒
- `fadeMs`：淡入淡出时长（毫秒）
- `enabled`：是否启用定时轮换
