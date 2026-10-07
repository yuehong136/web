import { APIError } from '@/api/client-types'
import type {
  AgentTimelineNode,
  AgentTimelineState,
  SSEStreamEnd,
  StreamingAnswerState,
} from '@/lib/streaming'
import type { AnswerStatusKind, ChatMessage } from '../types'

/**
 * Home 回答的终态判定：只有流里的完成帧算完成，其余结束方式落到固定分类。
 * 分类只读 HTTP 状态、稳定错误码和错误类型，后端原文（message、retmsg、
 * 响应体）不会进入结果，也就不会出现在界面上。
 */

/** 流里已得出的结论；得出后停止、断开与晚到的帧都不再改判 */
export type AnswerVerdict = 'completed' | 'business' | null

const ANSWER_STATUS_MESSAGE_KEYS: Record<AnswerStatusKind, string> = {
  stopped: 'home.answerStatus.stopped',
  unconfirmed: 'home.answerStatus.unconfirmed',
  network: 'home.answerStatus.network',
  timeout: 'home.answerStatus.timeout',
  unauthorized: 'home.answerStatus.unauthorized',
  rate_limited: 'home.answerStatus.rateLimited',
  server_error: 'home.answerStatus.serverError',
  business: 'home.answerStatus.business',
  failed: 'home.answerStatus.failed',
}

export const answerStatusMessageKey = (kind: AnswerStatusKind) =>
  ANSWER_STATUS_MESSAGE_KEYS[kind]

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

/** 应用模式：只有 `data: true` 完成帧算完成，错误帧与错误哨兵为业务失败 */
export const answerVerdict = (state: StreamingAnswerState): AnswerVerdict =>
  state.phase === 'completed'
    ? 'completed'
    : state.phase === 'failed'
      ? 'business'
      : null

/** MCP 模式：错误事件为业务失败，完成事件为完成 */
export const timelineVerdict = (state: AgentTimelineState): AnswerVerdict =>
  state.nodes.some((node) => node.kind === 'error')
    ? 'business'
    : state.final
      ? 'completed'
      : null

/** 传输结束却没有结论：本地中止是停止接收，其余是结果未确认 */
export const unresolvedStreamEnd = (end: SSEStreamEnd): AnswerStatusKind =>
  end.reason === 'aborted' ? 'stopped' : 'unconfirmed'

/** 已完成的回答没有结束原因；已判定失败的保持原判，否则用本次的原因 */
export const resolveAnswerKind = (
  verdict: AnswerVerdict,
  unresolved: AnswerStatusKind,
): AnswerStatusKind | null =>
  verdict === 'completed' ? null : (verdict ?? unresolved)

/** 错误节点带后端原文，不展示；失败由消息状态呈现 */
export const withoutErrorNodes = (nodes: AgentTimelineNode[]) =>
  nodes.filter((node) => node.kind !== 'error')

/**
 * 结束一条回答：写入结束原因，保留已收到的正文、引用与执行步骤；
 * 未完成的步骤标为中止，不再显示为进行中。
 */
export const settleAnswerMessage = (
  message: ChatMessage,
  kind: AnswerStatusKind | null,
): ChatMessage => {
  if (!kind) {
    return message.isStreaming ? { ...message, isStreaming: false } : message
  }
  const partial = Boolean(
    message.content.trim() ||
    message.thinking?.trim() ||
    message.timelineNodes?.length,
  )
  return {
    ...message,
    isStreaming: false,
    status: { kind, partial },
    timelineNodes: message.timelineNodes?.map(
      (node): AgentTimelineNode =>
        node.status === 'loading' ? { ...node, status: 'abort' } : node,
    ),
  }
}
