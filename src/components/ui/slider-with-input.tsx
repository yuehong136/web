'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { HelpCircle } from 'lucide-react'
import {
  TooltipRoot as Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

/**
 * LLM 参数控制组件 - Radix UI 版本
 * 
 * 布局结构（参考 ragflow 的单行紧凑设计）：
 * [标签 ⓘ]
 * [Switch] [======Slider======] [Input]
 * 
 * 特点：
 * 1. 开关控制参数是否启用
 * 2. 滑块用于快速调整
 * 3. 输入框用于精确输入数值
 * 4. 禁用时只显示关闭状态
 */

export interface SliderWithInputProps {
  /** 参数标签 */
  label: string
  /** 提示信息 */
  tooltip?: string
  /** 当前值 */
  value: number
  /** 值变更回调 */
  onChange: (value: number) => void
  /** 是否启用 */
  enabled?: boolean
  /** 启用状态变更回调 */
  onEnabledChange?: (enabled: boolean) => void
  /** 最小值 */
  min?: number
  /** 最大值 */
  max?: number
  /** 步长 */
  step?: number
  /** 是否禁用整个组件 */
  disabled?: boolean
  /** 自定义类名 */
  className?: string
  /** 是否显示开关（默认 true） */
  showSwitch?: boolean
  /** 是否只显示输入框（用于 max_tokens 等大范围值） */
  inputOnly?: boolean
  /** 输入框宽度 */
  inputWidth?: number
  /** 小数位数 */
  precision?: number
}

export const SliderWithInput: React.FC<SliderWithInputProps> = ({
  label,
  tooltip,
  value,
  onChange,
  enabled = true,
  onEnabledChange,
  min = 0,
  max = 1,
  step = 0.01,
  disabled = false,
  className,
  showSwitch = true,
  inputOnly = false,
  inputWidth = 70,
  precision = 2,
}) => {
  const handleSliderChange = (values: number[]) => {
    onChange(values[0])
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    if (inputValue === '') {
      onChange(min)
      return
    }
    const numValue = parseFloat(inputValue)
    if (!isNaN(numValue)) {
      // 确保值在范围内
      const clampedValue = Math.min(Math.max(numValue, min), max)
      onChange(clampedValue)
    }
  }

  const isActive = showSwitch ? enabled : true
  const displayPrecision = step < 1 ? precision : 0

  return (
    <div className={cn('space-y-2', className)}>
      {/* 标签行 */}
      <div className="flex items-center gap-1">
        <span 
          className="text-sm font-medium"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {label}
        </span>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle 
                  className="h-3.5 w-3.5 cursor-help"
                  style={{ color: 'var(--color-text-tertiary)' }}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* 控件行：开关 + 滑块 + 输入框 */}
      <div className="flex items-center gap-3">
        {/* 开关 */}
        {showSwitch && (
          <Switch
            checked={enabled}
            onCheckedChange={onEnabledChange}
            disabled={disabled}
          />
        )}

        {/* 滑块（仅在启用且非 inputOnly 模式时显示） */}
        {isActive && !inputOnly && (
          <Slider
            value={[value]}
            onValueChange={handleSliderChange}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className="flex-1"
          />
        )}

        {/* 输入框（仅在启用时显示） */}
        {isActive && (
          <input
            type="number"
            value={inputOnly ? value : value.toFixed(displayPrecision)}
            onChange={handleInputChange}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            style={{ width: inputWidth }}
            className={cn(
              'h-8 rounded-md border border-border bg-background px-2 text-center text-sm',
              'focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary',
              '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          />
        )}
      </div>
    </div>
  )
}

/**
 * 预设的参数配置（与 LLMParameterControl 保持一致）
 */
export const SLIDER_PRESETS = {
  temperature: {
    label: 'Temperature',
    tooltip: '控制输出的随机性，值越高越有创意',
    min: 0,
    max: 2,
    step: 0.01,
    default: 0.5,
    precision: 2,
  },
  topP: {
    label: 'Top P',
    tooltip: '核采样参数，控制输出的多样性',
    min: 0,
    max: 1,
    step: 0.01,
    default: 0.85,
    precision: 2,
  },
  presencePenalty: {
    label: 'Presence Penalty',
    tooltip: '降低重复主题的可能性',
    min: 0,
    max: 2,
    step: 0.01,
    default: 0.2,
    precision: 2,
  },
  frequencyPenalty: {
    label: 'Frequency Penalty',
    tooltip: '降低重复用词的可能性',
    min: 0,
    max: 2,
    step: 0.01,
    default: 0.3,
    precision: 2,
  },
  maxTokens: {
    label: 'Max Tokens',
    tooltip: '限制单次回复的最大 token 数量',
    min: 1,
    max: 128000,
    step: 1,
    default: 4096,
    inputOnly: true,
    inputWidth: 100,
    precision: 0,
  },
} as const

export default SliderWithInput
