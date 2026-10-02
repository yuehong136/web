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
        'flex h-9 w-full min-w-0 rounded-md border border-input bg-input px-3 py-1 text-base outline-hidden transition-[color,box-shadow] selection:bg-primary selection:text-primary-foreground file:text-foreground hover:border-input/80 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
        'placeholder:text-[rgb(var(--color-components-input-text-placeholder))]',
        className,
      )}
      {...props}
    />
  )
}
