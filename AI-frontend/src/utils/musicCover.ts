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

/**
 * 将网易云 CDN 封面转为开发环境代理路径（附带尺寸参数）
 */
export function toCoverDisplayUrl(url?: string | null): string {
  if (!url?.trim()) return '';
  let normalized = url.trim();
  if (!normalized.includes('param=')) {
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
 * 从搜索/歌单结果解析封面：优先 album.picUrl，避免错误的 blur 接口
 */
export function resolveNeteaseCover(album?: { picUrl?: string; picId?: number }, songPicUrl?: string): string {
  const raw = album?.picUrl || songPicUrl || '';
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
