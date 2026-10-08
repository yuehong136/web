import { APIError } from '@/api/client-types'
import type { SSEStreamEnd } from '@/lib/streaming'

/**
 * 对话回答的终态合同（ARCH-8 共享工作台，各入口共用）：只有协议里的完成信号
 * 算完成，其余结束方式落到下面的固定分类。分类只读 HTTP 状态、稳定错误码和
 * 错误类型，后端原文（message、retmsg、响应体）不会进入结果，也就不会出现在
 * 界面上。各入口只决定自己的完成信号和文案，判定与提示级别在这里统一。
 */

/**
 * 回答没有以完成信号结束的原因。stopped 只表示本地停止接收，不代表服务端已取消；
 * unconfirmed 是连接结束却没有完成信号；business 是流里的错误帧或错误哨兵。
 */
export type AnswerStatusKind =
  | 'stopped'
  | 'unconfirmed'
  | 'network'
  | 'timeout'
  | 'unauthorized'
  | 'rate_limited'
  | 'server_error'
  | 'business'
  | 'failed'

/** 只存分类，不存后端错误原文 */
export interface AnswerStatus {
  kind: AnswerStatusKind
  /** 结束前已收到正文、思考或执行步骤，它们保留在消息里 */
  partial: boolean
}

/** 流里已得出的结论；得出后停止、断开与晚到的帧都不再改判 */
export type AnswerVerdict = 'completed' | 'business' | null

/**
 * 结束原因的提示级别：停止是用户自己的动作，只在消息上中性说明、不弹提示；
 * 结果未确认是警告；其余都是错误。
 */
export type AnswerStatusTone = 'neutral' | 'warning' | 'error'

export const answerStatusTone = (kind: AnswerStatusKind): AnswerStatusTone =>
  kind === 'stopped' ? 'neutral' : kind === 'unconfirmed' ? 'warning' : 'error'

const hasErrorName = (error: unknown, name: string) =>
  typeof error === 'object' &&
  error !== null &&
  (error as { name?: unknown }).name === name

/** 请求失败的固定分类 */
export const classifyAnswerError = (error: unknown): AnswerStatusKind => {
  if (hasErrorName(error, 'TimeoutError')) return 'timeout'
  if (error instanceof APIError) {
    const { status, code } = error
    if (status === 401 || code === '401' || code === 'UNAUTHORIZED')
      return 'unauthorized'
    if (status === 429) return 'rate_limited'
    if (status === 408 || status === 504 || code === 'TIMEOUT') return 'timeout'
    if (status === 0 || code === 'NETWORK_ERROR') return 'network'
    if (status >= 500) return 'server_error'
    return 'failed'
  }
  // 发不出请求和读流中途断开都是 TypeError；不是本地发起的中止也按连接中断处理
  if (
    error instanceof TypeError ||
    hasErrorName(error, 'NetworkError') ||
    hasErrorName(error, 'AbortError')
  )
    return 'network'
  return 'failed'
}

/** 传输结束却没有结论：本地中止是停止接收，其余是结果未确认 */
export const unresolvedStreamEnd = (end: SSEStreamEnd): AnswerStatusKind =>
  end.reason === 'aborted' ? 'stopped' : 'unconfirmed'

/** 已完成的回答没有结束原因；已判定失败的保持原判，否则用本次的原因 */
export const resolveAnswerKind = (
  verdict: AnswerVerdict,
  unresolved: AnswerStatusKind,
): AnswerStatusKind | null =>
  verdict === 'completed' ? null : (verdict ?? unresolved)
