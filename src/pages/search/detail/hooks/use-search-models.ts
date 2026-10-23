import { useQuery } from '@tanstack/react-query'
import { llmAPI } from '@/api/llm'
import { llmKeys } from '@/hooks/use-llm-request'
import type { LLMModel } from '@/types/api'
import type { MyLLMProvider } from '@/stores/model'

interface RawModelItem {
  id?: string
  name?: string
  llm_name?: string
  type?: string
  mdl_type?: string
  available?: boolean
  status?: string
  used_token?: number
}

interface RawProviderPayload {
  tags?: string
  llm?: RawModelItem[]
}

const isEnabledRawModel = (model: RawModelItem) =>
  model.available !== false && model.status !== '0'

export function normalizeSearchModels(response: Record<string, unknown>) {
  const providers = Object.entries(
    response as Record<string, unknown>,
  ).reduce<MyLLMProvider>((acc, [providerName, providerValue]) => {
    const payload = providerValue as RawProviderPayload | RawModelItem[]
    const llmList = Array.isArray(payload) ? payload : payload?.llm || []
    const llm = llmList
      .filter((model) => {
        const modelType = model.mdl_type || model.type
        return (
          isEnabledRawModel(model) &&
          (modelType === 'chat' || modelType === 'image2text') &&
          !!(model.llm_name || model.name || model.id)
        )
      })
      .map((model) => ({
        type: (model.mdl_type || model.type) as 'chat' | 'image2text',
        name: model.llm_name || model.name || model.id || '',
        used_token: model.used_token || 0,
        status: model.status as '0' | '1' | undefined,
        available: model.available,
      }))

    if (llm.length) {
      acc[providerName] = {
        tags: Array.isArray(payload) ? '' : payload.tags || '',
        llm,
      }
    }

    return acc
  }, {})

  const allModels = Object.entries(response as Record<string, unknown>).flatMap(
    ([providerName, providerValue]) => {
      const payload = providerValue as RawProviderPayload | RawModelItem[]
      const llmList = Array.isArray(payload) ? payload : payload?.llm || []
      return llmList
        .filter((model) => isEnabledRawModel(model))
        .map(
          (model): LLMModel => ({
            id:
              model.id ||
              `${model.llm_name || model.name || 'model'}@${providerName}`,
            llm_name: model.llm_name || model.name || model.id || '',
            fid: providerName,
            mdl_type: (model.mdl_type ||
              model.type ||
              'chat') as LLMModel['mdl_type'],
            available: model.available !== false,
            status: model.status,
            name: model.name,
          }),
        )
    },
  )

  const idToNameMap: Record<string, string> = {}
  allModels.forEach((model) => {
    if (model.mdl_type !== 'chat' && model.mdl_type !== 'image2text') return
    const modelName = model.llm_name || model.name || model.id
    if (!modelName) return
    idToNameMap[model.id || modelName] = modelName
  })

  return {
    chatModelProviders: providers,
    chatModelNameById: idToNameMap,
    rerankModels: allModels.filter((model) => model.mdl_type === 'rerank'),
  }
}
const EMPTY = normalizeSearchModels({})
export function useSearchModels(enabled: boolean) {
  const query = useQuery({
    queryKey: llmKeys.available(),
    enabled,
    queryFn: async () =>
      normalizeSearchModels(
        (await llmAPI.list({ available: true })) as Record<string, unknown>,
      ),
    staleTime: 5 * 60 * 1000,
  })
  return { ...query, ...(query.data ?? EMPTY) }
}
