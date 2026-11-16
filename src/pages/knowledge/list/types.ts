export type KnowledgeTimeFormat = 'detailed' | 'compact' | 'relative'

/**
 * How the list groups the current page. Per-base parse status needs the
 * list request to send `include_parsing_status`, which it does not yet, so
 * the groups use what every row carries: its document count or visibility.
 */
export type KnowledgeGroupBy = 'none' | 'content' | 'permission'

export type KnowledgeGroupKey = 'all' | 'empty' | 'hasDocuments' | 'me' | 'team'

export interface QuickEditValues {
  name: string
  description: string | null
}
