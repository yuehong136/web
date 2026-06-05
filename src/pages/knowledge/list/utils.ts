import {
  formatRelativeTime,
  formatTimestamp,
  formatTimestampCompact,
  formatTimestampDetailed,
} from '@/lib/utils'
import type { KnowledgeBase } from '@/types/api'
import type { KnowledgeTimeFormat } from './types'

export const formatKnowledgeTime = (
  timestamp: number,
  format: KnowledgeTimeFormat,
) => {
  switch (format) {
    case 'detailed':
      return formatTimestampDetailed(timestamp)
    case 'compact':
      return formatTimestampCompact(timestamp)
    case 'relative':
      return formatRelativeTime(timestamp)
    default:
      return formatTimestamp(timestamp)
  }
}

export const getStatusClassName = (knowledgeBase: KnowledgeBase) => {
  if (knowledgeBase.doc_num > 0) {
    return 'bg-status-success-subtle text-status-success'
  }

  if (knowledgeBase.permission === 'me') {
    return 'bg-status-info-subtle text-status-info'
  }

  return 'bg-background-subtle text-text-secondary'
}
