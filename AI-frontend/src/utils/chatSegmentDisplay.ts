/**
 * 分段展示清洗：保留心理/动作描写的圆括号，去掉回复外层的方括号。
 * 例：`[别指望我做饭…]` → `别指望我做饭…`；（……别指望…）保持不变。
 */
export function sanitizeSegmentDisplayText(text: string): string {
  let s = text.trim()
  if (!s) return s

  // 整段被方括号包裹时去掉外层（支持半角 [] 与全角 【】）
  if (
    (s.startsWith('[') && s.endsWith(']') && s.length >= 2)
    || (s.startsWith('【') && s.endsWith('】') && s.length >= 2)
  ) {
    s = s.slice(1, -1).trim()
  }

  return s
}

export function sanitizeSegmentList(segments: string[]): string[] {
  return segments.map(sanitizeSegmentDisplayText).filter((s) => s.length > 0)
}
