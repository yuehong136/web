import { detectMatchingPresetSnake } from '@/constants/llm'
import type { MyLLMModel, MyLLMProvider } from '@/stores/model'
import { isLLMModelEnabled } from '@/stores/model'
import type { KnowledgeBase, LLMModel } from '@/types/api'
import { DEFAULT_SYSTEM_PROMPT } from './constants'
import type { AppConfig, AppSearchMode } from './types'

interface DialogPromptConfigResponse {
  system?: string
  prologue?: string
  empty_response?: string
  quote?: boolean
  keyword?: boolean
  tts?: boolean
  toc_enhance?: boolean
  refine_multiturn?: boolean
  use_kg?: boolean
  reasoning?: boolean
  tavily_api_key?: string
  cross_languages?: string[]
  parameters?: AppConfig['prompt_config']['parameters']
}

interface DialogLLMSettingResponse {
  temperature?: number
  top_p?: number
  presence_penalty?: number
  frequency_penalty?: number
  max_tokens?: number
}

interface DialogDetailResponse {
  name?: string
  description?: string
  icon?: string
  llm_id?: string
  llm_setting?: DialogLLMSettingResponse | null
  kb_ids?: string[]
  search_mode?: unknown
  similarity_threshold?: number
  vector_similarity_weight?: number
  top_n?: number
  top_k?: number
  rerank_id?: string | null
  do_refer?: string
  prompt_config?: DialogPromptConfigResponse
  tenant_id?: string
  kb_names?: string[]
  language?: string
  create_date?: string
  create_time?: string | number
  update_date?: string
  update_time?: number
}

interface ProviderResponseEntry {
  tags?: string
  llm?: MyLLMModel[]
}

const SEARCH_MODE_TYPES = new Set<AppSearchMode['type']>([
  'hybrid',
  'dense',
  'sparse',
  'fusion',
])

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isSearchModeType = (value: unknown): value is AppSearchMode['type'] =>
  typeof value === 'string' &&
  SEARCH_MODE_TYPES.has(value as AppSearchMode['type'])

const normalizeWeight = (value: unknown, fallback: number) => {
  if (value === null || value === undefined) {
    return fallback
  }

  const normalizedValue = Number(value)
  return Number.isFinite(normalizedValue) ? normalizedValue : fallback
}

const buildSearchMode = (
  type: AppSearchMode['type'],
  modeData: Record<string, unknown>,
): AppSearchMode => {
  if (type !== 'hybrid') {
    return { type }
  }

  return {
    type,
    weight_dense: normalizeWeight(modeData.weight_dense, 0.7),
    weight_sparse: normalizeWeight(modeData.weight_sparse, 0.3),
  }
}

export const normalizeDialogSearchMode = (
  searchMode: unknown,
): AppSearchMode => {
  if (!isRecord(searchMode)) {
    return { type: 'dense' }
  }

  // Current REST API shape: { type: 'hybrid', weight_dense, weight_sparse }.
  if (isSearchModeType(searchMode.type)) {
    return buildSearchMode(searchMode.type, searchMode)
  }

  // Keep compatibility with legacy responses such as
  // { hybrid: { weight_dense, weight_sparse } }.
  const legacyType = Object.keys(searchMode).find(isSearchModeType)
  if (!legacyType) {
    return { type: 'dense' }
  }

  const legacyModeData = searchMode[legacyType]
  return buildSearchMode(
    legacyType,
    isRecord(legacyModeData) ? legacyModeData : {},
  )
}

export const normalizeDialogConfig = (data: DialogDetailResponse) => {
  const promptConfig = data.prompt_config || {}
  const llmSetting = data.llm_setting
  const isLlmSettingNull = llmSetting === null

  const config: AppConfig = {
    name: data.name || '新建应用',
    description: data.description || '',
    icon: data.icon || '',
    systemPrompt: promptConfig.system || DEFAULT_SYSTEM_PROMPT,
    llm_id: data.llm_id || '',
    llm_setting: {
      temperature: isLlmSettingNull
        ? 0.5
        : Number(llmSetting?.temperature ?? 0.5),
      top_p: isLlmSettingNull ? 0.85 : Number(llmSetting?.top_p ?? 0.85),
      presence_penalty: isLlmSettingNull
        ? 0.2
        : Number(llmSetting?.presence_penalty ?? 0.2),
      frequency_penalty: isLlmSettingNull
        ? 0.3
        : Number(llmSetting?.frequency_penalty ?? 0.3),
      max_tokens: isLlmSettingNull
        ? 4096
        : Number(llmSetting?.max_tokens ?? 4096),
      temperature_enabled: isLlmSettingNull
        ? false
        : llmSetting?.temperature !== undefined,
      top_p_enabled: isLlmSettingNull ? false : llmSetting?.top_p !== undefined,
      presence_penalty_enabled: isLlmSettingNull
        ? false
        : llmSetting?.presence_penalty !== undefined,
      frequency_penalty_enabled: isLlmSettingNull
        ? false
        : llmSetting?.frequency_penalty !== undefined,
      max_tokens_enabled: isLlmSettingNull
        ? false
        : llmSetting?.max_tokens !== undefined,
    },
    kb_ids: data.kb_ids || [],
    search_mode: normalizeDialogSearchMode(data.search_mode),
    similarity_threshold: data.similarity_threshold || 0.2,
    vector_similarity_weight: data.vector_similarity_weight || 0.3,
    top_n: data.top_n || 8,
    top_k: data.top_k || 1024,
    rerank_id: data.rerank_id || null,
    do_refer: data.do_refer || '1',
    prompt_config: {
      prologue: promptConfig.prologue || '您好，我是您的助手！',
      empty_response: promptConfig.empty_response || '',
      quote: promptConfig.quote ?? data.do_refer !== '0',
      keyword: Boolean(promptConfig.keyword),
      tts: Boolean(promptConfig.tts),
      toc_enhance: Boolean(promptConfig.toc_enhance),
      refine_multiturn: promptConfig.refine_multiturn !== false,
      use_kg: Boolean(promptConfig.use_kg),
      reasoning: Boolean(promptConfig.reasoning),
      tavily_api_key: promptConfig.tavily_api_key || '',
      cross_languages: promptConfig.cross_languages || [],
      parameters: promptConfig.parameters || [],
    },
  }

  const matchedPreset = detectMatchingPresetSnake({
    temperature: config.llm_setting.temperature ?? 0.5,
    top_p: config.llm_setting.top_p ?? 0.85,
    presence_penalty: config.llm_setting.presence_penalty ?? 0.2,
    frequency_penalty: config.llm_setting.frequency_penalty ?? 0.3,
    max_tokens: config.llm_setting.max_tokens ?? 4096,
    temperature_enabled: config.llm_setting.temperature_enabled ?? false,
    top_p_enabled: config.llm_setting.top_p_enabled ?? false,
    presence_penalty_enabled:
      config.llm_setting.presence_penalty_enabled ?? false,
    frequency_penalty_enabled:
      config.llm_setting.frequency_penalty_enabled ?? false,
    max_tokens_enabled: config.llm_setting.max_tokens_enabled ?? false,
  })

  return { config, matchedPreset }
}

export const buildKnowledgeFallback = (
  data: DialogDetailResponse,
  kbId: string,
  index: number,
): KnowledgeBase => ({
  id: kbId,
  tenant_id: data.tenant_id || '',
  name: data.kb_names?.[index] || kbId,
  description: '',
  permission: 'me',
  language: data.language || 'Chinese',
  embd_id: '',
  chunk_num: 0,
  doc_num: 0,
  token_num: 0,
  avatar: '',
  parser_id: '',
  create_time: data.create_time ? data.create_time.toString() : '',
  update_time: data.update_time || 0,
})

export const mapLLMProviders = (
  response: Record<string, ProviderResponseEntry>,
) => {
  const chatModels: MyLLMProvider = {}
  const rerankModels: LLMModel[] = []

  Object.entries(response).forEach(([providerName, providerData]) => {
    const providerModels = providerData.llm ?? []
    if (!providerModels.length) {
      return
    }

    const availableChatModels = providerModels
      .filter(
        (model) =>
          (model.type === 'chat' || model.type === 'image2text') &&
          isLLMModelEnabled(model),
      )
      .map((model) => ({
        name: model.name,
        type: model.type as 'chat' | 'image2text',
        used_token: model.used_token || 0,
        status: model.status,
        available: model.available,
      }))

    if (availableChatModels.length > 0) {
      chatModels[providerName] = {
        llm: availableChatModels,
        tags: providerData.tags || '',
      }
    }

    const availableRerankModels = providerModels
      .filter((model) => model.type === 'rerank' && isLLMModelEnabled(model))
      .map((model) => ({
        id: `${model.name}@${providerName}`,
        llm_name: model.name,
        fid: providerName,
        mdl_type: 'rerank' as const,
        available: true,
      }))
    rerankModels.push(...availableRerankModels)
  })

  return {
    chatModels,
    rerankModels,
  }
}

export type { DialogDetailResponse, ProviderResponseEntry }
