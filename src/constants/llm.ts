/**
 * LLM 相关常量定义
 * 参考 ragflow/web/src/constants/knowledge.ts 和 chat.ts
 */

/**
 * 生成多样性预设类型
 * 参考 ragflow ModelVariableType
 */
export const GenerationPresetType = {
  /** 即兴创作：高温度，高创意 */
  Improvise: 'improvise',
  /** 精确：低温度，高确定性 */
  Precise: 'precise',
  /** 平衡：适中参数 */
  Balance: 'balance',
  /** 自定义 */
  Custom: 'custom',
} as const

export type GenerationPresetType = typeof GenerationPresetType[keyof typeof GenerationPresetType]

/**
 * LLM 参数启用状态字段
 * 参考 ragflow ChatVariableEnabledField
 */
export const LLMParameterEnabledField = {
  TemperatureEnabled: 'temperatureEnabled',
  TopPEnabled: 'topPEnabled',
  PresencePenaltyEnabled: 'presencePenaltyEnabled',
  FrequencyPenaltyEnabled: 'frequencyPenaltyEnabled',
  MaxTokensEnabled: 'maxTokensEnabled',
} as const

export type LLMParameterEnabledField = typeof LLMParameterEnabledField[keyof typeof LLMParameterEnabledField]

/**
 * 启用字段与参数字段的映射
 */
export const enabledFieldToParameterMap: Record<LLMParameterEnabledField, string> = {
  [LLMParameterEnabledField.TemperatureEnabled]: 'temperature',
  [LLMParameterEnabledField.TopPEnabled]: 'topP',
  [LLMParameterEnabledField.PresencePenaltyEnabled]: 'presencePenalty',
  [LLMParameterEnabledField.FrequencyPenaltyEnabled]: 'frequencyPenalty',
  [LLMParameterEnabledField.MaxTokensEnabled]: 'maxTokens',
}

/**
 * 预设参数配置
 */
export type GenerationPresetConfig = {
  temperature: number
  topP: number
  presencePenalty: number
  frequencyPenalty: number
  maxTokens: number
}

/**
 * 预设参数配置映射
 * 参考 ragflow settledModelVariableMap
 */
export const generationPresetConfigMap: Record<Exclude<GenerationPresetType, 'custom'>, GenerationPresetConfig> = {
  [GenerationPresetType.Improvise]: {
    temperature: 0.80,
    topP: 0.90,
    presencePenalty: 0.10,
    frequencyPenalty: 0.10,
    maxTokens: 4096,
  },
  [GenerationPresetType.Precise]: {
    temperature: 0.20,
    topP: 0.75,
    presencePenalty: 0.50,
    frequencyPenalty: 0.50,
    maxTokens: 4096,
  },
  [GenerationPresetType.Balance]: {
    temperature: 0.50,
    topP: 0.85,
    presencePenalty: 0.20,
    frequencyPenalty: 0.30,
    maxTokens: 4096,
  },
}

/**
 * 预设选项配置
 */
export type PresetOption = {
  value: GenerationPresetType
  label: string
  description: string
}

/**
 * 预设选项列表
 */
export const generationPresetOptions: PresetOption[] = [
  { value: GenerationPresetType.Improvise, label: '即兴创作', description: '高创意，适合头脑风暴' },
  { value: GenerationPresetType.Precise, label: '精确', description: '高确定性，适合严谨任务' },
  { value: GenerationPresetType.Balance, label: '平衡', description: '适中参数，通用场景' },
  { value: GenerationPresetType.Custom, label: '自定义', description: '手动调整参数' },
]

/**
 * 获取默认的参数启用状态
 * 预设模式下，除 maxTokens 外其他参数都应启用
 */
export function getDefaultEnabledFields(): Record<LLMParameterEnabledField, boolean> {
  return {
    [LLMParameterEnabledField.TemperatureEnabled]: true,
    [LLMParameterEnabledField.TopPEnabled]: true,
    [LLMParameterEnabledField.PresencePenaltyEnabled]: true,
    [LLMParameterEnabledField.FrequencyPenaltyEnabled]: true,
    [LLMParameterEnabledField.MaxTokensEnabled]: false,
  }
}

/**
 * LLM 参数配置接口
 */
export type LLMParameters = {
  // 预设类型
  preset: GenerationPresetType
  // 参数值
  temperature: number
  topP: number
  presencePenalty: number
  frequencyPenalty: number
  maxTokens: number
  // 启用状态
  temperatureEnabled: boolean
  topPEnabled: boolean
  presencePenaltyEnabled: boolean
  frequencyPenaltyEnabled: boolean
  maxTokensEnabled: boolean
}

/**
 * 默认 LLM 参数
 */
export const defaultLLMParameters: LLMParameters = {
  preset: GenerationPresetType.Balance,
  ...generationPresetConfigMap[GenerationPresetType.Balance],
  ...getDefaultEnabledFields(),
}

/**
 * 检测当前参数是否匹配某个预设
 * 参考 ragflow checkParameterIsEqual
 */
export function detectMatchingPreset(params: Omit<LLMParameters, 'preset'>): GenerationPresetType {
  const tolerance = 0.01

  for (const [presetName, presetConfig] of Object.entries(generationPresetConfigMap)) {
    const isMatch =
      Math.abs(params.temperature - presetConfig.temperature) < tolerance &&
      Math.abs(params.topP - presetConfig.topP) < tolerance &&
      Math.abs(params.presencePenalty - presetConfig.presencePenalty) < tolerance &&
      Math.abs(params.frequencyPenalty - presetConfig.frequencyPenalty) < tolerance

    if (isMatch) {
      return presetName as GenerationPresetType
    }
  }

  return GenerationPresetType.Custom
}

// ============================================
// Snake_case 版本 (用于兼容后端 API 数据结构)
// ============================================

/**
 * 预设参数配置 (snake_case 版本，用于 API 兼容)
 */
export type GenerationPresetConfigSnake = {
  temperature: number
  top_p: number
  presence_penalty: number
  frequency_penalty: number
  max_tokens: number
}

/**
 * 预设参数配置映射 (snake_case 版本)
 */
export const generationPresetConfigMapSnake: Record<Exclude<GenerationPresetType, 'custom'>, GenerationPresetConfigSnake> = {
  [GenerationPresetType.Improvise]: {
    temperature: 0.80,
    top_p: 0.90,
    presence_penalty: 0.10,
    frequency_penalty: 0.10,
    max_tokens: 4096,
  },
  [GenerationPresetType.Precise]: {
    temperature: 0.20,
    top_p: 0.75,
    presence_penalty: 0.50,
    frequency_penalty: 0.50,
    max_tokens: 4096,
  },
  [GenerationPresetType.Balance]: {
    temperature: 0.50,
    top_p: 0.85,
    presence_penalty: 0.20,
    frequency_penalty: 0.30,
    max_tokens: 4096,
  },
}

/**
 * 获取默认的参数启用状态 (snake_case 版本)
 */
export function getDefaultEnabledFieldsSnake(): Record<string, boolean> {
  return {
    temperature_enabled: true,
    top_p_enabled: true,
    presence_penalty_enabled: true,
    frequency_penalty_enabled: true,
    max_tokens_enabled: false,
  }
}

/**
 * LLM 参数配置 (snake_case 版本，用于 API 兼容)
 */
export type LLMParametersSnake = {
  temperature: number
  top_p: number
  presence_penalty: number
  frequency_penalty: number
  max_tokens: number
  temperature_enabled: boolean
  top_p_enabled: boolean
  presence_penalty_enabled: boolean
  frequency_penalty_enabled: boolean
  max_tokens_enabled: boolean
}

/**
 * 检测当前参数是否匹配某个预设 (snake_case 版本)
 */
export function detectMatchingPresetSnake(params: LLMParametersSnake): GenerationPresetType {
  const tolerance = 0.01

  for (const [presetName, presetConfig] of Object.entries(generationPresetConfigMapSnake)) {
    const isMatch =
      Math.abs(params.temperature - presetConfig.temperature) < tolerance &&
      Math.abs(params.top_p - presetConfig.top_p) < tolerance &&
      Math.abs(params.presence_penalty - presetConfig.presence_penalty) < tolerance &&
      Math.abs(params.frequency_penalty - presetConfig.frequency_penalty) < tolerance

    if (isMatch) {
      return presetName as GenerationPresetType
    }
  }

  return GenerationPresetType.Custom
}
