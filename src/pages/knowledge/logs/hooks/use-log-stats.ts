import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { knowledgeAPI } from '@/api/knowledge'

const EMPTY_LOG_STATS = {
  cancelled: 0,
  failed: 0,
  finished: 0,
  processing: 0,
  downloaded: 0,
}

export function useLogStats() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['logStats', id],
    queryFn: async () => {
      if (!id) return null
      return knowledgeAPI.logs.getBasicInfo(id)
    },
    enabled: !!id,
    staleTime: 30000,
  })

  return {
    data: data || EMPTY_LOG_STATS,
    isLoading,
    error,
    refetch,
  }
}
