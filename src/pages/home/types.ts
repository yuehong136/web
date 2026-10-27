/**
 * 首页相关类型定义
 */

import type { AnswerStatus } from '@/lib/chat/answer-status'
import type { StreamToolCallInfo as ToolCallInfo } from '@/lib/streaming'
import type { AgentTimelineNode } from '@/utils/agent-timeline'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import type { ContextManifest } from '@/lib/ai-workspace/contracts'

// Re-export think types from common utils
export type { ThinkExtractResult, ThinkingStatus } from '@/utils/think-utils'

// 回答的结束原因由共享终态合同定义，首页只决定完成帧与文案
export type { AnswerStatus, AnswerStatusKind } from '@/lib/chat/answer-status'

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
  /** 只有本机收到完成帧并收口后为 true；历史缺省不代表成功。 */
  completionConfirmed?: boolean
  // 应用对话模式的附加字段
  references?: ReferenceChunk[]
  thinking?: string
  /** 本机本轮发送范围；不持久化，不推断历史消息或服务端实际使用。 */
  contextManifest?: ContextManifest
}

// 起始提示卡：只预填输入框，用户提交前不会运行
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
