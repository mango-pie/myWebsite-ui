/**
 * 站点文案与页脚链接。业务域入口必须带 requireModule，由 GlobalFooter 按 capabilities 过滤。
 */
export type SiteFooterLink = {
  label: string
  path?: string
  href?: string
  requireModule?: string
}

export const siteConfig = {
  siteName: '纸间',
  footer: {
    tagline: '合上书页，墨痕仍在',
    links: [
      { label: '关于', path: '/about' },
      { label: '随笔', path: '/blog', requireModule: 'blog' },
      { label: '实验室', path: '/lab', requireModule: 'app-lab' },
      { label: '友链', href: '#' },
    ] satisfies SiteFooterLink[],
  },
}

export type SiteConfig = typeof siteConfig
