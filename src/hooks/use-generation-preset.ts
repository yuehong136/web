import { useCallback, useMemo } from 'react'
import type { GenerationPresetType, LLMParameters } from '@/constants/llm'
import {
  GenerationPresetType as GenerationPresetTypeValues,
  generationPresetConfigMap,
  getDefaultEnabledFields,
  detectMatchingPreset,
  defaultLLMParameters,
} from '@/constants/llm'

/**
 * 生成多样性预设管理 Hook
 * 参考 ragflow useHandleFreedomChange
 * 
 * 功能：
 * 1. 切换预设时自动应用对应的参数配置
 * 2. 手动修改参数时自动检测是否匹配预设，不匹配则切换到自定义模式
 * 3. 初始化时自动检测当前参数匹配的预设（解决初始状态不显示预设标记的问题）
 */

interface UseGenerationPresetOptions {
  /** 当前参数 */
  parameters: LLMParameters
  /** 参数变更回调 */
  onChange: (parameters: LLMParameters) => void
}

interface UseGenerationPresetReturn {
  /** 当前预设类型 */
  preset: GenerationPresetType
  /** 切换预设 */
  setPreset: (preset: GenerationPresetType) => void
  /** 更新单个参数（会自动检测预设匹配） */
  updateParameter: <K extends keyof Omit<LLMParameters, 'preset'>>(
    key: K,
    value: LLMParameters[K]
  ) => void
  /** 批量更新参数（会自动检测预设匹配） */
  updateParameters: (updates: Partial<Omit<LLMParameters, 'preset'>>) => void
}

/**
 * 生成多样性预设管理 Hook
 */
export function useGenerationPreset({
  parameters,
  onChange,
}: UseGenerationPresetOptions): UseGenerationPresetReturn {
  // 始终根据当前参数检测匹配的预设，而不是简单地使用 parameters.preset
  // 这样可以确保初始化时就能正确显示预设标记
  const preset = useMemo(() => {
    return detectMatchingPreset(parameters)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 显式拆分到 4 个标量字段是为了避免 parameters 对象每次渲染重新创建导致误判
  }, [
    parameters.temperature,
    parameters.topP,
    parameters.presencePenalty,
    parameters.frequencyPenalty,
  ])

  /**
   * 切换预设
   * 当选择非自定义预设时，自动应用对应的参数配置
   */
  const setPreset = useCallback(
    (newPreset: GenerationPresetType) => {
      if (newPreset === GenerationPresetTypeValues.Custom) {
        // 切换到自定义模式，只更新预设类型，保持当前参数
        onChange({
          ...parameters,
          preset: newPreset,
        })
      } else {
        // 切换到预设模式，应用预设参数配置
        const presetConfig = generationPresetConfigMap[newPreset as Exclude<GenerationPresetType, 'custom'>]
        const enabledFields = getDefaultEnabledFields()

        onChange({
          preset: newPreset,
          temperature: presetConfig.temperature,
          topP: presetConfig.topP,
          presencePenalty: presetConfig.presencePenalty,
          frequencyPenalty: presetConfig.frequencyPenalty,
          maxTokens: presetConfig.maxTokens,
          temperatureEnabled: enabledFields.temperatureEnabled,
          topPEnabled: enabledFields.topPEnabled,
          presencePenaltyEnabled: enabledFields.presencePenaltyEnabled,
          frequencyPenaltyEnabled: enabledFields.frequencyPenaltyEnabled,
          maxTokensEnabled: enabledFields.maxTokensEnabled,
        })
      }
    },
    [parameters, onChange]
  )

  /**
   * 更新单个参数
   * 会自动检测是否匹配预设，不匹配则切换到自定义模式
   */
  const updateParameter = useCallback(
    <K extends keyof Omit<LLMParameters, 'preset'>>(
      key: K,
      value: LLMParameters[K]
    ) => {
      const newParameters = {
        ...parameters,
        [key]: value,
      }

      // 检测是否匹配预设
      const matchedPreset = detectMatchingPreset(newParameters)
      newParameters.preset = matchedPreset

      onChange(newParameters)
    },
    [parameters, onChange]
  )

  /**
   * 批量更新参数
   * 会自动检测是否匹配预设，不匹配则切换到自定义模式
   */
  const updateParameters = useCallback(
    (updates: Partial<Omit<LLMParameters, 'preset'>>) => {
      const newParameters = {
        ...parameters,
        ...updates,
      }

      // 检测是否匹配预设
      const matchedPreset = detectMatchingPreset(newParameters)
      newParameters.preset = matchedPreset

      onChange(newParameters)
    },
    [parameters, onChange]
  )

  return {
    preset,
    setPreset,
    updateParameter,
    updateParameters,
  }
}

/**
 * 创建默认的 LLM 参数配置
 */
export function createDefaultLLMParameters(
  preset: GenerationPresetType = GenerationPresetTypeValues.Balance
): LLMParameters {
  if (preset === GenerationPresetTypeValues.Custom) {
    return { ...defaultLLMParameters, preset }
  }

  const presetConfig = generationPresetConfigMap[preset as Exclude<GenerationPresetType, 'custom'>]
  const enabledFields = getDefaultEnabledFields()

  return {
    preset,
    ...presetConfig,
    ...enabledFields,
  }
}

export default useGenerationPreset
