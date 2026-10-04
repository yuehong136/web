import * as React from 'react'
import { cn } from './utils'

export function Textarea({
  className,
  ...props
}: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-16 w-full resize-none rounded-md border border-components-input-border bg-components-input-bg px-3 py-2 text-base text-components-input-text outline-hidden placeholder:text-components-input-text-placeholder hover:border-components-input-border-hover focus-visible:border-components-input-border-focus focus-visible:ring-[3px] focus-visible:ring-state-focus/20',
        'selection:bg-state-selected selection:text-text-on-accent',
        className,
      )}
      {...props}
    />
  )
}
