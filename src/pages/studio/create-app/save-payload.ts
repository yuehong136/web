import {
  KNOWLEDGE_PARAMETER_KEY,
  stripKnowledgePlaceholder,
} from '@/lib/chat/knowledge-prompt'
import { DEFAULT_PROLOGUE, DEFAULT_SYSTEM_PROMPT } from './constants'
import {
  hasAppRetrievalSource,
  withAppKnowledgeRetrieval,
} from './knowledge-prompt'
import type { AppConfig, AppSearchMode } from './types'

const RETRIEVAL_EMPTY_RESPONSE = '抱歉，我无法回答这个问题。'

// `/api/v1/chats` takes the documented `{ type, ... }` search mode shape and
// stores it in the keyed form retrieval reads.
const toSearchModeRequest = (searchMode: AppSearchMode) =>
  searchMode.type === 'hybrid'
    ? {
        type: 'hybrid',
        weight_dense: searchMode.weight_dense ?? 0.7,
        weight_sparse: searchMode.weight_sparse ?? 0.3,
      }
    : { type: searchMode.type }

const pickEnabledLlmSettings = ({ llm_setting: setting }: AppConfig) => ({
  ...(setting.temperature_enabled && {
    temperature: Number(setting.temperature),
  }),
  ...(setting.top_p_enabled && { top_p: Number(setting.top_p) }),
  ...(setting.presence_penalty_enabled && {
    presence_penalty: Number(setting.presence_penalty),
  }),
  ...(setting.frequency_penalty_enabled && {
    frequency_penalty: Number(setting.frequency_penalty),
  }),
  ...(setting.max_tokens_enabled && {
    max_tokens: Number(setting.max_tokens),
  }),
})

/** Builds the `/api/v1/chats` create/update body from the Studio editor config. */
export const buildChatSaveRequest = (
  editorConfig: AppConfig,
  knowledgeBlock: string,
): Record<string, unknown> => {
  const config = withAppKnowledgeRetrieval(editorConfig, knowledgeBlock)
  const isRetrievalApp = hasAppRetrievalSource(config)
  const promptConfig = config.prompt_config

  const requestData: Record<string, unknown> = {
    name: config.name,
    description: config.description,
    icon: config.icon || '',
    llm_id: config.llm_id,
    // Always an object: `{}` means no overrides, and chat generation reads a dict.
    llm_setting: pickEnabledLlmSettings(config),
    prompt_config: {
      system: isRetrievalApp
        ? config.systemPrompt
        : stripKnowledgePlaceholder(config.systemPrompt) ||
          DEFAULT_SYSTEM_PROMPT,
      prologue: promptConfig.prologue || DEFAULT_PROLOGUE,
      empty_response: isRetrievalApp
        ? promptConfig.empty_response || RETRIEVAL_EMPTY_RESPONSE
        : promptConfig.empty_response || '',
      quote: promptConfig.quote,
      reference_metadata: promptConfig.reference_metadata,
      keyword: promptConfig.keyword,
      tts: promptConfig.tts,
      toc_enhance: promptConfig.toc_enhance,
      refine_multiturn: promptConfig.refine_multiturn,
      use_kg: promptConfig.use_kg,
      reasoning: promptConfig.reasoning,
      tavily_api_key: promptConfig.tavily_api_key || '',
      cross_languages: promptConfig.cross_languages || [],
      parameters: isRetrievalApp
        ? promptConfig.parameters
        : promptConfig.parameters.filter(
            (item) => item.key !== KNOWLEDGE_PARAMETER_KEY,
          ),
    },
    dataset_ids: config.kb_ids || [],
    top_n: config.top_n,
    top_k: config.top_k,
    do_refer: config.do_refer,
    similarity_threshold: config.similarity_threshold,
    vector_similarity_weight: config.vector_similarity_weight,
    rerank_id: config.rerank_id || null,
  }

  if (config.search_mode) {
    requestData.search_mode = toSearchModeRequest(config.search_mode)
  }

  return requestData
}
