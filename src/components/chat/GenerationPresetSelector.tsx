import React, { useCallback } from 'react'
import { cn } from '@/lib/utils'

// 生成多样性预设类型 - 与 ragflow 对齐
export type GenerationPresetType = 'creative' | 'precise' | 'balanced' | 'custom'

// 预设配置接口
export interface GenerationPreset {
  temperature: number
  topP: number
  presencePenalty: number
  frequencyPenalty: number
  maxTokensEnabled: boolean
}

// LLM 参数配置接口
export interface LLMParameters {
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

// 预设配置常量 - 与 ragflow settledModelVariableMap 对齐
export const GENERATION_PRESETS: Record<Exclude<GenerationPresetType, 'custom'>, GenerationPreset> = {
  // Improvise - 即兴创作：高温度，高创意
  creative: {
    temperature: 0.80,
    topP: 0.90,
    presencePenalty: 0.10,
    frequencyPenalty: 0.10,
    maxTokensEnabled: false,
  },
  // Precise - 精确：低温度，高确定性
  precise: {
    temperature: 0.20,
    topP: 0.75,
    presencePenalty: 0.50,
    frequencyPenalty: 0.50,
    maxTokensEnabled: false,
  },
  // Balance - 平衡：适中参数
  balanced: {
    temperature: 0.50,
    topP: 0.85,
    presencePenalty: 0.20,
    frequencyPenalty: 0.30,
    maxTokensEnabled: false,
  },
}

// 预设选项 - 与 ragflow ModelVariableType 对齐
export const PRESET_OPTIONS: { value: GenerationPresetType; label: string; description: string }[] = [
  { value: 'creative', label: '即兴创作', description: '高创意，适合头脑风暴' },
  { value: 'precise', label: '精确', description: '高确定性，适合严谨任务' },
  { value: 'balanced', label: '平衡', description: '适中参数，通用场景' },
  { value: 'custom', label: '自定义', description: '手动调整参数' },
]

interface GenerationPresetSelectorProps {
  /** 当前选中的预设 */
  value: GenerationPresetType
  /** 预设变更回调 */
  onChange: (preset: GenerationPresetType) => void
  /** 预设变更时应用参数的回调 */
  onApplyPreset?: (preset: GenerationPreset) => void
  /** 自定义类名 */
  className?: string
  /** 是否禁用 */
  disabled?: boolean
}

/**
 * 生成多样性预设选择器
 * 提供即兴创作、精确、平衡、自定义四种预设选项
 * 参考 ragflow 的 freedom 选择器实现
 */
export const GenerationPresetSelector: React.FC<GenerationPresetSelectorProps> = ({
  value,
  onChange,
  onApplyPreset,
  className,
  disabled = false,
}) => {
  const handlePresetChange = useCallback((preset: GenerationPresetType) => {
    onChange(preset)
    
    // 如果不是自定义，则应用预设参数
    if (preset !== 'custom' && onApplyPreset) {
      onApplyPreset(GENERATION_PRESETS[preset])
    }
  }, [onChange, onApplyPreset])

  return (
    <div className={cn('space-y-2', className)}>
      <label 
        className="block text-sm font-medium"
        style={{ color: 'var(--color-text-primary)' }}
      >
        生成多样性
      </label>
      <div 
        className="flex rounded-lg p-1" 
        style={{ 
          backgroundColor: 'var(--color-components-segmented-bg)',
          border: '1px solid var(--color-components-segmented-border)'
        }}
      >
        {PRESET_OPTIONS.map((option) => {
          const isActive = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => handlePresetChange(option.value)}
              title={option.description}
              className={cn(
                'flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
                'focus:outline-none focus-visible:ring-2',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              style={{
                backgroundColor: isActive 
                  ? 'var(--color-components-segmented-item-bg-active)' 
                  : 'var(--color-components-segmented-item-bg)',
                color: isActive 
                  ? 'var(--color-components-segmented-item-text-active)' 
                  : 'var(--color-components-segmented-item-text)',
                boxShadow: isActive ? 'var(--color-shadow-sm)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive && !disabled) {
                  e.currentTarget.style.backgroundColor = 'var(--color-components-segmented-item-bg-hover)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive && !disabled) {
                  e.currentTarget.style.backgroundColor = 'var(--color-components-segmented-item-bg)'
                }
              }}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * 根据当前 LLM 参数检测匹配的预设
 */
export function detectPreset(params: LLMParameters): GenerationPresetType {
  // 检查是否匹配任何预设
  for (const [presetName, preset] of Object.entries(GENERATION_PRESETS)) {
    let isMatch = true
    let hasEnabledParams = false
    
    // 温度参数比较
    if (params.temperatureEnabled && params.temperature !== undefined) {
      hasEnabledParams = true
      if (Math.abs(params.temperature - preset.temperature) >= 0.01) {
        isMatch = false
      }
    }
    
    // Top P参数比较
    if (params.topPEnabled && params.topP !== undefined) {
      hasEnabledParams = true
      if (Math.abs(params.topP - preset.topP) >= 0.01) {
        isMatch = false
      }
    }
    
    // Presence Penalty参数比较
    if (params.presencePenaltyEnabled && params.presencePenalty !== undefined) {
      hasEnabledParams = true
      if (Math.abs(params.presencePenalty - preset.presencePenalty) >= 0.01) {
        isMatch = false
      }
    }
    
    // Frequency Penalty参数比较
    if (params.frequencyPenaltyEnabled && params.frequencyPenalty !== undefined) {
      hasEnabledParams = true
      if (Math.abs(params.frequencyPenalty - preset.frequencyPenalty) >= 0.01) {
        isMatch = false
      }
    }
    
    // 只有当有启用的参数且全部匹配时才认为是该预设
    if (isMatch && hasEnabledParams) {
      return presetName as GenerationPresetType
    }
  }
  
  return 'custom'
}

export default GenerationPresetSelector
