'use client'

import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'

import { cn } from '@/lib/utils'

export interface SwitchProps extends React.ComponentPropsWithoutRef<
  typeof SwitchPrimitive.Root
> {
  /** Switch 尺寸变体 */
  size?: 'sm' | 'md' | 'lg'
}

// DreamJira switch: a one-pixel track border with a 2px inset thumb that is
// dark when off and white on the checked fill, so both states read on any
// surface without relying on the track colour alone.
const sizeConfig = {
  sm: {
    root: 'h-5 w-9',
    thumb: 'size-3.5',
    translate: 'data-[state=checked]:translate-x-4',
  },
  md: {
    root: 'h-6 w-11',
    thumb: 'size-4.5',
    translate: 'data-[state=checked]:translate-x-5',
  },
  lg: {
    root: 'h-7 w-13',
    thumb: 'size-5.5',
    translate: 'data-[state=checked]:translate-x-6',
  },
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ className, size = 'md', ...props }, ref) => {
  const config = sizeConfig[size]

  return (
    <SwitchPrimitive.Root
      className={cn(
        'peer inline-flex shrink-0 cursor-pointer items-center rounded-radius-full border p-space-2xs outline-hidden',
        'transition-colors duration-150 motion-reduce:transition-none',
        'focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=unchecked]:border-line-strong data-[state=unchecked]:bg-line-strong data-[state=unchecked]:hover:border-line-strong',
        'data-[state=checked]:border-accent-solid data-[state=checked]:bg-accent-solid',
        config.root,
        className,
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'pointer-events-none block rounded-radius-full shadow-elevation-low',
          'transition-transform duration-150 motion-reduce:transition-none',
          'data-[state=unchecked]:translate-x-0 data-[state=unchecked]:bg-fg-muted',
          'data-[state=checked]:bg-knob',
          config.thumb,
          config.translate,
        )}
      />
    </SwitchPrimitive.Root>
  )
})
Switch.displayName = SwitchPrimitive.Root.displayName

export { Switch }
