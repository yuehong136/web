import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { knowledgeAPI } from '@/api/knowledge'
import { knowledgeLogKeys } from '../constants'

export function useLogStats() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: knowledgeLogKeys.stats(id),
    queryFn: async () => {
      if (!id) return null
      return knowledgeAPI.logs.getSummary(id)
    },
    enabled: !!id,
    staleTime: 30000,
  })

  return {
    data,
    isLoading,
    error,
    refetch,
  }
}
