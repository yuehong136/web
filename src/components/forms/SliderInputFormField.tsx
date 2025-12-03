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
}: SliderInputFormFieldProps) {
  const form = useFormContext()
  const isHorizontal = layout === 'horizontal'

  return (
    <FormField
      control={form.control}
      name={name}
      defaultValue={defaultValue}
      render={({ field }) => {
        const value = typeof field.value === 'number' ? field.value : defaultValue

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
            const clampedValue = Math.min(Math.max(numValue, min), max)
            field.onChange(clampedValue)
          }
        }

        return (
          <FormItem className={cn(isHorizontal && 'flex items-center gap-1 space-y-0', className)}>
            <FormLabel
              tooltip={tooltip}
              className={cn(
                'text-sm text-text-secondary whitespace-nowrap',
                isHorizontal && 'w-1/4 shrink-0'
              )}
            >
              {label}
            </FormLabel>
            <div
              className={cn(
                'flex items-center gap-4',
                isHorizontal ? 'w-3/4' : 'w-full'
              )}
            >
              <FormControl>
                <Slider
                  value={[value]}
                  onValueChange={handleSliderChange}
                  min={min}
                  max={max}
                  step={step}
                  disabled={disabled}
                  className="flex-1"
                />
              </FormControl>
              <input
                type="number"
                value={value}
                onChange={handleInputChange}
                min={min}
                max={max}
                step={step}
                disabled={disabled}
                className={cn(
                  'h-7 w-16 rounded-md border border-border bg-background px-2 text-center text-sm',
                  'focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary',
                  '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              />
            </div>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}

export default SliderInputFormField

