import type { SearchConfig } from '@/types/search'

export enum SummaryPreset {
  PRECISE = 'precise',
  BALANCED = 'balanced',
  CREATIVE = 'creative',
  CUSTOM = 'custom',
}

export type LLMSettingValue = {
  temperature: number
  top_p: number
  presence_penalty: number
  frequency_penalty: number
}

export const DEFAULT_LLM_SETTING: LLMSettingValue = {
  temperature: 0.5,
  top_p: 0.85,
  presence_penalty: 0.2,
  frequency_penalty: 0.3,
}

export const SUMMARY_PRESET_MAP: Record<
  Exclude<SummaryPreset, SummaryPreset.CUSTOM>,
  LLMSettingValue
> = {
  [SummaryPreset.PRECISE]: {
    temperature: 0.2,
    top_p: 0.7,
    presence_penalty: 0.1,
    frequency_penalty: 0.1,
  },
  [SummaryPreset.BALANCED]: {
    temperature: 0.5,
    top_p: 0.85,
    presence_penalty: 0.2,
    frequency_penalty: 0.3,
  },
  [SummaryPreset.CREATIVE]: {
    temperature: 0.9,
    top_p: 0.95,
    presence_penalty: 0.4,
    frequency_penalty: 0.4,
  },
}

export type LLMSettingField =
  | 'temperature'
  | 'top_p'
  | 'presence_penalty'
  | 'frequency_penalty'

export const matchSummaryPreset = (
  llmSetting?: SearchConfig['llm_setting'],
) => {
  if (!llmSetting) return SummaryPreset.BALANCED

  const keys: LLMSettingField[] = [
    'temperature',
    'top_p',
    'presence_penalty',
    'frequency_penalty',
  ]
  const allEnabled = keys.every((key) => llmSetting[key] !== undefined)
  if (!allEnabled) return SummaryPreset.CUSTOM

  const isMatched = (preset: Exclude<SummaryPreset, SummaryPreset.CUSTOM>) => {
    const target = SUMMARY_PRESET_MAP[preset]
    return keys.every(
      (key) => Math.abs((llmSetting[key] as number) - target[key]) < 0.0001,
    )
  }

  if (isMatched(SummaryPreset.PRECISE)) return SummaryPreset.PRECISE
  if (isMatched(SummaryPreset.BALANCED)) return SummaryPreset.BALANCED
  if (isMatched(SummaryPreset.CREATIVE)) return SummaryPreset.CREATIVE
  return SummaryPreset.CUSTOM
}
