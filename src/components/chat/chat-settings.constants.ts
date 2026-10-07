import { GenerationPresetType } from '@/constants/llm'
import type { ChatSettings } from './chat-settings.types'

// 跨语言检索可选语言；value 是 prompt_config.cross_languages 的协议值，不翻译
export const CROSS_LANGUAGE_OPTIONS = [
  { value: 'English', labelKey: 'chat.settings.languages.english' },
  { value: 'Chinese', labelKey: 'chat.settings.languages.chinese' },
  { value: 'Spanish', labelKey: 'chat.settings.languages.spanish' },
  { value: 'French', labelKey: 'chat.settings.languages.french' },
  { value: 'German', labelKey: 'chat.settings.languages.german' },
  { value: 'Japanese', labelKey: 'chat.settings.languages.japanese' },
  { value: 'Korean', labelKey: 'chat.settings.languages.korean' },
  { value: 'Vietnamese', labelKey: 'chat.settings.languages.vietnamese' },
] as const

/**
 * 默认聊天设置
 * 开场白留空：加载应用时由 dialogToSettings 按界面语言补默认开场白
 */
export const defaultChatSettings: ChatSettings = {
  // 聊天设置
  icon: '',
  name: '',
  description: '',
  emptyResponse: '',
  prologue: '',

  // 开关选项
  quote: true,
  keyword: false,
  tts: false,
  tocEnhance: false,
  refineMultiturn: true,
  useKnowledgeGraph: false,
  reasoning: false,

  // API Key
  tavilyApiKey: '',

  // 知识库
  kbIds: [],

  // 元数据过滤
  metadataFilterMode: 'disabled',
  metadataCondition: {
    logic: 'and',
    conditions: [],
  },

  // 提示工程
  systemPrompt: '',
  similarityThreshold: 0.2,
  vectorSimilarityWeight: 0.3,
  topN: 8,
  crossLanguages: [],
  variables: [],

  // 重排序
  rerankId: '',
  topK: 1024,

  // LLM 设置
  llmId: '',
  generationPreset: GenerationPresetType.Balance,
  temperature: 0.5,
  temperatureEnabled: true,
  topP: 0.85,
  topPEnabled: true,
  presencePenalty: 0.2,
  presencePenaltyEnabled: true,
  frequencyPenalty: 0.3,
  frequencyPenaltyEnabled: true,
  maxTokens: 4096,
  maxTokensEnabled: false,
}
