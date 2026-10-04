import * as React from 'react'
import { cn } from './utils'

export function Input({
  className,
  type,
  ...props
}: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-9 w-full min-w-0 rounded-md border border-components-input-border bg-components-input-bg px-3 py-1 text-base text-components-input-text outline-hidden transition-[color,box-shadow] file:text-text-primary hover:border-components-input-border-hover focus-visible:border-components-input-border-focus focus-visible:ring-[3px] focus-visible:ring-state-focus/20',
        'selection:bg-state-selected selection:text-text-on-accent placeholder:text-components-input-text-placeholder',
        className,
      )}
      {...props}
    />
  )
}
