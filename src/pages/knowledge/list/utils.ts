import {
  formatRelativeTime,
  formatTimestamp,
  formatTimestampCompact,
  formatTimestampDetailed,
} from '@/lib/utils'
import type { KnowledgeBase } from '@/types/api'
import type { KnowledgeFilterState, KnowledgeTimeFormat } from './types'

const DAY_MS = 24 * 60 * 60 * 1000

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

export const matchesKnowledgeFilters = (
  knowledgeBase: KnowledgeBase,
  filters: KnowledgeFilterState,
  now = Date.now(),
) => {
  if (
    filters.permissions.length > 0 &&
    !filters.permissions.includes(knowledgeBase.permission)
  ) {
    return false
  }

  if (
    filters.languages.length > 0 &&
    (!knowledgeBase.language ||
      !filters.languages.includes(knowledgeBase.language))
  ) {
    return false
  }

  if (
    filters.parser_ids.length > 0 &&
    !filters.parser_ids.includes(knowledgeBase.parser_id)
  ) {
    return false
  }

  if (
    filters.embd_ids.length > 0 &&
    !filters.embd_ids.includes(knowledgeBase.embd_id)
  ) {
    return false
  }

  if (filters.doc_num_range.length > 0) {
    const docNum = knowledgeBase.doc_num || 0
    const matchesDocRange = filters.doc_num_range.some((range) => {
      if (range === '0') return docNum === 0
      if (range === '1-5') return docNum >= 1 && docNum <= 5
      if (range === '6-20') return docNum >= 6 && docNum <= 20
      if (range === '21+') return docNum >= 21
      return true
    })

    if (!matchesDocRange) {
      return false
    }
  }

  if (filters.time_range !== 'all') {
    const updatedAt =
      knowledgeBase.update_time < 1_000_000_000_000
        ? knowledgeBase.update_time * 1000
        : knowledgeBase.update_time
    const diff = now - updatedAt

    if (filters.time_range === 'today' && diff > DAY_MS) return false
    if (filters.time_range === 'week' && diff > 7 * DAY_MS) return false
    if (filters.time_range === 'month' && diff > 30 * DAY_MS) return false
    if (filters.time_range === 'quarter' && diff > 90 * DAY_MS) return false
  }

  return true
}

export const getUniqueOptions = (
  knowledgeBases: KnowledgeBase[],
  field: keyof Pick<
    KnowledgeBase,
    'language' | 'parser_id' | 'embd_id' | 'permission'
  >,
) => {
  const values = knowledgeBases
    .map((knowledgeBase) => knowledgeBase[field])
    .filter((value): value is string => Boolean(value))

  return [...new Set(values)].map((value) => ({
    value,
    label: value,
  }))
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
