import { useQuery } from '@tanstack/react-query'

import { llmAPI } from '@/api/llm'

import { mapRerankModelsResponse } from '../adapters/retrieval-result'

export const rerankLLMsQueryKey = ['knowledge-search', 'rerank-llms'] as const

export const useFetchRerankLLMs = () => {
  return useQuery({
    queryKey: rerankLLMsQueryKey,
    queryFn: async () => {
      const response = await llmAPI.list({
        mdl_type: 'rerank',
        available: true,
      })
      return mapRerankModelsResponse(response)
    },
    staleTime: 5 * 60 * 1000,
  })
}
