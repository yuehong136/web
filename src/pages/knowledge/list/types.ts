import type { KnowledgeBase } from '@/types/api'

export type KnowledgeViewMode = 'grid' | 'table'
export type KnowledgeTimeFormat = 'detailed' | 'compact' | 'relative'

export interface QuickEditValues {
  name: string
  description: string | null
}

export interface KnowledgeStatusCopy {
  getStatusClassName: (knowledgeBase: KnowledgeBase) => string
  getStatusText: (knowledgeBase: KnowledgeBase) => string
}
