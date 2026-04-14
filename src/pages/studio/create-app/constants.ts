import type { AppConfig, LanguageOption, TempAppConfig, VariableForm } from './types'

export const DEFAULT_APP_NAME = '新建应用'
export const DEFAULT_APP_DESCRIPTION = '这是一个AI助手应用'
export const DEFAULT_SYSTEM_PROMPT = '你是一个智能助手，请提供有帮助的回答。'
export const DEFAULT_PROLOGUE = '您好，我是您的助手！'
export const KNOWLEDGE_PAGE_SIZE = 10
export const STUDIO_CREATE_APP_LAYOUT_ID = 'studio-create-app-layout-v2'

export const MARKDOWN_EDITOR_PLACEHOLDER = `# AI助手系统提示词

请在这里定义AI助手的角色和行为...

## 示例：
你是一个专业的客服助手，具有以下特点：
- 友好和耐心
- 提供准确信息
- 快速响应问题`

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { value: 'English', label: '英语' },
  { value: 'Chinese', label: '中文' },
  { value: 'Spanish', label: '西班牙语' },
  { value: 'French', label: '法语' },
  { value: 'German', label: '德语' },
  { value: 'Japanese', label: '日语' },
  { value: 'Korean', label: '韩语' },
  { value: 'Vietnamese', label: '越南语' },
]

export const DEFAULT_VARIABLE_FORM: VariableForm = {
  key: '',
  optional: false,
}

export const createInitialConfig = ({
  name,
  description,
  icon,
}: {
  name?: string | null
  description?: string | null
  icon?: string | null
}): AppConfig => ({
  name: name || DEFAULT_APP_NAME,
  description: description || DEFAULT_APP_DESCRIPTION,
  icon: icon || undefined,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  llm_id: '',
  llm_setting: {
    temperature: 0.5,
    top_p: 0.85,
    presence_penalty: 0.2,
    frequency_penalty: 0.3,
    max_tokens: 4096,
    temperature_enabled: true,
    top_p_enabled: true,
    presence_penalty_enabled: true,
    frequency_penalty_enabled: true,
    max_tokens_enabled: true,
  },
  kb_ids: [],
  search_mode: {
    type: 'dense',
  },
  similarity_threshold: 0.2,
  vector_similarity_weight: 0.3,
  top_n: 8,
  top_k: 1024,
  rerank_id: null,
  do_refer: '1',
  prompt_config: {
    prologue: DEFAULT_PROLOGUE,
    empty_response: '',
    quote: true,
    keyword: false,
    tts: false,
    toc_enhance: false,
    refine_multiturn: true,
    use_kg: false,
    reasoning: false,
    tavily_api_key: '',
    cross_languages: [],
    parameters: [],
  },
})

export const createTempConfig = (config: Pick<AppConfig, 'name' | 'description' | 'icon'>): TempAppConfig => ({
  name: config.name,
  description: config.description,
  icon: config.icon,
})
