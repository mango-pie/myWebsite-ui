# 纸间 · Brand Spec

个人站视觉与叙事规格。Mode: Redesign · Overhaul（非 SaaS 工作台换皮）。

## Identity

| 项 | 值 |
|----|-----|
| 站名 | 纸间 |
| 气质 | 暖意人文、米白纸感、私人编辑室 |
| 主锚 | Stripe Press（Warm Humanist） |
| 辅 | Mailchimp 温暖语气（无黄底洪水、无手绘吉祥物） |
| Logo | 「纸间」字标（衬线）；替代 Vue 默认标 |
| 叙事 | 禁止「工作台 / Workspace」品牌话术；导航用功能本名 |

## Design Read

```yaml
artifact: personal-site
audience: 访客 + 站主日常使用
visual-language: stripe-press warm humanist paper
mode: overhaul
visual-variance: 7
motion-intensity: 4
information-density: 5-6
asset-dependence: 6
brand-fidelity: 9
```

## Color

| Role | Hex |
|------|-----|
| Ground | `#F1ECDE` |
| Surface | `#E6DCC4` |
| Ink | `#1A1A18` |
| Secondary text | `#736D5A` |
| Hairline | `#C8BEA4` |
| Accent (foil) | `#A04A2A` burnt sienna |

禁止纯白 `#FFFFFF` 作主底；禁止粉紫 `#e879a9` / 蓝 `#7c9ce0` / 深紫底 `#1a1625` 旧 AI 体系。

## Typography

- Display + Body: `Source Serif 4`, `Noto Serif SC`, 正文约 17–19px / lh 1.65
- UI only: `Source Sans 3`, `Noto Sans SC`（导航、按钮、表格）
- 禁止 Inter / Roboto / Arial / system-ui 作展示字

## Spacing / Radius / Shadow / Motion

- Spacing: 4 / 8 / 16 / 24 / 32 / 48 / 96
- Radius: 控件 2–4px；卡片 0–4px（禁止 16–24 大圆角墙）
- Shadow: 暖轻，如 `0 24px 48px rgba(0,0,0,0.12)`；禁止粉紫 glow
- Motion: 200–400ms；交叉淡入可至 600–1000ms；禁止 spring / neon pulse
- 纸感: CSS 轻颗粒即可，不做厚贴图

## Anti-cliché

- 粉紫→蓝渐变、`--shadow-glow`
- 渐变裁切站名、emoji 当图标
- 假数据 / 假统计墙
- 「又一个 AI SaaS」布局与文案

## Surfaces

| 表面 | 气质 |
|------|------|
| 首页 / 随笔 / 日记 | 编辑室：大标题、纸感、留白 |
| 对话 / 知识 / 学习 | 同纸色 + sienna；密度可略高 |
| 管理页 | 同 token；更密，色与字不变 |
