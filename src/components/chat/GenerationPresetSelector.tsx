import React from 'react'
import { cn } from '@/lib/utils'
import type { GenerationPresetType } from '@/constants/llm'
import { generationPresetOptions } from '@/constants/llm'

// 导出类型和常量供外部使用
export type { GenerationPresetType, LLMParameters, GenerationPresetConfig, PresetOption } from '@/constants/llm'
export {
  GenerationPresetType as GenerationPresetTypeValues,
  generationPresetConfigMap,
  generationPresetOptions,
  defaultLLMParameters,
  detectMatchingPreset,
  getDefaultEnabledFields,
} from '@/constants/llm'

interface GenerationPresetSelectorProps {
  /** 当前选中的预设 */
  value: GenerationPresetType
  /** 预设变更回调 */
  onChange: (preset: GenerationPresetType) => void
  /** 自定义类名 */
  className?: string
  /** 是否禁用 */
  disabled?: boolean
}

/**
 * 生成多样性预设选择器
 * 提供即兴创作、精确、平衡、自定义四种预设选项
 * 
 * 最佳实践：
 * - 使用 useGenerationPreset hook 管理预设和参数状态
 * - 组件只负责 UI 展示和预设选择，不处理参数应用逻辑
 * 
 * @example
 * ```tsx
 * import { useGenerationPreset, createDefaultLLMParameters } from '@/hooks/use-generation-preset'
 * 
 * const [params, setParams] = useState(createDefaultLLMParameters())
 * const { preset, setPreset, updateParameter } = useGenerationPreset({
 *   parameters: params,
 *   onChange: setParams,
 * })
 * 
 * return (
 *   <>
 *     <GenerationPresetSelector value={preset} onChange={setPreset} />
 *     <SliderWithInput
 *       value={params.temperature}
 *       onChange={(v) => updateParameter('temperature', v)}
 *     />
 *   </>
 * )
 * ```
 */
export const GenerationPresetSelector: React.FC<GenerationPresetSelectorProps> = ({
  value,
  onChange,
  className,
  disabled = false,
}) => {
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
        {generationPresetOptions.map((option) => {
          const isActive = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.value)}
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

export default GenerationPresetSelector
