import { modelProvidersAPI } from './llm-providers'
import type { TenantModel } from './llm-provider-types'
import { type LLMCatalog, type MyLLMProvider } from '@/stores/model'
import type { LLMModel, LLMType } from '@/types/api'

export const llmAPI = {
  // Catalog availability must be intersected with configured tenant rows.
  getModelCatalog: async (signal?: AbortSignal): Promise<LLMCatalog> => {
    const rows = await modelProvidersAPI.models(signal)
    const catalog: LLMCatalog = {}
    for (const row of rows)
      (catalog[row.provider_name] ??= []).push({
        llm_name: row.name,
        fid: row.provider_name,
        mdl_type: row.model_types.join(','),
        available: row.effective_status === 'active',
      })
    return catalog
  },

  // 获取模型列表
  list: async (
    params?: {
      mdl_type?: LLMType
      available?: boolean
    },
    signal?: AbortSignal,
  ): Promise<Record<string, LLMModel[]>> => {
    const rows = await modelProvidersAPI.models(signal)
    const providers: Record<string, LLMModel[]> = {}
    for (const row of rows)
      for (const type of row.model_types) {
        if (params?.mdl_type && params.mdl_type !== type) continue
        if (params?.available && row.effective_status !== 'active') continue
        ;(providers[row.provider_name] ??= []).push({
          id: row.reference,
          llm_name: `${row.name} · ${row.instance_name}`,
          name: row.name,
          fid: row.provider_name,
          mdl_type: type,
          available: row.effective_status === 'active',
          status: row.effective_status === 'active' ? '1' : '0',
          max_tokens: row.max_tokens,
        })
      }
    return providers
  },

  // The tenant endpoint returns provider objects with nested llm rows.
  getMyLLMs: async (
    params?: {
      mdl_type?: LLMType
      available?: boolean
      include_details?: boolean
    },
    signal?: AbortSignal,
  ): Promise<MyLLMProvider> => {
    const rows = await modelProvidersAPI.models(signal)
    return projectTenantModels(
      rows.filter(
        (row) => !params?.available || row.effective_status === 'active',
      ),
    )
  },

  // 获取模型工厂列表
  getFactories: async (signal?: AbortSignal) =>
    (await modelProvidersAPI.providers(true, signal)).map((provider) => ({
      id: provider.name,
      name: provider.name,
      tags: provider.model_types.join(','),
      logo: '',
    })),
}

export function projectTenantModels(rows: TenantModel[]): MyLLMProvider {
  const providers: MyLLMProvider = {}
  for (const row of rows) {
    const provider = (providers[row.provider_name] ??= { tags: '', llm: [] })
    for (const type of row.model_types)
      provider.llm.push({
        id: row.reference,
        reference: row.reference,
        instance_name: row.instance_name,
        model_types: row.model_types,
        label: `${row.name} · ${row.instance_name}`,
        name: row.name,
        type,
        status: row.effective_status === 'active' ? '1' : '0',
        available: row.effective_status === 'active',
        max_tokens: row.max_tokens,
        is_tools: row.is_tools,
        used_token: 0,
      })
    provider.tags = [...new Set(provider.llm.map((model) => model.type))].join(
      ',',
    )
  }
  return providers
}
