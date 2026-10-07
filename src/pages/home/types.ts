/**
 * 首页相关类型定义
 */

import type { StreamToolCallInfo as ToolCallInfo } from '@/lib/streaming'
import type { AgentTimelineNode } from '@/utils/agent-timeline'
import type { ReferenceChunk } from '@/utils/reference-replacer'

// Re-export think types from common utils
export type { ThinkExtractResult, ThinkingStatus } from '@/utils/think-utils'

/**
 * 回答没有以完成帧结束的原因。stopped 只表示本地停止接收，不代表服务端已取消；
 * unconfirmed 是连接结束却没有完成帧；business 是流里的错误帧或错误哨兵。
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

// 消息类型
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  parsedToolCalls?: ToolCallInfo[]
  timelineNodes?: AgentTimelineNode[]
  isStreaming?: boolean
  /** 未正常完成的回答的结束原因；缺省表示已完成、仍在生成或来自历史 */
  status?: AnswerStatus
  // 应用对话模式的附加字段
  references?: ReferenceChunk[]
  thinking?: string
}

// 推荐卡片项
export interface RecommendCard {
  id: number
  title: string
  titleKey?: string
  tag: string
  tagKey?: string
  bgColor: string
  hasImage?: boolean
  imageUrl?: string
}
