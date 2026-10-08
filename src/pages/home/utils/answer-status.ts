import type {
  AgentTimelineNode,
  AgentTimelineState,
  StreamingAnswerState,
} from '@/lib/streaming'
import type { AnswerStatusKind, AnswerVerdict } from '@/lib/chat/answer-status'
import type { ChatMessage } from '../types'

/**
 * Home 回答的终态适配：判定与分类沿用共享终态合同（`@/lib/chat/answer-status`），
 * 这里只决定首页两种模式各自的完成帧、文案键和消息上的结算方式。
 */

export {
  classifyAnswerError,
  resolveAnswerKind,
  unresolvedStreamEnd,
  type AnswerVerdict,
} from '@/lib/chat/answer-status'

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
