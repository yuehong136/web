import type { AgentCanvasUploadResult } from '@/types/agent'

export interface ShareRuntimeMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  thinking?: string
  error?: string
  isStreaming?: boolean
  files?: AgentCanvasUploadResult[]
}
