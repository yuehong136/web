import { readRetrievalScore } from '@/lib/knowledge/retrieval-score'
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
  // 缺失、null、NaN、非数字与超出 [0, 1] 的评分都记为 null（不可用），不再夹成 0 或 1
  scores: {
    combined: readRetrievalScore(raw.similarity),
    vector: readRetrievalScore(raw.vector_similarity),
    term: readRetrievalScore(raw.term_similarity),
  },
})

/**
 * 保持后端返回的顺序：排序和分页都在检索服务端完成，前端只拿到当前页，
 * 不按评分重排，缺失或无效评分因此不会被当成 0 参与排序。
 */
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
