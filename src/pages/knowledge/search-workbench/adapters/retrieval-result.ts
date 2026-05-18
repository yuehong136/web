import type { LLMModel } from '@/types/api'

import type {
  RawLLMModel,
  RawLLMProviderPayload,
  RetrievalResult,
  RetrievalResultView,
} from '../types'

const getFileExtension = (fileName: string): string => {
  const lastDot = fileName.lastIndexOf('.')
  if (lastDot <= 0 || lastDot === fileName.length - 1) return 'txt'
  return fileName.slice(lastDot + 1).toLowerCase()
}

const clampScore = (value: number | undefined): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

export const toRetrievalResultView = (
  raw: RetrievalResult,
): RetrievalResultView => ({
  id: raw.chunk_id,
  text: raw.text,
  highlight: raw.highlight,
  doc: {
    id: raw.doc_id,
    name: raw.docnm_kwd,
    extension: getFileExtension(raw.docnm_kwd),
  },
  scores: {
    combined: clampScore(raw.similarity),
    vector: clampScore(raw.vector_similarity),
    term: clampScore(raw.term_similarity),
  },
})

export const toRetrievalResultViewList = (
  raws: RetrievalResult[],
): RetrievalResultView[] => raws.map(toRetrievalResultView)

export const isEnabledRawLLMModel = (model: RawLLMModel): boolean =>
  model.available !== false && model.status !== '0'

export const mapRerankModelsResponse = (
  response: Record<string, RawLLMProviderPayload | RawLLMModel[]>,
): LLMModel[] => {
  return Object.entries(response).flatMap(([providerName, providerValue]) => {
    const providerModels = Array.isArray(providerValue)
      ? providerValue
      : providerValue.llm || []

    return providerModels
      .filter((model) => {
        const modelType = model.mdl_type || model.type
        return modelType === 'rerank' && isEnabledRawLLMModel(model)
      })
      .map((model) => {
        const modelName = model.llm_name || model.name || model.id || ''
        return {
          id: model.id || `${modelName}@${providerName}`,
          llm_name: modelName,
          name: model.name,
          fid: providerName,
          mdl_type: 'rerank',
          available: model.available !== false,
          status: model.status,
          max_tokens: model.max_tokens,
        } satisfies LLMModel
      })
  })
}
