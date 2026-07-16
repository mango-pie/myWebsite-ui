/** AI 搜索 / 合蒸：风险标记与失败原因文案 */

export const SEARCH_RISK_FLAG_LABELS: Record<string, string> = {
  VIDEO_HOST: '视频站',
  COURSE_LANDING: '课程落地页',
  PAYWALL_LIKELY: '可能需登录',
}

export function formatSearchRiskFlag(flag?: string): string {
  if (!flag) return '-'
  return SEARCH_RISK_FLAG_LABELS[flag] || flag
}

export function formatSearchRiskFlags(flags?: string[] | null): string {
  if (!flags?.length) return ''
  return flags.map(formatSearchRiskFlag).join('、')
}

export const INGEST_FAIL_REASON_LABELS: Record<string, string> = {
  CAPTCHA: '登录墙/验证码',
  TOO_SHORT: '正文过短',
  VIDEO_SHELL: '视频/播放器壳',
  IRRELEVANT: '与目标无关',
  TOO_THIN: '内容过薄',
}

export function formatIngestFailReason(code?: string | null): string {
  if (!code) return '-'
  return INGEST_FAIL_REASON_LABELS[code] || code
}

export function candidateHasRisk(record?: { riskFlags?: string[] } | null): boolean {
  return !!(record?.riskFlags && record.riskFlags.length > 0)
}
