/**
 * AI 用量成本估算（仅看板参考，非计费依据）。
 * 按「元 / 1M tokens」的混合单价估算：日志只落总 token，无法区分输入/输出，
 * 因此使用输入输出加权近似价；未收录的模型走默认单价。
 */

export const MODEL_COST_YUAN_PER_M: Record<string, number> = {
  'deepseek-chat': 4,
  'deepseek-reasoner': 8,
  'deepseek-v3': 4,
  'deepseek-r1': 8,
  'gpt-4o-mini': 2.5,
  'gpt-4o': 20,
  'gpt-4.1-mini': 3,
  'gpt-4.1': 15,
}

export const DEFAULT_MODEL_COST_YUAN_PER_M = 5

/** 按模型单价估算成本（元）；无 token 数据返回 null */
export function estimateModelCost(
  model?: string | null,
  tokens?: number | null,
): number | null {
  if (tokens == null || Number.isNaN(tokens)) return null
  const rate = (model ? MODEL_COST_YUAN_PER_M[model] : undefined) ?? DEFAULT_MODEL_COST_YUAN_PER_M
  return (tokens / 1_000_000) * rate
}

export function formatCostYuan(cost: number | null | undefined): string {
  if (cost == null || Number.isNaN(cost)) return '—'
  if (cost === 0) return '¥0.00'
  if (cost < 0.01) return '¥<0.01'
  return `¥${cost.toFixed(cost < 100 ? 2 : 0)}`
}
