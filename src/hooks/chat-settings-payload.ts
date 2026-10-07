import type { ChatSettings } from '@/components/chat/chat-settings.types'
import { withKnowledgeRetrieval } from '@/lib/chat/knowledge-prompt'
import type { DialogApp } from '@/types/api'

/**
 * 从 ChatSettings 转换为 DialogApp 更新请求
 * 关联了知识库或 Tavily Key 时，system 缺少 {knowledge} 就在末尾追加 knowledgeBlock，
 * parameters 缺少 knowledge 就补充为必填；否则提示词与变量按编辑内容原样发送。
 */
export function settingsToDialogUpdate(
  settings: ChatSettings,
  knowledgeBlock: string,
): Partial<DialogApp> & { dataset_ids: string[] } {
  // 构建 meta_data_filter
  let metaDataFilter: any = { method: 'disabled' }
  if (
    settings.metadataFilterMode === 'manual' &&
    settings.metadataCondition.conditions?.length
  ) {
    metaDataFilter = {
      method: 'manual',
      logic: settings.metadataCondition.logic || 'and',
      manual: settings.metadataCondition.conditions.map((c) => ({
        key: c.name,
        op: c.comparison_operator,
        value: c.value,
      })),
    }
  }

  const prompt = withKnowledgeRetrieval(
    {
      systemPrompt: settings.systemPrompt,
      parameters: settings.variables
        .filter((v) => v.key)
        .map((v) => ({
          key: v.key,
          optional: v.optional,
        })),
    },
    { datasetIds: settings.kbIds, tavilyApiKey: settings.tavilyApiKey },
    knowledgeBlock,
  )

  return {
    icon: settings.icon || undefined,
    name: settings.name || undefined,
    description: settings.description || undefined,
    dataset_ids: settings.kbIds,
    similarity_threshold: settings.similarityThreshold,
    vector_similarity_weight: settings.vectorSimilarityWeight,
    top_n: settings.topN,
    top_k: settings.topK,
    rerank_id: settings.rerankId || null,
    llm_id: settings.llmId || undefined,
    llm_setting: {
      // 只发送启用的参数，参考 ragflow 的 removeUselessFieldsFromValues 逻辑
      ...(settings.temperatureEnabled
        ? { temperature: settings.temperature }
        : {}),
      ...(settings.topPEnabled ? { top_p: settings.topP } : {}),
      ...(settings.presencePenaltyEnabled
        ? { presence_penalty: settings.presencePenalty }
        : {}),
      ...(settings.frequencyPenaltyEnabled
        ? { frequency_penalty: settings.frequencyPenalty }
        : {}),
      ...(settings.maxTokensEnabled ? { max_tokens: settings.maxTokens } : {}),
    },
    prompt_config: {
      system: prompt.systemPrompt,
      prologue: settings.prologue,
      empty_response: settings.emptyResponse,
      quote: settings.quote,
      keyword: settings.keyword,
      tts: settings.tts,
      toc_enhance: settings.tocEnhance,
      refine_multiturn: settings.refineMultiturn,
      use_kg: settings.useKnowledgeGraph,
      reasoning: settings.reasoning,
      tavily_api_key: settings.tavilyApiKey,
      cross_languages: settings.crossLanguages,
      parameters: prompt.parameters,
    },
    meta_data_filter: metaDataFilter,
  } as any
}
