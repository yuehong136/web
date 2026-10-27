import { useQuery } from '@tanstack/react-query'
import { knowledgeAPI } from '@/api/knowledge'
import { knowledgeKeys } from './use-knowledge-request'

export function useKnowledgeTags(knowledgeIds: string[], enabled = true) {
  const ids = [...new Set(knowledgeIds)].sort()
  return useQuery({
    queryKey: knowledgeKeys.tags(ids),
    queryFn: () => knowledgeAPI.tag.aggregate(ids),
    enabled: enabled && ids.length > 0,
  })
}
