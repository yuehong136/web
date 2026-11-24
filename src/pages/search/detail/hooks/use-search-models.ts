import { useQuery } from '@tanstack/react-query'
import { llmAPI } from '@/api/llm'
import { llmKeys } from '@/hooks/use-llm-request'
import type { LLMModel } from '@/types/api'
import type { MyLLMProvider } from '@/stores/model'

export function normalizeSearchModels(response: Record<string, LLMModel[]>) {
  const providers: MyLLMProvider = {}
  const idToNameMap: Record<string, string> = {}
  const rerankModels: LLMModel[] = []
  for (const [providerName, models] of Object.entries(response)) {
    for (const model of models) {
      const name = model.name || model.llm_name
      const label = model.display_name ?? model.llm_name
      if (model.mdl_type === 'rerank') {
        rerankModels.push({ ...model, llm_name: name, display_name: label })
      }
      if (model.mdl_type !== 'chat' && model.mdl_type !== 'image2text') continue
      ;(providers[providerName] ??= { tags: '', llm: [] }).llm.push({
        id: model.id,
        reference: model.id,
        name,
        label,
        type: model.mdl_type,
        available: model.available,
        status: model.status === '0' ? '0' : '1',
        used_token: 0,
      })
      idToNameMap[model.id] = name
    }
  }

  return {
    chatModelProviders: providers,
    chatModelNameById: idToNameMap,
    rerankModels,
  }
}
const EMPTY = normalizeSearchModels({})
export function useSearchModels(enabled: boolean) {
  const query = useQuery({
    queryKey: llmKeys.available(),
    enabled,
    queryFn: async ({ signal }) =>
      normalizeSearchModels(await llmAPI.list(undefined, signal)),
    staleTime: 5 * 60 * 1000,
  })
  return { ...query, ...(query.data ?? EMPTY) }
}
