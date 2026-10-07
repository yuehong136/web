import type { MetadataCondition } from '@/types/api'
import type { GenerationPresetType } from '@/constants/llm'
import type { MetadataFilterMode } from './MetadataFilter'

// 动态变量项
export interface DynamicVariable {
  key: string
  optional: boolean
}

/**
 * 聊天设置配置 - 完整版，参考 ragflow
 */
export interface ChatSettings {
  // === 聊天设置（参考 ragflow） ===
  /** 助理头像 (base64 或 URL) */
  icon?: string
  /** 助手名称 */
  name?: string
  /** 助手描述 */
  description?: string
  /** 空回复内容 */
  emptyResponse?: string
  /** 开场白 */
  prologue?: string

  // === 开关选项 ===
  /** 显示引用 */
  quote: boolean
  /** 关键词分析 */
  keyword: boolean
  /** 文本转语音 */
  tts: boolean
  /** 目录增强 */
  tocEnhance: boolean
  /** 多轮对话优化 */
  refineMultiturn: boolean
  /** 使用知识图谱 */
  useKnowledgeGraph: boolean
  /** 深度思考/推理 */
  reasoning: boolean

  // === API Key ===
  /** Tavily API Key */
  tavilyApiKey?: string

  // === 知识库设置 ===
  /** 选中的知识库 ID 列表 */
  kbIds: string[]

  // === 元数据过滤 ===
  /** 元数据过滤模式 */
  metadataFilterMode: MetadataFilterMode
  /** 元数据过滤条件 */
  metadataCondition: MetadataCondition

  // === 提示工程 ===
  /** 系统提示词 */
  systemPrompt: string
  /** 相似度阈值 */
  similarityThreshold: number
  /** 向量相似度权重 */
  vectorSimilarityWeight: number
  /** Top N */
  topN: number
  /** 跨语言 */
  crossLanguages: string[]
  /** 动态变量 */
  variables: DynamicVariable[]

  // === 重排序设置 ===
  /** 重排序模型 ID */
  rerankId?: string
  /** Top K (重排序时使用) */
  topK: number

  // === LLM 设置 ===
  /** LLM 模型 ID */
  llmId?: string
  /** 生成多样性预设 */
  generationPreset: GenerationPresetType
  /** Temperature */
  temperature: number
  /** Temperature 是否启用 */
  temperatureEnabled: boolean
  /** Top P */
  topP: number
  /** Top P 是否启用 */
  topPEnabled: boolean
  /** Presence Penalty */
  presencePenalty: number
  /** Presence Penalty 是否启用 */
  presencePenaltyEnabled: boolean
  /** Frequency Penalty */
  frequencyPenalty: number
  /** Frequency Penalty 是否启用 */
  frequencyPenaltyEnabled: boolean
  /** Max Tokens */
  maxTokens: number
  /** Max Tokens 是否启用 */
  maxTokensEnabled: boolean
}
