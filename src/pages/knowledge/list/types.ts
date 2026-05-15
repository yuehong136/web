import type { KnowledgeBase } from '@/types/api'

export interface KnowledgeFilterState {
  permissions: string[]
  languages: string[]
  parser_ids: string[]
  embd_ids: string[]
  doc_num_range: string[]
  time_range: string
}

export interface KnowledgeFilterOption {
  value: string
  label: string
}

export type KnowledgeViewMode = 'grid' | 'table'
export type KnowledgeTimeFormat = 'detailed' | 'compact' | 'relative'

export interface KnowledgeStatusCopy {
  getStatusClassName: (knowledgeBase: KnowledgeBase) => string
  getStatusText: (knowledgeBase: KnowledgeBase) => string
}
