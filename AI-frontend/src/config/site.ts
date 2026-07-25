/**
 * 站点文案与链接配置 — 个人化时只需修改此文件
 */
import type {
  PetGifAliasMap,
  PetGifAssetMap,
  PetGifOverlayAliasMap,
  PetGifOverlayMap,
  PetGifStateMap,
  PetRendererKind,
} from '@/pet/types'

export const siteAvatarSrc = new URL('../assets/head.jpg', import.meta.url).href

export const siteConfig = {
  siteName: '纸间',
  siteSubtitle: '',
  ownerName: '纸间',
  bio: '一本摊开的私人手册：随笔、日记与知识，在米白书页间慢慢落墨。',
  avatar: siteAvatarSrc,

  rooms: {
    blog: { title: '随笔', hint: '读与写' },
    diary: { title: '日记', hint: '留给自己的页' },
    knowledge: { title: '知识库', hint: '文档与问答' },
    lab: { title: '实验室', hint: '试一试小应用' },
    chat: { title: '对话', hint: '未写完的交谈' },
  },

  blogTitle: '随笔',
  blogSubtitle: '纸上的想法',

  diaryTitle: '日记',
  diarySubtitle: '每日手记',

  heroLabTitle: '实验室',
  heroLabDesc: '用一句话描述想法，生成可运行的小应用',
  heroLabPlaceholder: '例如：做一个简洁的个人待办清单，支持添加和勾选完成……',
  quickPrompts: ['个人主页', '待办清单', '读书笔记卡片', '暗黑风格仪表盘'],

  labPage: {
    subtitle: '描述想法，生成可运行的小应用',
    entryTitle: '进入实验室',
    entryDesc: '用一句话生成可运行的小应用',
    entryAction: '进入实验室',
  },

  sections: {
    latestPosts: '最新随笔',
    myExperiments: '我的小实验',
    inspiration: '灵感橱窗',
    emptyMyApps: '还没有实验作品，去实验室创建一个吧',
    emptyFeatured: '暂无推荐作品',
    recommendedAuthor: '站主推荐',
  },

  statsLabels: {
    posts: '文章',
    experiments: '实验',
    uptime: '站点运行',
  },

  about: {
    title: '关于',
    skills: ['Vue 3', 'TypeScript', 'Spring Boot', 'MySQL', 'AI 应用'],
    interests: ['技术笔记', '分子模拟', '轻音乐'],
    contact: {
      email: { label: '邮箱', href: '#' },
      github: { label: 'GitHub', href: '#' },
    },
    techStack: 'Vue 3 · Vite · Ant Design Vue · Spring Boot',
  },

  footer: {
    tagline: '合上书页，墨痕仍在',
    links: [
      { label: '关于', path: '/about' },
      { label: '随笔', path: '/blog' },
      { label: '实验室', path: '/lab' },
      { label: '友链', href: '#' },
    ],
    icp: '备案号占位',
  },

  music: {
    demoTracks: [
      { title: '背景轻音乐 · 一', artist: '氛围' },
      { title: '背景轻音乐 · 二', artist: '氛围' },
    ],
  },

  /** 全站背景图轮换：纸间浅色主题默认关闭，避免压过纸感 */
  backgroundSlideshow: {
    enabled: false,
    intervalMs: 5_000,
    fadeMs: 1200,
  },

  effects: {
    mouseTrail: {
      enabled: true,
    },
    bubbleMenu: {
      enabled: true,
      defaultOffset: 24,
      defaultBottomGap: 100,
    },
    petDango: {
      enabled: true,
      renderer: 'gif' as PetRendererKind,
      size: 64,
      wanderSpeed: 0.55,
      /** 单次漫游最大步长，相对较短视口边的比例（0.5 = 半屏） */
      wanderMaxStepRatio: 0.5,
      idleMinMs: 2000,
      idleMaxMs: 5000,
      sleepAfterMs: 180_000,
      showOnMobile: false,
      dialogueEnabled: true,
      defaultPosition: { x: 48, y: null as number | null },
      spriteUrl: '',
      gif: {
        fallbackState: 'idle',
        renderScale: 1.4,
        reactDurationMs: 800,
        /** 移动距离低于该比例时用 move，否则用 fly（相对较短视口边） */
        walkSlowDistanceRatio: 0.45,
        overlayEnabled: true,
        overlayChance: 0.18,
        overlayCooldownMs: 2200,
        overlayDurationMs: {
          jump: 700,
          happy: 900,
          sigh: 800,
        },
        assets: {
          click: 'click',
          default: 'default',
          fly: 'fly',
          move: 'move',
          music: 'music',
          jump: 'jump',
          happy: 'happy',
          sigh: 'sigh',
        } as PetGifAssetMap,
        stateMap: {
          idle: 'default',
          walk: 'move',
          react: 'click',
          sleep: 'default',
          drag: 'move',
        } as PetGifStateMap,
        aliases: {
          idle: ['default'],
          walk: ['move', 'fly'],
          react: ['click'],
          sleep: ['default', 'sigh'],
          drag: ['move', 'fly'],
        } as PetGifAliasMap,
        overlayMap: {
          jump: 'jump',
          happy: 'happy',
          sigh: 'sigh',
        } as PetGifOverlayMap,
        overlayAliases: {
          jump: ['jump'],
          happy: ['happy'],
          sigh: ['sigh'],
        } as PetGifOverlayAliasMap,
      },
    },
  },
} as const

export type SiteConfig = typeof siteConfig
