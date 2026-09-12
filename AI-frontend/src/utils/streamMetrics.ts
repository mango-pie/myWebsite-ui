/**
 * AI 流式首字延迟（TTFB）采样 — 架构审查 SLI「AI 流式 TTFB p95 < 3s」的前端埋点。
 * debug_chat_sse 打开（或 dev 环境）时输出到 console；最近样本保留在内存环形队列，
 * 暂不上报后端，后续接入可观测性时直接消费 getStreamTtfbSamples()。
 */
import { chatSseLog } from '@/utils/sseChatStream'

export interface StreamTtfbSample {
  /** 埋点场景：chat（主聊天 ask/agent）/ kb-chat（知识问答） */
  scene: string
  ttfbMs: number
  at: number
}

const MAX_SAMPLES = 50
const samples: StreamTtfbSample[] = []

export function getStreamTtfbSamples(): StreamTtfbSample[] {
  return [...samples]
}

export function recordStreamTtfb(scene: string, ttfbMs: number): void {
  samples.push({ scene, ttfbMs, at: Date.now() })
  if (samples.length > MAX_SAMPLES) samples.shift()
  chatSseLog(`[TTFB] ${scene}: ${ttfbMs}ms`)
}

/** 在发起 fetch 前创建；首个内容事件到达时调用 markFirstContent()（重复调用只记首次） */
export function createStreamTtfbTracker(scene: string): { markFirstContent: () => void } {
  const start = performance.now()
  let marked = false
  return {
    markFirstContent() {
      if (marked) return
      marked = true
      recordStreamTtfb(scene, Math.round(performance.now() - start))
    },
  }
}
