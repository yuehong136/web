import type { KnowledgeFilterState } from './types'

export const DEFAULT_KNOWLEDGE_FILTERS: KnowledgeFilterState = {
  permissions: [],
  languages: [],
  parser_ids: [],
  embd_ids: [],
  doc_num_range: [],
  time_range: 'all',
}

export const DEFAULT_PAGE_SIZE = 12
export const PAGE_SIZE_OPTIONS = [6, 12, 24, 48]
