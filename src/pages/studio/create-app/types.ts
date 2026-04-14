export interface AppLLMSetting {
  temperature?: number
  top_p?: number
  presence_penalty?: number
  frequency_penalty?: number
  max_tokens?: number
  temperature_enabled?: boolean
  top_p_enabled?: boolean
  presence_penalty_enabled?: boolean
  frequency_penalty_enabled?: boolean
  max_tokens_enabled?: boolean
}

export interface AppSearchMode {
  type: 'hybrid' | 'dense' | 'sparse' | 'fusion'
  weight_dense?: number
  weight_sparse?: number
}

export interface AppParameter {
  key: string
  optional: boolean
}

export interface AppPromptConfig {
  prologue: string
  empty_response: string
  quote: boolean
  keyword: boolean
  tts: boolean
  toc_enhance: boolean
  refine_multiturn: boolean
  use_kg: boolean
  reasoning: boolean
  tavily_api_key: string
  cross_languages: string[]
  parameters: AppParameter[]
}

export interface AppConfig {
  name: string
  description: string
  icon?: string
  systemPrompt: string
  llm_id: string
  llm_setting: AppLLMSetting
  kb_ids: string[]
  search_mode: AppSearchMode | null
  similarity_threshold: number
  vector_similarity_weight: number
  top_n: number
  top_k: number
  rerank_id: string | null
  do_refer: string
  prompt_config: AppPromptConfig
}

export interface TempAppConfig {
  name: string
  description: string
  icon?: string
}

export interface PreviewMessage {
  role: 'user' | 'assistant'
  content: string
  id: string
  thinking?: string
}

export interface VariableForm {
  key: string
  optional: boolean
}

export interface LanguageOption {
  value: string
  label: string
}
