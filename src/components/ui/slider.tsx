'use client'

import * as SliderPrimitive from '@radix-ui/react-slider'
import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Slider 组件 - 参考 ragflow 设计
 * Track: 使用半透明背景
 * Range: 使用主色调 (teal)
 * Thumb: 白色背景 + 主色调边框
 */
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex w-full touch-none select-none items-center',
      className,
    )}
    {...props}
  >
    <SliderPrimitive.Track 
      className="relative h-2 w-full grow overflow-hidden rounded-full"
      style={{ backgroundColor: 'var(--color-components-slider-track)' }}
    >
      <SliderPrimitive.Range 
        className="absolute"
        style={{ backgroundColor: 'var(--color-components-slider-range)', height: '100%' }}
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb 
      className="block h-5 w-5 rounded-full ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      style={{ 
        backgroundColor: 'var(--color-components-slider-thumb)', 
        border: '2px solid var(--color-components-slider-thumb-border)' 
      }}
    />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

type FormSliderProps = Omit<
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>,
  'onChange' | 'value'
> & { onChange: (value: number) => void; value: number }

const FormSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  FormSliderProps
>(({ onChange, value, ...props }, ref) => (
  <Slider
    ref={ref}
    {...props}
    value={[value]}
    onValueChange={(vals) => {
      onChange(vals[0])
    }}
  />
))
FormSlider.displayName = 'FormSlider'

export { FormSlider, Slider }



