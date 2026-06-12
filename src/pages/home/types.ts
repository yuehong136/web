/**
 * 首页相关类型定义
 */

import type { StreamToolCallInfo as ToolCallInfo } from '@/lib/streaming'
import type { AgentTimelineNode } from '@/utils/agent-timeline'
import type { ReferenceChunk } from '@/utils/reference-replacer'

// Re-export think types from common utils
export type { ThinkExtractResult, ThinkingStatus } from '@/utils/think-utils'

// 消息类型
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  parsedToolCalls?: ToolCallInfo[]
  timelineNodes?: AgentTimelineNode[]
  isStreaming?: boolean
  // 应用对话模式的附加字段
  references?: ReferenceChunk[]
  thinking?: string
}

// 功能标签项
export interface FunctionTab {
  id: string
  label: string
  labelKey?: string
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
