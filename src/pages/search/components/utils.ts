import type { SearchAppListItem } from '@/types/search'
import { formatRelativeTime, formatTimestampCompact, formatTimestampDetailed } from '@/lib/utils'

type SearchListItemWithConfig = SearchAppListItem & {
  search_config?: {
    kb_ids?: string[]
    summary?: boolean
    related_search?: boolean
  }
}

export const resolveKbCount = (app: SearchAppListItem): number => {
  const item = app as SearchListItemWithConfig
  if (Array.isArray(app.kb_ids)) return app.kb_ids.length
  return item.search_config?.kb_ids?.length ?? 0
}

export const resolveSummaryEnabled = (app: SearchAppListItem): boolean => {
  const item = app as SearchListItemWithConfig
  if (typeof app.summary === 'boolean') return app.summary
  return Boolean(item.search_config?.summary)
}

export const resolveRelatedEnabled = (app: SearchAppListItem): boolean => {
  const item = app as SearchListItemWithConfig
  if (typeof app.related_search === 'boolean') return app.related_search
  return Boolean(item.search_config?.related_search)
}

export type SearchTimeFormat = 'detailed' | 'compact' | 'relative'

export const formatSearchTime = (timestamp: number, format: SearchTimeFormat): string => {
  switch (format) {
    case 'compact':
      return formatTimestampCompact(timestamp)
    case 'relative':
      return formatRelativeTime(timestamp)
    case 'detailed':
    default:
      return formatTimestampDetailed(timestamp)
  }
}
