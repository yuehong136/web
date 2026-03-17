'use client'

import * as React from 'react'
import { useFormContext } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { Slider } from '@/components/ui/slider'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'

export type FormLayoutType = 'horizontal' | 'vertical'

interface SliderInputFormFieldProps {
  name: string
  label: string
  tooltip?: React.ReactNode
  min?: number
  max?: number
  step?: number
  defaultValue?: number
  layout?: FormLayoutType
  className?: string
  disabled?: boolean
  /** 是否显示为百分比（值 0-1 显示为 0%-100%） */
  percentage?: boolean
}

export function SliderInputFormField({
  name,
  label,
  tooltip,
  min = 0,
  max = 100,
  step = 1,
  defaultValue = 0,
  layout = 'horizontal',
  className,
  disabled = false,
  percentage = false,
}: SliderInputFormFieldProps) {
  const form = useFormContext()
  const isHorizontal = layout === 'horizontal'

  // 百分比模式下的转换系数
  const multiplier = percentage ? 100 : 1

  const normalizeNumber = (value: unknown) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }

    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value)
      if (Number.isFinite(parsed)) {
        return parsed
      }
    }

    return defaultValue
  }

  return (
    <FormField
      control={form.control}
      name={name}
      defaultValue={defaultValue}
      render={({ field }) => {
        const rawValue = normalizeNumber(field.value)
        // 显示值：百分比模式下乘以100
        const displayValue = percentage ? Math.round(rawValue * multiplier) : rawValue

        const handleSliderChange = (values: number[]) => {
          field.onChange(values[0])
        }

        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const inputValue = e.target.value
          if (inputValue === '') {
            field.onChange(min)
            return
          }
          const numValue = parseFloat(inputValue)
          if (!isNaN(numValue)) {
            // 百分比模式下，输入值除以100存储
            const actualValue = percentage ? numValue / multiplier : numValue
            const clampedValue = Math.min(Math.max(actualValue, min), max)
            field.onChange(clampedValue)
          }
        }

        // 百分比模式下的显示范围
        const displayMin = percentage ? min * multiplier : min
        const displayMax = percentage ? max * multiplier : max
        const displayStep = percentage ? Math.round(step * multiplier) || 1 : step

        return (
          <FormItem className={cn(isHorizontal && 'flex items-start gap-3 space-y-0', className)}>
            <FormLabel
              tooltip={tooltip}
              className={cn(
                'text-sm text-text-secondary pt-1.5',
                isHorizontal && 'w-[140px] shrink-0'
              )}
            >
              {label}
            </FormLabel>
            <div
              className={cn(
                'flex items-center gap-4',
                isHorizontal ? 'flex-1 min-w-0' : 'w-full'
              )}
            >
              <FormControl>
                <Slider
                  value={[rawValue]}
                  onValueChange={handleSliderChange}
                  min={min}
                  max={max}
                  step={step}
                  disabled={disabled}
                  className="flex-1"
                />
              </FormControl>
              <div className="flex items-center shrink-0">
                <input
                  type="number"
                  value={displayValue}
                  onChange={handleInputChange}
                  min={displayMin}
                  max={displayMax}
                  step={displayStep}
                  disabled={disabled}
                  className={cn(
                    'h-7 w-16 rounded-md border border-border bg-background px-2 text-center text-sm',
                    'focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary',
                    '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                />
                {percentage && (
                  <span className="ml-1 text-sm text-text-secondary">%</span>
                )}
              </div>
            </div>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}

export default SliderInputFormField
