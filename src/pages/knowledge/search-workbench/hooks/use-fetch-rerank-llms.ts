import { llmKeys } from '@/hooks/use-llm-request'
import { useQuery } from '@tanstack/react-query'

import { llmAPI } from '@/api/llm'

import { mapRerankModelsResponse } from '../adapters/retrieval-result'

export const rerankLLMsQueryKey = llmKeys.rerank()

export const useFetchRerankLLMs = () => {
  return useQuery({
    queryKey: rerankLLMsQueryKey,
    queryFn: async ({ signal }) => {
      const response = await llmAPI.list(
        {
          mdl_type: 'rerank',
          available: true,
        },
        signal,
      )
      return mapRerankModelsResponse(response)
    },
    staleTime: 5 * 60 * 1000,
  })
}
