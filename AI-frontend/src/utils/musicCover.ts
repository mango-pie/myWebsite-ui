/**
 * 音乐封面 URL 与加载失败回退（不依赖外网占位图服务）
 */

const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#e879a9"/>
      <stop offset="50%" style="stop-color:#7c9ce0"/>
      <stop offset="100%" style="stop-color:#f4b8c1"/>
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="24" fill="url(#g)"/>
  <circle cx="100" cy="100" r="52" fill="rgba(26,22,37,0.35)"/>
  <path fill="#f5f0f8" d="M78 68v64l56-32-56-32zm8 32l32 18-32 18V100z"/>
</svg>`;

/** 本地 SVG，无外网请求 */
export const MUSIC_COVER_FALLBACK = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(FALLBACK_SVG)}`;

const NETEASE_HOST_RE = /^https?:\/\/p\d\.music\.126\.net\//i;

function isLocalMediaUrl(url: string) {
  return /^(blob:|data:|file:|asset:)/i.test(url) || /asset\.localhost/i.test(url)
}

/**
 * 将网易云 CDN 封面转为开发环境代理路径（附带尺寸参数）。
 * 本地 blob / 文件地址原样返回，不能加 param，否则封面无法加载。
 */
export function toCoverDisplayUrl(url?: string | null): string {
  if (!url?.trim()) return '';
  const raw = url.trim();
  if (isLocalMediaUrl(raw)) return raw;

  let normalized = raw;
  const isNetease = NETEASE_HOST_RE.test(normalized) || normalized.startsWith('/netease-img');
  if (isNetease && !normalized.includes('param=')) {
    normalized += `${normalized.includes('?') ? '&' : '?'}param=300y300`;
  }
  if (NETEASE_HOST_RE.test(normalized)) {
    try {
      const parsed = new URL(normalized);
      return `/netease-img${parsed.pathname}${parsed.search}`;
    } catch {
      return normalized;
    }
  }
  return normalized;
}

/**
 * 从搜索/歌单结果解析封面：优先 album.picUrl。
 * 搜索接口经常没有 picUrl（仅有 picId），此时返回空，由 song/detail 补齐。
 */
export function resolveNeteaseCover(
  album?: { picUrl?: string; picId?: number },
  songPicUrl?: string,
): string {
  const raw = (album?.picUrl || songPicUrl || '').trim();
  if (!raw) return '';
  if (/default|缺省|暂无/i.test(raw)) return '';
  return toCoverDisplayUrl(raw);
}

/**
 * img @error：只回退一次，避免死循环请求
 */
export function applyCoverFallback(event: Event): void {
  const img = event.target as HTMLImageElement;
  if (!img || img.dataset.coverFallback === '1') {
    img.removeAttribute('src');
    return;
  }
  img.dataset.coverFallback = '1';
  img.src = MUSIC_COVER_FALLBACK;
}
