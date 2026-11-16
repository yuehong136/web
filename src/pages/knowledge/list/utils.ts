import {
  formatRelativeTime,
  formatTimestamp,
  formatTimestampCompact,
  formatTimestampDetailed,
} from '@/lib/utils'
import type { KnowledgeBase } from '@/types/api'
import type {
  KnowledgeGroupBy,
  KnowledgeGroupKey,
  KnowledgeTimeFormat,
} from './types'

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

export const getKnowledgeVisibility = (
  knowledgeBase: Pick<KnowledgeBase, 'permission'>,
): 'me' | 'team' => (knowledgeBase.permission === 'team' ? 'team' : 'me')

const groupKey = (
  knowledgeBase: KnowledgeBase,
  groupBy: KnowledgeGroupBy,
): KnowledgeGroupKey => {
  if (groupBy === 'content')
    return (knowledgeBase.doc_num || 0) > 0 ? 'hasDocuments' : 'empty'
  if (groupBy === 'permission') return getKnowledgeVisibility(knowledgeBase)
  return 'all'
}

/* Bases that need attention (no documents yet) come first. */
const GROUP_ORDER: Record<KnowledgeGroupBy, KnowledgeGroupKey[]> = {
  none: ['all'],
  content: ['empty', 'hasDocuments'],
  permission: ['me', 'team'],
}

export interface KnowledgeGroup {
  key: KnowledgeGroupKey
  items: KnowledgeBase[]
}

/**
 * Groups the loaded page, keeping the server order inside each group and
 * dropping empty groups. `none` returns one `all` group.
 */
export const groupKnowledgeBases = (
  knowledgeBases: KnowledgeBase[],
  groupBy: KnowledgeGroupBy,
): KnowledgeGroup[] => {
  const buckets = new Map<KnowledgeGroupKey, KnowledgeBase[]>()
  for (const knowledgeBase of knowledgeBases) {
    const key = groupKey(knowledgeBase, groupBy)
    buckets.set(key, [...(buckets.get(key) ?? []), knowledgeBase])
  }
  return GROUP_ORDER[groupBy]
    .filter((key) => buckets.has(key))
    .map((key) => ({ key, items: buckets.get(key)! }))
}

/**
 * Figures for the loaded page only. The list API has no all-bases document or
 * chunk totals, so these sit by the pager and say "this page".
 */
export const getKnowledgePageStats = (knowledgeBases: KnowledgeBase[]) => ({
  knowledgeBases: knowledgeBases.length,
  documents: knowledgeBases.reduce(
    (sum, knowledgeBase) => sum + (knowledgeBase.doc_num || 0),
    0,
  ),
  chunks: knowledgeBases.reduce(
    (sum, knowledgeBase) => sum + (knowledgeBase.chunk_num || 0),
    0,
  ),
})
